// Session card, "What changed" card and the "Why this?" sheet (design system:
// components/session-card.md, components/why-this-sheet.md).
import { useState } from "react";
import { humanize, MOD_LABEL, RULE_EVIDENCE, RULE_NAME, DAYS_LONG, type Change, type Session } from "../lib/engine";
import { Badge, Button, Sheet } from "./ui";
import { track } from "../lib/runtime";
import { useApp } from "../state";

const EVIDENCE_NOTE: Record<string, string> = {
  "SCI-003": "power after endurance work",
  "SCI-004": "time between endurance and power sessions",
  "SCI-005": "hard sessions 6 h apart beat 0 h; 24 h was best",
  "SCI-006": "week-to-week load jumps (a product limit, not injury prevention)",
  "SCI-007": "acute:chronic load (a coach signal only)",
};

export function badgeFor(s: Session, change?: Change, coach?: string) {
  if (change?.outcome === "escalated") return <Badge kind="needs-coach">{coach ? `Waiting for Coach ${coach}` : "Kept easy today"}</Badge>;
  if (change?.outcome === "accepted") return <Badge kind="suggestion">Suggestion · checked</Badge>;
  return <Badge kind="decided">{s.source === "starter" ? "Starter · easy" : "Planned by your rules"}</Badge>;
}

export function SessionCard({ session, onStart, change, done, highlight }: { session: Session; onStart?: () => void; change?: Change; done?: boolean; highlight?: boolean }) {
  const [why, setWhy] = useState(false);
  const { s } = useApp();
  return (
    <article className={`card session${highlight ? " is-moved" : ""}`} aria-label={`${session.title}, ${session.minutes} minutes, ${DAYS_LONG[session.day]} ${session.slot === "am" ? "morning" : "evening"}${done ? ", done" : ""}`}>
      <span className={`type-bar ${session.modality}`} aria-hidden="true" />
      <div className="card-main">
        <p className="card-kicker">{MOD_LABEL[session.modality]} · {session.slot === "am" ? "Morning" : "Evening"}</p>
        <h3 className="card-title">{session.title}{done && <span className="done-mark"> ✓ Done</span>}</h3>
        <p className="card-meta">{session.minutes} min · effort {session.rpe}/10{session.exercises ? ` · ${session.exercises.length} exercises` : ""}</p>
        {badgeFor(session, change, s.club?.coach)}
        <div className="card-actions">
          {onStart && !done && <Button onClick={onStart}>Start</Button>}
          <button type="button" className="btn tertiary" onClick={() => { track("why_open", { session: session.id }); setWhy(true); }}>Why this?</button>
        </div>
      </div>
      {why && <WhySheet session={session} change={change} onClose={() => setWhy(false)} />}
    </article>
  );
}

export function ChangeCard({ change }: { change: Change }) {
  const [why, setWhy] = useState(false);
  return (
    <article className="card changed" aria-label={`What changed: ${change.title}`}>
      <p className="card-kicker">What changed{change.by === "coach" ? " · Coach" : ""}</p>
      <h3 className="card-title">{change.title}</h3>
      <p className="card-body">{change.body}</p>
      <div className="row">
        {change.rules.filter((r) => r !== "check").map((r) => (
          <button key={r} type="button" className="rule" onClick={() => setWhy(true)}>{RULE_NAME[r] ?? r}</button>
        ))}
        <button type="button" className="btn tertiary" onClick={() => { track("why_open", { change: change.id }); setWhy(true); }}>Why this?</button>
      </div>
      {why && <WhySheet change={change} onClose={() => setWhy(false)} />}
    </article>
  );
}

export function WhySheet({ session, change, onClose }: { session?: Session; change?: Change; onClose: () => void }) {
  const { s, update } = useApp();
  const rules = change ? change.rules.filter((r) => r !== "check") : session?.source === "starter" ? [] : ["H3_PRIORITY_FIRST", "H1_CONFLICT_SEPARATION"];
  const what = change ? change.title : session ? `${session.title}, ${session.minutes} min on ${DAYS_LONG[session.day]}` : "";
  const because = change
    ? change.steps.map((x) => humanize(x.outcome))
    : session?.source === "starter"
      ? ["Nothing was planned today, so you get a short, easy session instead of nothing."]
      : session
        ? [`Your ${s.plan?.week.priority} priority gets the morning slots, and hard sessions are kept apart so they don't blunt each other.`, `Effort ${session.rpe}/10 comes from your rules for a ${MOD_LABEL[session.modality].toLowerCase()} session.`]
        : [];
  const ev = [...new Set(rules.flatMap((r) => (RULE_EVIDENCE as Record<string, string[]>)[r] ?? []))];
  return (
    <Sheet title="Why this?" onClose={onClose}>
      <h3 className="why-what">{what}</h3>
      <ul className="why-because">{because.map((b, i) => <li key={i}>{b}</li>)}</ul>
      {rules.length > 0 && (
        <div className="row" aria-label="Rules">{rules.map((r) => <span key={r} className="rule">{RULE_NAME[r] ?? r}</span>)}</div>
      )}
      {rules.some((r) => r === "H5_WEEKLY_LOAD_JUMP" || r === "H6_ACUTE_CHRONIC_ATTENTION") && <p className="muted small">H5 and H6 are coach-attention limits, not injury prevention.</p>}
      {ev.length > 0 && (
        <ul className="why-evidence">{ev.map((e) => <li key={e}><span className="evidence-id">{e}</span> {EVIDENCE_NOTE[e] ?? ""}</li>)}</ul>
      )}
      <div className="stack">
        <Button kind="secondary" onClick={onClose}>Keep it</Button>
        <Button kind="secondary" onClick={() => { onClose(); update((x) => ({ ...x, tab: "coach", stage: "app", activeSession: null })); }}>Ask the coach</Button>
      </div>
    </Sheet>
  );
}
