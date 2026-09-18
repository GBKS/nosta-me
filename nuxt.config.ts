// https://nuxt.com/docs/api/configuration/nuxt-config
// https://nuxt.com/docs/guide/concepts/rendering#route-rules
export default defineNuxtConfig({
	nitro: {
		preset: 'netlify'
	},
	app: {
		head: {
			title: 'Nosta',
			meta: [
				{ name: 'description', content: 'Nostr profiles. Nice and easy.' },
				{ name: 'msapplication-TileColor', content: '#ffffff' },
				{ name: 'msapplication-TileImage', content: '/ms-icon-144x144.png' },
				{ name: 'theme-color', content: '#ffffff' }
			],
			link: [
				{ rel: 'apple-touch-icon', sizes: '57x57', href: '/images/apple-icon-57x57.png' },
				{ rel: 'apple-touch-icon', sizes: '60x60', href: '/images/apple-icon-60x60.png' },
				{ rel: 'apple-touch-icon', sizes: '72x72', href: '/images/apple-icon-72x72.png' },
				{ rel: 'apple-touch-icon', sizes: '76x76', href: '/images/apple-icon-76x76.png' },
				{ rel: 'apple-touch-icon', sizes: '114x114', href: '/images/apple-icon-114x114.png' },
				{ rel: 'apple-touch-icon', sizes: '120x120', href: '/images/apple-icon-120x120.png' },
				{ rel: 'apple-touch-icon', sizes: '144x144', href: '/images/apple-icon-144x144.png' },
				{ rel: 'apple-touch-icon', sizes: '152x152', href: '/images/apple-icon-152x152.png' },
				{ rel: 'apple-touch-icon', sizes: '180x180', href: '/images/apple-icon-180x180.png' },
				{ rel: 'icon', type: 'image/png', sizes: '144x144', href: '/images/android-icon-192x192.png' },
				{ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/images/favicon-32x32.png' },
				{ rel: 'icon', type: 'image/png', sizes: '96x96', href: '/images/favicon-96x96.png' },
				{ rel: 'icon', type: 'image/png', sizes: '16x16', href: '/images/favicon-16x16.png' },
				{ rel: 'manifest', href: '/manifest.json' }
			],
			script: [
				{ 
					src: 'https://cloud.umami.is/script.js',
					'data-website-id': 'f60ce998-27d4-421b-98a0-c54d38131290',
					defer: true
				}
			]
		}
	},
	modules: [
		'@pinia/nuxt',
		'@vueuse/nuxt',
		'nuxt-security'
	],
	// https://nuxt-security.vercel.app
	// Profiles show content from anywhere, which is what the CSP is for:
	// should a script ever get injected, it won't run. Scripts need the
	// nonce, inline event handlers are off. Images, media and connections
	// are left open since they point to whatever users put in their profiles.
	security: {
		headers: {
			contentSecurityPolicy: {
				'default-src': ["'self'"],
				'script-src': ["'self'", "'nonce-{{nonce}}'", "'strict-dynamic'"],
				'script-src-attr': ["'none'"],
				'style-src': ["'self'", "'unsafe-inline'"],
				'img-src': ["'self'", 'data:', 'blob:', 'https:'],
				'media-src': ["'self'", 'data:', 'blob:', 'https:'],
				'font-src': ["'self'", 'data:'],
				'connect-src': ["'self'", 'https:', 'wss:'], // Relays, NIP-05, NIP-11, LNURL, analytics
				'frame-src': ['https://embed.wavlake.com'],
				'frame-ancestors': ["'none'"],
				'object-src': ["'none'"],
				'base-uri': ["'none'"],
				'form-action': ["'self'"],
				'manifest-src': ["'self'"],
				'upgrade-insecure-requests': true
			},
			xFrameOptions: 'DENY',
			referrerPolicy: 'strict-origin-when-cross-origin',
			// Netlify already sends this, without includeSubDomains.
			strictTransportSecurity: false,
			permissionsPolicy: {
				camera: [],
				'display-capture': [],
				fullscreen: ['self'], // For videos in notes
				geolocation: [],
				microphone: []
			},
			// These break loading profile images and the Wavlake embeds.
			crossOriginEmbedderPolicy: false,
			crossOriginResourcePolicy: false,
			crossOriginOpenerPolicy: false
		},
		// /.well-known/nostr.json sets its own CORS header for NIP-05.
		corsHandler: false,
		// The rate limiter keeps state in memory, which doesn't work with
		// serverless functions. Netlify does the rate limiting (netlify.toml).
		rateLimiter: false,
		requestSizeLimiter: false,
		xssValidator: false,
		removeLoggers: false,
		sri: false
	},
	// Stores are imported explicitly everywhere. The auto-import scanner
	// also misreads `state` in stores/session.js as an export.
	pinia: {
		storesDirs: []
	},
	serverHandlers: [
  		{ route: '/.well-known/nostr.json', handler: '~/server/api/nip05.ts' }
	],
	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: '@use "@/assets/css/_import.scss" as *;',
					// The stylesheets still use @import, which works until Dart Sass 3.
					silenceDeprecations: ['import', 'global-builtin']
				}
			}
		}
	},
	css: [
		'@/assets/css/_base.scss'
	]
})
