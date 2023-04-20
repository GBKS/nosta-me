<script setup>
  
</script>

<template>
  <div class="edit-layout">
    <div class="nav">
      <EditNav />
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss">

.edit-layout {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .nav {

  }

  .modal {
    width: 1000px;
    height: 600px;
    background-color: white;
    border-radius: 25px;
    position: relative;
    display: flex;
    overflow: hidden;

    .-edit-page {
      flex-grow: 1;
      display: flex;
      @include r('padding', 20, 40);
      @include r('gap', 20, 40);
      box-sizing: border-box;

      .content {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        flex-basis: 40%;
        justify-content: space-between;

        .copy {
          display: flex;
          flex-direction: column;

          p.-step {
            @include r('font-size', 16, 16);
          }

          h1 {
            @include r('font-size', 64, 64);
            font-weight: bold;
          }

          p.-description {
            @include r('font-size', 22, 22);
          }
        }

        nav {
          display: flex;
          gap: 5px;
        }
      }

      .options {
        display: flex;
        flex-direction: column;
        background-color: #f4f4f4;

        input {
          width: 100%;
        }
      }
    }
  }

  @include media-query(small) {
    
  }

  @include media-query(medium-up) {
    .modal {
      .-create-page {
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
      }
    }
  }
}

</style>
