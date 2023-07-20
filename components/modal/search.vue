<script setup>
import { onMounted, ref } from 'vue'

const emit = defineEmits(['close'])
const router = useRouter()
const active = ref(false)
const input = ref(null)
const isValid = ref(false)
const inputModel = ref('')
const showMessage = ref(false)
import Icons from '@/helpers/icons'

function onKeyUp(event) {
  isValid.value = validateInput()

  switch(event.key) {
    case 'Escape':
      close()
      break;
    case 'Enter':
      commit()
      break;
  }
}

function commit() {
  if(validateInput()) {
    showMessage.value = false

    router.push('/'+inputModel.value)

    close()
  } else {
    showMessage.value = true
  }
}

// npub, pubkey or NIP05
function validateInput() {
  let result = false

  if(inputModel.value.indexOf('npub') === 0) {
    result = true
  } else if(inputModel.value.indexOf('@') !== -1 && inputModel.value.indexOf('.') !== -1) {
    result = true
  } else if(inputModel.value.length == 64) {
    return true
  }

  return result
}

function close() {
  window.emitter.emit('hide-modal', {id: 'search'})
}

function onShowModal(data) {
  active.value = data.id == 'search'

  setTimeout(focusInput, 25)
}

function onHideModal(data) {
  if(data.id === 'search') {
    active.value = false
    inputModel.value = ''
  }
}

function focusInput() {
  if(input.value) {
    input.value.focus()
  }
}

onMounted(() => {
  window.emitter.on('show-modal', onShowModal)
  window.emitter.on('hide-modal', onHideModal)
})

</script>

<template>
  <Transition v-if="active" name="modal" appear>
    <div class="search -modal">
      <div class="wrap">
        <div class="content">
          <div class="input-wrap">
            <input 
              ref="input"
              type="text" 
              placeholder="Search profiles..."
              v-model="inputModel"
              @keyup="onKeyUp"
            />
            <Transition name="appear" appear>
              <span 
                v-if="isValid" 
                v-html="Icons.check"
              />
            </Transition>
          </div>
          <p v-if="showMessage">Please enter a handle (name@domain.com) or public key (npub..., nprofile..., or just random letters and numbers).</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">

.search {
  .wrap {
    .content {
      position: relative;

      .input-wrap {
        position: relative;
      }

      input {
        appearance: none;
        border-width: 0;
        background-color: transparent;
        padding: 10px 50px 10px 15px;
        @include r('font-size', 18, 30);
        color: white;
        background-color: rgba(black, 0.2);
        border: 1px solid rgba(white, 0.5);
        border-radius: 20px;
        width: calc(100vw - 40px);
        max-width: 500px;
        box-shadow: 0 15px 30px -10px rgba(black, 0.35);
        background-color: rgba(black, 0.25);
        // backdrop-filter: blur(25px);
        transition: all 150ms $ease;
        box-sizing: border-box;

        &::placeholder {
          color: rgba(white, 0.5);
        }

        &:focus {
          outline: none;
          border-color: rgba(white, 0.75);
        }

        &.slide-enter-active,
        &.slide-leave-active {
          transition: all 400ms $ease;
        }
        &.slide-enter-from,
        &.slide-leave-to {
          opacity: 0;
          transform: translateY(50px) scale(0.8, 0.8);
        }
      }

      span {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        background-color: white;
        border-radius: 100px;
        width: 30px;
        height: 30px;
        color: black;

        :deep(svg) {
          width: 14px;
          height: 14px;
        }

        &.appear-enter-active,
        &.appear-leave-active {
          transition: all 400ms $easeInOutBack;
        }
        &.appear-enter-from,
        &.appear-leave-to {
          opacity: 0;
          transform: translateY(-50%) scale(0.25, 0.25);
        }
      }

      p {
        margin-top: 20px;
        width: calc(100vw - 40px);
        max-width: 500px;
        color: white;
        font-weight: 500;
        line-height: 1.6;
        text-align: center;
      }
    }
  }

  @include media-query(medium-down) {
    
  }

  @include media-query(large) {
    
  }
}

</style>
