// You: profile, Memory (view, forget, undo), data, subscription, accessibility, safety region.
import { useEffect, useState } from "react";
import { Button, ChipGroup, Notice, Sheet } from "../components/ui";
import { announce, exportLog, resetAll, track } from "../lib/runtime";
import { useApp, type Fact } from "../state";
import type { Region } from "../lib/safety";

export function You() {
  const { s, update } = useApp();
  const [undo, setUndo] = useState<Fact | null>(null);
  const [forgetAll, setForgetAll] = useState(false);
  const [del, setDel] = useState(false);
  const [typed, setTyped] = useState("");
  const [cancel, setCancel] = useState(false);
  useEffect(() => { if (!undo) return; const t = window.setTimeout(() => setUndo(null), 10000); return () => window.clearTimeout(t); }, [undo]);
  const set = (patch: Partial<typeof s.settings>) => update((x) => ({ ...x, settings: { ...x.settings, ...patch } }));

  return (
    <main className="screen tab-screen" aria-labelledby="you-title">
      <header className="tab-head"><h1 id="you-title" className="large-title">You</h1></header>

      <section aria-labelledby="mem" className="card">
        <h2 id="mem" className="card-title">Memory</h2>
        <p className="muted small">What the coach knows about you, and where it came from. Health answers from onboarding aren't here; they're in Safety below.</p>
        {s.memory.length === 0 ? <p className="muted">Nothing yet.</p> : (
          <ul className="mem-list">
            {s.memory.map((f) => (
              <li key={f.id} className="mem-row">
                <span><span className="mem-text">{f.text}</span><span className="muted small"> · {f.source}</span></span>
                <button type="button" className="btn tertiary" aria-label={`Forget: ${f.text}`} onClick={() => { track("memory_forget", { id: f.id }); setUndo(f); update((x) => ({ ...x, memory: x.memory.filter((m) => m.id !== f.id) })); announce("Forgotten. Undo available for 10 seconds."); }}>Forget</button>
              </li>
            ))}
          </ul>
        )}
        {undo && <Notice kind="info" action={<button type="button" className="btn tertiary" onClick={() => { update((x) => ({ ...x, memory: [...x.memory, undo] })); setUndo(null); }}>Undo</button>}>Forgotten: {undo.text}</Notice>}
        {s.memory.length > 0 && <button type="button" className="btn tertiary" onClick={() => setForgetAll(true)}>Forget everything</button>}
      </section>

      <section aria-labelledby="sub" className="card">
        <h2 id="sub" className="card-title">Subscription</h2>
        {s.club ? <p>Your club covers PolySync. Nothing to pay.</p> : s.subscription === "trial" ? (
          <>
            <p>Free trial. We'll remind you 2 days before you're billed.</p>
            <Button kind="secondary" onClick={() => setCancel(true)}>Cancel trial</Button>
          </>
        ) : <p>Free plan. Everything you use today stays free.</p>}
      </section>

      <section aria-labelledby="a11y" className="card">
        <h2 id="a11y" className="card-title">Display and accessibility</h2>
        <ChipGroup label="Appearance" options={[{ value: "system", label: "System" }, { value: "dark", label: "Dark" }, { value: "light", label: "Light" }]} value={[s.settings.theme]} onChange={(v) => set({ theme: v[0] as typeof s.settings.theme })} />
        <ChipGroup label="Motion" options={[{ value: "system", label: "Follow system" }, { value: "reduce", label: "Reduce motion" }]} value={[s.settings.motion]} onChange={(v) => set({ motion: v[0] as typeof s.settings.motion })} />
        <div className="stepper" role="group" aria-label="Text size">
          <span className="stepper-label">Text size (simulates Dynamic Type)</span>
          <div className="stepper-row">
            <button type="button" className="step-btn" aria-label="Smaller text" onClick={() => set({ textScale: Math.max(1, +(s.settings.textScale - 0.25).toFixed(2)) })}>A−</button>
            <output className="step-value">{Math.round(s.settings.textScale * 100)}%</output>
            <button type="button" className="step-btn" aria-label="Larger text" onClick={() => set({ textScale: Math.min(2.25, +(s.settings.textScale + 0.25).toFixed(2)) })}>A+</button>
          </div>
        </div>
        <ChipGroup label="Haptics" options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]} value={[s.settings.haptics ? "on" : "off"]} onChange={(v) => set({ haptics: v[0] === "on" })} />
      </section>

      <section aria-labelledby="safe" className="card">
        <h2 id="safe" className="card-title">Safety</h2>
        <ChipGroup label="Emergency numbers for" options={[{ value: "UAE", label: "UAE" }, { value: "US", label: "US" }, { value: "EU", label: "EU" }]} value={[s.settings.region]} onChange={(v) => set({ region: v[0] as Region })} />
        <p className="muted small">Readiness answers from onboarding: {s.readinessAnswered.some(Boolean) ? "at least one yes (gentle sessions until cleared)" : "all no"}.</p>
        <Button kind="secondary" onClick={() => update((x) => ({ ...x, readinessAnswered: [null, null, null] }))}>Delete my health answers</Button>
      </section>

      <section aria-labelledby="data" className="card">
        <h2 id="data" className="card-title">Your data</h2>
        <Button kind="secondary" onClick={() => { const blob = new Blob([JSON.stringify({ answers: s.answers, memory: s.memory, logs: s.logs, changes: s.changes }, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "polysync-my-data.json"; a.click(); }}>Export my data</Button>
        <Button kind="destructive" onClick={() => setDel(true)}>Delete my account</Button>
      </section>

      <section aria-labelledby="test" className="card">
        <h2 id="test" className="card-title">Usability test</h2>
        <ChipGroup label="Facilitator panel" options={[{ value: "on", label: "Show" }, { value: "off", label: "Hide" }]} value={[s.settings.testPanel ? "on" : "off"]} onChange={(v) => set({ testPanel: v[0] === "on" })} />
        <Button kind="secondary" onClick={exportLog}>Export session log (JSON)</Button>
      </section>

      {forgetAll && (
        <Sheet title="Forget everything?" onClose={() => { setForgetAll(false); setTyped(""); }}>
          <label className="field"><span className="field-label">Type FORGET to confirm</span><input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} /></label>
          <Button kind="destructive" disabled={typed !== "FORGET"} onClick={() => { update((x) => ({ ...x, memory: [] })); setForgetAll(false); setTyped(""); announce("Memory cleared"); }}>Forget everything</Button>
        </Sheet>
      )}
      {del && (
        <Sheet title="Delete your account?" onClose={() => { setDel(false); setTyped(""); }}>
          <p>This deletes your plan, sessions, memory and health answers. It can't be undone.</p>
          <label className="field"><span className="field-label">Type DELETE to confirm</span><input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} /></label>
          <Button kind="destructive" disabled={typed !== "DELETE"} onClick={() => { resetAll(); window.location.reload(); }}>Delete my account</Button>
        </Sheet>
      )}
      {cancel && (
        <Sheet title="Cancel your trial?" onClose={() => setCancel(false)}>
          <p>You'll keep the free plan. Nothing is billed.</p>
          <Button kind="destructive" onClick={() => { update((x) => ({ ...x, subscription: "free" })); setCancel(false); track("trial_cancel"); announce("Trial cancelled"); }}>Cancel trial</Button>
        </Sheet>
      )}
    </main>
  );
}
