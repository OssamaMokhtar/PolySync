#!/usr/bin/env python3
"""Generate product/generated/polysync-unit-economics.xlsx from product/data/*.json.

The workbook carries live formulas (change a blue input, everything recomputes).
Its formulas mirror product/scripts/build.mjs; verify_xlsx() checks the
recalculated cells against product/generated/model-output.json.

    python3 product/scripts/build_xlsx.py            # write the workbook
    (recalculate with LibreOffice), then:
    python3 product/scripts/build_xlsx.py --verify   # compare cells to model-output.json
"""
import json
import sys
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.workbook.defined_name import DefinedName

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "product/generated/polysync-unit-economics.xlsx"
model = json.loads((ROOT / "product/data/model.json").read_text())
evidence = {c["id"]: c for c in json.loads((ROOT / "product/data/evidence.json").read_text())["claims"]}
hybrid = json.loads((ROOT / "evals/results/hybrid-latest.json").read_text())
esc = hybrid["sets"]["amber_escalation_by_schedule"]["byDaysAndDoubles"]

F = "Arial"
BLUE = Font(name=F, color="0000FF")
BLACK = Font(name=F)
GREEN = Font(name=F, color="008000")
BOLD = Font(name=F, bold=True)
HEAD = Font(name=F, bold=True, color="FFFFFF")
HEAD_FILL = PatternFill("solid", fgColor="1F3A5F")
KEY = PatternFill("solid", fgColor="FFFF00")
THIN = Border(bottom=Side(style="thin", color="BBBBBB"))
KEY_DRIVERS = {"manualMinutesPerAthleteWeek", "pricePerAthleteMonthUsd", "specialistPremium", "minutesPerEscalation"}


def header(ws, row, cols):
    for i, t in enumerate(cols, 1):
        c = ws.cell(row=row, column=i, value=t)
        c.font, c.fill = HEAD, HEAD_FILL
        c.alignment = Alignment(wrap_text=True, vertical="top")


