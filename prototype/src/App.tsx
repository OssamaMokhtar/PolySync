import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button, LinkButton, Sheet } from "./components/ui";
import { adaptToday, DAYS, DAYS_LONG, sessionsOn } from "./lib/engine";
import { applyTextScale, getEvents, onEvents, resetAll, saveState, loadState, setHaptics, track, ttfw, exportLog } from "./lib/runtime";
import { RESOURCES, TOPIC_LINE } from "./lib/safety";
import { Coach } from "./screens/Coach";
import { Onboarding } from "./screens/Onboarding";
import { PlanTab } from "./screens/Plan";
import { Player } from "./screens/Player";
import { Done, Plans, SaveProgress } from "./screens/PostSession";
import { Recover } from "./screens/Recover";
import { Today } from "./screens/Today";
import { You } from "./screens/You";
import { initialState, StateCtx, useApp, type State, type Tab } from "./state";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "today", label: "Today", icon: "◉" },
  { id: "plan", label: "Plan", icon: "▦" },
  { id: "recover", label: "Recover", icon: "◍" },
  { id: "coach", label: "Coach", icon: "✉" },
  { id: "you", label: "You", icon: "◎" },
];

export function App() {
  const [s, setS] = useState<State>(() => ({ ...initialState(), ...(loadState<State>() ?? {}) }));
  const update = useCallback((fn: (x: State) => State) => setS((x) => fn(x)), []);
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => { saveState(s); }, [s]);
  useEffect(() => { setHaptics(s.settings.haptics); }, [s.settings.haptics]);
  useEffect(() => { if (frame.current) applyTextScale(frame.current, s.settings.textScale); }, [s.settings.textScale]);
  const systemReduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const reduce = s.settings.motion === "reduce" || systemReduce;

  let body;
  if (s.stage === "onboarding") body = <Onboarding />;
  else if (s.stage === "session") body = <Player />;
  else if (s.stage === "done") body = <Done />;
  else if (s.stage === "save") body = <SaveProgress />;
  else if (s.stage === "plans") body = <Plans />;
  else if (s.activeSession) body = <Player />;
  else body = { today: <Today />, plan: <PlanTab />, recover: <Recover />, coach: <Coach />, you: <You /> }[s.tab];

  const showTabs = s.stage === "app" && !s.activeSession;
  return (
    <StateCtx.Provider value={{ s, update }}>
      <div className="stage">
        <div ref={frame} className="phone-frame" data-theme={s.settings.theme === "system" ? undefined : s.settings.theme} data-motion={reduce ? "reduce" : "full"}>
          <a className="skip" href="#content">Skip to content</a>
          <div id="content" className="content" key={`${s.stage}-${s.tab}-${s.step}-${s.activeSession ?? ""}`}>{body}</div>
          {showTabs && (
            <nav className="tabbar" aria-label="Tabs">
              {TABS.map((t, i) => (
                <button key={t.id} type="button" className={`tab${s.tab === t.id ? " is-active" : ""}`} aria-current={s.tab === t.id ? "page" : undefined} aria-label={`${t.label}, tab ${i + 1} of ${TABS.length}`} onClick={() => { track("tab", { tab: t.id }); update((x) => ({ ...x, tab: t.id })); }}>
                  <span aria-hidden="true" className="tab-icon">{t.icon}</span>
                  <span aria-hidden="true">{t.label}</span>
                </button>
              ))}
            </nav>
          )}
          {s.safety && <SafetyCard />}
          <div id="sr-polite" className="sr-only" aria-live="polite" />
          <div id="sr-assertive" className="sr-only" aria-live="assertive" />
        </div>
        {s.settings.testPanel && <Facilitator />}
      </div>
    </StateCtx.Provider>
  );
}

