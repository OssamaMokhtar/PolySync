// Small SVG chart kit that follows the dataviz mark specs: bars <= 24px with a
// 4px rounded data-end, hairline solid grid, 2px surface gap between adjacent
// bars, legend for >= 2 series, per-mark hover + focus tooltip (values lead),
// text in ink tokens, never in the series colour. Every chart has a table twin.

const NS = "http://www.w3.org/2000/svg";

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: (Node | string | null | undefined)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else e.setAttribute(k, v);
  }
  for (const c of children) if (c !== null && c !== undefined) e.append(typeof c === "string" ? document.createTextNode(c) : c);
  return e;
}

function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

// ── Tooltip ────────────────────────────────────────────────────────────────
const tip = h("div", { class: "tooltip", role: "status", hidden: "" });
document.body.append(tip);

export function showTip(x: number, y: number, rows: { value: string; label: string; color?: string }[], title?: string) {
  tip.replaceChildren();
  if (title) tip.append(h("div", { class: "muted", style: "font-size:12px;margin-bottom:4px" }, title));
  for (const r of rows) {
    const line = h("div", {});
    if (r.color) line.append(h("span", { class: "k", style: `background:${r.color}` }));
    line.append(h("span", { class: "v" }, r.value), " ", h("span", { class: "ink-2" }, r.label));
    tip.append(line);
  }
  tip.hidden = false;
  const pad = 14;
  const w = tip.offsetWidth;
  const hgt = tip.offsetHeight;
  tip.style.left = `${Math.min(x + pad, window.innerWidth - w - 8)}px`;
  tip.style.top = `${Math.max(8, y - hgt - pad)}px`;
}
export function hideTip() {
  tip.hidden = true;
}

function bindTip(el: SVGElement, rows: () => Parameters<typeof showTip>[2], title?: string) {
  el.setAttribute("tabindex", "0");
  el.addEventListener("pointermove", (e) => showTip(e.clientX, e.clientY, rows(), title));
  el.addEventListener("pointerleave", hideTip);
  el.addEventListener("focus", () => {
    const r = el.getBoundingClientRect();
    showTip(r.left + r.width / 2, r.top, rows(), title);
  });
  el.addEventListener("blur", hideTip);
}

