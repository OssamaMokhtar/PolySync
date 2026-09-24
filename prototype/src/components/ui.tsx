// Components from the design system specs (polysync-design-system/components/*.md), styled only
// with tokens (see styles.css). Accessibility notes live next to each component.
import { useEffect, useId, useRef, type ReactNode } from "react";
import { haptic, track } from "../lib/runtime";

type BtnKind = "primary" | "secondary" | "tertiary" | "destructive" | "safety";
export function Button({ kind = "primary", children, onClick, disabled, full = true, icon, label, describedBy, autoFocus }: { kind?: BtnKind; children: ReactNode; onClick?: () => void; disabled?: boolean; full?: boolean; icon?: ReactNode; label?: string; describedBy?: string; autoFocus?: boolean }) {
  return (
    <button
      type="button"
      className={`btn ${kind}${full && kind !== "tertiary" ? " full" : ""}`}
      disabled={disabled}
      aria-label={label}
      aria-describedby={describedBy}
      autoFocus={autoFocus}
      onClick={() => { track("tap", { control: label ?? (typeof children === "string" ? children : kind) }); onClick?.(); }}
    >
      {icon && <span aria-hidden="true" className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}

export function LinkButton({ href, children, kind = "safety" }: { href: string; children: ReactNode; kind?: BtnKind }) {
  return <a className={`btn ${kind} full`} href={href} onClick={() => track("tap", { control: String(children) })}>{children}</a>;
}

/** Choice chip group: radio (single) or checkbox (multi) semantics; selected = fill + outline + check. */
export function ChipGroup<T extends string | number>({ label, options, value, onChange, multi = false, hideLabel = false, card = false }: { label: string; options: { value: T; label: string; hint?: string }[]; value: T[]; onChange: (v: T[]) => void; multi?: boolean; hideLabel?: boolean; card?: boolean }) {
  const id = useId();
  return (
    <div role={multi ? "group" : "radiogroup"} aria-labelledby={id} className={card ? "chip-cards" : "chips"}>
      <span id={id} className={hideLabel ? "sr-only" : "group-label"}>{label}</span>
      {options.map((o, i) => {
        const on = value.includes(o.value);
        return (
          <button
            key={String(o.value)}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            aria-label={`${o.label}${o.hint ? `. ${o.hint}` : ""}`}
            aria-posinset={multi ? undefined : i + 1}
            aria-setsize={multi ? undefined : options.length}
            className={`chip${card ? " chip-card" : ""}${on ? " is-selected" : ""}`}
            onClick={() => {
              track("tap", { control: `${label}: ${o.label}` });
              haptic("selection");
              onChange(multi ? (on ? value.filter((x) => x !== o.value) : [...value, o.value]) : [o.value]);
            }}
          >
            <span aria-hidden="true" className="check">{on ? "✓" : ""}</span>
            <span className="chip-text">
              <span className="chip-title">{o.label}</span>
              {o.hint && <span className="chip-hint">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <fieldset className="yesno">
      <legend>{label}</legend>
      <ChipGroup label={label} hideLabel options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} value={value === null ? [] : [value ? "yes" : "no"]} onChange={(v) => onChange(v[0] === "yes")} />
    </fieldset>
  );
}

export const Badge = ({ kind, children }: { kind: "decided" | "suggestion" | "needs-coach"; children: ReactNode }) => (
  <span className={`badge ${kind}`}>{kind === "needs-coach" && <span aria-hidden="true">◷ </span>}{children}</span>
);

export const READINESS = {
  green: { icon: "●", word: "Ready", cls: "ready" },
  amber: { icon: "◐", word: "Low", cls: "low" },
  red: { icon: "✕", word: "Pain", cls: "pain" },
} as const;
export const ReadinessChip = ({ r, onClick }: { r: keyof typeof READINESS; onClick?: () => void }) => {
  const x = READINESS[r];
  const inner = <><span aria-hidden="true">{x.icon}</span> {x.word}</>;
  return onClick ? <button type="button" className={`readiness ${x.cls}`} aria-label={`Readiness: ${x.word}. Why?`} onClick={onClick}>{inner}</button> : <span className={`readiness ${x.cls}`} aria-label={`Readiness: ${x.word}`}>{inner}</span>;
};

export function Notice({ kind, children, onDismiss, action }: { kind: "info" | "good" | "warning" | "critical"; children: ReactNode; onDismiss?: () => void; action?: ReactNode }) {
  const icon = { info: "ⓘ", good: "✓", warning: "⚠", critical: "✕" }[kind];
  return (
    <div className={`notice ${kind}`} role={kind === "critical" ? "alert" : "status"}>
      <span aria-hidden="true">{icon}</span>
      <div className="notice-body">{children}{action}</div>
      {onDismiss && <button type="button" className="icon-btn" aria-label="Dismiss" onClick={onDismiss}>✕</button>}
    </div>
  );
}

/** Bottom sheet: dialog semantics, focus moves to the title, Escape and a visible Close both close, focus returns. */
export function Sheet({ title, onClose, children, alert = false }: { title: string; onClose: () => void; children: ReactNode; alert?: boolean }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !alert) closeRef.current();
      if (e.key !== "Tab" || !panelRef.current) return;
      const f = [...panelRef.current.querySelectorAll<HTMLElement>("button, a[href], input, [tabindex='0']")].filter((x) => !x.hasAttribute("disabled"));
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); opener?.focus?.(); };
  }, [alert]);
  return (
    <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget && !alert) onClose(); }}>
      <div ref={panelRef} className={`sheet${alert ? " sheet-alert" : ""}`} role={alert ? "alertdialog" : "dialog"} aria-modal="true" aria-labelledby={id}>
        {!alert && <span className="handle" aria-hidden="true" />}
        <div className="sheet-head">
          <h2 id={id} ref={titleRef} tabIndex={-1} className="sheet-title">{title}</h2>
          {!alert && <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>✕</button>}
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export const Progress = ({ step, of, title }: { step: number; of: number; title: string }) => (
  <div className="progress">
    <span className="progress-label">Step {step} of {of}</span>
    <span className="progress-track" role="progressbar" aria-label={`Step ${step} of ${of}: ${title}`} aria-valuemin={1} aria-valuemax={of} aria-valuenow={step}>
      <span className="progress-fill" style={{ width: `${(step / of) * 100}%` }} />
    </span>
  </div>
);

export const Tile = ({ value, label }: { value: string; label: string }) => (
  <div className="tile" role="group" aria-label={`${label}: ${value}`}>
    <span className="tile-value" aria-hidden="true">{value}</span>
    <span className="tile-label" aria-hidden="true">{label}</span>
  </div>
);

export function Stepper({ label, value, onChange, step = 1, min = 0, unit = "" }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; unit?: string }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <span className="stepper-label">{label}</span>
      <div className="stepper-row">
        <button type="button" className="step-btn" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - step))}>−</button>
        <output className="step-value" aria-live="polite">{value}{unit}</output>
        <button type="button" className="step-btn" aria-label={`Increase ${label}`} onClick={() => onChange(value + step)}>+</button>
      </div>
    </div>
  );
}
