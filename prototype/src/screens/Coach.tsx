// Coach: the AI coach explains and proposes; your rules decide; the human coach (club) talks.
// Order of operations (design system: patterns/ai-coach.md §7): safety detector → intent →
// reply built only from engine values → proposal checked by prescribeHybrid.
// Prototype: replies are scripted from engine output; production puts a model between the
// detector and the number checker, with the same rules.
import { useEffect, useRef, useState } from "react";
import { Badge, Button, ChipGroup } from "../components/ui";
import { adaptToday, checkProposal, DAYS, DAYS_LONG, humanize, RULE_NAME, sessionsOn, starterSession, type Session } from "../lib/engine";
import { announce, haptic, track } from "../lib/runtime";
import { detect } from "../lib/safety";
import { useApp, type Msg, type State } from "../state";

const SUGGESTIONS = ["Why is today's session like this?", "Move my hard run to Friday", "How many calories should I eat?", "I don't feel like training"];
const id = () => Math.random().toString(36).slice(2, 9);

function reply(s: State, text: string): { msgs: Msg[]; safety?: State["safety"]; pain?: boolean } {
  const d = detect(text);
  if (d?.card) return { msgs: [], safety: { card: d.card, category: d.category } };
  if (d?.category === "caution_pain") return { msgs: [{ id: id(), from: "ai", text: "Thanks for telling me. Nothing loaded today until someone looks at it: your rules don't change a pain day on their own. In a session, Report pain lets you say where and how bad.", offer: "pain" }], pain: true };
  if (d?.category === "illness") return { msgs: [{ id: id(), from: "ai", text: "Being ill isn't a day to push. Check in with 'Any pain? No' and 'Slept badly' and your rules will keep today easy, or rest. If you have a fever, rest until it's gone." }] };

  const t = text.toLowerCase();
  const plan = s.plan!;
  const dayIdx = DAYS.findIndex((d) => new RegExp(`\\b${d.toLowerCase()}(day|nesday|sday|rsday|urday)?\\b`).test(t));
  if (/\b(move|shift|swap|push)\b/.test(t) && dayIdx >= 0) {
    const want = /run/.test(t) ? plan.week.sessions.filter((x) => x.modality === "endurance_hard" || x.modality === "endurance_easy") : /strength|lift/.test(t) ? plan.week.sessions.filter((x) => x.modality === "strength") : plan.week.sessions;
    const target = want.filter((x) => !s.logs[x.id]).sort((a, b) => Number(b.modality === "endurance_hard") - Number(a.modality === "endurance_hard"))[0];
    if (!target) return { msgs: [{ id: id(), from: "ai", text: "I couldn't find a session like that left this week." }] };
    return { msgs: [{ id: id(), from: "ai", text: `Suggestion: move ${DAYS_LONG[target.day]}'s ${target.title.toLowerCase()} to ${DAYS_LONG[dayIdx]}. Your rules check it before anything changes.`, proposal: { sessionId: target.id, toDay: dayIdx, state: "proposed" } }] };
  }
  if (/\b(why|how come|explain)\b/.test(t)) {
    const c = s.changes[0];
    if (c) return { msgs: [{ id: id(), from: "ai", text: `${c.title}. ${c.steps.map((x) => humanize(x.outcome)).join(". ")}.`, ruleIds: c.rules.filter((r) => r !== "check") }] };
    const today = sessionsOn(plan, s.today)[0] ?? starterSession(s.today);
    return { msgs: [{ id: id(), from: "ai", text: today.source === "starter" ? "Nothing is planned today, so you have a short, easy starter instead of nothing." : `Today is ${today.title.toLowerCase()}, ${today.minutes} minutes at effort ${today.rpe}/10. Your ${plan.week.priority} priority gets the morning slots, and hard sessions are kept apart.`, ruleIds: today.source === "starter" ? [] : ["H3_PRIORITY_FIRST", "H1_CONFLICT_SEPARATION"] }] };
  }
  if (/(ramadan|fasting|iftar|suhoor)/.test(t)) return { msgs: [{ id: id(), from: "ai", text: "I can note that you're fasting so your coach and your plan know. Moving sessions after iftar is planned engine work; for now, tell your coach or move sessions in Plan.", offer: "fasting" }] };
  if (/(calorie|protein|macro|diet|meal|carb|eat|food|nutrition|weight loss|lose weight)/.test(t)) return { msgs: [{ id: id(), from: "ai", text: "I can share general guidance, but I don't build meal plans or set calorie or protein targets. A registered dietitian can, especially if you have a restriction. General rule of thumb: eat regular meals, and have something with carbohydrate and protein around your harder sessions." }] };
  if (/(don'?t feel like|not motivated|can'?t be bothered|no energy|not up for|skip today|unmotivated)/.test(t)) return { msgs: [{ id: id(), from: "ai", text: "Some days are like this. Fifteen minutes still counts, and so does resting.", offer: "motivation" }] };
  if (/(rack|taken|busy|no (barbell|dumbbells?|bench|machine)|equipment)/.test(t)) return { msgs: [{ id: id(), from: "ai", text: "In your session, tap Swap on the exercise. You'll see up to three that train the same movement with what you have, and only ones your rules allow." }] };
  return { msgs: [{ id: id(), from: "ai", text: "In this prototype I can explain your plan, suggest a move (\"move my run to Friday\"), and help on low-energy days. I don't diagnose, advise on medication or build meal plans." }] };
}

