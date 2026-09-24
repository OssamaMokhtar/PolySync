// Onboarding S0–S7 (design system: patterns/onboarding.md). Value before account, only the
// questions the engine uses, consent directly before the first health question, a session today.
import { useEffect, useRef, useState } from "react";
import { Button, ChipGroup, Notice, Progress, YesNo } from "../components/ui";
import { buildPlan, DAYS, DAYS_LONG, INJURY_OPTIONS, injuryLabel, MOD_LABEL, sessionsOn, starterSession, type Goal } from "../lib/engine";
import { announce, track } from "../lib/runtime";
import { useApp, type Step } from "../state";
import { RESOURCES } from "../lib/safety";

const GOALS: { value: Goal; label: string; hint: string }[] = [
  { value: "fitter", label: "Get stronger and fitter", hint: "Full-body strength sessions, built around your days" },
  { value: "hybrid", label: "Run and lift", hint: "Strength first, with runs that don't wreck your legs" },
  { value: "hyrox", label: "Race HYROX", hint: "Running and functional strength, endurance first" },
];
const LEVELS = [
  { value: "beginner" as const, label: "New to training", hint: "You've trained on and off, or not at all" },
  { value: "intermediate" as const, label: "Some experience", hint: "You train most weeks and know the main lifts" },
  { value: "advanced" as const, label: "Experienced", hint: "Years of structured training" },
];
const READINESS_Q = [
  "Has a doctor told you to limit exercise, or are you being treated for a heart, lung or other medical condition?",
  "Are you pregnant or have you given birth in the last 6 months?",
  "Do you feel chest pain, dizziness or unusual breathlessness when you're active?",
];

