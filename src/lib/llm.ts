import "server-only";

import { z } from "zod";

import { appEnv } from "@/lib/env";
import { extractJsonObject } from "@/lib/utils";

type Message = {
  role: "system" | "user";
  content: string;
};

export async function requestCompletionText({
  messages,
  temperature = 0.6,
  thinkingEnabled = false,
}: {
  messages: Message[];
  temperature?: number;
  thinkingEnabled?: boolean;
}) {
  if (!appEnv.llmBaseUrl || !appEnv.llmApiKey) {
    throw new Error("LLM is not configured.");
  }

  const response = await fetch(
    `${appEnv.llmBaseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appEnv.llmApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: appEnv.llmModel,
        temperature,
        messages,
        thinking_enabled: thinkingEnabled,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
  };

  const rawContent = payload.choices?.[0]?.message?.content;
  return normalizeMessageContent(rawContent);
}

function normalizeMessageContent(
  content: string | Array<{ text?: string }> | undefined,
): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map((item) => item.text ?? "").join("\n");
  }
  return "";
}

function extractStreamDeltaContent(choice: unknown): string {
  if (!choice || typeof choice !== "object") {
    return "";
  }
  const c = choice as {
    delta?: { content?: string | Array<{ text?: string }> };
  };
  return normalizeMessageContent(c.delta?.content);
}

async function readChatCompletionsSseStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (chunk: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let carry = "";
  let full = "";

  const processLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(":")) {
      return;
    }
    if (!trimmed.toLowerCase().startsWith("data:")) {
      return;
    }
    const data = trimmed.slice("data:".length).trim();
    if (data === "[DONE]") {
      return;
    }
    try {
      const json = JSON.parse(data) as {
        choices?: unknown[];
      };
      const choice = json.choices?.[0];
      const piece = extractStreamDeltaContent(choice);
      if (piece) {
        full += piece;
        onDelta(piece);
      }
    } catch {
      // ignore malformed SSE JSON lines
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    carry += decoder.decode(value, { stream: true });
    const lines = carry.split("\n");
    carry = lines.pop() ?? "";
    for (const line of lines) {
      processLine(line);
    }
  }

  if (carry.trim()) {
    processLine(carry);
  }

  return full;
}

/** OpenAI 兼容 chat/completions 流式接口，保持 HTTP 长连接直到模型输出结束 */
export async function requestCompletionTextStream({
  messages,
  temperature = 0.6,
  thinkingEnabled = false,
  onDelta,
}: {
  messages: Message[];
  temperature?: number;
  thinkingEnabled?: boolean;
  onDelta: (chunk: string) => void;
}): Promise<string> {
  if (!appEnv.llmBaseUrl || !appEnv.llmApiKey) {
    throw new Error("LLM is not configured.");
  }

  const response = await fetch(
    `${appEnv.llmBaseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appEnv.llmApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: appEnv.llmModel,
        temperature,
        messages,
        thinking_enabled: thinkingEnabled,
        stream: true,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`LLM stream request failed with status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
    };
    const text = normalizeMessageContent(payload.choices?.[0]?.message?.content);
    if (text) {
      onDelta(text);
    }
    return text;
  }

  if (!response.body) {
    throw new Error("LLM stream response has no body.");
  }

  const full = await readChatCompletionsSseStream(response.body, onDelta);
  if (!full.trim()) {
    throw new Error("LLM stream returned empty content.");
  }
  return full;
}

export async function requestStructuredCompletion<T>({
  schema,
  messages,
  temperature = 0.6,
}: {
  schema: z.ZodType<T>;
  messages: Message[];
  temperature?: number;
}) {
  const text = await requestCompletionText({
    messages,
    temperature,
  });
  return schema.parse(JSON.parse(extractJsonObject(text)));
}
