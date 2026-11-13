/**
 * OAuth redirects return to our fixed in-app callback, never to arbitrary
 * caller-controlled URLs.
 */
export function googleCallbackUrl(origin: string): string {
  return new URL("/auth/callback", origin).toString();
}

export function callbackError(search: string, hash: string): boolean {
  const query = new URLSearchParams(search.replace(/^\?/, ""));
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  return Boolean(
    query.get("error") ||
    query.get("error_code") ||
    fragment.get("error") ||
    fragment.get("error_code")
  );
}

export function postSignInPath(invitationToken: string | null): string {
  return invitationToken ? "/join?token=" + encodeURIComponent(invitationToken) : "/dashboard";
}
