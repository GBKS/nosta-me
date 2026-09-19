<script setup>
import ToolBox from '@/helpers/toolBox'
import linkHelper from '@/helpers/linkHelper.js'

// info is a highlight as returned by highlightHelper.parse()
const props = defineProps([
  'info',
  'handlers'
])

const LONG_FORM_KIND = 30023

const created = computed(() => {
  return ToolBox.formatRelativeDate(props.info.created_at, true)
})

// Where the passage is from, as { name, url }
const source = computed(() => {
  const source = props.info.source
  if(!source) return null

  try {
    if(source.type == 'web') {
      return { name: source.name, url: source.url }
    }

    if(source.type == 'address') {
      const isArticle = source.kind == LONG_FORM_KIND

      return {
        name: isArticle ? 'an article' : 'a post',
        url: linkHelper.address(
          source.identifier,
          source.pubkey,
          source.kind,
          source.relay,
          props.handlers,
          isArticle ? linkHelper.primal.article : linkHelper.njump.any
        )
      }
    }

    if(source.type == 'event') {
      return {
        name: 'a note',
        url: linkHelper.event(source.id, source.relay, 1, props.handlers, linkHelper.primal.event)
      }
    }
  } catch(error) {
    // A relay hint that can't be encoded, for one. Show the passage without a link.
  }

  return null
})
</script>

<template>
  <div class="highlight-item">
    <blockquote>{{ info.text }}</blockquote>
    <p v-if="info.comment" class="comment">{{ info.comment }}</p>
    <p class="meta">
      <template v-if="source">From <a
        :href="source.url"
        target="_blank"
        rel="nofollow noopener noreferrer"
      >{{ source.name }}</a> · </template>{{ created }}
    </p>
  </div>
</template>

<style scoped lang="scss">

.highlight-item {
  border: 1px solid rgba(var(--theme-front-rgb), 0.1);
  border-radius: 10px;
  padding: 15px;
  min-width: 0;

  blockquote {
    margin: 0;
    padding-left: 12px;
    border-left: 3px solid rgba(var(--theme-active-rgb), 0.75);
    font-size: 17px;
    line-height: 1.4;
    color: var(--theme-front);
    overflow-wrap: anywhere;
  }

  .comment {
    margin-top: 10px;
    font-size: 15px;
    color: var(--theme-text-medium);
    overflow-wrap: anywhere;
  }

  .meta {
    margin-top: 10px;
    color: var(--theme-text-medium);
    font-weight: 600;
    font-size: 13px;

    a {
      color: inherit;
      text-decoration: underline;

      &:hover {
        color: var(--theme-active);
      }
    }
  }
}

</style>
