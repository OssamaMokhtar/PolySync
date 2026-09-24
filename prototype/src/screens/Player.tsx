// Session player (design system: components/session-player.md). One hand, arm's length, loud gym.
import { useEffect, useMemo, useState } from "react";
import { Button, ChipGroup, Sheet, Stepper } from "../components/ui";
import { adaptToday, injuryLabel, MOD_LABEL, swapOptions, type PlanExercise, type Session } from "../lib/engine";
import { announce, getEvents, haptic, track } from "../lib/runtime";
import { useApp } from "../state";

const PAIN_REGIONS = ["knee", "lower_back", "hip", "ankle", "shoulder", "neck", "other"];
const painWord = (n: number) => (n === 0 ? "none" : n <= 3 ? "mild" : n <= 6 ? "moderate" : n <= 8 ? "severe" : "worst");
const firstSet = () => { if (!getEvents().some((e) => e.name === "first_set_logged")) track("first_set_logged"); };

export function Player() {
  const { s, update } = useApp();
  const session = s.plan?.week.sessions.find((x) => x.id === s.activeSession) as Session | undefined;
  const [pain, setPain] = useState(false);
  if (!session) return null;
  const finish = (log: { sets: number; minutes: number; effort?: number; swaps: number; stopped?: boolean }) => {
    track("session_complete", { id: session.id, ...log });
    haptic("success");
    update((x) => ({ ...x, logs: { ...x.logs, [session.id]: log }, stage: x.stage === "session" ? "done" : "app", activeSession: x.stage === "session" ? x.activeSession : null }));
  };
  // Closing the first session returns to "Your week"; later sessions return to the tabs.
  const close = () => update((x) => (x.stage === "session" ? { ...x, stage: "onboarding", step: "S7", activeSession: null } : { ...x, activeSession: null }));
  return (
    <main className="screen player" aria-label={`${session.title} session`}>
      <div className="player-top">
        <button type="button" className="icon-btn" aria-label="Close session" onClick={close}>✕</button>
        {/* Exercise sessions show per-exercise effort; the session-level RPE is the load input (GAPS #17 reconciles the two). */}
        <span className="muted small">{MOD_LABEL[session.modality]} · {session.minutes} min{session.exercises?.length ? "" : ` · effort ${session.rpe}/10`}</span>
        <button type="button" className="btn tertiary pain-link" onClick={() => { track("tap", { control: "Report pain" }); setPain(true); }}>Report pain</button>
      </div>
      {session.exercises?.length ? <ExerciseFlow session={session} onFinish={finish} /> : <TimedFlow session={session} onFinish={finish} />}
      {pain && <PainSheet session={session} onClose={() => setPain(false)} onStop={(sets) => finish({ sets, minutes: 0, swaps: 0, stopped: true })} />}
    </main>
  );
}

