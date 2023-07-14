<script setup>
import Icons from '@/helpers/icons'

const props = defineProps([
  'info'
])

let services = {
  github: {
    name: 'GitHub',
    link: 'https://github.com/{id}/',
    icon: 'githubCircle',
    title: 'View on GitHub'
  },
  twitter: {
    name: 'Twitter',
    link: 'https://www.twitter.com/{id}/',
    icon: 'twitterCircle',
    title: 'View on Twitter'
  },
  mastodon: {
    name: 'Mastodon',
    link: 'https://{id}/',
    icon: 'mastodonCircle',
    title: 'View on Mastodon'
  },
  telegram: {
    name: 'Telegram',
    link: 'https://t.me/{id}/',
    icon: 'telegramCircle',
    title: 'View on Telegram'
  }
}

const link = computed(() => {
  const userId = props.info[1].split(':')[1]
  return service.value.link.split('{id}').join(userId)
})

const icon = computed(() => {
  return Icons[service.value.icon]
})

const supported = computed(() => {
  return service.value !== null
})

const service = computed(() => {
  const serviceId = props.info[1].split(':')[0]
  return services[serviceId] ? services[serviceId] : null
})
</script>

<template>
  <a
    v-if="supported"
    :href="link"
    :title="service.title"
    target="_blank"
    rel="nofollow noreferrer"
  ><span v-html="icon" />{{ service.name }}</a>
</template>

<style scoped lang="scss">

a {
  vertical-align: middle;
  text-decoration: none;
  transition: all 150ms $ease;
  word-break: break-all;
  font-size: 17px;
  padding: 5px 10px 8px 10px;
  margin-left: -10px;
  border-radius: 5px;
  color: var(--theme-text-medium);

  span {
    display: inline-block;
    margin-right: 10px;
    
    :deep(svg) {
      width: 18px;
      height: 18px;
      vertical-align: middle;
    }
  }

  &:hover {
    background-color: rgba(var(--theme-active-rgb), 0.25);
    color: var(--theme-active);
  }
}

</style>
