import type { ChatMessage } from "@/types";

export async function chat(messageList: ChatMessage[], apiKey: string) {
  try {
    const result = await fetch("http://localhost:8080/ai/chat/stream", {
      method: "post",
      // signal: AbortSignal.timeout(8000),
      // 开启后到达设定时间会中断流式输出
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
