<template>
  <div class="flex flex-col h-screen  scrollable-content " ref="scrollableContent"
       @touchstart="handleTouchStart"
       @touchmove="handleTouchMove"
       @touchend="handleTouchEnd"
       @touchcancel="handleTouchCancel"
       >
<!--    <div-->
<!--      class="flex flex-nowrap fixed w-full items-baseline top-0 px-6 py-4 bg-gray-100"-->
<!--    >-->
<!--      <div class="text-2xl font-bold">inGPT</div>-->
<!--      <div class="ml-4 text-sm text-gray-500">-->
<!--        inGPT人工智能对话-->
<!--      </div>-->
<!--    </div>-->

    <div class="flex-1 mx-2 mt-2 mb-20" ref="chatListDom">
      <div
        class="group flex  px-4 py-3 hover:bg-slate-100 rounded-lg  mt-1.5 "
        :class="item.role=='assistant'?'justify-start':'justify-end'"
        v-for="item of messageList.filter((v) => v.role !== 'system')"
      >
        <div class="bg-gray-100 rounded-3xl p-5 ">
          <div
            class="prose text-sm leading-relaxed "
            :style="{ maxWidth: screenWidth-80 + 'px' }"
            v-if="item.content"
            v-html="md.render(item.content)"
          >
          </div>
          <Loding v-else />

        </div>
      </div>
    </div>

    <div class="sticky bottom-4 w-11/12 m-auto shadow-1xl rounded-3xl p-1 bg-gray-100">
      <div class="flex flex-col justify-end">
        <textarea
          class="input rounded-2xl bg-transparent no-focus-shadow  outline-none border-0 resize-none"
          :type="'text'"
          :placeholder="'请输入'"

          v-model="messageContent"
          @keydown.enter="isTalking || send()"
        />
        <div class="touch-record absolute bottom-1 left-0 right-0 flex items-center justify-center" >
          <button    class="shadow-2xl no-zoom" >
<!--            {{ isRecording ? '松开' : '按下录音' }}-->
            <voice class="shadow-2xl no-zoom" @click ='startRecording'v-show="!isRecording"  size="30" fill="#1d4ed8" strokeLinecap="square"/>
            <voice-one class="shadow-1xl no-zoom" @click="amrRec.startRecord()" v-show="isRecording"  size="30" fill="#1d4ed8" strokeLinecap="square"/>
          </button>
        </div>
        <button class="btn self-end rounded-2xl text-xs h-8 w-20 flex justify-center items-center mr-1 shadow-blue-400 " :disabled="isTalking" @click="send()">
          {{"发送" }}
        </button>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Voice,VoiceOne } from "@icon-park/vue-next";

import type { ChatMessage } from "@/types";
import { ref, watch, nextTick, onMounted,onBeforeUnmount } from "vue";
import { chat } from "@/libs/gpt";
import Loding from "@/components/Loding.vue";
import Copy from "@/components/Copy.vue";
import { md } from "@/libs/markdown";


let isTalking = ref(false);
let messageContent = ref("");
const chatListDom = ref<HTMLDivElement>();
const decoder = new TextDecoder("utf-8");
const roleAlias = { user: "用户", assistant: "小智", system: "System" };
const messageList = ref<ChatMessage[]>([
  {
    role: "assistant",
    content: `你好，我是inGPT语言模型，我可以提供一些常用服务和信息，例如：
请告诉我你需要哪方面的帮助，我会根据你的需求给你提供相应的信息和建议。`,
  },
]);

const screenWidth = ref(window.innerWidth);
const scrollableContent = ref(null);
const startY = ref(0);
const currentY = ref(0);
const isPullingDown = ref(false);
const pullDownThreshold = 200; // 下拉刷新的阈值，单位为px

let amrRec:BenzAMRRecorder;


import axios from 'axios';
import BenzAMRRecorder from "benz-amr-recorder";

const isRecording = ref(false);

onMounted(() => {
  // 初始化逻辑，比如请求麦克风权限
});

async function startRecording(e: TouchEvent) {
  isRecording.value = true;
  try {
    amrRec=new BenzAMRRecorder;
    await amrRec.initWithRecord();
    amrRec.startRecord();
    amrRec.onFinishRecord(()=>{
      stopAndUpload()
    })
  } catch (error) {
    alert("error"+error)
    console.error('录音权限被拒绝或发生错误:', error);
    isRecording.value = false;
  }
}


 function stopAndUpload() {


  isRecording.value = false;

  let audio = <Blob>amrRec.getBlob();
  const audioFile: File = new File([audio], 'recording.amr', );
  uploadAudio(audioFile);
  amrRec.destroy();

}

