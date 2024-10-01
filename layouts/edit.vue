<script setup>
  
</script>

<template>
  <div class="edit-layout">
    <div class="content">
      <div class="header">
        <h1>Update your profile</h1>
        <p>Edit your basic information.</p>
      </div>
      <EditNav />
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>

.edit-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;

  .content {
    width: 100%;
    max-width: 800px;
    background-color: white;
    border-radius: 25px;
    position: relative;
    display: flex;
    gap: 20px;
    flex-direction: column;

    .header {
      display: flex;
      flex-direction: column;
      gap: 10px;

      h1 {
        @include r('font-size', 24, 48);
      }
    }

    // overflow: hidden;

    // .-edit-page {
    //   flex-grow: 1;
    //   display: flex;
    //   @include r('padding', 20, 40);
    //   @include r('gap', 20, 40);
    //   box-sizing: border-box;

    //   .content {
    //     display: flex;
    //     flex-direction: column;
    //     flex-grow: 1;
    //     flex-basis: 40%;
    //     justify-content: space-between;

    //     .copy {
    //       display: flex;
    //       flex-direction: column;

    //       p.-step {
    //         @include r('font-size', 16, 16);
    //       }

    //       h1 {
    //         @include r('font-size', 64, 64);
    //         font-weight: bold;
    //       }

    //       p.-description {
    //         @include r('font-size', 22, 22);
    //       }
    //     }

    //     nav {
    //       display: flex;
    //       gap: 5px;
    //     }
    //   }

    //   .options {
    //     display: flex;
    //     flex-direction: column;
    //     background-color: #f4f4f4;

    //     input {
    //       width: 100%;
    //     }
    //   }
    // }
  }

  @include media-query(small) {
    .modal {
      padding: 0 15px 15px 15px;
    }
  }

  @include media-query(medium-up) {
    .content {
      padding: 50px;

      // .-create-page {
      //   .content {
      //     flex-grow: 1;
      //     flex-basis: 40%;
      //   }

      //   .options {
      //     flex-grow: 1;
      //     flex-basis: 40%;
      //     justify-content: center;
      //     align-items: center;
      //   }
      // }
    }
  }
}

</style>
