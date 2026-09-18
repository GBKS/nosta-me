/*

Smoke test for the production build.

A passing build doesn't mean a working site. The production server has
returned 500 for every page while the build and dev mode were fine. This
starts the built server, requests the main routes and checks the things
that have broken before.

Run via `npm run test:smoke`, which builds with the node-server preset first.
Nothing here needs a relay or any other network access.

 */

import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'

const PORT = process.env.SMOKE_PORT || 4173
const BASE = 'http://localhost:' + PORT
const SERVER_ENTRY = '.output/server/index.mjs'

const HEX_KEY = 'b731e7fbde5c192d793ff520a6ec91f6965f5d8fa1b64e12171089a65e540525'
const NPUB = 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6'

const PAGES = [
  '/',
  '/about',
  '/directory',
  '/relays',
  '/create/welcome',
  '/create/recovery-phrase',
  '/create/relays',
  '/login/options',
  '/login/private-key',
  '/edit/profile',
  '/edit/relays',
  '/' + HEX_KEY,
  '/' + NPUB,
  '/gbks@nosta.me',
  '/' + HEX_KEY + '?t=winter'
]

let failures = 0
let serverOutput = ''

function check(ok, label, detail) {
  if(ok) {
    console.log('  ok    ' + label)
  } else {
    failures++
    console.log('  FAIL  ' + label + (detail ? ' (' + detail + ')' : ''))
  }
}

async function isPortInUse() {
  try {
    await fetch(BASE + '/.well-known/nostr.json')
    return true
  } catch(error) {
    return false
  }
}

async function waitForServer(server) {
  for(let i=0; i<50; i++) {
    // If our server has exited, anything answering is not the build under test.
    if(server.exitCode !== null) return false

    try {
      await fetch(BASE + '/.well-known/nostr.json')
      return true
    } catch(error) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  return false
}

async function testPages() {
  console.log('\nPages render')

  for(const path of PAGES) {
    const response = await fetch(BASE + path)
    const html = await response.text()
    const ok = response.status === 200 && html.includes('id="__nuxt"')
    check(ok, path, 'status ' + response.status)
  }
}

async function testNip05() {
  console.log('\nNIP-05 endpoint')

  const response = await fetch(BASE + '/.well-known/nostr.json?name=gbks')
  check(response.status === 200, 'responds', 'status ' + response.status)

  // Required by NIP-05 so browser-based clients can verify addresses.
  check(response.headers.get('access-control-allow-origin') === '*', 'has the CORS header')

  let data = null
  try {
    data = await response.json()
  } catch(error) {}

  check(data && data.names && data.names.gbks === HEX_KEY, 'returns the public key for gbks')
  check(data && data.relays && Array.isArray(data.relays[HEX_KEY]), 'returns relays for that key')

  const unknown = await (await fetch(BASE + '/.well-known/nostr.json?name=nobody-by-this-name')).json()
  check(unknown && unknown.names && !unknown.names['nobody-by-this-name'], 'has no entry for an unknown name')
}

async function testSecurityHeaders() {
  console.log('\nSecurity headers')

  const first = await fetch(BASE + '/about')
  const html = await first.text()
  const csp = first.headers.get('content-security-policy') || ''

  check(csp.includes("script-src-attr 'none'"), 'CSP blocks inline event handlers')
  check(csp.includes("'strict-dynamic'") && csp.includes("'nonce-"), 'CSP uses a nonce with strict-dynamic')
  check(!/script-src[^;]*'unsafe-inline'/.test(csp), "CSP script-src has no 'unsafe-inline'")
  check(csp.includes("frame-ancestors 'none'"), 'CSP forbids framing')
  check(csp.includes("object-src 'none'"), 'CSP forbids plugins')

  // Every script tag needs the nonce, or the browser won't run it.
  const scripts = html.match(/<script\b[^>]*>/g) || []
  const withoutNonce = scripts.filter(tag => !tag.includes('nonce='))
  check(scripts.length > 0 && withoutNonce.length === 0, 'all ' + scripts.length + ' script tags carry the nonce', withoutNonce[0])

  const second = await fetch(BASE + '/about')
  const nonce = (value) => ((value || '').match(/'nonce-([^']+)'/) || [])[1]
  const nonceA = nonce(csp)
  const nonceB = nonce(second.headers.get('content-security-policy'))
  check(nonceA && nonceB && nonceA !== nonceB, 'the nonce changes with every request')

  check(first.headers.get('x-frame-options') === 'DENY', 'X-Frame-Options is DENY')
  check(first.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is nosniff')
  check(!first.headers.get('x-powered-by'), 'X-Powered-By is not sent')
}

async function testThemes() {
  console.log('\nThemes')

  const color = async (path) => {
    const html = await (await fetch(BASE + path)).text()
    const match = html.match(/class="site-wrap[^"]*"[^>]*style="[^"]*background-color:([^;"]+)/)
    return match ? match[1].trim().toLowerCase() : null
  }

  const standard = await color('/' + HEX_KEY)
  const winter = await color('/' + HEX_KEY + '?t=winter')
  const invalid = await color('/' + HEX_KEY + '?t=not-a-theme')

  check(standard !== null, 'the profile page renders a theme color on the server')
  check(winter !== null && winter !== standard, 'a valid ?t= theme is rendered on the server', winter + ' vs ' + standard)
  check(invalid === standard, 'an invalid ?t= theme falls back to the default')
}

