"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TripDocument, Attraction } from "@/lib/types";

interface MemoryViewProps {
  trip: TripDocument;
}

interface SocialCardProps {
  attractions: Attraction[];
  tripName: string;
  coverImage?: string;
}

// 模拟景点数据 - 实际应该从 trip 数据中获取
const defaultAttractions: Attraction[] = [
  {
    id: "1",
    name: "伏见稻荷大社",
    address: "京都市伏见区深草薮之内町 68",
    rating: 4.5,
    visitDuration: 120,
    bestTimeToVisit: "清晨或傍晚",
    description: "千本鸟居闻名于世，建议预留 2-3 小时徒步登山",
    category: "文化",
    latitude: 34.9671,
    longitude: 135.7727,
  },
  {
    id: "2",
    name: "清水寺",
    address: "京都市东山区清水 1-294",
    rating: 4.6,
    visitDuration: 90,
    bestTimeToVisit: "清晨",
    description: "世界文化遗产，清水舞台眺望京都全景",
    category: "文化",
    latitude: 34.9949,
    longitude: 135.7851,
  },
  {
    id: "3",
    name: "岚山竹林",
    address: "京都市右京区嵯峨天龙寺芒ノ马场町",
    rating: 4.4,
    visitDuration: 60,
    bestTimeToVisit: "上午",
    description: "漫步竹林小径，感受日式禅意美学",
    category: "自然",
    latitude: 35.0094,
    longitude: 135.6738,
  },
];