async function uploadAudio(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post('https://emm-dev.inspuronline.com/ai/chat/voice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    sendChatMessage(response.data)
  } catch (error) {
    console.error('上传失败:', error);
  }
}


const handleResize = () => {
  screenWidth.value = window.innerWidth;
};
const handleTouchStart = (event: TouchEvent) => {
  startY.value = event.touches[0].clientY;
};

// 触摸移动
const handleTouchMove = (event: TouchEvent) => {
  if (!isPullingDown.value) {
    currentY.value = event.touches[0].clientY;
    const deltaY = currentY.value - startY.value;

    // 判断是否向下拉动并且超过阈值
    if (deltaY > 0 && deltaY > pullDownThreshold) {
      isPullingDown.value = true;
    }
  }
};

// 触摸结束或取消
const handleTouchEnd = () => {
  if (isPullingDown.value && currentY.value - startY.value > pullDownThreshold) {
    // 这里触发重新加载
    reloadPage();
  }
  isPullingDown.value = false;
  startY.value = 0;
  currentY.value = 0;
};

// 取消触摸时重置状态
const handleTouchCancel = () => {
  isPullingDown.value = false;
  startY.value = 0;
  currentY.value = 0;
};

// 重新加载页面的模拟函数
const reloadPage = () => {
  console.log('触发页面重新加载');
  window.location.reload()
  // 实际应用中，你可以在这里调用API获取新数据或使用window.location.reload()来刷新页面
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

const sendChatMessage = async (content: string = messageContent.value) => {
  try {
    isTalking.value = true;
    if (messageList.value.length === 2) {
      messageList.value.pop();
    }
    clearMessageContent();

    messageList.value.push({ role: "user", content });
    messageList.value.push({ role: "assistant", content: "" });

    const { body, status } = await chat(messageList.value);
    if (body) {
      const reader = body.getReader();
      await readStream(reader, status);
    }
  } catch (error: any) {
    appendLastMessageContent(error);
  } finally {
    isTalking.value = false;
  }
};

const readStream = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  status: number
) => {
  let partialLine = "";

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const { value, done } = await reader.read();
    if (done) break;

    const decodedText = decoder.decode(value, { stream: true });

    if (status !== 200) {
      const json = JSON.parse(decodedText); // start with "data: "
      const content = json.error.message ?? decodedText;
      appendLastMessageContent(content);
      return;
    }

    const chunk = partialLine + decodedText;
    const newLines = chunk.split(/\r?\n/);

    partialLine = newLines.pop() ?? "";

    for (const line of newLines) {
      if (line.length === 0) continue; // ignore empty message
      if (line.startsWith(":")) continue; // ignore sse comment message
      if (line === "data: [DONE]") return; //

      const json = JSON.parse(line.substring(5)); // start with "data: "
      const content =
        status === 200
          ? json.choices[0].message.content ?? ""
          : json.error.message;
      appendLastMessageContent(content);
    }
  }
};

const appendLastMessageContent = (content: string) =>
  (messageList.value[messageList.value.length - 1].content += content);

const send = () => {
  if (!messageContent.value.length) return;

    sendChatMessage();

};



const clearMessageContent = () => (messageContent.value = "");

const scrollToBottom = () => {
  if (!chatListDom.value) return;
  scrollTo(0, chatListDom.value.scrollHeight);
};

watch(messageList.value, () => nextTick(() => scrollToBottom()));
</script>

<style scoped>
pre {
  font-family: -apple-system, "Noto Sans", "Helvetica Neue", Helvetica,
    "Nimbus Sans L", Arial, "Liberation Sans", "PingFang SC", "Hiragino Sans GB",
    "Noto Sans CJK SC", "Source Han Sans SC", "Source Han Sans CN",
    "Microsoft YaHei", "Wenquanyi Micro Hei", "WenQuanYi Zen Hei", "ST Heiti",
    SimHei, "WenQuanYi Zen Hei Sharp", sans-serif;
}
.no-zoom {
  touch-action: manipulation;
}
</style>
