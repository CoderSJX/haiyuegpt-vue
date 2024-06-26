import type { ChatMessage } from "@/types";

export async function chat(messageList: ChatMessage[]) {
  try {
    const result = await fetch("https://emm-dev.inspuronline.com/ai/chat/stream", {
      method: "post",
      // signal: AbortSignal.timeout(8000),
      // 开启后到达设定时间会中断流式输出
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: JSON.stringify(messageList)
      }),
    });
    return result;
  } catch (error) {
    throw error;
  }
}
