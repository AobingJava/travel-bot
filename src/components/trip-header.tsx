"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { SessionUser, TripDocument, TripStage } from "@/lib/types";
import { formatDateRange, getTripStageLabel } from "@/lib/utils";

const avatarUrls = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCMKvbpNKJG8j1JmkB4GxJHVe-ax-wvSx3mtudIp3uZwCNJA_lzrsUT10qujZVcJ46kAYpYhuB2hYfdAmPHRsQhw4QDJ2z03UbcaJ_UqwD_Scb6OHuQw6sBe4eqcLCC_OifVCj-KE8zOVR99App8_2FCCJi0-dHo1lMO5XK_-BVOplltb11yxg0LMBkhJEVykzrIK1Bfr3_PjJ9zP-W-dSn7bZFhBYDSUcQHnVS8QVrWkVukXK9cFS_jJiJybWRyJVtk_6lAXI6Jd2h",
];

const STAGE_OPTIONS: { value: TripStage; label: string }[] = [
  { value: "draft", label: "草稿" },
  { value: "planning", label: "筹备中" },
  { value: "ongoing", label: "进行中" },
  { value: "completed", label: "已完成" },
];

type Draft = {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount: string;
  stage: TripStage;
};

function draftFromTrip(t: TripDocument): Draft {
  return {
    name: t.name,
    destination: t.destination,
    startDate: t.startDate,
    endDate: t.endDate,
    travelerCount: String(t.travelerCount),
    stage: t.stage,
  };
}

export function TripHeader({
  trip,
  currentUser,
  canEdit = false,
}: {
  trip: TripDocument;
  currentUser: SessionUser | null;
  /** 与「邀请好友」一致：仅发起人可改 */
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftFromTrip(trip));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(draftFromTrip(trip));
    }
  }, [trip, editing]);

  const cancelEdit = useCallback(() => {
    setDraft(draftFromTrip(trip));
    setEditing(false);
    setError(null);
  }, [trip]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    const n = Number.parseInt(draft.travelerCount, 10);
    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          destination: draft.destination,
          startDate: draft.startDate,
          endDate: draft.endDate,
          travelerCount: Number.isFinite(n) ? n : trip.travelerCount,
          stage: draft.stage,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("网络异常，请重试");
    } finally {
      setSaving(false);
    }
  }, [draft, trip.id, trip.travelerCount, router]);

  const inputClass =
    "mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/25";
  const labelClass = "text-[11px] font-medium text-white/55";

  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-[13px] font-medium text-slate-400 transition hover:text-slate-700 active:scale-[0.98]"
        >
          ← 返回
        </Link>
        {currentUser ? (
          <div className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-white/30">
            <img
              src={avatarUrls[0]}
              alt={currentUser.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
            <svg className="h-4 w-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

      {editing ? (
        <div className="overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
          <p className="text-[13px] font-semibold text-emerald-300/90">编辑行程</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className={labelClass} htmlFor={`trip-name-${trip.id}`}>
                行程名称
              </label>
              <input
                id={`trip-name-${trip.id}`}
                className={inputClass}
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`trip-dest-${trip.id}`}>
                目的地
              </label>
              <input
                id={`trip-dest-${trip.id}`}
                className={inputClass}
                value={draft.destination}
                onChange={(e) => setDraft((d) => ({ ...d, destination: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor={`trip-start-${trip.id}`}>
                  开始日期
                </label>
                <input
                  id={`trip-start-${trip.id}`}
                  type="date"
                  className={inputClass}
                  value={draft.startDate}
                  onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`trip-end-${trip.id}`}>
                  结束日期
                </label>
                <input
                  id={`trip-end-${trip.id}`}
                  type="date"
                  className={inputClass}
                  value={draft.endDate}
                  onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor={`trip-count-${trip.id}`}>
                  同行人数
                </label>
                <input
                  id={`trip-count-${trip.id}`}
                  type="number"
                  min={1}
                  className={inputClass}
                  value={draft.travelerCount}
                  onChange={(e) => setDraft((d) => ({ ...d, travelerCount: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`trip-stage-${trip.id}`}>
                  状态
                </label>
                <select
                  id={`trip-stage-${trip.id}`}
                  className={`${inputClass} cursor-pointer`}
                  value={draft.stage}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, stage: e.target.value as TripStage }))
                  }
                >
                  {STAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-slate-900 text-white">
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {error ? <p className="mt-3 text-[13px] text-rose-300">{error}</p> : null}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              onClick={cancelEdit}
              disabled={saving}
            >
              取消
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
              onClick={() => void save()}
              disabled={saving}
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      ) : canEdit ? (
        <button
          type="button"
          className="w-full overflow-hidden rounded-2xl bg-slate-950 p-5 text-left text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)] transition active:scale-[0.99] hover:ring-2 hover:ring-white/15"
          onClick={() => setEditing(true)}
          aria-label="编辑行程信息"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
              {getTripStageLabel(trip.stage)}
            </span>
            <span className="text-[12px] text-white/70">{trip.travelerCount} 人同行</span>
          </div>
          <h1 className="mt-2.5 text-2xl font-bold tracking-tight">{trip.name}</h1>
          <p className="mt-1 text-[13px] text-white/75">{formatDateRange(trip.startDate, trip.endDate)}</p>
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
              {getTripStageLabel(trip.stage)}
            </span>
            <span className="text-[12px] text-white/70">{trip.travelerCount} 人同行</span>
          </div>
          <h1 className="mt-2.5 text-2xl font-bold tracking-tight">{trip.name}</h1>
          <p className="mt-1 text-[13px] text-white/75">{formatDateRange(trip.startDate, trip.endDate)}</p>
        </div>
      )}
    </header>
  );
}