export function Coach() {
  const { s, update } = useApp();
  const [text, setText] = useState("");
  const [thread, setThread] = useState<"ai" | "coach">("ai");
  const endRef = useRef<HTMLDivElement>(null);
  const msgs = thread === "ai" ? s.chat : s.coachThread;
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  const send = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setText("");
    track("chat_send", { thread, length: v.length });
    const mine: Msg = { id: id(), from: "you", text: v };
    if (thread === "coach") {
      update((x) => ({ ...x, coachThread: [...x.coachThread, mine, { id: id(), from: "coach", text: "Got it, I'll look at this today. (Prototype: a real coach replies here.)" }] }));
      return;
    }
    const r = reply(s, v);
    if (r.safety) { track("safety_card", { card: r.safety.card, category: r.safety.category, source: "chat" }); }
    update((x) => ({ ...x, chat: [...x.chat, mine, ...r.msgs], safety: r.safety ?? x.safety }));
    if (r.msgs[0]) announce(`Coach: ${r.msgs[0].text}`);
  };

  const decide = (m: Msg) => {
    const p = m.proposal!;
    const r = checkProposal(s.plan!, p.sessionId, p.toDay);
    const sess = s.plan!.week.sessions.find((x) => x.id === p.sessionId) as Session;
    track("proposal_checked", { accepted: r.accepted, rule: r.findings[0]?.rule });
    haptic(r.accepted ? "warning" : "selection");
    const rules = r.findings.filter((f) => f.severity === "block").map((f) => f.rule);
    update((x) => ({
      ...x,
      plan: r.accepted ? r.plan : x.plan,
      changes: r.accepted ? [{ id: `c${Date.now()}`, outcome: "accepted", title: `${sess.title} moved to ${DAYS_LONG[p.toDay]}`, body: "Suggested by the coach, checked by your rules.", rules: ["check"], steps: [{ rule: "check", outcome: "The suggestion passes every blocking rule" }], movedSessionId: sess.id, by: "engine", at: Date.now() }, ...x.changes] : x.changes,
      chat: x.chat.map((y) => (y.id === m.id ? { ...y, proposal: { ...p, state: r.accepted ? "accepted" : "kept", rules } } : y)),
    }));
    announce(r.accepted ? "Accepted by your rules" : "Your rules kept the original");
  };

  return (
    <main className="screen tab-screen chat-screen" aria-labelledby="coach-title">
      <header className="tab-head"><h1 id="coach-title" className="large-title">Coach</h1></header>
      {s.club && <ChipGroup label="Conversation" hideLabel options={[{ value: "ai", label: "Coach (AI)" }, { value: "coach", label: `Coach ${s.club.coach}` }]} value={[thread]} onChange={(v) => setThread(v[0] as "ai" | "coach")} />}
      <div className="chat" aria-live="off">
        {thread === "ai" && <Bubble m={{ id: "intro", from: "ai", text: "I explain your plan and can suggest changes. Your rules check every change. I can't diagnose, advise on medication or build meal plans." }} />}
        {thread === "coach" && s.coachThread.length === 0 && <Bubble m={{ id: "c0", from: "coach", text: "Hi, I'm Sara. I see your plan and anything that needs a person. Message me here." }} coach={s.club?.coach} />}
        {msgs.map((m) => (
          <Bubble key={m.id} m={m} coach={s.club?.coach} onDecide={() => decide(m)} onOffer={(o) => {
            if (o === "15") update((x) => ({ ...x, tab: "today", activeSession: starterSession(x.today).id, plan: { ...x.plan!, week: { ...x.plan!.week, sessions: x.plan!.week.sessions.some((y) => y.id === starterSession(x.today).id) ? x.plan!.week.sessions : [...x.plan!.week.sessions, starterSession(x.today)] } } }));
            if (o === "fasting") update((x) => ({ ...x, memory: [...x.memory, { id: "m-fast", text: "Fasting (Ramadan): prefers sessions after iftar", source: "you, chat" }] }));
            if (o === "pain") update((x) => { const r = adaptToday(x.plan!, x.answers, x.today, "red", true, x.club?.coach); return { ...x, plan: r.plan, changes: r.change ? [r.change, ...x.changes] : x.changes, tab: "today" }; });
            track("chat_offer", { o });
          }} />
        ))}
        <div ref={endRef} />
      </div>
      {thread === "ai" && s.chat.length < 2 && (
        <div className="chips suggestions" role="group" aria-label="Suggestions">
          {SUGGESTIONS.map((q) => <button key={q} type="button" className="chip" onClick={() => send(q)}>{q}</button>)}
        </div>
      )}
      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <label htmlFor="msg" className="sr-only">Message</label>
        <input id="msg" className="input" placeholder={thread === "ai" ? "Ask your coach" : `Message Coach ${s.club?.coach}`} value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
        <button type="submit" className="btn primary send" aria-label="Send">↑</button>
      </form>
    </main>
  );
}

