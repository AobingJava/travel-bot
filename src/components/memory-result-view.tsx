"use client";

import { useState } from "react";
import { TripDocument, Attraction, SessionUser } from "@/lib/types";
import Link from "next/link";

interface MemoryResultViewProps {
  trip: TripDocument;
  currentUser: SessionUser | null;
}

interface SocialCardProps {
  attractions: Attraction[];
  tripName: string;
  destination: string;
  coverImage?: string;
}

// 从 trip 任务中提取景点数据
function extractAttractionsFromTrip(trip: TripDocument): Attraction[] {
  const duringTasks = trip.tasks.filter((task) => task.phase === "during");

  return duringTasks.map((task, index) => ({
    id: task.id,
    name: task.locationName || task.title,
    address: task.notes,
    rating: 4.5,
    visitDuration: task.durationMinutes || 60,
    bestTimeToVisit: task.scheduledTime,
    description: task.routeHint || task.notes || "",
    category: task.label || "suggestion",
    latitude: task.lat,
    longitude: task.lng,
    images: [],
  }));
}

export function MemoryResultView({ trip, currentUser }: MemoryResultViewProps) {
  const [selectedAttractions, setSelectedAttractions] = useState<Attraction[]>([]);
  const [showGenerateCard, setShowGenerateCard] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<SocialCardProps[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const attractions = extractAttractionsFromTrip(trip);

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
      destination: trip.destination,
      coverImage: selectedAttractions[0]?.name,
    };
    setGeneratedCards((prev) => [card, ...prev]);
    setShowGenerateCard(false);
    setSelectedAttractions([]);
  };

  const handleRecordVoice = () => {
    setIsRecording(!isRecording);
  };

  const isCompleted = trip.stage === "completed";

  return (
    <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 pt-6 pb-28 sm:pt-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/trips/${trip.id}?view=meeting`}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:shadow-sm active:scale-[0.98]"
        >
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </span>
        </Link>
        <h1 className="text-lg font-bold text-slate-800">生成回忆</h1>
        <div className="w-16" />
      </div>

      {/* 行程状态提示 */}
      {!isCompleted && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            提示：行程尚未结束
          </p>
          <p className="text-xs text-amber-700 mt-1">
            建议先结束行程再生成回忆，这样可以包含更多完整的信息。
          </p>
        </div>
      )}

      {/* 已生成的卡片列表 */}
      {generatedCards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">已生成的卡片</h3>
          {generatedCards.map((card, index) => (
            <SocialCard key={index} {...card} />
          ))}
        </div>
      )}

      {/* 选择景点区域 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-slate-800">选择景点</h4>
            <p className="text-xs text-slate-500">选择你想分享的景点生成卡片</p>
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
          {attractions.length > 0 ? (
            attractions.map((attraction) => (
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
                  {attraction.description && (
                    <p className="text-xs text-slate-500 truncate">{attraction.description}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              暂无景点数据
            </div>
          )}
        </div>
      </div>

      {/* 语音反馈 */}
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
    </main>
  );
}

// 小红书风格社交卡片组件
function SocialCard({ attractions, tripName, destination }: SocialCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {destination}
          </span>
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
