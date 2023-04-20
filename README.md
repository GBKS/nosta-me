# Nosta

Here lies the code (computer code, not some type of secret code) for the [Nosta](https://nosta.me/) interactive experience, the antidote for [Nostr](https://nostr.com) profile setup anxiety.

Goal is to have a micro-app that onboards new Nostriches into the ecosystem as a whole by helping them set up their profiles and exposing them to all the things they can do on Nostr. Then ideally, the profile becomes a place that reflects their activities and they feel proud of. Part of this is also themeing, which I look at like configuring your avatar in a video game.

Nosta is not a place for posting timely social media content, messaging, etc. The site links out to other apps that specialize in these. It focuses on setting up and displaying static profile information (name, about, follows, badges, lists...), and also showcasing some recent activity like zaps and products listed for sale.

- [nosta.me](https://nosta.me/)
- [Bolt.fun project page](https://makers.bolt.fun/project/nosta)

This is a for-fun side project by [Christoph](https://nosta.me/gbks@nosta.me). You can read the background story in the [Bolt.fun Nostr hackathon pitch](https://makers.bolt.fun/story/a-bold-pitch-for-nosta--716). I am not necessarily looking for contributors at the moment, but I was asked to open-source the code because it touches private keys, so here we go. I'd appreciate to hear feedback when something doesn't work or acts funky, and ideas for improvements.

## [NIPs](https://github.com/nostr-protocol/nips) supported

- NIP-01: Basic protocol flow description
- NIP-02: Contact List and Petnames
- NIP-05: Mapping Nostr keys to DNS-based internet identifiers
- NIP-06: Basic key derivation from mnemonic seed phrase
- NIP-07: window.nostr capability for web browsers
- NIP-11: Relay Information Document
- NIP-19: bech32-encoded entities
- NIP-21: nostr: URL scheme
- NIP-51: Lists
- NIP-56: Reporting
- NIP-57: Lightning Zaps
- NIP-58: Badges
- NIP-65: Relay List Metadata

## NIPs to be supported

- NIP-15: Marketplace
- NIP-36: Sensitive Content
- NIP-39: External Identities in Profiles
- NIP-46: Nostr Connect
- NIP-78: Application-specific data 

## Local development

Switch to a node version that might work (requires nvm).

```bash
nvm use
```

Install depencencies (requires npm).

```bash
npm install
```

Start the development server on http://localhost:3000

```bash
npm run dev
```

Build the application for production.

```bash
npm run build
```

Locally preview production build.

```bash
npm run preview
```