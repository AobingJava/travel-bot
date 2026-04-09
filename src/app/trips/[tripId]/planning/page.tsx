"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

const planningSteps = [
  { id: "analyzing", label: "分析目的地特色", icon: "🔍" },
  { id: "weather", label: "查询天气与季节", icon: "🌤️" },
  { id: "attractions", label: "筛选热门景点", icon: "🗺️" },
  { id: "tasks", label: "生成行前准备清单", icon: "📋" },
  { id: "route", label: "规划最佳路线", icon: "🚶" },
  { id: "packing", label: "整理装备清单", icon: "🎒" },
  { id: "finalizing", label: "完成行程计划", icon: "✨" },
];

const stepMessages: Record<string, string> = {
  analyzing: "正在分析目的地特色与旅行主题...",
  weather: "正在查询天气与季节信息...",
  attractions: "正在筛选热门景点与打卡地...",
  tasks: "正在生成行前准备清单...",
  route: "正在规划最佳游览路线...",
  packing: "正在整理装备清单...",
  finalizing: "正在完成最终规划...",
};

export default function PlanningPage() {
  const router = useRouter();
  const params = useParams<{ tripId: string }>();
  const tripId = params.tripId;
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>(stepMessages.analyzing);
  const hasChecked = useRef(false);

  // 轮询检查行程是否生成完成
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkTrip = async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}`);
        if (!res.ok) {
          throw new Error("行程不存在");
        }
        const data = await res.json();

        // 检查行程是否已生成完成（有 tasks 且 tasks 长度>0）
        if (data.trip && data.trip.tasks && data.trip.tasks.length > 0) {
          setCurrentStep(planningSteps.length);
          setLiveMessage("行程已生成完成！");
          setTimeout(() => {
            router.replace(`/trips/${tripId}`);
          }, 800);
        } else {
          // 还没生成好，继续等待
          hasChecked.current = false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      }
    };

    checkTrip();
  }, [tripId, router]);

  // 动态更新步骤进度
  useEffect(() => {
    if (currentStep >= planningSteps.length) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= planningSteps.length - 1) {
          return prev;
        }
        const next = prev + 1;
        setLiveMessage(stepMessages[planningSteps[next].id]);
        return next;
      });
    }, 2500); // 每 2.5 秒更新一步，总共约 17 秒

    return () => clearInterval(interval);
  }, [currentStep]);

  return (
    <main className="mx-auto flex w-full max-w-[430px] flex-col items-center justify-center min-h-screen px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 mb-4">
          <span className="text-xl">🚀</span>
          <span className="text-sm font-semibold text-orange-700">AI 正在规划中</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          正在生成你的专属行程
        </h1>
        <p className="text-slate-500 text-sm">
          基于目的地、天气和热门景点，AI 正在为你量身定制
        </p>
      </div>

      {/* 实时进度消息 */}
      <div className="w-full mb-6">
        <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
          <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            {liveMessage}
          </p>
        </div>
      </div>

      {/* 进度指示器 */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">规划进度</span>
          <span className="text-xs font-semibold text-orange-600">
            {Math.min(currentStep, planningSteps.length)}/{planningSteps.length}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500 ease-out"
            style={{ width: `${(Math.min(currentStep, planningSteps.length) / planningSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="w-full space-y-3">
        {planningSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isPending = index > currentStep;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 rounded-2xl p-3.5 transition-all ${
                isActive
                  ? "bg-orange-50 border-2 border-orange-200 shadow-md shadow-orange-100"
                  : isCompleted
                  ? "bg-emerald-50 border-2 border-emerald-200"
                  : "bg-slate-50 border-2 border-slate-100 opacity-60"
              }`}
            >
              {/* 状态图标 */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                  isActive
                    ? "bg-orange-100"
                    : isCompleted
                    ? "bg-emerald-100"
                    : "bg-slate-200"
                }`}
              >
                {isCompleted ? "✓" : step.icon}
              </div>

              {/* 文字说明 */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? "text-orange-900"
                      : isCompleted
                      ? "text-emerald-900"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-orange-600 mt-0.5 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                    进行中...
                  </p>
                )}
              </div>

              {/* 加载中动画 */}
              {isActive && (
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-4 bg-orange-400 rounded-full animate-[bounce_1s_infinite]" />
                  <span className="w-1.5 h-4 bg-orange-400 rounded-full animate-[bounce_1s_infinite_100ms]" />
                  <span className="w-1.5 h-4 bg-orange-400 rounded-full animate-[bounce_1s_infinite_200ms]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 提示信息 */}
      {error ? (
        <div className="mt-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-center">
          <p className="text-sm text-rose-700">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-3 text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            返回首页
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-center">
          <p className="text-sm text-blue-700">
            💡 基于 {planningSteps.length} 个维度智能规划，通常需要 30-60 秒
          </p>
        </div>
      )}
    </main>
  );
}
