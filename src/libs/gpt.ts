import type {ChatMessage} from "@/types";

export async function chat(messages: ChatMessage[] ) {
    try {
        const result = await fetch("https://cognitive-service.inspures.com/cs/test/4/v1/chat/completions", {
            method: "post",
            // signal: AbortSignal.timeout(8000),
            // 开启后到达设定时间会中断流式输出
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                    model: "ingpt",
                    messages
                }
            )

        });
        return result;
    } catch (error) {
        throw error;
    }
}
