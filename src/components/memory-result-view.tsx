"use client";

import { useState, useEffect, useMemo } from "react";
import { TripDocument, Attraction, SessionUser } from "@/lib/types";
import { buildXhsPlainText, tripPackingToSelectableRows } from "@/lib/packing-format";
import {
  buildMarathonHashtagLine,
  MARATHON_PACKING_INTRO,
  MARATHON_XHS_PS,
  tripHasMarathonProfile,
} from "@/lib/trip-marathon";
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
  marathonMode?: boolean;
  marathonTagContext?: string[];
  /** 用户勾选带入卡片的装备行（完整文案） */
  selectedPackingTexts: string[];
  /** 复制到剪贴板的完整正文 */
  cardPlainText: string;
}

// 从 trip 任务中提取景点数据（只包含已完成的任务）
function extractAttractionsFromTrip(trip: TripDocument): Attraction[] {
  const duringTasks = trip.tasks.filter(
    (task) => task.phase === "during" && task.status === "done"
  );

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
    images: task.photos || [],
  }));
}

export function MemoryResultView({ trip, currentUser }: MemoryResultViewProps) {
  const [selectedAttractions, setSelectedAttractions] = useState<Attraction[]>([]);
  const [selectedPackingIds, setSelectedPackingIds] = useState<string[]>([]);
  const [showGenerateCard, setShowGenerateCard] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<SocialCardProps[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [attractionsWithPhotos, setAttractionsWithPhotos] = useState<Attraction[]>([]);

  const attractions = extractAttractionsFromTrip(trip);
  const packingRows = useMemo(() => tripPackingToSelectableRows(trip.packingList), [trip.packingList]);

  const needsPickingGear = packingRows.length > 0;
  const canGenerate =
    selectedAttractions.length > 0 && (!needsPickingGear || selectedPackingIds.length > 0);

  function togglePackingRow(id: string) {
    setSelectedPackingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function selectAllPacking() {
    setSelectedPackingIds(packingRows.map((r) => r.id));
  }

  function clearPackingSelection() {
    setSelectedPackingIds([]);
  }

  // 加载所有景点的照片
  useEffect(() => {
    const loadPhotos = async () => {
      const loadedAttractions = await Promise.all(
        attractions.map(async (attraction) => {
          try {
            const response = await fetch(`/api/trips/${trip.id}/tasks/${attraction.id}/photos`);
            if (response.ok) {
              const data = await response.json();
              return { ...attraction, images: data.photos || [] };
            }
          } catch (error) {
            console.error(`加载照片失败 for ${attraction.id}:`, error);
          }
          return attraction;
        })
      );
      setAttractionsWithPhotos(loadedAttractions);
    };

    if (attractions.length > 0) {
      loadPhotos();
    }
  }, [attractions, trip.id]);

  const toggleAttraction = (attraction: Attraction) => {
    // 从 attractionsWithPhotos 中找到包含照片的景点数据
    const attractionWithPhotos = attractionsWithPhotos.find((a) => a.id === attraction.id) || attraction;

    setSelectedAttractions((prev) =>
      prev.find((a) => a.id === attraction.id)
        ? prev.filter((a) => a.id !== attraction.id)
        : [...prev, attractionWithPhotos]
    );
  };

  const generateSocialCard = () => {
    if (!canGenerate) return;

    // 从 attractionsWithPhotos 中找到对应的景点（包含照片数据）
    const selectedWithPhotos = attractionsWithPhotos.filter((a) =>
      selectedAttractions.some((s) => s.id === a.id)
    );

    const marathonMode = tripHasMarathonProfile({ customTags: trip.customTags });
    const packingTexts = packingRows.filter((r) => selectedPackingIds.includes(r.id)).map((r) => r.text);

    const cardPlainText = buildXhsPlainText({
      marathonMode,
      destination: trip.destination,
      tripName: trip.name,
      marathonTagContext: trip.customTags,
      attractions: selectedWithPhotos.map((a) => ({
        name: a.name,
        description: a.description,
        address: a.address,
      })),
      packingLines: packingTexts,
    });

    const card: SocialCardProps = {
      attractions: selectedWithPhotos,
      tripName: trip.name,
      destination: trip.destination,
      coverImage: selectedWithPhotos[0]?.images?.[0],
      marathonMode,
      marathonTagContext: trip.customTags,
      selectedPackingTexts: packingTexts,
      cardPlainText,
    };
    setGeneratedCards((prev) => [card, ...prev]);
    setShowGenerateCard(false);
    setSelectedAttractions([]);
    setSelectedPackingIds([]);
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

      {/* 语音反馈区域 - 置顶 */}
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

      {/* 统计摘要卡片 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 总行程 */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">总行程</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-bold text-indigo-900">
              {Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} 天
            </p>
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* 减少碳排放 */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">减少碳排放</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-bold text-amber-900">12.4 kg</p>
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
        </div>

        {/* 打卡新地点 */}
        <div className="col-span-2 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">打卡新地点</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-bold text-emerald-900">{trip.tasks.filter((t) => t.phase === "during").length} 个</p>
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
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

      {/* 选择装备（与景点一起写入小红书正文） */}
      {packingRows.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-bold text-slate-800">选择装备</h4>
              <p className="text-xs text-slate-500">
                勾选要放进卡片与复制正文中的装备条目（需至少选一项后再生成）
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllPacking}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                全选
              </button>
              <button
                type="button"
                onClick={clearPackingSelection}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                清空
              </button>
            </div>
          </div>
          <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
            {packingRows.map((row) => {
              const on = selectedPackingIds.includes(row.id);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => togglePackingRow(row.id)}
                  className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition ${
                    on ? "border-orange-500 bg-orange-50 text-slate-900" : "border-slate-100 bg-slate-50/80 text-slate-700"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      on ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {on ? (
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <span className="leading-snug">{row.text}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">已选 {selectedPackingIds.length} / {packingRows.length} 条</p>
        </div>
      ) : null}

      {/* 选择景点区域 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-slate-800">选择景点</h4>
            <p className="text-xs text-slate-500">选择你想分享的景点生成卡片</p>
          </div>
          <button
            onClick={() => setShowGenerateCard(true)}
            disabled={!canGenerate}
            className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2 text-xs font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-105 active:scale-95"
          >
            生成卡片 ({selectedAttractions.length}
            {packingRows.length > 0 ? ` · ${selectedPackingIds.length}装备` : ""})
          </button>
        </div>

        <div className="space-y-2">
          {attractionsWithPhotos.length > 0 ? (
            attractionsWithPhotos.map((attraction) => (
              <div
                key={attraction.id}
                onClick={() => toggleAttraction(attraction)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                  selectedAttractions.find((a) => a.id === attraction.id)
                    ? "border-orange-500 bg-orange-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  {attraction.images && attraction.images.length > 0 ? (
                    <img
                      src={attraction.images[0]}
                      alt={attraction.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

      {/* 生成卡片弹窗 */}
      {showGenerateCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800">确认生成卡片</h3>
            <p className="mt-2 text-sm text-slate-500">
              将为以下 {selectedAttractions.length} 个景点
              {packingRows.length > 0 ? ` 与 ${selectedPackingIds.length} 条装备` : ""} 生成小红书风格正文（可复制全文）：
            </p>
            <ul className="mt-3 space-y-1">
              {selectedAttractions.map((attraction) => (
                <li key={attraction.id} className="text-sm text-slate-700">
                  • {attraction.name}
                </li>
              ))}
            </ul>
            {packingRows.length > 0 ? (
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                <p className="font-semibold text-slate-700">装备预览</p>
                <ul className="mt-1 max-h-28 space-y-0.5 overflow-y-auto">
                  {packingRows
                    .filter((r) => selectedPackingIds.includes(r.id))
                    .map((r) => (
                      <li key={r.id}>– {r.text}</li>
                    ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowGenerateCard(false)}
                className="flex-1 rounded-full border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={generateSocialCard}
                disabled={!canGenerate}
                className="flex-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
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

function CopyCardButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 2000);
          },
          () => {
            setDone(false);
          },
        );
      }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-pink-200 bg-pink-50 py-2.5 text-sm font-bold text-pink-700 transition hover:bg-pink-100"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      {done ? "已复制到剪贴板" : "复制全文（小红书粘贴）"}
    </button>
  );
}

/** 勾选跑马类标签时的「跑马行李清单」版型（地点 + 自选装备全文 + PS） */
function MarathonSocialCard({
  attractions,
  tripName,
  destination,
  marathonTagContext,
  selectedPackingTexts,
  cardPlainText,
}: Pick<
  SocialCardProps,
  | "attractions"
  | "tripName"
  | "destination"
  | "marathonTagContext"
  | "selectedPackingTexts"
  | "cardPlainText"
>) {
  const allImages = attractions.flatMap((a) =>
    a.images && a.images.length > 0 ? a.images.map((url) => ({ url, caption: a.name })) : [],
  );
  const hero =
    allImages[0]?.url ??
    "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&h=1000&fit=crop";
  const hashtagTokens = buildMarathonHashtagLine(destination, marathonTagContext).split(/\s+/).filter(Boolean);

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-100">
      <div className="relative aspect-[3/4]">
        <img alt={tripName} className="h-full w-full object-cover" src={hero} />
      </div>
      <div className="space-y-3 p-5">
        <CopyCardButton text={cardPlainText} />
        <div className="flex flex-wrap gap-2">
          {hashtagTokens.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-pink-100 px-2.5 py-1 text-[11px] font-black text-pink-600"
            >
              {tag}
            </span>
          ))}
        </div>
        {attractions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">打卡地点</p>
            {attractions.map((a) => (
              <div key={a.id} className="rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-800">
                <p className="font-semibold">{a.name}</p>
                {(a.description || a.address) && (
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                    {[a.description, a.address].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : null}
        <p className="text-[13px] font-semibold text-slate-800">{MARATHON_PACKING_INTRO}</p>
        <ul className="space-y-1.5 text-[13px] leading-relaxed text-slate-700">
          {selectedPackingTexts.map((line, idx) => (
            <li key={`${idx}-${line.slice(0, 48)}`} className="flex gap-2">
              <span className="shrink-0 text-slate-400">□</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="whitespace-pre-wrap border-t border-slate-100 pt-3 text-[12px] leading-relaxed text-slate-600">
          {MARATHON_XHS_PS}
        </p>
      </div>
    </div>
  );
}

// 小红书风格社交卡片组件
function SocialCard({
  attractions,
  tripName,
  destination,
  marathonMode,
  marathonTagContext,
  selectedPackingTexts,
  cardPlainText,
}: SocialCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (marathonMode) {
    return (
      <MarathonSocialCard
        attractions={attractions}
        tripName={tripName}
        destination={destination}
        marathonTagContext={marathonTagContext}
        selectedPackingTexts={selectedPackingTexts}
        cardPlainText={cardPlainText}
      />
    );
  }

  // 收集所有景点的照片
  const allImages = attractions.flatMap((a) =>
    a.images && a.images.length > 0
      ? a.images.map((url) => ({ url, caption: a.name }))
      : []
  );

  // 如果没有照片，使用默认图片
  const images = allImages.length > 0
    ? allImages
    : [{ url: `https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=1000&fit=crop`, caption: tripName }];

  const heroUrl =
    images[currentImageIndex]?.url ||
    images[0]?.url ||
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=1000&fit=crop";

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-100">
      {/* 轮播图区域 */}
      <div className="relative aspect-[3/4] group">
        <img alt={tripName} className="h-full w-full object-cover" src={heroUrl} />
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
        <CopyCardButton text={cardPlainText} />

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

        <div className="flex items-center gap-2 text-slate-500">
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <span className="text-xs font-bold uppercase tracking-wider">{destination}</span>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-3">
          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">打卡地点</p>
          {attractions.map((a) => (
            <div key={a.id}>
              <h4 className="text-base font-bold leading-snug text-slate-900">{a.name}</h4>
              {(a.description || a.address) && (
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {[a.description, a.address].filter(Boolean).join("\n")}
                </p>
              )}
            </div>
          ))}
        </div>

        {selectedPackingTexts.length > 0 ? (
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">装备清单</p>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-slate-700">
              {selectedPackingTexts.map((line, idx) => (
                <li key={`${idx}-${line.slice(0, 48)}`} className="flex gap-2">
                  <span className="text-slate-400">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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