def build(write=True):
    wb = Workbook()

    # ── Read me ─────────────────────────────────────────────────────────────
    rd = wb.active
    rd.title = "Read me"
    lines = [
        ("PolySync unit economics", BOLD),
        (f"As of {model['asOf']}. Generated from product/data/model.json by product/scripts/build_xlsx.py.", BLACK),
        ("Blue cells are inputs; black cells are formulas; green cells link to another sheet; yellow marks the drivers that swing club ROI most.", BLACK),
        ("Edit a blue cell on 'Drivers' (column C) and every sheet recalculates.", BLACK),
        ("B2B2C (ADR-001): the club's coaches review escalations, so coach time is the club's cost. 'Managed break-even' is the price PolySync would need if it employed the coaches.", BLACK),
        ("Escalation rates are simulated from the engine's own rules (evals/results/hybrid-latest.json); real rates are unmeasured (GAPS #14).", BLACK),
        ("Most drivers are hypotheses; each names the telemetry event or study that will replace it (see 'Drivers' column H).", BLACK),
    ]
    for i, (t, f) in enumerate(lines, 1):
        rd.cell(row=i, column=1, value=t).font = f
    rd.column_dimensions["A"].width = 140

    # ── Drivers ─────────────────────────────────────────────────────────────
    dr = wb.create_sheet("Drivers")
    header(dr, 1, ["Id", "Driver", "Base", "Low", "High", "Unit", "Source type", "Source / measured by"])
    for r, d in enumerate(model["drivers"], 2):
        dr.cell(row=r, column=1, value=d["id"]).font = BLACK
        dr.cell(row=r, column=2, value=d["label"]).font = BLACK
        for col, key in ((3, "base"), (4, "low"), (5, "high")):
            c = dr.cell(row=r, column=col, value=d[key])
            c.font = BLUE
        if d["id"] in KEY_DRIVERS:
            dr.cell(row=r, column=3).fill = KEY
        dr.cell(row=r, column=6, value=d["unit"]).font = BLACK
        if d.get("evidence"):
            kind = "Evidence"
            srcs = "; ".join(f"{e} ({evidence[e]['grade']}): {evidence[e]['source']} {evidence[e]['url']}" for e in d["evidence"])
        elif d.get("decision"):
            kind, srcs = "Decision", d["decision"]
        else:
            kind = "Hypothesis"
            srcs = f"Measured by {d['hypothesis']['measuredBy']}" + (f"; anchors {', '.join(d['anchors'])}" if d.get("anchors") else "")
        dr.cell(row=r, column=7, value=kind).font = BLACK
        dr.cell(row=r, column=8, value=srcs).font = BLACK
        wb.defined_names[d["id"]] = DefinedName(d["id"], attr_text=f"Drivers!$C${r}")
    n = len(model["drivers"]) + 2
    dr.cell(row=n + 1, column=1, value="Constants").font = BOLD
    consts = [
        ("weeksPerMonth", "Weeks per month", 4.33, "Convention"),
        ("fxAedPerUsd", "AED per USD", evidence["CST-004"]["value"], f"CST-004 ({evidence['CST-004']['grade']}): {evidence['CST-004']['source']}"),
        ("uaeMonthlyWageAed", "UAE personal-trainer average salary, AED/month", 4556, f"CST-002 ({evidence['CST-002']['grade']}): {evidence['CST-002']['url']}"),
        ("uaeHoursPerMonth", "Working hours per month", 173.33, "40 h x 52 / 12"),
        ("usHourlyWageUsd", "US median wage, fitness trainers, USD/h", evidence["CST-001"]["value"], f"CST-001 ({evidence['CST-001']['grade']}): {evidence['CST-001']['url']}"),
    ]
    for i, (name, label, val, src) in enumerate(consts, n + 2):
        dr.cell(row=i, column=1, value=name).font = BLACK
        dr.cell(row=i, column=2, value=label).font = BLACK
        dr.cell(row=i, column=3, value=val).font = BLUE
        dr.cell(row=i, column=8, value=src).font = BLACK
        wb.defined_names[name] = DefinedName(name, attr_text=f"Drivers!$C${i}")
    for col, w in zip("ABCDEFGH", (30, 58, 10, 10, 10, 16, 12, 90)):
        dr.column_dimensions[col].width = w

    # ── Escalation (CI simulation) ──────────────────────────────────────────
    es = wb.create_sheet("Escalation")
    header(es, 1, ["Schedule", "Hard sessions (n)", "Escalated", "Rate", "Segment"])
    seg_of = {k: s["id"] for s in model["segments"] for k in s["scheduleKeys"]}
    keys = sorted(esc)
    for r, k in enumerate(keys, 2):
        es.cell(row=r, column=1, value=k).font = BLACK
        es.cell(row=r, column=2, value=esc[k]["n"]).font = BLUE
        es.cell(row=r, column=3, value=esc[k]["escalated"]).font = BLUE
        c = es.cell(row=r, column=4, value=f"=IFERROR(C{r}/B{r},0)")
        c.font, c.number_format = BLACK, "0.0%"
        es.cell(row=r, column=5, value=seg_of.get(k, "")).font = BLACK
    last = len(keys) + 1
    es.cell(row=1, column=4).comment = Comment("Source: evals/results/hybrid-latest.json, amber_escalation_by_schedule (CI). Simulation of the engine's own rules.", "build_xlsx")
    seg_row0 = last + 3
    es.cell(row=seg_row0 - 1, column=1, value="Segment escalation rate (n-weighted)").font = BOLD
    for i, s in enumerate(model["segments"]):
        r = seg_row0 + i
        es.cell(row=r, column=1, value=s["id"]).font = BLACK
        es.cell(row=r, column=2, value=s["label"]).font = BLACK
        c = es.cell(row=r, column=4, value=f'=IFERROR(SUMIFS($C$2:$C${last},$E$2:$E${last},A{r})/SUMIFS($B$2:$B${last},$E$2:$E${last},A{r}),0)')
        c.font, c.number_format = BLACK, "0.0%"
        wb.defined_names[f"esc_{s['id']}"] = DefinedName(f"esc_{s['id']}", attr_text=f"Escalation!$D${r}")
    for col, w in zip("ABCDE", (22, 46, 16, 10, 12)):
        es.column_dimensions[col].width = w

    # ── Unit economics ──────────────────────────────────────────────────────
    ue = wb.create_sheet("Unit economics")
    cases = [(m["id"], s["id"]) for m in model["markets"] for s in model["segments"]]
    header(ue, 1, ["Per athlete-month"] + [f"{m} / {s}" for m, s in cases])
    rows = [
        ("coachHourly", "Coach cost per hour, loaded ($)", "$#,##0.00"),
        ("escRate", "Escalation rate on amber days (simulated)", "0.0%"),
        ("escalations", "Escalations per athlete-month", "0.00"),
        ("withMin", "Coach minutes with PolySync", "0.0"),
        ("manualMin", "Coach minutes by hand", "0.0"),
        ("savedMin", "Coach minutes saved", "0.0"),
        ("clubValue", "Club value of minutes saved ($)", "$#,##0.00"),
        ("clubRoi", "Club ROI at price", "0.00x"),
        ("apcManual", "Athletes per coach, by hand", "0"),
        ("apcWith", "Athletes per coach, with PolySync", "0"),
        ("inference", "Inference cost ($)", "$#,##0.00"),
        ("softwareGm", "PolySync software gross margin", "0.0%"),
        ("coachCost", "Coach cost if PolySync employed the coach ($)", "$#,##0.00"),
        ("managedBe", "Managed break-even price for target margin ($)", "$#,##0.00"),
        ("priceAed", "Price in AED", "#,##0"),
    ]
    ROW = {k: i for i, (k, _, _) in enumerate(rows, 2)}
    for key, label, fmt in rows:
        ue.cell(row=ROW[key], column=1, value=label).font = BLACK
    for j, (mkt, seg) in enumerate(cases, 2):
        col = ue.cell(row=1, column=j).column_letter
        R = lambda k: f"{col}{ROW[k]}"
        wage = "(uaeMonthlyWageAed/uaeHoursPerMonth/fxAedPerUsd)" if mkt == "UAE" else "usHourlyWageUsd"
        f = {
            "coachHourly": f"={wage}*coachLoading*specialistPremium",
            "escRate": f"=esc_{seg}",
            "escalations": f"=amberDaysPerAthleteMonth*hardShareOnAmber*{R('escRate')}+painFlagsPerAthleteMonth+llmProposalsPerAthleteMonth*proposalRejectRate",
            "withMin": f"=triageMinutesPerAthleteWeek*weeksPerMonth+{R('escalations')}*minutesPerEscalation",
            "manualMin": "=manualMinutesPerAthleteWeek*weeksPerMonth",
            "savedMin": f"={R('manualMin')}-{R('withMin')}",
            "clubValue": f"={R('savedMin')}/60*{R('coachHourly')}",
            "clubRoi": f"=IFERROR({R('clubValue')}/pricePerAthleteMonthUsd,0)",
            "apcManual": f"=IFERROR(coachProgrammingHoursPerWeek*60*weeksPerMonth/{R('manualMin')},0)",
            "apcWith": f"=IFERROR(coachProgrammingHoursPerWeek*60*weeksPerMonth/{R('withMin')},0)",
            "inference": "=llmCallsPerAthleteMonth*(llmTokensInPerProposal*priceInPer1M+llmTokensOutPerProposal*priceOutPer1M)/1000000",
            "softwareGm": f"=IFERROR(1-({R('inference')}+infraPerAthleteMonthUsd+pricePerAthleteMonthUsd*paymentFeeRate)/pricePerAthleteMonthUsd,0)",
            "coachCost": f"={R('withMin')}/60*{R('coachHourly')}",
            "managedBe": f"=IFERROR(({R('coachCost')}+{R('inference')}+infraPerAthleteMonthUsd)/(1-targetGrossMargin-paymentFeeRate),0)",
            "priceAed": "=pricePerAthleteMonthUsd*fxAedPerUsd",
        }
        for key, label, fmt in rows:
            c = ue.cell(row=ROW[key], column=j, value=f[key])
            c.font = GREEN if key == "escRate" else BLACK
            c.number_format = fmt
    ue.column_dimensions["A"].width = 48
    for j in range(2, len(cases) + 2):
        ue.column_dimensions[ue.cell(row=1, column=j).column_letter].width = 16

    # ── Penetration ─────────────────────────────────────────────────────────
    pe = wb.create_sheet("Penetration")
    header(pe, 1, ["Required penetration (not a forecast)", "Value"])
    items = [
        ("ARR milestone ($)", "=arrTargetUsd", "$#,##0"),
        ("Active athletes needed", "=IFERROR(arrTargetUsd/(12*pricePerAthleteMonthUsd),0)", "#,##0"),
        ("Clubs needed", "=IFERROR(B3/athletesPerClub,0)", "#,##0"),
        ("Share of HYROX-affiliated gyms (MKT-003, grade C)", "=IFERROR(B4/hyroxGyms,0)", "0.0%"),
    ]
    for r, (label, formula, fmt) in enumerate(items, 2):
        pe.cell(row=r, column=1, value=label).font = BLACK
        c = pe.cell(row=r, column=2, value=formula)
        c.font, c.number_format = BLACK, fmt
    pe.column_dimensions["A"].width = 52
    pe.column_dimensions["B"].width = 16

    # ── Sources ─────────────────────────────────────────────────────────────
    so = wb.create_sheet("Sources")
    header(so, 1, ["Id", "Grade", "Claim", "Source", "URL", "Accessed"])
    for r, c in enumerate(evidence.values(), 2):
        for col, key in enumerate(("id", "grade", "claim", "source", "url", "accessed"), 1):
            so.cell(row=r, column=col, value=c[key]).font = BLACK
    for col, w in zip("ABCDEF", (10, 7, 70, 60, 60, 12)):
        so.column_dimensions[col].width = w

    for ws in wb.worksheets:
        ws.freeze_panes = "B2" if ws.title not in ("Read me",) else None
    if write:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        wb.save(OUT)
        print(f"wrote {OUT.relative_to(ROOT)}")
    return ROW, cases