async function testStylesheets() {
  console.log('\nStylesheets')

  // assets/css/_import.scss is added to the styles of every component. If it
  // ever pulls in something that outputs CSS, every component gets a copy.
  // That has happened: 195 copies of the :root block, half of all the CSS.
  const directory = '.output/public/_nuxt/'
  const files = readdirSync(directory).filter(file => file.endsWith('.css'))
  const css = files.map(file => readFileSync(directory + file, 'utf8')).join('\n')

  const scopedCopies = (css.match(/\[data-v-[0-9a-f]+\]:root/g) || []).length
  check(files.length > 0, 'found ' + files.length + ' built stylesheets')
  check(scopedCopies === 0, 'no global CSS repeated in component styles', scopedCopies + ' copies of :root')

  // The page gets the global styles exactly once. Where from depends on the
  // Nuxt version: inlined into the HTML (Nuxt 3), or a linked stylesheet (Nuxt 4).
  const html = await (await fetch(BASE + '/about')).text()
  let pageCss = (html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join('\n')

  const links = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(match => match[1])
  for(const href of links) {
    pageCss += '\n' + await (await fetch(new URL(href, BASE))).text()
  }

  const definitions = (pageCss.match(/--back-rgb:/g) || []).length
  check(definitions === 1, 'the page defines the color variables exactly once', 'found ' + definitions)
  check(pageCss.includes('-theme-winter'), 'the page gets the themes')
}

async function run() {
  if(!existsSync(SERVER_ENTRY)) {
    console.log('No server build found at ' + SERVER_ENTRY + '. Run `npm run test:smoke`, which builds first.')
    process.exit(1)
  }

  // Otherwise our server fails to start and the checks would silently
  // run against whatever is already there, like an older build.
  if(await isPortInUse()) {
    console.log('Something is already running on port ' + PORT + '. Stop it, or set SMOKE_PORT to a free port.')
    process.exit(1)
  }

  const server = spawn(process.execPath, [SERVER_ENTRY], {
    env: { ...process.env, PORT: '' + PORT, NITRO_PORT: '' + PORT },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  server.stdout.on('data', data => { serverOutput += data })
  server.stderr.on('data', data => { serverOutput += data })

  try {
    const isUp = await waitForServer(server)
    if(!isUp) {
      console.log('The server did not start.\n' + serverOutput)
      process.exitCode = 1
      return
    }

    await testPages()
    await testNip05()
    await testSecurityHeaders()
    await testThemes()
    await testStylesheets()

    console.log('\nServer log')
    check(server.exitCode === null, 'the server under test is still running')
    const errorLines = serverOutput.split('\n').filter(line => line.includes('[request error]'))
    check(errorLines.length === 0, 'no request errors', errorLines[0])
  } catch(error) {
    failures++
    console.log('\nThe smoke test itself failed: ' + error.message)
  } finally {
    server.kill()
  }

  console.log(failures === 0 ? '\nAll checks passed.' : '\n' + failures + ' check(s) failed.')
  process.exitCode = failures === 0 ? 0 : 1
}

run()