function ExerciseFlow({ session, onFinish }: { session: Session; onFinish: (l: { sets: number; minutes: number; effort?: number; swaps: number }) => void }) {
  const { s } = useApp();
  const [list, setList] = useState<PlanExercise[]>(session.exercises!);
  const [i, setI] = useState(0);
  const [setNo, setSetNo] = useState(1);
  const [logged, setLogged] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const ex = list[i];
  const lo = Number(String(ex.reps).split("-")[0]) || 8;
  const [reps, setReps] = useState(lo);
  const [kg, setKg] = useState(0);
  const [rest, setRest] = useState<number | null>(null);
  const [restOff, setRestOff] = useState(false);
  const [swap, setSwap] = useState(false);
  const [tick, setTick] = useState(false);
  const [t0] = useState(Date.now());
  useEffect(() => { setReps(Number(String(list[i].reps).split("-")[0]) || 8); }, [i, list]);

  const log = () => {
    firstSet();
    track("set_logged", { exercise: ex.exerciseId, set: setNo, reps, kg });
    haptic("light");
    setTick(true);
    window.setTimeout(() => setTick(false), 400);
    announce(`Set ${setNo} logged`);
    const n = logged + 1;
    setLogged(n);
    const last = setNo >= ex.sets;
    if (last && i === list.length - 1) return onFinish({ sets: n, minutes: Math.max(1, Math.round((Date.now() - t0) / 60000)), swaps });
    if (last) { setI(i + 1); setSetNo(1); } else setSetNo(setNo + 1);
    if (!restOff) setRest(ex.rest);
  };
  const options = useMemo(() => swapOptions(ex, s.answers), [ex, s.answers]);

  return (
    <>
      <p className="muted small">Exercise {i + 1} of {list.length}</p>
      <h1 className="ex-name">{ex.exerciseName}</h1>
      <p className="ex-target"><strong>Set {setNo} of {ex.sets}</strong> · {ex.reps} reps · effort {ex.rpeTarget}/10</p>
      <div className="row">
        <button type="button" className="btn secondary" onClick={() => { track("tap", { control: "Swap" }); setSwap(true); }}>Swap</button>
        <details className="how"><summary>How to do it</summary><p>{ex.instructions}</p></details>
      </div>
      {rest !== null ? (
        <RestTimer seconds={rest} onDone={() => setRest(null)} onOff={() => { setRestOff(true); setRest(null); }} />
      ) : (
        <div className="logger">
          <Stepper label="Reps" value={reps} onChange={setReps} min={1} />
          <Stepper label="Weight" value={kg} onChange={setKg} step={2.5} unit=" kg" />
        </div>
      )}
      <div className="sticky-bar">
        <Button onClick={log} icon={tick ? "✓" : undefined}>{rest !== null ? "Skip rest and log next set" : `Log set ${setNo}`}</Button>
      </div>
      {swap && (
        <Sheet title="Swap exercise" onClose={() => setSwap(false)}>
          {options.length === 0 ? (
            <p>Nothing here trains that movement safely with what you have. We'll skip it today.</p>
          ) : (
            <ul className="swap-list">
              {options.map((o) => (
                <li key={o.id}>
                  <button type="button" className="swap-row" onClick={() => {
                    track("swap", { from: ex.exerciseId, to: o.id }); haptic("selection");
                    setList(list.map((x, k) => (k === i ? { ...x, exerciseId: o.id, exerciseName: o.name, instructions: o.instructions, equipment: o.equipment } : x)));
                    setSwaps(swaps + 1); setSwap(false); announce(`Swapped to ${o.name}`);
                  }}>
                    <span className="swap-name">{o.name}</span>
                    <span className="muted small">Needs: {o.equipment.join(", ") || "nothing"} · same movement</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="muted small">Only exercises your rules allow for your level, equipment and injuries.</p>
        </Sheet>
      )}
    </>
  );
}

function RestTimer({ seconds, onDone, onOff }: { seconds: number; onDone: () => void; onOff: () => void }) {
  const [left, setLeft] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    if (left <= 0) { haptic("success"); announce("Rest over"); onDone(); return; }
    if (left === 10) haptic("soft");
    const t = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, paused, onDone]);
  const mm = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="timer" role="timer" aria-label={`Rest, ${Math.floor(left / 60)} minutes ${left % 60} seconds left`}>
      <svg viewBox="0 0 120 120" className="ring" aria-hidden="true">
        <circle cx="60" cy="60" r={r} className="ring-track" />
        <circle cx="60" cy="60" r={r} className="ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - left / total)} />
      </svg>
      <span className="timer-value" aria-hidden="true">{mm}</span>
      <div className="row center">
        <button type="button" className="btn secondary" onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}</button>
        <button type="button" className="btn secondary" onClick={() => { setLeft(left + 30); setTotal(total + 30); }}>+30 s</button>
        <button type="button" className="btn tertiary" onClick={onOff}>Turn off timer</button>
      </div>
    </div>
  );
}

function TimedFlow({ session, onFinish }: { session: Session; onFinish: (l: { sets: number; minutes: number; effort?: number; swaps: number }) => void }) {
  const [started, setStarted] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!started || paused || asking) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [started, paused, asking]);
  const mm = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const easy = session.modality === "endurance_easy";
  return (
    <>
      <h1 className="ex-name">{session.title}</h1>
      <p className="ex-target">{session.minutes} min at effort {session.rpe}/10 · {easy ? "you can hold a conversation" : "hard but steady"}</p>
      {session.source === "starter" && <p className="muted small">Nothing was planned today, so this is a short starter: walk, jog, bike or row, whatever you have.</p>}
      <div className="timer" role="timer" aria-label={`Elapsed ${Math.floor(elapsed / 60)} minutes ${elapsed % 60} seconds of ${session.minutes}`}>
        <span className="timer-value" aria-hidden="true">{mm}</span>
        <span className="muted small">of {session.minutes}:00</span>
      </div>
      {asking ? (
        <div className="stack">
          <ChipGroup label="How hard was that? (effort 1–10)" options={Array.from({ length: 10 }, (_, k) => ({ value: k + 1, label: String(k + 1) }))} value={[]} onChange={(v) => onFinish({ sets: 1, minutes: Math.max(1, Math.round(elapsed / 60)), effort: v[0], swaps: 0 })} />
          <p className="muted small">1 = very easy, 5 = moderate, 10 = maximal.</p>
        </div>
      ) : (
        <div className="sticky-bar">
          {!started ? (
            <Button onClick={() => { setStarted(Date.now()); firstSet(); track("block_started", { id: session.id }); haptic("light"); announce("Started"); }}>Start</Button>
          ) : (
            <div className="row">
              <button type="button" className="btn secondary half" onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}</button>
              <Button full={false} onClick={() => setAsking(true)}>Finish</Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function PainSheet({ session, onClose, onStop }: { session: Session; onClose: () => void; onStop: (sets: number) => void }) {
  const { s, update } = useApp();
  const [region, setRegion] = useState<string[]>([]);
  const [score, setScore] = useState(4);
  const [feel, setFeel] = useState<string[]>([]);
  const [stage, setStage] = useState<"ask" | "gentle">("ask");
  const submit = () => {
    track("pain_report", { region: region[0], score, feel: feel[0], session: session.id });
    if (score >= 7 || feel[0] === "sharp") {
      update((x) => ({ ...x, safety: { card: "S3", category: "acute_injury" } }));
      onClose();
      return;
    }
    // E1: stop the exercise; the rest of today becomes gentle when the athlete ends the session.
    setStage("gentle");
    announce("Exercise stopped");
  };
  if (stage === "gentle")
    return (
      <Sheet title="We've stopped this exercise" onClose={onClose}>
        <p>We'll keep the rest of today gentle{s.club ? ` and ask Coach ${s.club.coach} to look` : ""}.</p>
        {region[0] && region[0] !== "other" && !s.answers.injuries.includes(region[0]) && (
          <Button kind="secondary" onClick={() => update((x) => ({ ...x, answers: { ...x.answers, injuries: [...x.answers.injuries, region[0]] }, memory: [...x.memory, { id: `m-inj-${region[0]}`, text: `${injuryLabel(region[0])}: exercises that load it are left out`, source: "you, pain report" }] }))}>Remember my {injuryLabel(region[0]).toLowerCase()} for future plans</Button>
        )}
        <Button onClick={() => {
          onClose();
          onStop(0);
          update((x) => { const r = adaptToday(x.plan!, x.answers, x.today, "red", true, x.club?.coach); return { ...x, plan: r.plan, changes: r.change ? [r.change, ...x.changes] : x.changes }; });
        }}>End session</Button>
      </Sheet>
    );
  return (
    <Sheet title="Where does it hurt?" onClose={onClose}>
      <p className="muted small">Thanks for telling us. We've paused the session.</p>
      <ChipGroup label="Where" options={PAIN_REGIONS.map((r) => ({ value: r, label: r === "other" ? "Somewhere else" : injuryLabel(r) }))} value={region} onChange={setRegion} />
      <div className="pain-slider">
        <label htmlFor="pain-range" className="group-label">How bad? {score} of 10, {painWord(score)}</label>
        <div className="row">
          <button type="button" className="step-btn" aria-label="Less" onClick={() => setScore(Math.max(0, score - 1))}>−</button>
          <input id="pain-range" type="range" min={0} max={10} value={score} aria-valuetext={`${score} of 10, ${painWord(score)}`} onChange={(e) => setScore(Number(e.target.value))} />
          <button type="button" className="step-btn" aria-label="More" onClick={() => setScore(Math.min(10, score + 1))}>+</button>
        </div>
      </div>
      <ChipGroup label="What does it feel like?" options={[{ value: "sharp", label: "Sharp" }, { value: "dull", label: "Dull" }, { value: "ache", label: "Ache" }]} value={feel} onChange={setFeel} />
      <Button disabled={region.length === 0} onClick={submit}>Continue</Button>
    </Sheet>
  );
}
