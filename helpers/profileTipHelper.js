/*

Reviews profile events and gathers tips for things the user hasn't done yet.

Each tip links to an app where it can be done. These used to link to a page per
event kind on nostrapp.link, which is gone. Apps come and go: check that a link
still leads to the app before adding it, and look over these now and then.
All checked on 2026-09-19.

 */

const APP_DIRECTORY = 'https://nostrapps.com/' // For what has no obvious app
const FOLLOWING_SPACE = 'https://following.space/'
const PRIMAL = 'https://primal.net/'
const YAKIHONNE = 'https://yakihonne.com/'
const LISTR = 'https://listr.lol/'
const ZAP_STREAM = 'https://zap.stream/'
const SHOPSTR = 'https://shopstr.store/'
const PLEBEIAN_MARKET = 'https://plebeian.market/'
const FLOCKSTR = 'https://www.flockstr.com/'

export default { 
  log: !false,

  getTips(data) {
    let result = []

    if(!data.follows || data.follows.tags.length == 0) {
      result.push({
        title: 'Follow others',
        description: 'See their latest posts in other Nostr clients.',
        kind: 3,
        url: FOLLOWING_SPACE
      })
    }

    if(!data.userStatuses || data.userStatuses.length == 0) {
      result.push({
        title: 'Update your status',
        description: 'Keep it organized and efficient.',
        kind: 30315,
        url: APP_DIRECTORY
      })
    }

    if(!data.shortNotes || data.shortNotes.length == 0) {
      result.push({
        title: 'Post an update',
        description: 'What you had for breakfast, philosophical insights, or anything else on your mind.',
        kind: 1,
        url: PRIMAL
      })
    }

    if(!data.longNotes || data.longNotes.length == 0) {
      result.push({
        title: 'Write an article',
        description: 'Write a fiction story, recipes, code tutorials, etc.',
        kind: 30023,
        url: YAKIHONNE
      })
    }

    if(!data.badges || data.badges.length == 0) {
      result.push({
        title: 'Create and earn badges',
        description: 'Style out your profile.',
        kind: 10008,
        url: APP_DIRECTORY
      })
    }

    if(!data.lists || data.lists.length == 0) {
      result.push({
        title: 'Create lists',
        description: 'Mute, bookmark and pin to stay organized.',
        kind: 30001,
        url: LISTR
      })
    }

    if(!data.live || data.live.length == 0) {
      result.push({
        title: 'Stream live',
        description: 'Schedule and host audio and video streams.',
        kind: 30311,
        url: ZAP_STREAM
      })
    }

    if(!data.classifieds || data.classifieds.length == 0) {
      result.push({
        title: 'Post a classified ad',
        description: 'Looking to hire? Got a lawn mower to sell?',
        kind: 30402,
        url: SHOPSTR
      })
    }

    if(!data.products || data.products.length == 0) {
      result.push({
        title: 'Create an online shop',
        description: 'List your products for others to purchase.',
        kind: 30018,
        url: PLEBEIAN_MARKET
      })
    }

    if(!data.handlers || data.handlers.length == 0) {
      result.push({
        title: 'Recommend Nostr apps',
        description: 'Surface great tools, improve your own experience.',
        kind: 31989,
        url: APP_DIRECTORY
      })
    }

    if(!data.events || data.events.length == 0) {
      result.push({
        title: 'Organize an event',
        description: 'Meetups, birthdays, holidays, and anything else.',
        kind: 31922,
        url: FLOCKSTR
      })
    }

    if(!data.calendars || data.calendars.length == 0) {
      result.push({
        title: 'Share a calendar',
        description: 'Let others know about events you organize or attend.',
        kind: 31924,
        url: FLOCKSTR
      })
    }

    if(!data.files || data.files.length == 0) {
      result.push({
        title: 'Share files',
        description: 'Images, videos, PDFs, and more.',
        kind: 1063,
        url: APP_DIRECTORY
      })
    }

    if(!data.reports || data.reports.length == 0) {
      result.push({
        title: 'Make a report',
        description: 'Help point out problematic content and profiles.',
        kind: 1984,
        url: APP_DIRECTORY
      })
    }

    if(result.length == 0) {
      result = null
    }

    return result
  }
}