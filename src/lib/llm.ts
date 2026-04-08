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
}: {
  messages: Message[];
  temperature?: number;
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
  return (
    typeof rawContent === "string"
      ? rawContent
      : rawContent?.map((item) => item.text ?? "").join("\n") ?? ""
  );
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
