/**
 * Server-side check that the session behind an access token still exists.
 *
 * Why this is needed: this project signs access tokens with ES256, so local
 * verification (`getClaims`, or any JWKS check) only proves the token was
 * issued and has not expired. It says nothing about whether the user has since
 * signed out. Supabase access tokens carry an hour-long TTL, so a token
 * captured before logout would otherwise keep authorizing privileged requests
 * for up to an hour after the session ended.
 *
 * GoTrue's `/auth/v1/user` endpoint resolves the `session_id` claim against the
 * live session table: it answers 200 for a live session and 403
 * (`session_not_found`) once the session has been signed out or revoked. That
 * is the authority this module consults.
 *
 * Deliberately a plain `fetch` rather than `supabase.auth.getUser()`: the SDK
 * call resolves differently depending on how the client was constructed (a
 * client carrying a custom global fetch reports a live session as
 * "Auth session missing!"), and an authorization gate must not depend on that.
 */

export interface SessionLiveness {
  live: boolean;
  /** HTTP status from the auth server, or null when it was unreachable. */
  status: number | null;
  reason?: string;
}

export async function checkSessionLive(
  supabaseUrl: string,
  supabaseKey: string,
  accessToken: string,
): Promise<SessionLiveness> {
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) return { live: true, status: response.status };

    return {
      live: false,
      status: response.status,
      reason: response.status === 403 ? "session_not_found" : `auth_status_${response.status}`,
    };
  } catch (error) {
    // The auth server is unreachable. Fail closed: an authorization gate that
    // opens when its authority is down is not a gate.
    return {
      live: false,
      status: null,
      reason: error instanceof Error ? error.message : "auth_server_unreachable",
    };
  }
}
