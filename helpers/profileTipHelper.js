/*

Reviews profile events and gathers tips for things the user hasn't done yet.

*/

export default { 
  log: !false,

  getTips(data) {
    let result = []

    if(!data.follows || data.follows.tags.length == 0) {
      result.push({
        title: 'Follow others',
        description: 'See their latest posts in other Nostr clients.',
        kind: 3
      })
    }

    if(!data.userStatuses || data.userStatuses.length == 0) {
      result.push({
        title: 'Update your status',
        description: 'Keep it organized and efficient.',
        kind: 30315
      })
    }

    if(!data.shortNotes || data.shortNotes.length == 0) {
      result.push({
        title: 'Post an update',
        description: 'What you had for breakfast, philosophical insights, or anything else on your mind.',
        kind: 1
      })
    }

    if(!data.longNotes || data.longNotes.length == 0) {
      result.push({
        title: 'Write an article',
        description: 'Write a fiction story, recipes, code tutorials, etc.',
        kind: 30023
      })
    }

    // if(!data.relays || data.relays.length == 0) {
    //   result.push({
    //     title: 'Get connected',
    //     description: 'Define your Nostr relays to find and post content efficiently.',
    //     kind: 2
    //   })
    // }

    if(!data.badges || data.badges.length == 0) {
      result.push({
        title: 'Create and earn badges',
        description: 'Style out your profile.',
        kind: 30008
      })
    }

    if(!data.lists || data.lists.length == 0) {
      result.push({
        title: 'Create lists',
        description: 'Mute, bookmark and pin to stay organized.',
        kind: 30001
      })
    }

    if(!data.live || data.live.length == 0) {
      result.push({
        title: 'Stream live',
        description: 'Schedule and host audio and video streams.',
        kind: 30311
      })
    }

    if(!data.classifieds || data.classifieds.length == 0) {
      result.push({
        title: 'Post a classified ad',
        description: 'Looking to hire? Got a lawn mower to sell?',
        kind: 30402
      })
    }

    if(!data.products || data.products.length == 0) {
      result.push({
        title: 'Create an online shop',
        description: 'List your products for others to purchase.',
        kind: 30018
      })
    }

    if(!data.handlers || data.handlers.length == 0) {
      result.push({
        title: 'Recommend Nostr apps',
        description: 'Surface great tools, improve your own experience.',
        kind: 31989
      })
    }

    if(!data.events || data.events.length == 0) {
      result.push({
        title: 'Organize an event',
        description: 'Meetups, birthdays, holidays, and anything else.',
        kind: 31922
      })
    }

    if(!data.calendars || data.calendars.length == 0) {
      result.push({
        title: 'Share a calendar',
        description: 'Let others know about events you organize or attend.',
        kind: 31924
      })
    }

    if(!data.files || data.files.length == 0) {
      result.push({
        title: 'Share files',
        description: 'Images, videos, PDFs, and more.',
        kind: 1063
      })
    }

    if(!data.reports || data.reports.length == 0) {
      result.push({
        title: 'Make a report',
        description: 'Help point out problematic content and profiles.',
        kind: 1984
      })
    }

    if(result.length == 0) {
      result = null
    }

    return result
  }
}