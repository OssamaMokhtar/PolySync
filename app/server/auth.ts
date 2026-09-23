// Server-side identity (audit fix, 24 Sep 2026).
//
// Before: requireAuth() trusted an `x-user-id` header, and several components
// sent hard-coded values ("current-user", "stream-user"). Anyone could read or
// write any athlete's data by setting the header.
//
// Now: the client sends its Firebase ID token as `Authorization: Bearer …`,
// and the server verifies it against Google's published keys (RS256, issuer
// and audience bound to this Firebase project). The uid comes from the token,
// never from the request body or a header the client chooses.
//
// A local-development escape hatch exists (ALLOW_DEV_USER_HEADER=1) and is
// refused whenever NODE_ENV is "production".

import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

const GOOGLE_JWKS = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

export interface AuthConfig {
  projectId: string;
  /** Injected in tests; defaults to Google's published signing keys. */
  keys?: JWTVerifyGetKey;
  allowDevHeader?: boolean;
  production?: boolean;
}

export type AuthResult = { ok: true; uid: string; via: "id-token" | "dev-header" } | { ok: false; status: 401; error: string };

let remote: JWTVerifyGetKey | null = null;

export async function authenticate(headers: Record<string, string | string[] | undefined>, cfg: AuthConfig): Promise<AuthResult> {
  const raw = headers["authorization"];
  const auth = Array.isArray(raw) ? raw[0] : raw;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    try {
      const keys = cfg.keys ?? (remote ??= createRemoteJWKSet(new URL(GOOGLE_JWKS)));
      const { payload } = await jwtVerify(token, keys, {
        issuer: `https://securetoken.google.com/${cfg.projectId}`,
        audience: cfg.projectId,
        algorithms: ["RS256"],
      });
      if (typeof payload.sub !== "string" || payload.sub.length === 0 || payload.sub.length > 128) {
        return { ok: false, status: 401, error: "Invalid token subject" };
      }
      return { ok: true, uid: payload.sub, via: "id-token" };
    } catch {
      return { ok: false, status: 401, error: "Invalid or expired ID token" };
    }
  }
  const devUid = headers["x-user-id"];
  if (cfg.allowDevHeader && !cfg.production && typeof devUid === "string" && devUid.length > 0) {
    return { ok: true, uid: devUid, via: "dev-header" };
  }
  return { ok: false, status: 401, error: "Unauthorized: send a Firebase ID token as Authorization: Bearer <token>" };
}