function SafetyCard() {
  const { s, update } = useApp();
  const card = s.safety!;
  const r = RESOURCES[s.settings.region];
  const close = () => update((x) => ({ ...x, safety: null }));
  useEffect(() => { track("safety_card_shown", { card: card.card, category: card.category }); }, []);
  if (card.card === "S1")
    return (
      <Sheet alert title="Stop and get help now" onClose={close}>
        <p>Chest pain, fainting or trouble breathing need a medical check straight away.</p>
        <LinkButton href={`tel:${r.emergency}`}>Call {r.emergencyLabel}</LinkButton>
        <Button kind="secondary" onClick={() => { update((x) => ({ ...x, safety: null, paused: true })); }}>I'm OK now</Button>
        {s.club && <Button kind="secondary" onClick={() => { update((x) => ({ ...x, safety: null, paused: true, tab: "coach" })); }}>Talk to Coach {s.club.coach}</Button>}
        <p className="muted small">Your plan is paused until you tell us you've been checked.</p>
      </Sheet>
    );
  if (card.card === "S2")
    return (
      <Sheet alert title="You don't have to deal with this alone" onClose={close}>
        <p>If you're thinking about hurting yourself, please talk to someone now.</p>
        <LinkButton href={`tel:${r.crisis.replace(/\s/g, "")}`}>Call {r.crisisLabel}</LinkButton>
        {r.crisis !== r.emergency && <LinkButton kind="secondary" href={`tel:${r.emergency}`}>Emergency: {r.emergency}</LinkButton>}
        {r.note && <p className="muted small">{r.note}</p>}
        <Button kind="secondary" onClick={close}>Close</Button>
      </Sheet>
    );
  if (card.card === "S3")
    return (
      <Sheet alert title="Let's stop here" onClose={close}>
        <p>That sounds like it should be checked by a doctor or physio before you train it again.</p>
        <Button kind="safety" onClick={() => update((x) => { const a = adaptToday(x.plan!, x.answers, x.today, "red", true, x.club?.coach); return { ...x, safety: null, plan: a.plan, changes: a.change ? [a.change, ...x.changes] : x.changes, activeSession: null, stage: x.stage === "session" ? "done" : x.stage }; })}>Keep today gentle</Button>
        {s.club && <Button kind="secondary" onClick={() => update((x) => ({ ...x, safety: null, coachThread: [...x.coachThread, { id: `sh${Date.now()}`, from: "you", text: "Shared with my coach: pain during today's session." }] }))}>Tell Coach {s.club.coach}</Button>}
        <p className="muted small">Find a physio: your GP or local sports-medicine clinic.</p>
      </Sheet>
    );
  const topic = TOPIC_LINE[card.category];
  return (
    <Sheet alert title="That's one for a specialist" onClose={close}>
      <p>{topic?.line ?? "That's outside what we can help with"}. {topic ? `${topic.who.replace(/^./, (c) => c.toUpperCase())} can help with this properly.` : ""}</p>
      {card.category === "eating" && <p className="muted small">If food or exercise feels out of control, you can also call {r.crisisLabel}.</p>}
      <Button onClick={close}>OK</Button>
    </Sheet>
  );
}

function Facilitator() {
  const { s, update } = useApp();
  const events = useSyncExternalStore(onEvents, getEvents);
  const t = ttfw();
  const last = events.slice(-8).reverse();
  return (
    <aside className="facilitator" aria-label="Facilitator panel (usability test)">
      <h2>Usability test</h2>
      <dl className="kv">
        <dt>Time to first workout</dt><dd>{t.ms === null ? "not yet" : `${(t.ms / 1000).toFixed(1)} s`}</dd>
        <dt>Taps to first set</dt><dd>{t.taps || "–"}</dd>
        <dt>Today (scenario)</dt>
        <dd>
          <select value={s.today} onChange={(e) => update((x) => ({ ...x, today: Number(e.target.value), checkin: null }))} aria-label="Scenario day">
            {DAYS.map((d, i) => <option key={d} value={i}>{DAYS_LONG[i]}</option>)}
          </select>
        </dd>
      </dl>
      <div className="fac-actions">
        <button type="button" onClick={() => update((x) => { const y = x.plan ? sessionsOn(x.plan, x.today - 1).filter((q) => !x.logs[q.id]).map((q) => q.id) : []; return { ...x, missed: [...x.missed, ...y] }; })}>Mark yesterday missed</button>
        <button type="button" onClick={exportLog}>Export log</button>
        <button type="button" onClick={() => { resetAll(); window.location.reload(); }}>Reset prototype</button>
      </div>
      <h3>Last events</h3>
      <ol className="events">{last.map((e, i) => <li key={i}><code>{new Date(e.t).toLocaleTimeString()}</code> {e.name}{e.props ? ` ${JSON.stringify(e.props).slice(0, 60)}` : ""}</li>)}</ol>
      <p className="muted small">Tasks T1–T7: research/usability-test-plan.md in the design system. Haptics appear here as events.</p>
    </aside>
  );
}

