// Layer 1 of the safety design (design system: patterns/safety-guardrails.md): a deterministic
// detector that runs BEFORE any model call. If it fires, the model is never called.
// Lists are a prototype set (EN + a small AR set) to be reviewed by a clinician and a native
// Arabic speaker before launch; the production lists live with a test set in CI.

export type Card = "S1" | "S2" | "S3" | "S4";
export type Category = "cardiac" | "crisis" | "acute_injury" | "eating" | "pregnancy" | "medication" | "diagnosis" | "caution_pain" | "illness";
export interface Detection { category: Category; card: Card | null; tier: "emergency" | "stop" | "blocked" | "caution"; matched: string }

const RULES: { category: Category; card: Card | null; tier: Detection["tier"]; patterns: RegExp[] }[] = [
  { category: "crisis", card: "S2", tier: "emergency", patterns: [/\b(kill|hurt|harm)(ing)? myself\b/, /\b(want|wanna) to die\b/, /\bend (it all|my life)\b/, /\bsuicid/, /\bno reason to live\b/, /\bnothing matters( anymore)?\b/, /\bhopeless\b/, /ما أبغى أعيش/, /أبي أموت/, /انتحار/] },
  { category: "cardiac", card: "S1", tier: "emergency", patterns: [/\bchest (pain|tight\w*|pressure)\b/, /\b(faint(ed|ing)?|passed out|blacked out)\b/, /\bcan'?t (catch my|get my) breath\b/, /\b(heart|chest) (is )?(racing|pounding) (at rest|won'?t stop)\b/, /ألم في (الصدر|صدري)/, /أغمي علي/] },
  { category: "acute_injury", card: "S3", tier: "stop", patterns: [/\b(heard|felt) a (pop|snap)\b/, /\b(popped|snapped)\b/, /\bcan'?t (put weight|bear weight|walk)\b/, /\b(swelling|swollen)\b/, /\bsharp pain\b/] },
  { category: "eating", card: "S4", tier: "blocked", patterns: [/\bburn off (what|everything|all) (i|I) ate\b/, /\bearn (my|the) (food|meal|dinner)\b/, /\bpurg(e|ing)\b/, /\bmake myself (sick|throw up)\b/, /\bstarv(e|ing) myself\b/, /\b(skip|skipping) (meals|eating) to\b/] },
  { category: "pregnancy", card: "S4", tier: "blocked", patterns: [/\bpregnan/, /\b(gave birth|postpartum|post-partum)\b/, /حامل/] },
  { category: "medication", card: "S4", tier: "blocked", patterns: [/\bwhat dose\b/, /\bhow (much|many) (mg|milligrams)\b/, /\b(steroid|sarm|trt|testosterone) (cycle|dose|stack)\b/, /\bshould i take\b/, /\b(dosage|dosing)\b/] },
  { category: "diagnosis", card: "S4", tier: "blocked", patterns: [/\bis (it|this) (a )?(torn|tear|fracture|broken|sprain)/, /\bdo i have\b/, /\bwhat'?s wrong with my\b/, /\bdiagnos/] },
  { category: "caution_pain", card: null, tier: "caution", patterns: [/\b(my )?(knee|back|shoulder|hip|ankle|neck|wrist|elbow)s? (hurts?|is sore|aches?|feels? off)\b/, /\bit hurts\b/, /\bpain\b/] },
  { category: "illness", card: null, tier: "caution", patterns: [/\b(fever|flu|a cold|covid|sick)\b/] },
];

// Gym idioms that must not trigger (false-positive list, grown from the test set).
const IDIOMS = [/\bkiller (workout|session|legs)\b/, /\bdying (after|from) (that|this|those)\b/, /\b(i'?m|im) dead\b/, /\bkilled it\b/, /\bsick (workout|session|pump)\b/, /\bnailed it\b/];
const NEGATION = /\b(no|not|don'?t|doesn'?t|didn'?t|without|never|zero)\b(\W+\w+){0,3}\W*$/;

export function detect(message: string): Detection | null {
  let text = message.toLowerCase().replace(/[’`]/g, "'");
  for (const i of IDIOMS) text = text.replace(i, " ");
  for (const rule of RULES) {
    for (const p of rule.patterns) {
      const m = p.exec(text);
      if (!m) continue;
      const negated = NEGATION.test(text.slice(0, m.index)); // "no pain", "I don't have chest pain"
      // Crisis language is never discounted by a negation, except "I don't want to die".
      if (negated && (rule.category !== "crisis" || /want|wanna/.test(m[0]))) continue;
      return { category: rule.category, card: rule.card, tier: rule.tier, matched: m[0] };
    }
  }
  return null;
}

export type Region = "UAE" | "US" | "EU";
export const RESOURCES: Record<Region, { emergency: string; emergencyLabel: string; crisis: string; crisisLabel: string; note?: string }> = {
  UAE: { emergency: "998", emergencyLabel: "Ambulance 998", crisis: "800 4673", crisisLabel: "800HOPE (800 4673)" },
  US: { emergency: "911", emergencyLabel: "Emergency 911", crisis: "988", crisisLabel: "988 Lifeline (call or text)" },
  EU: { emergency: "112", emergencyLabel: "Emergency 112", crisis: "112", crisisLabel: "Emergency 112", note: "National crisis lines are added per launch country." },
};

export const TOPIC_LINE: Partial<Record<Category, { line: string; who: string }>> = {
  eating: { line: "We don't give advice on eating, weight or making up for food with exercise", who: "a doctor or a registered dietitian" },
  pregnancy: { line: "Training during pregnancy or after giving birth needs a plan from someone who can examine you", who: "your doctor or midwife" },
  medication: { line: "We don't advise on medication, supplement doses or performance drugs", who: "a doctor or pharmacist" },
  diagnosis: { line: "We can't tell what an injury is", who: "a doctor or physio" },
};