export function MemoryView({ trip }: MemoryViewProps) {
  const router = useRouter();
  const [selectedAttractions, setSelectedAttractions] = useState<Attraction[]>([]);
  const [showGenerateCard, setShowGenerateCard] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<SocialCardProps[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);

  // 从 trip 中提取景点数据，这里使用模拟数据
  const attractions = defaultAttractions;

  const toggleAttraction = (attraction: Attraction) => {
    setSelectedAttractions((prev) =>
      prev.find((a) => a.id === attraction.id)
        ? prev.filter((a) => a.id !== attraction.id)
        : [...prev, attraction]
    );
  };

  const generateSocialCard = () => {
    if (selectedAttractions.length === 0) return;

    const card: SocialCardProps = {
      attractions: selectedAttractions,
      tripName: trip.name,
      coverImage: selectedAttractions[0]?.name,
    };
    setGeneratedCards((prev) => [card, ...prev]);
    setShowGenerateCard(false);
    setSelectedAttractions([]);
  };

  const handleRecordVoice = () => {
    setIsRecording(!isRecording);
    // 实际应用中这里会调用语音识别 API
  };

  const endTrip = async () => {
    if (!confirm("确定要结束这个行程吗？结束后将无法修改。")) return;

    setIsEndingTrip(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("结束行程失败", error);
      alert("结束行程失败，请稍后再试");
    } finally {
      setIsEndingTrip(false);
    }
  };

  const generateMemory = () => {
    router.push(`/trips/${trip.id}/memory/result`);
  };

  return (
    <section className="space-y-6 pb-8">
      {/* 动态列表区域 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">行程动态</h2>
          {trip.stage !== "completed" && (
            <button
              onClick={endTrip}
              disabled={isEndingTrip}
              className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEndingTrip ? "处理中..." : "结束行程"}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {trip.events.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[14px] font-semibold text-slate-950">{event.title}</p>
                  <p className="text-[13px] leading-6 text-slate-500">{event.body}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {event.actorName}
                </span>
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-300">
                {new Intl.DateTimeFormat("zh-CN", {
                  month: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(event.createdAt))}
              </p>
            </article>
          ))}
        </div>
      </div>

      {/* 生成回忆按钮 */}
      <button
        onClick={generateMemory}
        className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-5 text-white shadow-lg shadow-rose-500/30 transition hover:scale-[1.02] active:scale-95"
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="font-bold text-lg">生成回忆</p>
            <p className="text-sm opacity-90">生成小红书风格的旅行回忆卡片</p>
          </div>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </button>
      {/* 行程完成状态卡片 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-orange-200/30 blur-2xl" />
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* 圆形进度条图标 */}
          <div className="relative h-32 w-32">
            <svg className="h-full w-full -rotate-90 transform">
              <circle
                className="text-orange-100"
                cx="64"
                cy="64"
                fill="transparent"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
              />
              <circle
                className="text-orange-500"
                cx="64"
                cy="64"
                fill="transparent"
                r="58"
                stroke="currentColor"
                strokeDasharray="364.4"
                strokeDashoffset="0"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="h-12 w-12 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-800">行程圆满结束！</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-xs">
            你已经完成了 1240 公里的冒险。即使你看起来很酷，飞机也不等人，但好在你已经平安到家。
          </p>
          <div className="mt-4 flex gap-3">
            <button className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:scale-105 active:scale-95">
              查看回忆
            </button>
            <button className="rounded-full border border-orange-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-orange-50 active:scale-95">
              行程历史
            </button>
          </div>
        </div>
      </div>

      {/* 反馈与语音输入 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 p-8">
          <div className="relative z-10 space-y-4">
            <h3 className="text-3xl font-bold leading-tight text-slate-800">
              这次玩得开心吗？<br />
              <span className="text-orange-600">快来吐槽。</span>
            </h3>
            <p className="text-base text-slate-600">
              你的活力副驾驶正在倾听。别有任何顾虑。
            </p>
          </div>

          {/* 语音输入交互 */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="relative">
              {isRecording && (
                <div className="absolute inset-0 animate-ping rounded-full bg-orange-300/40" />
              )}
              <button
                onClick={handleRecordVoice}
                className={`relative h-20 w-20 rounded-full bg-white shadow-2xl transition ${
                  isRecording ? "ring-4 ring-orange-200" : ""
                }`}
              >
                <div className="flex h-full w-full items-center justify-center">
                  <svg
                    className={`h-8 w-8 ${isRecording ? "text-orange-500" : "text-slate-400"}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </div>
              </button>
            </div>

            {isRecording && (
              <>
                <div className="flex items-end gap-1 h-8">
                  {[4, 8, 6, 10, 4].map((height, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-orange-500"
                      style={{ height: `${height * 2}px`, animation: `pulse 0.5s ease-in-out infinite ${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-600 italic">
                  伙伴正在倾听...
                </p>
              </>
            )}

            {!isRecording && (
              <p className="text-xs text-slate-500">点击开始录音</p>
            )}
          </div>
        </div>

        {/* 行程统计 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 rounded-xl bg-indigo-100 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase opacity-70 text-indigo-700">总行程</p>
              <h4 className="text-3xl font-black italic text-indigo-900">8 天</h4>
            </div>
            <svg className="h-10 w-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="rounded-xl bg-amber-100 p-5">
            <p className="text-xs font-bold opacity-70 text-amber-700">减少碳排放</p>
            <h4 className="text-2xl font-black text-amber-900">12.4 kg</h4>
            <svg className="mt-3 h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="rounded-xl bg-white p-5 border border-orange-200/50">
            <p className="text-xs font-bold uppercase text-slate-500">打卡新地点</p>
            <h4 className="text-2xl font-black text-slate-800">15</h4>
            <svg className="mt-3 h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 一键生成攻略区域 */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-800">一键生成攻略</h3>
            <p className="text-sm text-slate-600">
              我们已经为你准备好了"小红书"风格的美学草稿。准备好闪耀全场了吗？
            </p>
          </div>
          <button className="rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 active:scale-95 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            发布至社交平台
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-800">选择景点</h4>
              <p className="text-xs text-slate-500">选择你想分享的景点</p>
            </div>
            <button
              onClick={() => setShowGenerateCard(true)}
              disabled={selectedAttractions.length === 0}
              className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2 text-xs font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-105 active:scale-95"
            >
              生成卡片 ({selectedAttractions.length})
            </button>
          </div>

          <div className="space-y-2">
            {attractions.map((attraction) => (
              <div
                key={attraction.id}
                onClick={() => toggleAttraction(attraction)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  selectedAttractions.find((a) => a.id === attraction.id)
                    ? "border-orange-500 bg-orange-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    selectedAttractions.find((a) => a.id === attraction.id)
                      ? "border-orange-500 bg-orange-500"
                      : "border-slate-300"
                  }`}
                >
                  {selectedAttractions.find((a) => a.id === attraction.id) && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800">{attraction.name}</h4>
                  <p className="text-xs text-slate-500">{attraction.description}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {attraction.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 已生成的卡片列表 */}
      {generatedCards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">已生成的卡片</h3>
          {generatedCards.map((card, index) => (
            <SocialCard key={index} {...card} />
          ))}
        </div>
      )}

      {/* 生成卡片弹窗 */}
      {showGenerateCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800">确认生成卡片</h3>
            <p className="mt-2 text-sm text-slate-500">
              将为以下 {selectedAttractions.length} 个景点生成小红书风格卡片：
            </p>
            <ul className="mt-3 space-y-1">
              {selectedAttractions.map((attraction) => (
                <li key={attraction.id} className="text-sm text-slate-700">
                  • {attraction.name}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowGenerateCard(false)}
                className="flex-1 rounded-full border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={generateSocialCard}
                className="flex-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105"
              >
                生成
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// 小红书风格社交卡片组件
function SocialCard({ attractions, tripName }: SocialCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 模拟图片 - 实际应该从景点数据或 AI 生成获取
  const images = attractions.map((a) => ({
    url: `https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=1000&fit=crop`,
    caption: a.name,
  }));

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-100">
      {/* 轮播图区域 */}
      <div className="relative aspect-[3/4] group">
        <img
          alt={tripName}
          className="h-full w-full object-cover"
          src={images[0]?.url || "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=1000&fit=crop"}
        />
        <div className="absolute bottom-4 right-4 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
          {currentImageIndex + 1}/{images.length}
        </div>

        {/* 图片切换按钮 */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white opacity-0 transition group-hover:opacity-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white opacity-0 transition group-hover:opacity-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* 内容区域 */}
      <div className="space-y-3 p-5">
        {/* 标签 */}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-600">
            #旅行攻略
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-600">
            #{tripName}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-600">
            #打卡圣地
          </span>
        </div>

        {/* 标题 */}
        <h4 className="text-lg font-bold leading-snug text-slate-900">
          {attractions[0]?.name ? `探索${attractions[0].name}，发现隐藏的美景 🌸✨` : "精彩旅程"}
        </h4>

        {/* 描述 */}
        <p className="text-sm leading-relaxed text-slate-600">
          {attractions[0]?.description || "这次旅行真的太棒了！每一个景点都让人流连忘返。"}
        </p>

        {/* 地点信息 */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">日本，京都</span>
        </div>

        {/* 互动栏 */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex -space-x-2">
            <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-slate-200">
              <img
                alt="Avatar"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
              />
            </div>
            <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-slate-200">
              <img
                alt="Avatar"
                src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop"
              />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600">
              +12
            </div>
          </div>
          <div className="flex gap-4">
            <button className="text-slate-400 hover:text-pink-500 transition">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <button className="text-slate-400 hover:text-indigo-500 transition">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
            <button className="text-slate-400 hover:text-emerald-500 transition">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
