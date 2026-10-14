import analytics from '@/helpers/analytics.js'

// Counts steps through the create flow, opening the edit pages and profiles
// opened from the home page or directory. See helpers/analytics.js.
export default defineNuxtPlugin(() => {
  const router = useRouter()

  router.afterEach((to, from, failure) => {
    if(failure) return

    const event = analytics.navigationEvent(to, from)
    if(event) {
      analytics.track(event.name, event.data)
    }
  })
})