/** Path for a vertical bar with a 4px rounded top, square at the baseline. */
function colPath(x: number, y: number, w: number, hgt: number, r = 4): string {
  if (hgt <= 0) return "";
  const rr = Math.min(r, hgt, w / 2);
  return `M${x},${y + hgt}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + hgt}Z`;
}
/** Horizontal bar from x0 to x1 with a rounded data-end on the far side. */
function barPath(x0: number, x1: number, y: number, hgt: number, r = 4): string {
  const w = Math.abs(x1 - x0);
  if (w <= 0) return "";
  const rr = Math.min(r, w, hgt / 2);
  if (x1 >= x0) return `M${x0},${y}H${x1 - rr}Q${x1},${y} ${x1},${y + rr}V${y + hgt - rr}Q${x1},${y + hgt} ${x1 - rr},${y + hgt}H${x0}Z`;
  return `M${x0},${y}H${x1 + rr}Q${x1},${y} ${x1},${y + rr}V${y + hgt - rr}Q${x1},${y + hgt} ${x1 + rr},${y + hgt}H${x0}Z`;
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

export interface Series {
  name: string;
  color: string; // CSS var reference, e.g. "var(--s1)"
  values: number[];
}

export function legend(series: { name: string; color: string }[], shape: "rect" | "line" = "rect"): HTMLElement {
  const box = h("div", { class: "flex flex-wrap gap-4 text-sm ink-2", role: "list" });
  for (const se of series) {
    const key = shape === "rect" ? h("span", { style: `display:inline-block;width:10px;height:10px;border-radius:2px;background:${se.color}` }) : h("span", { style: `display:inline-block;width:14px;height:2px;background:${se.color}` });
    box.append(h("span", { class: "inline-flex items-center gap-2", role: "listitem" }, key, se.name));
  }
  return box;
}

/** Grouped column chart. One y-axis; values labelled on hover/focus and in the table twin. */
export function groupedColumns(opts: { categories: string[]; series: Series[]; format: (v: number) => string; yLabel: string; height?: number; refLine?: { value: number; label: string } }): SVGSVGElement {
  const W = 640;
  const H = opts.height ?? 260;
  const m = { t: 16, r: opts.refLine ? 96 : 12, b: 36, l: 44 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const all = opts.series.flatMap((x) => x.values).concat(opts.refLine ? [opts.refLine.value] : []);
  const min = Math.min(0, ...all);
  const max = niceMax(Math.max(...all));
  const y = (v: number) => m.t + ih - ((v - min) / (max - min)) * ih;
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": opts.yLabel });
  // grid + ticks
  for (let i = 0; i <= 4; i++) {
    const v = min + ((max - min) * i) / 4;
    svg.append(s("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: "var(--grid)", "stroke-width": 1 }));
    const t = s("text", { x: m.l - 6, y: y(v) + 4, "text-anchor": "end", "font-size": 11, fill: "var(--muted)" });
    t.textContent = opts.format(v);
    svg.append(t);
  }
  svg.append(s("line", { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), stroke: "var(--axis)", "stroke-width": 1 }));
  const band = iw / opts.categories.length;
  const n = opts.series.length;
  const bw = Math.min(24, (band * 0.7 - (n - 1) * 2) / n);
  const groupW = n * bw + (n - 1) * 2;
  opts.categories.forEach((cat, ci) => {
    const gx = m.l + ci * band + (band - groupW) / 2;
    opts.series.forEach((se, si) => {
      const v = se.values[ci];
      const x = gx + si * (bw + 2);
      const top = y(Math.max(0, v));
      const hgt = Math.abs(y(v) - y(0));
      const g = s("g", { "aria-label": `${cat}, ${se.name}: ${opts.format(v)}` });
      g.append(s("rect", { x: x - 2, y: m.t, width: bw + 4, height: ih, fill: "transparent" }));
      if (v >= 0) g.append(s("path", { d: colPath(x, top, bw, hgt), fill: se.color }));
      else g.append(s("rect", { x, y: y(0), width: bw, height: hgt, fill: se.color, rx: 2 }));
      bindTip(g, () => opts.series.map((z) => ({ value: opts.format(z.values[ci]), label: z.name, color: z.color })), cat);
      svg.append(g);
    });
    const lab = s("text", { x: m.l + ci * band + band / 2, y: H - m.b + 18, "text-anchor": "middle", "font-size": 12, fill: "var(--ink-2)" });
    lab.textContent = cat;
    svg.append(lab);
  });
  if (opts.refLine) {
    const ry = y(opts.refLine.value);
    svg.append(s("line", { x1: m.l, x2: W - m.r, y1: ry, y2: ry, stroke: "var(--ink-2)", "stroke-width": 1 }));
    const t = s("text", { x: W - m.r + 6, y: ry + 4, "text-anchor": "start", "font-size": 11, fill: "var(--ink-2)" });
    t.textContent = opts.refLine.label;
    svg.append(t);
  }
  return svg;
}

/** Tornado: each driver's low and high value, drawn from the base line. */
export function tornado(opts: { base: number; bars: { label: string; low: number; high: number }[]; format: (v: number) => string; lowLabel: string; highLabel: string }): SVGSVGElement {
  const W = 640;
  const rowH = 30;
  const m = { t: 24, r: 16, b: 12, l: 260 };
  const H = m.t + m.b + rowH * opts.bars.length;
  const vals = opts.bars.flatMap((b) => [b.low, b.high]).concat(opts.base);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const x = (v: number) => m.l + ((v - lo) / span) * (W - m.l - m.r);
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": "Sensitivity tornado" });
  const bx = x(opts.base);
  opts.bars.forEach((b, i) => {
    const yy = m.t + i * rowH + 7;
    const g = s("g", { "aria-label": `${b.label}: ${opts.format(b.low)} to ${opts.format(b.high)}` });
    g.append(s("rect", { x: 0, y: yy - 6, width: W, height: rowH, fill: "transparent" }));
    const lab = s("text", { x: m.l - 10, y: yy + 12, "text-anchor": "end", "font-size": 12, fill: "var(--ink-2)" });
    lab.textContent = b.label.length > 36 ? b.label.slice(0, 35).trimEnd() + "…" : b.label;
    const full = s("title", {});
    full.textContent = b.label;
    lab.append(full);
    g.append(lab);
    // driver at its low value, then at its high value; each coloured by its effect
    for (const [v, name] of [[b.low, opts.lowLabel], [b.high, opts.highLabel]] as [number, string][]) {
      const up = v >= opts.base;
      const x1 = x(v);
      const p = barPath(up ? bx + 1 : bx - 1, x1, yy, 16);
      if (p) g.append(s("path", { d: p, fill: up ? "var(--s1)" : "var(--critical)" }));
      void name;
    }
    bindTip(g, () => [
      { value: opts.format(b.low), label: opts.lowLabel },
      { value: opts.format(b.high), label: opts.highLabel },
    ], b.label);
    svg.append(g);
  });
  svg.append(s("line", { x1: bx, x2: bx, y1: m.t - 8, y2: H - m.b, stroke: "var(--ink-2)", "stroke-width": 1 }));
  const bt = s("text", { x: bx, y: m.t - 12, "text-anchor": "middle", "font-size": 11, fill: "var(--ink-2)" });
  bt.textContent = `Base ${opts.format(opts.base)}`;
  svg.append(bt);
  return svg;
}

/** Table twin for any chart: the WCAG-clean equivalent. */
export function tableView(headers: string[], rows: (string | number)[][], numericCols: number[] = []): HTMLTableElement {
  const t = h("table", { class: "data" });
  const tr = h("tr", {});
  headers.forEach((x, i) => tr.append(h("th", numericCols.includes(i) ? { class: "num" } : {}, x)));
  t.append(h("thead", {}, tr));
  const tb = h("tbody", {});
  for (const r of rows) {
    const row = h("tr", {});
    r.forEach((c, i) => row.append(h("td", numericCols.includes(i) ? { class: "num" } : {}, String(c))));
    tb.append(row);
  }
  t.append(tb);
  return t;
}

/** Card with a chart and a toggle to its table twin. */
export function chartCard(title: string, subtitle: string, chart: () => Node, table: () => Node, extra?: Node): HTMLElement {
  const body = h("div", { class: "mt-3" });
  let mode: "chart" | "table" = "chart";
  const btn = h("button", { class: "btn no-print", type: "button", "aria-pressed": "false" }, "Table view");
  const render = () => {
    body.replaceChildren(mode === "chart" ? chart() : table());
    btn.textContent = mode === "chart" ? "Table view" : "Chart view";
    btn.setAttribute("aria-pressed", String(mode === "table"));
  };
  btn.addEventListener("click", () => {
    mode = mode === "chart" ? "table" : "chart";
    render();
  });
  render();
  const card = h("section", { class: "card p-5" },
    h("div", { class: "flex items-start justify-between gap-4" },
      h("div", {}, h("h3", { class: "font-semibold" }, title), h("p", { class: "text-sm ink-2 mt-1" }, subtitle)),
      btn),
    extra ?? null,
    body);
  (card as HTMLElement & { rerender?: () => void }).rerender = render;
  return card;
}
