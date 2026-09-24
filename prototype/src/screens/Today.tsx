// Today: Assess (check-in) and Train (design system: ux/information-architecture.md).
import { useState } from "react";
import { ChangeCard, SessionCard } from "../components/cards";
import { Button, ChipGroup, Notice, ReadinessChip, Sheet } from "../components/ui";
import { adaptToday, DAYS_LONG, readinessFrom, repairMissed, sessionsOn, starterSession, type CheckIn, type Session } from "../lib/engine";
import { announce, haptic, track } from "../lib/runtime";
import { useApp } from "../state";

export function Today() {
  const { s, update } = useApp();
  const plan = s.plan!;
  const [ci, setCi] = useState<Partial<CheckIn>>({});
  const [lowMood, setLowMood] = useState(false);
  const todays = sessionsOn(plan, s.today);
  const checked = s.checkin?.day === s.today ? s.checkin : null;
  const changesToday = s.changes.filter((c) => Date.now() - c.at < 36e5 * 24).slice(0, 2);
  const missed = plan.week.sessions.find((x) => x.day === s.today - 1 && !s.logs[x.id] && s.missed.includes(x.id));

  const start = (sess: Session) => {
    track("start_session", { id: sess.id });
    update((x) => ({ ...x, activeSession: sess.id, plan: x.plan!.week.sessions.some((y) => y.id === sess.id) ? x.plan : { ...x.plan!, week: { ...x.plan!.week, sessions: [...x.plan!.week.sessions, sess] } } }));
  };
  const submitCheckin = () => {
    const c = ci as CheckIn;
    const readiness = readinessFrom(c);
    track("checkin", { ...c, readiness });
    if (c.pain) {
      update((x) => {
        const r = adaptToday(x.plan!, x.answers, x.today, readiness, true, x.club?.coach);
        return { ...x, checkin: { c, readiness, day: x.today }, plan: r.plan, changes: r.change ? [r.change, ...x.changes] : x.changes };
      });
      haptic("warning");
      announce("Plan changed: today stays easy until someone looks at the pain.");
      return;
    }
    update((x) => {
      const r = adaptToday(x.plan!, x.answers, x.today, readiness, false, x.club?.coach);
      if (r.change) { haptic("warning"); announce(`Plan changed: ${r.change.title}`); }
      return { ...x, checkin: { c, readiness, day: x.today }, plan: r.plan, changes: r.change ? [r.change, ...x.changes] : x.changes };
    });
  };

  const dateLine = DAYS_LONG[s.today];
  return (
    <main className="screen tab-screen" aria-labelledby="today-title">
      <header className="tab-head">
        <div>
          <p className="muted small">{dateLine}</p>
          <h1 id="today-title" className="large-title">Today</h1>
        </div>
        {checked && <ReadinessChip r={checked.readiness} />}
      </header>

      {s.paused && (
        <Notice kind="critical" action={<Button kind="secondary" onClick={() => update((x) => ({ ...x, paused: false }))}>I've been checked, resume</Button>}>
          Your plan is paused until you've been checked.
        </Notice>
      )}

      {missed && (
        <article className="card changed" aria-label="Pick up here">
          <p className="card-kicker">Pick up here</p>
          <h3 className="card-title">Yesterday's {missed.title.toLowerCase()} didn't happen</h3>
          <p className="card-body">We can move it to a later day if your week still passes every rule.</p>
          <Button onClick={() => update((x) => { const r = repairMissed(x.plan!, missed, x.today, x.answers.days); track("missed_repair", { outcome: r.change.outcome }); return { ...x, plan: r.plan, changes: [r.change, ...x.changes], missed: x.missed.filter((m) => m !== missed.id) }; })}>Fit it into my week</Button>
        </article>
      )}

      {!checked && !s.paused && (
        <section className="card" aria-labelledby="ci-title">
          <h2 id="ci-title" className="card-title">How are you today?</h2>
          <ChipGroup label="How did you sleep?" options={[{ value: "well", label: "Well" }, { value: "ok", label: "OK" }, { value: "badly", label: "Badly" }]} value={ci.sleep ? [ci.sleep] : []} onChange={(v) => setCi({ ...ci, sleep: v[0] as CheckIn["sleep"] })} />
          <ChipGroup label="How do your legs feel?" options={[{ value: "fresh", label: "Fresh" }, { value: "heavy", label: "Heavy" }, { value: "sore", label: "Sore" }]} value={ci.legs ? [ci.legs] : []} onChange={(v) => setCi({ ...ci, legs: v[0] as CheckIn["legs"] })} />
          <ChipGroup label="Any pain?" options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} value={ci.pain === undefined ? [] : [ci.pain ? "yes" : "no"]} onChange={(v) => setCi({ ...ci, pain: v[0] === "yes" })} />
          <Button disabled={!ci.sleep || !ci.legs || ci.pain === undefined} onClick={submitCheckin}>Done</Button>
        </section>
      )}

      {changesToday.map((c) => <ChangeCard key={c.id} change={c} />)}

      {!s.paused && (
        <>
          <h2 className="section-title">Today's session</h2>
          {todays.length === 0 ? (
            <SessionCard session={starterSession(s.today)} onStart={() => start(starterSession(s.today))} />
          ) : (
            todays.map((x) => <SessionCard key={x.id} session={x} done={!!s.logs[x.id]} highlight={x.source === "moved"} change={s.changes.find((c) => c.outcome === "escalated" && c.at > Date.now() - 864e5)} onStart={() => start(x)} />)
          )}
          <button type="button" className="btn tertiary" onClick={() => { track("low_motivation_open"); setLowMood(true); }}>Not up for it today?</button>
        </>
      )}

      {lowMood && (
        <Sheet title="Some days are like this" onClose={() => setLowMood(false)}>
          <p>Fifteen minutes still counts, and so does resting.</p>
          <div className="stack">
            <Button kind="secondary" onClick={() => { setLowMood(false); track("low_motivation", { choice: "15" }); start(starterSession(s.today)); }}>Do 15 minutes</Button>
            <Button kind="secondary" onClick={() => { setLowMood(false); track("low_motivation", { choice: "keep" }); }}>Keep today's plan</Button>
            <button type="button" className="btn tertiary" onClick={() => { setLowMood(false); track("low_motivation", { choice: "rest" }); announce("Rest day. See you tomorrow."); }}>Rest today</button>
          </div>
        </Sheet>
      )}
    </main>
  );
}
