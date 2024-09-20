<script setup>
const items = ref({})
const timeouts = ref({})

/*
{
  id: 'unique-id',
  title: 'Notification Title',
  description?: 'Notification Description',
  theme?: "default" | "error" | "success",
  expiration?: 5000
}
*/
function onShowNotification(data) {
  items.value[data.id] = data

  if(data.expiration) {
    if(timeouts.value[data.id]) {
      clearTimeout(timeouts.value[data.id])
    }

    timeouts.value[data.id] = setTimeout(() => {
      delete items.value[data.id]
    }, data.expiration)
  }
}

function onHideNotification(data) {
  delete items.value[data.id]
}

function hideItem(id) {
  delete items.value[id]
}

const visible = computed(() => {
  return Object.keys(items.value).length > 0
})

const classObject = computed(() => {
  const c = ['notification-drawer']

  if(visible.value) {
    c.push('-visible')
  }

  return c.join(' ')
})

onMounted(() => {
  window.emitter.on('show-notification', onShowNotification)
  window.emitter.on('hide-notification', onHideNotification)
})
</script>

<template>
  <div :class="classObject">
    <TransitionGroup name="notification-drawer-list" tag="ol">
      <NotificationItem
        v-for="item in items"
        :key="item.id"
        :id="item.id"
        :title="item.title"
        :description="item.description"
        :icon="item.icon"
        :theme="item.theme"
        @hide="hideItem"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">

.notification-drawer {
  position: fixed;
  top: 0;
  right: 0;
  padding: 20px;
  z-index: 1000;
  max-width: 300px;
  width: 100%;
  box-sizing: border-box;
  pointer-events: none;

  :deep(ol) {
    position: relative;
    list-style: none;
    padding: 0;
    margin: 0;

    > * + * {
      margin-top: 5px;
    }
  }

  &.-visible {
    pointer-events: auto;
  }
}

.notification-drawer-list-move,
.notification-drawer-list-enter-active,
.notification-drawer-list-leave-active {
  transition: all 0.35s $ease;
}

.notification-drawer-list-enter-from,
.notification-drawer-list-leave-to {
  opacity: 0;
  transform: translateX(15px);
}

.notification-drawer-list-leave-active {
  position: absolute;
}

</style>
