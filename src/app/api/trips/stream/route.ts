import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { getRepositoryFallbackUser } from "@/lib/app-service";
import { createTripSchema } from "@/lib/validators";
import { getSessionUser } from "@/lib/auth";
import { normalizePackingListFromApi } from "@/lib/packing-list";
import {
  createTripShellDocument,
  generatePackingListOnly,
  type PlanningStep,
} from "@/lib/planner";
import { getRepository } from "@/lib/repository";

const encoder = new TextEncoder();

const stepMessages: Record<PlanningStep, string> = {
  analyzing: "正在分析目的地特色与旅行主题...",
  weather: "正在查询天气与季节信息...",
  attractions: "正在筛选热门景点与打卡地...",
  tasks: "正在生成行前准备清单...",
  route: "正在规划最佳游览路线...",
  packing: "正在整理装备清单...",
  finalizing: "正在完成最终规划...",
};

function encodeSSE(data: object) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: NextRequest) {
  try {
    const payload = createTripSchema.parse(await request.json());

    const stream = new ReadableStream({
      async start(controller) {
        const currentUser =
          (await getSessionUser()) ?? getRepositoryFallbackUser();

        const sendProgress = (step: PlanningStep, message?: string) => {
          controller.enqueue(
            encodeSSE({
              type: "step",
              message: message || stepMessages[step],
            })
          );
        };

        try {
          controller.enqueue(
            encodeSSE({
              type: "start",
              message: "开始生成行程...",
            })
          );

          const repository = getRepository();

          sendProgress("packing", "正在整理装备清单...");
          // 仍对大模型使用流式 HTTP 连接；不向浏览器推送原始 JSON 片段
          const noopStream = () => {};
          const rawPackingList = await generatePackingListOnly(payload, noopStream);
          const tripDays = Math.max(
            1,
            Math.ceil(
              (new Date(payload.endDate).getTime() - new Date(payload.startDate).getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1,
          );
          const packingList = normalizePackingListFromApi(
            Array.isArray(rawPackingList) ? rawPackingList : [],
            tripDays,
          );

          controller.enqueue(
            encodeSSE({
              type: "packing_complete",
              packingList,
              message: "装备清单已生成",
            })
          );

          const trip = createTripShellDocument(payload, currentUser, packingList);
          await repository.createTrip(trip);

          // 发送完成事件
          controller.enqueue(
            encodeSSE({
              type: "complete",
              tripId: trip.id,
              message: "装备清单已保存，可前往待办页；完整任务与路线在后台生成中",
            })
          );
        } catch (error) {
          controller.enqueue(
            encodeSSE({
              type: "error",
              message: error instanceof Error ? error.message : "生成失败",
            })
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({ error: error.issues[0]?.message ?? "输入不合法。" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "生成失败。" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
