/*

Turns a greeting note into a little bit of safe HTML for the gm card.

Everything from the note is escaped. Links become 🔗 and nostr references an
ellipsis, since the card is about the greeting. Custom emoji (NIP-30) are the
only images, and only from https addresses.

 */

const MAX_LENGTH = 600

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

export function greetingHtml(event) {
  let text = event.content.trim()
  if(text.length > MAX_LENGTH) text = text.slice(0, MAX_LENGTH) + '…'

  let html = escapeHtml(text)
    .replace(/https?:\/\/\S+/g, '🔗')
    .replace(/nostr:(npub|nprofile|note|nevent|naddr)1[0-9a-z]+/g, '…')

  for(const tag of event.tags || []) {
    const [name, code, url] = tag
    if(name != 'emoji' || !/^[\w-]+$/.test(code || '') || !/^https:\/\/[^\s"'<>]+$/.test(url || '')) continue
    html = html.split(`:${code}:`).join(`<img class="emoji" alt=":${code}:" src="${escapeHtml(url)}" referrerpolicy="no-referrer">`)
  }

  return html
}
