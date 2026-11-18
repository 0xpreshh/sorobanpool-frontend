# 0003 Token storage

**Status:** accepted (risk documented; moving the refresh token to an httpOnly cookie is tracked as a follow-up).

**Context.** The API issues an access token and a rotating refresh token (`lib/api.ts`). Today:

- The access token is held only in a module variable. It is lost on reload and is re-issued from the refresh token.
- The refresh token is stored in `localStorage` under `sp.refresh`, so sign-in survives a reload.

Any script that runs on the origin can read `localStorage`. That includes an injected third-party script or an XSS bug. A stolen refresh token keeps working until it is rotated or revoked.

The better design is an httpOnly, `SameSite` cookie for the refresh token, so JavaScript cannot read it. That needs a change in the API: it must set the cookie, accept refresh requests without a body, and allow credentialed CORS from the app origin. The API lives in a separate repository, so that change cannot be made from this one.

**Decision.** Keep the refresh token in `localStorage` for now, and reduce the risk around it:

1. The access token stays in memory only. It is never written to any storage.
2. A strict Content Security Policy with a per-request nonce (ADR 0004) limits which scripts can run. It starts in report-only mode and is enforced once the core pages are clean.
3. Untrusted text is rendered through `UserText`, which escapes it and strips bidi-control characters, so stored user content is not a script or layout attack vector.
4. No third-party scripts are loaded on the app origin.
5. The API should rotate refresh tokens on every use and revoke the token family when a used token is replayed. This is a backend requirement, not something this repo can enforce.

The follow-up is an API issue to set the refresh token as an httpOnly cookie. When it lands, `session.set` and `session.clear` in `lib/api.ts` stop touching storage, `refresh()` sends `credentials: 'include'`, and the `sp.refresh` key is removed.

**Consequences.**

- Sign-in persistence across reloads is unchanged.
- The refresh token is still readable by script on the origin until the follow-up lands. This is an accepted risk, not a fix.
- The e2e helpers in `tests/e2e/a11y.spec.ts` still seed `sp.refresh`, and they must be updated when the follow-up lands.
