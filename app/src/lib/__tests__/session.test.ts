import { describe, expect, it } from "vitest";
import { sessionContent } from "../session";

describe("Today session content (UX-01)", () => {
  it("never invents exercises when the plan has none", () => {
    for (const w of [undefined, null, {}, { exercises: null }, { exercises: [] }]) {
      const c = sessionContent(w as never);
      expect(c.kind).toBe("empty");
      expect("exercises" in c).toBe(false);
    }
  });

  it("passes engine exercises through unchanged", () => {
    const ex = [{ exerciseId: "squat" }, { exerciseId: "row" }];
    expect(sessionContent({ exercises: ex })).toEqual({ kind: "ready", exercises: ex });
  });
});