def verify(ROW, cases):
    wb = load_workbook(OUT, data_only=True)
    ue = wb["Unit economics"]
    out = json.loads((ROOT / "product/generated/model-output.json").read_text())["unitEconomics"]
    keymap = {"clubRoi": "clubRoi", "softwareGm": "softwareGrossMargin", "managedBe": "managedBreakEvenPriceUsd", "withMin": "coachMinutesWith", "apcWith": "athletesPerCoachWith", "escRate": "escalationRate", "inference": "inferenceUsd"}
    bad = []
    for j, (m, s) in enumerate(cases, 2):
        for xk, jk in keymap.items():
            v = ue.cell(row=ROW[xk], column=j).value
            want = out[f"{m}/{s}"][jk]
            if v is None or abs(v - want) > 0.002 * max(1, abs(want)):
                bad.append(f"{m}/{s} {xk}: sheet {v} vs model {want}")
    pen = wb["Penetration"]["B4"].value
    if pen is None:
        bad.append("penetration not calculated")
    if bad:
        print("VERIFY FAIL\n- " + "\n- ".join(bad))
        sys.exit(1)
    print(f"verify OK: {len(cases) * len(keymap)} cells match model-output.json")


if __name__ == "__main__":
    # Usage: build_xlsx.py            -> write the workbook
    #        (recalculate with LibreOffice, e.g. the xlsx skill's recalc.py)
    #        build_xlsx.py --verify   -> check the recalculated cells against model-output.json
    if "--verify" in sys.argv:
        ROW, cases = build(write=False)
        verify(ROW, cases)
    else:
        build()
