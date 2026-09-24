// After the first session: done → S9 save progress → S10 plans (B2C only). Value first,
// account second, paywall last and skippable with equal weight.
import { Button } from "../components/ui";
import { announce, track } from "../lib/runtime";
import { useApp } from "../state";

export function Done() {
  const { s, update } = useApp();
  const log = s.activeSession ? s.logs[s.activeSession] : undefined;
  return (
    <main className="screen onb">
      <h1 className="onb-title">{log?.stopped ? "Session stopped" : "Session complete"}</h1>
      {log && !log.stopped && <p className="big-stat">{log.effort ? `${log.minutes} min · effort ${log.effort}/10` : `${log.sets} set${log.sets === 1 ? "" : "s"} · ${log.minutes} min`}</p>}
      <p className="muted">{log?.stopped ? "You reported pain, so the rest of today is gentle. Nothing loaded until someone looks at it." : "Your plan uses this to set the next sessions."}</p>
      <div className="stack-bottom"><Button autoFocus onClick={() => update((x) => ({ ...x, stage: "save" }))}>Continue</Button></div>
    </main>
  );
}

export function SaveProgress() {
  const { update } = useApp();
  const choose = (account: "apple" | "google" | "email" | "local") => {
    track("account", { account });
    update((x) => ({ ...x, account, stage: x.club ? "app" : "plans", activeSession: null }));
    announce(account === "local" ? "Saved on this phone" : "Progress saved");
  };
  return (
    <main className="screen onb">
      <h1 className="onb-title">Save your progress</h1>
      <p className="muted">So your plan and sessions follow you to a new phone. Prototype: no account is created.</p>
      <div className="stack-bottom">
        <Button kind="secondary" onClick={() => choose("apple")}>Continue with Apple</Button>
        <Button kind="secondary" onClick={() => choose("google")}>Continue with Google</Button>
        <Button kind="secondary" onClick={() => choose("email")}>Continue with email</Button>
        <button type="button" className="btn tertiary" onClick={() => choose("local")}>Skip for now (keep it on this phone)</button>
      </div>
    </main>
  );
}

export function Plans() {
  const { update } = useApp();
  const pick = (sub: "free" | "trial") => { track("paywall", { choice: sub }); update((x) => ({ ...x, subscription: sub, stage: "app", tab: "today" })); };
  return (
    <main className="screen onb">
      <h1 className="onb-title">Keep going free, or try more</h1>
      <table className="table plans">
        <caption className="sr-only">Free and paid plans compared</caption>
        <thead><tr><th scope="col">What you get</th><th scope="col">Free</th><th scope="col">Trial</th></tr></thead>
        <tbody>
          <tr><th scope="row">A checked plan every week</th><td>✓</td><td>✓</td></tr>
          <tr><th scope="row">Daily adaptation with the reason</th><td>✓</td><td>✓</td></tr>
          <tr><th scope="row">Safety checks and resources</th><td>✓</td><td>✓</td></tr>
          <tr><th scope="row">AI coach chat</th><td>Limited</td><td>✓</td></tr>
        </tbody>
      </table>
      <p className="muted small">Price set at launch (not decided yet). We'll remind you 2 days before you're billed. Cancel in two taps in You → Subscription.</p>
      <p className="muted small">Prototype: what's free versus paid isn't decided. This table tests the layout, not the offer.</p>
      <div className="stack-bottom">
        <Button kind="secondary" onClick={() => pick("trial")}>Start free trial</Button>
        <Button kind="secondary" onClick={() => pick("free")}>Continue free</Button>
      </div>
    </main>
  );
}
