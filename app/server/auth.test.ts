import { describe, expect, it } from "vitest";
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import { authenticate } from "./auth";

const PROJECT = "demo-project";

async function setup() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
  const keys = createLocalJWKSet({ keys: [jwk] });
  const sign = (claims: Record<string, unknown>, opts: { iss?: string; aud?: string; exp?: string } = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(opts.iss ?? `https://securetoken.google.com/${PROJECT}`)
      .setAudience(opts.aud ?? PROJECT)
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? "1h")
      .sign(privateKey);
  return { keys, sign };
}

describe("authenticate", () => {
  it("accepts a valid ID token and takes the uid from it", async () => {
    const { keys, sign } = await setup();
    const t = await sign({ sub: "athlete-123" });
    const r = await authenticate({ authorization: `Bearer ${t}` }, { projectId: PROJECT, keys });
    expect(r).toEqual({ ok: true, uid: "athlete-123", via: "id-token" });
  });

  it("rejects a token for another Firebase project", async () => {
    const { keys, sign } = await setup();
    const t = await sign({ sub: "x" }, { aud: "someone-elses-project", iss: "https://securetoken.google.com/someone-elses-project" });
    expect((await authenticate({ authorization: `Bearer ${t}` }, { projectId: PROJECT, keys })).ok).toBe(false);
  });

  it("rejects an expired token", async () => {
    const { keys, sign } = await setup();
    const t = await sign({ sub: "x" }, { exp: "-1m" });
    expect((await authenticate({ authorization: `Bearer ${t}` }, { projectId: PROJECT, keys })).ok).toBe(false);
  });

  it("rejects a token signed by a different key", async () => {
    const { keys } = await setup();
    const other = await setup();
    const t = await other.sign({ sub: "x" });
    expect((await authenticate({ authorization: `Bearer ${t}` }, { projectId: PROJECT, keys })).ok).toBe(false);
  });

  it("ignores x-user-id by default: the old impersonation path is closed", async () => {
    const { keys } = await setup();
    const r = await authenticate({ "x-user-id": "victim-uid" }, { projectId: PROJECT, keys });
    expect(r.ok).toBe(false);
  });

  it("never honours x-user-id in production, even if the dev flag is set", async () => {
    const { keys } = await setup();
    expect((await authenticate({ "x-user-id": "u" }, { projectId: PROJECT, keys, allowDevHeader: true, production: true })).ok).toBe(false);
    expect(await authenticate({ "x-user-id": "u" }, { projectId: PROJECT, keys, allowDevHeader: true, production: false })).toEqual({ ok: true, uid: "u", via: "dev-header" });
  });
});
