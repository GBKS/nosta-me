import { defineVitestConfig } from '@nuxt/test-utils/config'

// Tests run in a Nuxt environment, so auto-imports, aliases and stores work
// the way they do in the app. https://nuxt.com/docs/getting-started/testing
export default defineVitestConfig({
	test: {
		environment: 'nuxt',
		include: ['tests/**/*.test.js']
	}
})
