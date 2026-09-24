// Recover: the load map (polished "Body Impact"), from minutes × RPE only. Region list is the
// accessible table view; upper body is marked "not programmed yet" instead of invented.
import { useState } from "react";
import { BODY, REGION_LABEL, regionLoads, type Region } from "../../../engine/bodymodel";
import { ChipGroup, Sheet, Tile } from "../components/ui";
import { DAYS, HYBRID_PARAMS, MOD_LABEL, sessionLoad, weekLoad, type Modality } from "../lib/engine";
import { useApp } from "../state";

const binOf = (v: number, max: number) => (max <= 0 ? 0 : Math.min(4, Math.floor((v / max) * 5 - 1e-9)));
const HARD: Modality[] = ["strength", "power", "endurance_hard"];

export function Recover() {
  const { s } = useApp();
  const plan = s.plan!;
  const [side, setSide] = useState<"front" | "back">("front");
  const [open, setOpen] = useState<Region | null>(null);
  const loads = regionLoads(plan.week);
  const max = Math.max(...Object.values(loads).map((r) => r.load));
  const total = weekLoad(plan);
  const base = s.basePlan ? s.basePlan.week.sessions.filter((x) => HARD.includes(x.modality)).length : 0;
  const kept = plan.week.sessions.filter((x) => HARD.includes(x.modality)).length;
  const byMod = (["strength", "power", "endurance_hard", "endurance_easy"] as Modality[]).map((m) => ({ m, load: plan.week.sessions.filter((x) => x.modality === m).reduce((t, x) => t + sessionLoad(x), 0) })).filter((x) => x.load > 0);
  const regions = (Object.keys(REGION_LABEL) as Region[]).sort((a, b) => loads[b].load - loads[a].load);

  return (
    <main className="screen tab-screen" aria-labelledby="rec-title">
      <header className="tab-head"><div><p className="muted small">This week</p><h1 id="rec-title" className="large-title">Load</h1></div></header>
      <div className="tiles">
        <Tile value={String(total)} label="Weekly load (minutes × effort)" />
        <Tile value={`${kept} / ${base}`} label="Hard sessions kept" />
        <Tile value={`+${Math.round(HYBRID_PARAMS.maxWeeklyLoadIncrease * 100)}%`} label="Weekly limit (H5)" />
      </div>

      <ChipGroup label="Body side" hideLabel options={[{ value: "front", label: "Front" }, { value: "back", label: "Back" }]} value={[side]} onChange={(v) => setSide(v[0] as "front" | "back")} />
      <div className="body-wrap">
        <svg viewBox="0 0 200 400" className="body" role="img" aria-label={`Body map, ${side}. Region loads are listed below.`}>
          <defs>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className="hatch-line" />
            </pattern>
          </defs>
          {BODY[side].map((sh, i) => (
            <path key={i} d={sh.d} className={sh.region ? `region load-${binOf(loads[sh.region].load, max) + 1}` : "region unprogrammed"} />
          ))}
        </svg>
        <div className="legend-col">
          <p className="muted small">Load, low → high</p>
          <div className="ramp" aria-hidden="true">{[1, 2, 3, 4, 5].map((i) => <span key={i} className={`ramp-step load-${i}`} />)}</div>
          <p className="legend"><i className="hatch-sw" aria-hidden="true" /> Not programmed yet</p>
        </div>
      </div>

      <h2 className="section-title">By region</h2>
      <ul className="region-list">
        {regions.map((r) => (
          <li key={r}>
            <button type="button" className="region-row" onClick={() => setOpen(r)} aria-label={`${REGION_LABEL[r]}: load ${loads[r].load}. Show sessions.`}>
              <span>{REGION_LABEL[r]}</span>
              <span className="region-bar" aria-hidden="true"><span className={`load-${binOf(loads[r].load, max) + 1}`} style={{ width: `${max ? (loads[r].load / max) * 100 : 0}%` }} /></span>
              <span className="num">{loads[r].load}</span>
            </button>
          </li>
        ))}
        <li className="region-row static"><span>Chest, shoulders, back, arms</span><span className="muted small">Not programmed yet</span></li>
      </ul>

      <h2 className="section-title">Week balance</h2>
      <div className="stack-bar" role="img" aria-label={byMod.map((x) => `${MOD_LABEL[x.m]} ${Math.round((x.load / total) * 100)}%`).join(", ")}>
        {byMod.map((x) => <span key={x.m} className={`seg ${x.m}`} style={{ flex: x.load }} />)}
      </div>
      <div className="legends">{byMod.map((x) => <span key={x.m} className="legend"><i className={`sw ${x.m}`} aria-hidden="true" />{MOD_LABEL[x.m]} {Math.round((x.load / total) * 100)}%</span>)}</div>

      <p className="footnote">Estimates from session type, minutes and effort. Not a medical assessment, and not a prediction of injury.</p>

      {open && (
        <Sheet title={`${REGION_LABEL[open]}: ${loads[open].load}`} onClose={() => setOpen(null)}>
          <table className="table">
            <caption className="sr-only">Sessions that loaded {REGION_LABEL[open]}</caption>
            <thead><tr><th scope="col">Day</th><th scope="col">Session</th><th scope="col">Min</th><th scope="col">Effort</th><th scope="col">Load</th></tr></thead>
            <tbody>{loads[open].from.map((f, i) => <tr key={i}><td>{DAYS[f.s.day]}</td><td>{MOD_LABEL[f.s.modality]}</td><td>{f.s.minutes}</td><td>{f.s.rpe}</td><td>{Math.round(f.load)}</td></tr>)}</tbody>
          </table>
          <p className="muted small">Region shares are a display model (v1), not a measurement.</p>
        </Sheet>
      )}
    </main>
  );
}
