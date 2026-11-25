/*

Where to go after logging in, when a page sent the user to the login with
?next=/somewhere. Only plain paths on this site are allowed, so the login
can't be used to send people off to another site.

 */

export function returnPath(query) {
  const next = query && query.next
  if(typeof next != 'string') return null
  return /^\/[a-z0-9-]+$/i.test(next) ? next : null
}