function Bubble({ m, coach, onDecide, onOffer }: { m: Msg; coach?: string; onDecide?: () => void; onOffer?: (o: string) => void }) {
  const author = m.from === "you" ? "You" : m.from === "ai" ? "Coach (AI)" : `Coach ${coach ?? ""}`;
  return (
    <div className={`msg ${m.from}`}>
      <p className="author">{author}</p>
      <div className={`bubble ${m.from === "you" ? "user" : m.from}`}>
        <p>{m.text}</p>
        {m.ruleIds && m.ruleIds.length > 0 && <div className="row">{m.ruleIds.map((r) => <span key={r} className="rule">{RULE_NAME[r] ?? r}</span>)}</div>}
        {m.proposal && (
          <div className="proposal">
            {m.proposal.state === "proposed" && <><Badge kind="suggestion">Suggestion</Badge><Button onClick={onDecide}>Check this change</Button></>}
            {m.proposal.state === "accepted" && <><Badge kind="suggestion">Suggestion · checked</Badge><p className="small">Accepted by your rules. Your plan is updated.</p></>}
            {m.proposal.state === "kept" && <><Badge kind="decided">Planned by your rules</Badge><p className="small">Your rules kept the original{m.proposal.rules?.[0] ? `: ${RULE_NAME[m.proposal.rules[0]] ?? m.proposal.rules[0]}` : ""}.</p></>}
          </div>
        )}
        {m.offer === "motivation" && (
          <div className="stack">
            <Button kind="secondary" onClick={() => onOffer?.("15")}>Do 15 minutes</Button>
            <Button kind="secondary" onClick={() => onOffer?.("keep")}>Keep today's plan</Button>
            <button type="button" className="btn tertiary" onClick={() => onOffer?.("rest")}>Rest today</button>
          </div>
        )}
        {m.offer === "pain" && <Button kind="secondary" onClick={() => onOffer?.("pain")}>Keep today gentle</Button>}
        {m.offer === "fasting" && <Button kind="secondary" onClick={() => onOffer?.("fasting")}>Add to my Memory</Button>}
      </div>
    </div>
  );
}
