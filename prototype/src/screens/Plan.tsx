// Plan: this week, every change with its rule, and moving a session (the engine decides).
import { useState } from "react";
import { ChangeCard, SessionCard } from "../components/cards";
import { Button, Notice, Sheet } from "../components/ui";
import { checkProposal, DAYS, DAYS_LONG, RULE_NAME, sessionsOn, type Session } from "../lib/engine";
import { announce, haptic, track } from "../lib/runtime";
import { useApp } from "../state";

export function PlanTab() {
  const { s, update } = useApp();
  const plan = s.plan!;
  const [moving, setMoving] = useState<Session | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const tryMove = (sess: Session, day: number) => {
    const r = checkProposal(plan, sess.id, day);
    track("move_request", { id: sess.id, to: day, accepted: r.accepted });
    setMoving(null);
    if (r.accepted) {
      haptic("warning");
      const change = { id: `c${Date.now()}`, outcome: "accepted" as const, title: `${sess.title} moved to ${DAYS_LONG[day]}`, body: "You asked for this move and it passes every rule.", rules: ["check"], steps: [{ rule: "check", outcome: "Your change passes every blocking rule" }], movedSessionId: sess.id, by: "engine" as const, at: Date.now() };
      update((x) => ({ ...x, plan: r.plan, changes: [change, ...x.changes] }));
      setResult({ ok: true, text: `Moved to ${DAYS_LONG[day]}. It passes every rule.` });
      announce(`Plan changed: ${sess.title} moved to ${DAYS_LONG[day]}`);
    } else {
      const rule = r.findings.find((f) => f.severity === "block")?.rule;
      setResult({ ok: false, text: `Your rules kept the original${rule ? `: ${RULE_NAME[rule] ?? rule}` : ""}. ${day === undefined ? "" : plan.kind === "hybrid" && !plan.profile?.availableDays.includes(day) ? `${DAYS_LONG[day]} isn't one of your training days.` : ""}`.trim() });
    }
  };

  const days = plan.kind === "hybrid" ? plan.profile!.availableDays : s.answers.days;
  return (
    <main className="screen tab-screen" aria-labelledby="plan-title">
      <header className="tab-head"><h1 id="plan-title" className="large-title">This week</h1></header>
      {result && <Notice kind={result.ok ? "good" : "info"} onDismiss={() => setResult(null)}>{result.text}</Notice>}
      {plan.gentle && <Notice kind="warning">Gentle sessions only until you've been cleared.</Notice>}
      {DAYS.map((d, i) => {
        const ss = sessionsOn(plan, i);
        return (
          <section key={d} className="plan-day" aria-labelledby={`pd-${i}`}>
            <h2 id={`pd-${i}`} className="section-title">{DAYS_LONG[i]}{i === s.today ? " · today" : ""}</h2>
            {ss.length === 0 ? <p className="muted small">Rest</p> : ss.map((x) => (
              <div key={x.id} className="plan-item">
                <SessionCard session={x} done={!!s.logs[x.id]} highlight={x.source === "moved"} />
                {plan.kind === "hybrid" && !s.logs[x.id] && x.source !== "starter" && <button type="button" className="btn tertiary" onClick={() => setMoving(x)}>Move {x.title.toLowerCase()}</button>}
              </div>
            ))}
          </section>
        );
      })}
      {s.changes.length > 0 && (
        <section aria-labelledby="hist">
          <h2 id="hist" className="section-title">What changed this week</h2>
          {s.changes.map((c) => <ChangeCard key={c.id} change={c} />)}
        </section>
      )}
      {moving && (
        <Sheet title={`Move ${moving.title.toLowerCase()}`} onClose={() => setMoving(null)}>
          <p className="muted small">Pick a day. Your rules check the change before anything moves.</p>
          <div className="stack">
            {DAYS.map((d, i) => i !== moving.day && (
              <Button key={d} kind="secondary" onClick={() => tryMove(moving, i)}>{DAYS_LONG[i]}{days.includes(i) ? "" : " (not a training day)"}</Button>
            ))}
          </div>
        </Sheet>
      )}
    </main>
  );
}
