<template>
  <div class="com__box w-full  flex items-center">
    <div class="loading w-5 h-5">
        <img src="@/assets/icon_语音识别中.svg"  class="rotating-circle h-full w-full" alt="">
    </div>
    <span class="ml-2">语音识别中...</span>
  </div>
</template>

<style scoped>

.rotating-circle {

  animation: rotate-circle 0.7s linear infinite; /* Animation properties */
}

@keyframes rotate-circle {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
