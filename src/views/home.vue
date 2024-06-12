<template>
  <div class="h-screen flex flex-col rounded-lg">
    <div class="absolute top-0 left-0 rounded-full -z-10"
         style="box-shadow:0 0 90px 100px rgba(241,51,255,0.06);"></div>
    <div class="absolute -top-1/2 left-1/2 rounded-full -z-9"
         style="box-shadow:0 0 90px 100px rgba(0,149,255,0.12);"></div>
    <div class="absolute top-0 right-0 rounded-full -z-8" style="box-shadow:0 0 90px 100px rgba(0,241,255,0.08);"></div>

    <div class="flex-none  flex flex-row items-center justify-center text-center h-16 py-3">
      <img src="@/assets/客服头像@3x.png" alt="用户头像" class="w-9 h-9 ">
      <span class="ml-2">AI助理</span>

    </div>
    <div class="flex-1 flex flex-col overflow-y-auto px-4 py-2" ref="chatListDom">
      <div
          class="group flex flex-col px-4 py-4 items-start mb-5 min-w-min  rounded-2xl " style="max-width: 86%"
          :class="item.role=='assistant'?'self-start':'self-end '"
          :style="item.role=='assistant'?'background-color:#fff':'background: #B3D4FF;'"
          v-for="item of messageList.filter((v) => v.role !== 'system')"
      >

        <div>
          <div
              class="text-sm leading-relaxed" style="color: #1A1A1A"
              v-if="item.content"
              v-html="md.render(item.content.replace('\n\n', ''))"
          ></div>
          <Loding v-else/>
          <div class="flex justify-end items-center">
            <!--            <Copy class="visible" :content="item.content" />-->
          </div>
        </div>
      </div>
    </div>
    <div class="flex-none  p-2 relative">
      <div class="input-area  input-bg py-3 px-5 flex  m-auto relative h-11"
           :class="{'gradient-border-input':!isRecording}" style="width: 96%">
        <!--          <input style="width: 100%;height: 100%;" />-->
        <!--            <button>按住说话</button>-->
        <div class="record-tip-area flex flex-col justify-center items-center absolute  left-0 right-0 w-full h-10"
             style="top: -75px" :class="isRecording?'flex':'hidden'">
          <img :src="currentSVG" alt="" ref="cancelArea">
          <span class="mt-1.5"
                style="font-size: 14px;color: #666666;">{{ isTargetAreaReached ? '松开取消' : '松开发送  上滑取消' }}</span>
        </div>
        <div class="recording-area absolute  w-full h-full top-0 right-0 left-0 bottom-0  "
             style="border-radius: inherit;"
             :class="[isRecording?'flex':'hidden',isTargetAreaReached?'bg-voice-cancel':'bg-voice']">
          <div class="time-box absolute top-0 bottom-0 right-0 left-0 flex justify-center items-center" >
        <span class="start-taste-line w-full h-full absolute top-0 right-0 left-0 bottom-0 flex justify-center items-center">
          <hr class="hr" v-for="index in waves" :style="{ animationDelay: randomDelays[index - 1] } "/>
         </span>
          </div>

        </div>
        <div class="keyboard-ares absolute w-full bg-white h-full top-0 right-0 left-0 bottom-0 py-3 px-5  m-auto  "  style="border-radius: inherit; " :class="isKeyboard?'flex':'hidden'">
                  <textarea
                      class=" bg-transparent  outline-none border-0 resize-none h-full flex-1"
                      :type="'text'"
                      :placeholder="'有问题尽管问我～'"

                      v-model="messageContent"
                      @keydown.enter="isTalking || send()"
                  />

          <div class="flex justify-center items-center  pl-5 " style="border-left: 1px solid rgba(0,0,0,0.2)">
            <img src="@/assets/icon_语音@1x.svg" alt="" @click="isKeyboard=false">
          </div>
        </div>

        <div class="flex justify-center items-center flex-1" @touchstart="handleTouchStart" @touchend="handleTouchEnd"
             @touchmove="handleTouchMove">
          <img src="@/assets/icon_语音@1x.svg" alt="" >
          <button class="ml-2">按住 说话</button>
        </div>

        <div class="flex justify-center items-center  pl-5 " style="border-left: 1px solid rgba(0,0,0,0.2)">
          <img src="@/assets/icon_文字输入@1x.svg" alt="" @click="isKeyboard=true">

        </div>


      </div>
    </div>
  </div>

</template>

<script setup lang="ts">

import type {ChatMessage} from "@/types";
import {ref, watch, nextTick, onMounted, onBeforeUnmount} from "vue";
import {chat} from "@/libs/gpt";
import Loding from "@/components/Loding.vue";
import Copy from "@/components/Copy.vue";
import {md} from "@/libs/markdown";
// 初始化一个存储随机延迟的数组
let randomDelays = ref(['']);
let waves=40;

