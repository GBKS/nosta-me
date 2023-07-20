<script setup>
  
</script>

<template>
  <div class="create-layout">
    <Transition name="slide-right" appear>
      <div class="modal">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss">

.create-layout {
  display: flex;
  padding-left: 15px;
  padding-right: 15px;

  .modal {
    background-color: white;
    border-radius: 25px;
    position: relative;
    display: flex;

    .-create-page {
      display: flex;
      box-sizing: border-box;
      width: 100%;
      @include r('padding-left', 20, 60);
      @include r('padding-right', 20, 60);
      @include r('padding-top', 20, 40);
      @include r('padding-bottom', 20, 40);
      @include r('gap', 20, 40);

      .content {
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .copy {
          display: flex;
          flex-direction: column;
          @include r('padding-top', 0, 50);

          p.-step {
            font-weight: 500;
            @include r('font-size', 16, 16);
          }

          h1 {
            margin-top: 10px;
            font-family: 'Moonrocks';
            line-height: 0.9;
            @include r('font-size', 48, 64);
            text-wrap: balance;
          }

          p.-description {
            margin-top: 30px;
            font-weight: 500;
            @include r('font-size', 20, 22);
            text-wrap: balance;

            a {
              color: black;
              text-decoration: none;

              &:hover {
                text-decoration: underline;
                color: var(--red);
              }
            }
          }
        }
      }

      .options {
        display: flex;
        flex-direction: column;
        // background-color: #f4f4f4;

        input,
        textarea {
          width: 100%;
        }
      }

      nav {
        display: flex;
        gap: 10px;
      }
    }
  }

  @include media-query(small) {
    // min-height: 100vh;
    flex-grow: 1;

    .modal {
      width: 100%;
      overflow: hidden;

      .-create-page {
        flex-direction: column;

        .content {
          order: 2;
        }

        .options {
          order: 3;
        }

        nav {
          order: 1;
          justify-content: space-between;
        }
      }
    }
  }

  @include media-query(medium-up) {
    min-height: 100vh;
    justify-content: center;
    align-items: center;

    .modal {
      width: 1000px;
      height: 600px;
      overflow: hidden;

      .-create-page {
        flex-grow: 1;

        .content {
          flex-grow: 1;
          flex-basis: 40%;
        }

        .options {
          flex-grow: 1;
          flex-basis: 40%;
          justify-content: center;
          align-items: center;
        }

        nav {
          position: absolute;
          left: 60px;
          bottom: 40px;
        }
      }
    }
  }
}

</style>