export function Onboarding() {
  const { s, update } = useApp();
  const a = s.answers;
  const hybrid = a.goal !== "fitter";
  const order: Step[] = hybrid ? ["S1", "S2", "S3", "S4", "S5", "S6", "S7"] : ["S1", "S2", "S4", "S5", "S6", "S7"];
  const [code, setCode] = useState("");

  const go = (step: Step) => {
    track("onboarding_step", { step });
    update((x) => ({ ...x, step }));
    announce(`Step ${Math.max(1, order.indexOf(step) + 1)} of ${order.length}`);
  };
  const next = () => {
    const i = order.indexOf(s.step);
    if (s.step === "S6" && s.readinessAnswered.some(Boolean)) return go("S6b");
    if (s.step === "S6b") return finishPlan();
    if (order[i + 1] === "S7") return finishPlan();
    go(order[i + 1]);
  };
  const back = () => {
    if (s.step === "S0b") return go("S0");
    if (s.step === "S6b") return go("S6");
    const i = order.indexOf(s.step);
    go(i <= 0 ? "S0" : order[i - 1]); // answers are kept (WCAG 3.3.7)
  };
  const finishPlan = () => {
    const t0 = performance.now();
    const answers = { ...a, readinessYes: s.readinessAnswered.map(Boolean) as [boolean, boolean, boolean] };
    const plan = buildPlan(answers);
    track("plan_built", { ms: Math.round(performance.now() - t0), kind: plan.kind, sessions: plan.week.sessions.length, gentle: plan.gentle });
    const memory = [
      { id: "m-goal", text: `Goal: ${GOALS.find((g) => g.value === a.goal)!.label.toLowerCase()}`, source: "you, onboarding" },
      { id: "m-days", text: `Trains on ${a.days.map((d) => DAYS[d]).join(", ")}, ${a.minutes} min`, source: "you, onboarding" },
      ...a.injuries.map((i) => ({ id: `m-inj-${i}`, text: `${injuryLabel(i)}: exercises that load it are left out`, source: "you, onboarding" })),
    ];
    update((x) => ({ ...x, answers, plan, basePlan: plan, step: "S7", memory }));
  };
  const set = (patch: Partial<typeof a>) => update((x) => ({ ...x, answers: { ...x.answers, ...patch } }));

  const stepNo = order.indexOf(s.step === "S6b" ? "S6" : s.step) + 1;
  const header = (title: string) => (
    <>
      <div className="onb-top">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>‹</button>
        {stepNo > 0 && <Progress step={stepNo} of={order.length} title={title} />}
      </div>
      <StepTitle text={title} />
    </>
  );

  if (s.step === "S0")
    return (
      <main className="screen onb welcome">
        <div className="brand" aria-hidden="true"><span className="brand-mark" />PolySync</div>
        <h1 className="welcome-title">Your plan, built around your week. Checked every day.</h1>
        <p className="muted">Start training today. You can save your progress after your first session.</p>
        <div className="stack-bottom">
          <Button onClick={() => { track("onboarding_start"); go("S1"); }}>Start</Button>
          <Button kind="secondary" onClick={() => go("S0b")}>I have a club code</Button>
        </div>
      </main>
    );

  if (s.step === "S0b")
    return (
      <main className="screen onb">
        {header("Join your club")}
        <label className="field">
          <span className="field-label">Club code (6 characters)</span>
          <input className="input" value={code} maxLength={6} autoCapitalize="characters" autoComplete="off" inputMode="text" onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} aria-describedby="code-help" />
        </label>
        <p id="code-help" className="muted small">Paste works. Prototype: any 6 characters join a sample club.</p>
        {code.length === 6 && <Notice kind="good">Harbour Athletics (sample club) · Coach Sara</Notice>}
        <div className="stack-bottom">
          <Button disabled={code.length !== 6} onClick={() => { track("onboarding_start"); update((x) => ({ ...x, club: { name: "Harbour Athletics", coach: "Sara" } })); go("S1"); }}>Join my club</Button>
        </div>
      </main>
    );

  if (s.step === "S1")
    return (
      <main className="screen onb">
        {header("What are you training for?")}
        <ChipGroup card label="Goal" hideLabel options={GOALS} value={[a.goal]} onChange={(v) => set({ goal: v[0] })} />
        <div className="stack-bottom"><Button onClick={next}>Continue</Button></div>
      </main>
    );

  if (s.step === "S2")
    return (
      <main className="screen onb">
        {header("Which days can you train?")}
        <ChipGroup multi label="Training days" hideLabel options={DAYS.map((d, i) => ({ value: i, label: d }))} value={a.days} onChange={(v) => set({ days: [...v].sort((x, y) => x - y) })} />
        <p className="muted small">You can change this any time.</p>
        <div className="stack-bottom">
          {a.days.length === 0 && <p className="muted small" id="days-why">Pick at least one day to continue.</p>}
          <Button disabled={a.days.length === 0} describedBy={a.days.length === 0 ? "days-why" : undefined} onClick={next}>Continue</Button>
        </div>
      </main>
    );

  if (s.step === "S3")
    return (
      <main className="screen onb">
        {header("Can you train twice on some days?")}
        <p className="muted">A morning and an evening session. It's what lets us keep your hard sessions on a bad day instead of cutting them.</p>
        <ChipGroup label="Train twice on some days" hideLabel options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} value={[a.doubles ? "yes" : "no"]} onChange={(v) => set({ doubles: v[0] === "yes" })} />
        <div className="stack-bottom"><Button onClick={next}>Continue</Button></div>
      </main>
    );

  if (s.step === "S4")
    return (
      <main className="screen onb">
        {header("How long per session?")}
        <ChipGroup label="Session length" hideLabel options={[30, 45, 60, 75].map((m) => ({ value: m, label: `${m} min` }))} value={[a.minutes]} onChange={(v) => set({ minutes: v[0] })} />
        <div className="stack-bottom"><Button onClick={next}>Continue</Button></div>
      </main>
    );

  if (s.step === "S5")
    return (
      <main className="screen onb">
        {header("How much training experience?")}
        <ChipGroup card label="Experience" hideLabel options={LEVELS} value={[a.level]} onChange={(v) => set({ level: v[0] })} />
        <div className="stack-bottom"><Button onClick={next}>Continue</Button></div>
      </main>
    );

  if (s.step === "S6") {
    const done = s.readinessAnswered.every((x) => x !== null);
    return (
      <main className="screen onb">
        {header("Keep sessions safe")}
        <p className="consent">To keep sessions safe, we ask about pain and health. Your answers stay private and you can delete them any time.</p>
        {READINESS_Q.map((q, i) => (
          <YesNo key={i} label={q} value={s.readinessAnswered[i]} onChange={(v) => update((x) => { const r = [...x.readinessAnswered] as typeof x.readinessAnswered; r[i] = v; return { ...x, readinessAnswered: r }; })} />
        ))}
        <ChipGroup multi label="Any injuries we should work around? (optional)" options={INJURY_OPTIONS.map((i) => ({ value: i, label: injuryLabel(i) }))} value={a.injuries} onChange={(v) => set({ injuries: v })} />
        <div className="stack-bottom">
          {!done && <p className="muted small" id="safe-why">Answer the three questions to continue.</p>}
          <Button disabled={!done} describedBy={!done ? "safe-why" : undefined} onClick={next}>Continue</Button>
        </div>
      </main>
    );
  }

  if (s.step === "S6b") {
    const r = RESOURCES[s.settings.region];
    return (
      <main className="screen onb">
        {header("Talk to a professional first")}
        <p>We'll keep sessions gentle until you've spoken to a doctor or physio. You can still train today.</p>
        <Notice kind="info">If you ever feel chest pain, faint or can't catch your breath, stop and call {r.emergencyLabel}.</Notice>
        <div className="stack-bottom"><Button onClick={next}>Got it, keep it gentle</Button></div>
      </main>
    );
  }

  // S7: your week, built on the device by the engine
  const plan = s.plan!;
  const today = sessionsOn(plan, s.today);
  const first = today[0] ?? starterSession(s.today);
  return (
    <main className="screen onb">
      {header("Your week")}
      {plan.gentle && <Notice kind="warning">Gentle sessions only until you've been cleared.</Notice>}
      <p className="muted small">Built on your phone by your rules in under a second. Every session passes every rule.</p>
      <ol className="week-list" aria-label="This week">
        {DAYS.map((d, i) => {
          const ss = sessionsOn(plan, i);
          return (
            <li key={d} className={`week-row${i === s.today ? " is-today" : ""}`}>
              <span className="week-day">{i === s.today ? "Today" : d}</span>
              <span className="week-sessions">
                {ss.length === 0 ? <span className="muted">{i === s.today ? "15-minute starter" : "Rest"}</span> : ss.map((x) => (
                  <span key={x.id} className="week-session">
                    <i className={`dot ${x.modality}`} aria-hidden="true" />{x.title} · {x.minutes} min<span className="sr-only">, {MOD_LABEL[x.modality]}, {x.slot === "am" ? "morning" : "evening"}</span>
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="muted small">{today.length === 0 ? `Nothing is planned for ${DAYS_LONG[s.today]}, so today is a 15-minute starter.` : `Today: ${first.title.toLowerCase()}, ${first.minutes} minutes.`}</p>
      <div className="stack-bottom">
        <Button onClick={() => { const sess = today[0] ?? starterSession(s.today); update((x) => ({ ...x, stage: "session", activeSession: sess.id, plan: today.length ? x.plan : { ...x.plan!, week: { ...x.plan!.week, sessions: [...x.plan!.week.sessions, sess] } } })); track("start_first_session", { id: sess.id }); }}>Start today's session</Button>
      </div>
    </main>
  );
}

/** Moves focus to the new step's title once per step, so screen readers hear where they are. */
function StepTitle({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [text]);
  return <h1 className="onb-title" tabIndex={-1} ref={ref}>{text}</h1>;
}