onMounted(() => {
  // 页面加载完成后，计算并设置随机延迟
  for (let i = 0; i < waves; i++) {
    randomDelays.value[i] = `-${Math.random()*1.5}s`; // 生成0到2秒之间的随机延迟
  }
});

let isTalking = ref(false);

let messageContent = ref("");
const chatListDom = ref<HTMLDivElement>();
const decoder = new TextDecoder("utf-8");
const messageList = ref<ChatMessage[]>([
  {
    role: "assistant",
    content: `您好，我是 inGPT，一个由浪潮数字企业 开发的 AI 助手。我可以帮助您解决各种问题和提供所需的信息。`,
  },
]);


import defaultSVG from '@/assets/icon_取消_default@1x.svg';
import targetSVG from '@/assets/icon_取消_触发@1x.svg';

const cancelArea = ref<HTMLDivElement>();
let touchStartX = 0;
let touchStartY = 0;
let isTargetAreaReached = false;
let currentSVG = ref(defaultSVG);
const handleTouchStart = (event: TouchEvent) => {
  isTargetAreaReached = false;
  currentSVG = ref(defaultSVG);
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
  startRecording(event);

};
let isKeyboard = ref(false);




const handleTouchMove = (event: TouchEvent) => {

  const touchMoveX = event.touches[0].clientX;
  const touchMoveY = event.touches[0].clientY;
  if (!cancelArea.value) return;
  // 简化处理：如果移动到了容器内任意位置都认为是目标区域
  const containerRect = cancelArea.value.getBoundingClientRect();
  if (
      touchMoveX >= containerRect.left && touchMoveX <= containerRect.right &&
      touchMoveY >= containerRect.top && touchMoveY <= containerRect.bottom
  ) {
    if (!isTargetAreaReached) {
      isTargetAreaReached = true;
      currentSVG.value = targetSVG;
    }
  } else {
    // 如果移动出目标区域且之前已经到达过目标区域，则还原默认SVG
    if (isTargetAreaReached) {
      isTargetAreaReached = false;
      currentSVG.value = defaultSVG;
    }
  }
};

const handleTouchEnd = () => {
  // 触摸结束时重置状态
  // isTargetAreaReached = false;
  stopAndUpload();
};

const screenWidth = ref(window.innerWidth);

const scrollToBottom = () => {
  if (!chatListDom.value) return;
  console.log(chatListDom.value.scrollHeight)
  chatListDom.value.scrollTop = chatListDom.value.scrollHeight;
};

watch(messageList.value, () => nextTick(() => {
  scrollToBottom()
}));
let amrRec: BenzAMRRecorder;


import axios from 'axios';
import BenzAMRRecorder from "benz-amr-recorder";

const isRecording = ref(false);
const isMicrophoneAccessGranted = ref(false);

// requestMicrophonePermission();
async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    // 用户已授权，可以开始使用麦克风
    isMicrophoneAccessGranted.value = true;
    console.log('麦克风权限已获取');

    // 如果不需要立即使用流，记得释放资源
    // stream.getTracks().forEach(track => track.stop());
  } catch (error) {
    // 用户拒绝授权或发生其他错误
    alert(error);
    isMicrophoneAccessGranted.value = false;
    console.error('无法获取麦克风权限:', error);
  }
}

onMounted(() => {
  // 初始化逻辑，比如请求麦克风权限

});

async function startRecording(e: TouchEvent) {
  isRecording.value = true;
  try {
    await requestMicrophonePermission();

    amrRec = new BenzAMRRecorder;
    await amrRec.initWithRecord();
    amrRec.startRecord();
    amrRec.onFinishRecord(() => {
      if (isTargetAreaReached) {
        return;
      }
      stopAndUpload()
    })
  } catch (error) {
    alert("error" + error)
    console.error('录音权限被拒绝或发生错误:', error);
    isRecording.value = false;
  }
}


function stopAndUpload() {


  isRecording.value = false;
  if (isTargetAreaReached) {
    return;
  }
  let audio = <Blob>amrRec.getBlob();
  const audioFile: File = new File([audio], 'recording.amr',);
  uploadAudio(audioFile);
  amrRec.destroy();
  isTargetAreaReached = false
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

    messageList.value.push({role: "user", content});
    const {body, status} = await chat(messageList.value);
    messageList.value.push({role: "assistant", content: ""});
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
    const {value, done} = await reader.read();
    if (done) break;

    const decodedText = decoder.decode(value, {stream: true});
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
      if (line.startsWith("id")) continue; // ignore sse comment message
      if (line.startsWith("event")) continue; // ignore sse comment message


      const json = JSON.parse(line.substring(5)); // start with "data: "
      if (json.output.finish_reason === 'stop') {
        return;
      }
      const content =
          status === 200
              ? json.output.text ?? ""
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
