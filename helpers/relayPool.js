
import { SimplePool } from 'nostr-tools/pool'

/*

One shared nostr-tools pool for all relay connections.

The pool gives us connection timeouts, keep-alive pings to notice dead
sockets, and automatic reconnects (with back-off) that re-send any open
subscriptions. Relay connectors get their connections from here.

 */

let pool = null

export default function relayPool() {
  // Created on first use, so nothing happens during server-side rendering.
  if(!pool) {
    pool = new SimplePool({
      enablePing: true,
      enableReconnect: true
    })

    // By default the pool closes connections that have been idle for 20 seconds.
    // We keep them open, the relay indicator in the header reflects them.
    pool.idleTimeout = 0
  }

  return pool
}
