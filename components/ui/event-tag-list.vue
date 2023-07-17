<script setup>

const props = defineProps([
  'info', 
  'tags'
])

const groupedTags = computed(() => {
  const result = []

  let i=0, k, tagName, tags
  for(; i<props.tags.length; i++) {
    tagName = props.tags[i]

    tags = props.info.tags.filter(tag => tag[0] == tagName)
    for(k=0; k<tags.length; k++) {
      result.push({
        name: tagName,
        tags
      })
    }
  }

  return result
})

const tags = computed(() => {
  return props.info.tags.filter(tag => tag[0] == 't')
})

</script>

<template>
  <div class="event-tag-list">
    <template
      v-for="item in groupedTags"
      :key="item.name"
    >
      <h3 v-if="item.name == 'title'">{{ item[1] }}</h3>
      <h3 v-if="item.name == 'subject'">{{ item[1] }}</h3>
      <h3 v-if="item.name == 'name'">{{ item[1] }}</h3>
      <p v-if="item.name == 'summary'">{{ item[1] }}</p>
      <p v-if="item.name == 'location'">{{ item[1] }}</p>
      <p v-if="item.name == 'description'">{{ item[1] }}</p>
      <div v-if="item.name == 't'" class="tags">
        <p
          v-for="(tag, tagIndex) in item.tags"
          :key="tagIndex"
        >{{ tag[1] }}</p>
      </div>
      <div v-if="item.name == 'r'" class="links">
        <a
          v-for="(tag, tagIndex) in item.tags"
          :key="tagIndex"
          :href="tag[1]"
          target="_blank"
          rel="nofollow noreferrer"
        >{{ tag[1] }}</a>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">

.event-tag-list {
  > p {

  }

  .tags {
    p {

    }
  } 
}

</style>
