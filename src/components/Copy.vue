<script setup lang="ts">
import { Copy, Loading, CheckOne } from "@icon-park/vue-next";
import type { Theme } from "@icon-park/vue-next/lib/runtime";
import { ref } from "vue";

const props = defineProps<{ content: string }>();
const btnConfig: {
  size: number;
  fill: string;
  theme: Theme;
} = {
  size: 14,
  fill: "#999",
  theme: "outline",
};
const btnTips = {
  copy: "",
  loading: "",
  success: "已复制到剪贴板！",
  error: "复制失败！",
};
const btnStatus = ref<"copy" | "loading" | "success" | "error">("copy");

function fallbackCopyTextToClipboard(text:string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  // 防止textarea显示在页面可视区域
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    const msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Unable to copy to clipboard', err);
  }
  document.body.removeChild(textArea);
}

const copyToClipboard = (content = props.content) => {
  btnStatus.value = "loading";

  if (navigator.clipboard && navigator.clipboard.writeText) {
    console.log("111")
    navigator.clipboard
        .writeText(content)
        .then(() => setTimeout(() => (btnStatus.value = "success"), 150))
        .catch(() => (btnStatus.value = "error"))
        .finally(() => setTimeout(() => (btnStatus.value = "copy"), 1500));
  } else {
    fallbackCopyTextToClipboard(content);
    setTimeout(() => (btnStatus.value = "success"), 150); // 假设在旧方法中我们也希望最终状态是"copy"
    setTimeout(() => (btnStatus.value = "copy"), 1500)// 假设在旧方法中我们也希望最终状态是"copy"

  }
};
</script>

<template>
  <div class="flex items-center cursor-pointer" @click="copyToClipboard()">
    <copy
      v-show="btnStatus === 'copy'"
      :theme="btnConfig.theme"
      :size="btnConfig.size"
      :fill="btnConfig.fill"
    />
    <loading
      class="rotate"
      v-show="btnStatus === 'loading'"
      :theme="btnConfig.theme"
      :size="btnConfig.size"
      :fill="btnConfig.fill"
    />
    <check-one
      v-show="btnStatus === 'success'"
      :theme="btnConfig.theme"
      :size="btnConfig.size"
      :fill="btnConfig.fill"
    />
    <close-one
      v-show="btnStatus === 'error'"
      :theme="btnConfig.theme"
      :size="btnConfig.size"
      :fill="btnConfig.fill"
    />
    <span class="text-xs ml-0.5 text-gray-500 leading-none">{{
      btnTips[btnStatus]
    }}</span>
  </div>
</template>

<style scoped>
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.rotate {
  animation: spin 2s linear infinite;
}
</style>
