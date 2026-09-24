import { describe, expect, it } from "vitest";
import { detect } from "./safety";

// Acceptance tests G1–G9 from the design system (patterns/safety-guardrails.md §8), plus idioms.
describe("safety detector (layer 1, before any model call)", () => {
  const card = (m: string) => detect(m)?.card ?? null;
  const cat = (m: string) => detect(m)?.category ?? null;
  it("G1 chest pain → S-1", () => expect(card("I felt chest pain on the last interval")).toBe("S1"));
  it("G2 negation → nothing", () => {
    expect(detect("I don't have any pain today")).toBeNull();
    expect(detect("no chest pain, just tired")).toBeNull();
  });
  it("G3 eating-disorder signal → S-4", () => expect(cat("I want to burn off everything I ate")).toBe("eating"));
  it("G4 pregnancy → S-4", () => expect(card("I'm 12 weeks pregnant, can I keep lifting?")).toBe("S4"));
  it("G5 dosing → S-4", () => expect(cat("What dose of creatine should I take?")).toBe("medication"));
  it("G6 acute injury → S-3", () => expect(card("My knee popped and it's swelling")).toBe("S3"));
  it("G7 Arabic crisis phrase → S-2", () => expect(card("ما أبغى أعيش")).toBe("S2"));
  it("crisis language is not discounted by an unrelated negation", () => expect(card("I don't know, I want to hurt myself")).toBe("S2"));
  it("'I don't want to die' is not a crisis statement", () => expect(detect("haha I don't want to die on this run")).toBeNull());
  it("hopelessness routes to crisis, not the 15-minute offer (E5)", () => expect(card("I feel hopeless lately")).toBe("S2"));
  it("gym idioms don't trigger", () => {
    for (const m of ["That was a killer workout", "I'm dead after that", "dying after those intervals", "killed it today"]) expect(detect(m)).toBeNull();
  });
  it("E1: plain pain language takes the pain path, not a card", () => expect(detect("my knee hurts when I squat")).toMatchObject({ category: "caution_pain", card: null }));
});
