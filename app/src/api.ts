// Every call to this app's API goes through here, so every request carries the
// signed-in user's Firebase ID token. The server derives the uid from that
// token (server/auth.ts); the client never states who it is.
import { auth } from './firebase';

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const user = auth.currentUser;
  if (user) headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  return fetch(input, { ...init, headers });
}
