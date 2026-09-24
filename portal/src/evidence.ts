// Evidence chips and the drawer that shows a claim's source. Every chip on the
// page resolves to product/data/evidence.json.
import { evidenceById, gradeRubric } from "./data";
import { h } from "./charts";

let drawer: HTMLElement | null = null;
let lastFocus: HTMLElement | null = null;

function close() {
  drawer?.remove();
  drawer = null;
  lastFocus?.focus();
}

export function openEvidence(id: string) {
  const c = evidenceById.get(id);
  if (!c) return;
  lastFocus = document.activeElement as HTMLElement | null;
  close();
  const shut = h("button", { class: "btn", type: "button", "aria-label": "Close" }, "Close");
  shut.addEventListener("click", close);
  const value = c.value === null ? "—" : typeof c.value === "object" ? Object.entries(c.value as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join(" · ") : `${c.value} ${c.unit}`;
  const url = c.url.startsWith("http") ? c.url : `https://github.com/OssamaMokhtar/PolySync/blob/main/${c.url.replace(/^(\.\.\/)+/, "")}`;
  drawer = h("aside", { class: "drawer p-6", role: "dialog", "aria-modal": "true", "aria-label": `Evidence ${c.id}` },
    h("div", { class: "flex items-center justify-between" }, h("span", { class: "font-mono text-sm" }, c.id), shut),
    h("div", { class: "mt-4 flex items-center gap-2" }, h("span", { class: "grade" }, `Grade ${c.grade}`), h("span", { class: "text-xs muted" }, `${c.topic} · accessed ${c.accessed}`)),
    h("p", { class: "text-xs muted mt-1" }, gradeRubric[c.grade] ?? ""),
    h("p", { class: "mt-4" }, c.claim),
    h("p", { class: "mt-3 font-semibold tabnum" }, value),
    h("p", { class: "mt-4 text-sm ink-2" }, c.source),
    h("a", { class: "mt-2 inline-block text-sm break-all", href: url, target: "_blank", rel: "noopener" }, "Open the source"),
    h("p", { class: "mt-6 text-xs muted" }, `Used in: ${c.usedIn.join(", ") || "context only"}`));
  document.body.append(drawer);
  shut.focus();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer) close();
});

export function evidenceChip(id: string): HTMLElement {
  const c = evidenceById.get(id);
  const b = h("button", { class: "chip", type: "button", title: c ? c.claim : id }, id, c ? h("span", { class: "grade", style: "border:none;padding:0 0 0 2px" }, c.grade) : "");
  b.addEventListener("click", () => openEvidence(id));
  return b;
}
