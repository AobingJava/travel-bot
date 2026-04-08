"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { tripThemes } from "@/lib/types";

type FormState = {
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount: string;
  themes: string[];
};

const defaultState: FormState = {
  destination: "京都 + 大阪",
  startDate: "2026-05-10",
  endDate: "2026-05-17",
  travelerCount: "4",
  themes: ["culture", "food", "nature"],
};

export function CreateTripForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedLabel = useMemo(
    () =>
      tripThemes
        .filter((theme) => form.themes.includes(theme.key))
        .map((theme) => theme.label)
        .join(" / "),
    [form.themes],
  );

  function toggleTheme(themeKey: string) {
    setForm((current) => ({
      ...current,
      themes: current.themes.includes(themeKey)
        ? current.themes.filter((value) => value !== themeKey)
        : [...current.themes, themeKey],
    }));
  }

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: formData.get("destination"),
          startDate: formData.get("startDate"),
          endDate: formData.get("endDate"),
          travelerCount: formData.get("travelerCount"),
          themes: form.themes,
        }),
      });

      const payload = (await response.json()) as { error?: string; tripId?: string };
      if (!response.ok || !payload.tripId) {
        setError(payload.error ?? "生成失败，请稍后再试。");
        return;
      }

      router.push(`/trips/${payload.tripId}`);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-slate-600" htmlFor="destination">
          目的地
        </label>
        <input
          id="destination"
          name="destination"
          value={form.destination}
          onChange={(event) => updateField("destination", event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          placeholder="例如：京都 + 大阪"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <label className="space-y-1.5 text-[13px] font-medium text-slate-600">
          <span>出发</span>
          <input
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={(event) => updateField("startDate", event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </label>
        <label className="space-y-1.5 text-[13px] font-medium text-slate-600">
          <span>返回</span>
          <input
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={(event) => updateField("endDate", event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </label>
      </div>

      <div className="space-y-1.5">
        <span className="text-[13px] font-medium text-slate-600">旅行主题</span>
        <div className="flex flex-wrap gap-1.5">
          {tripThemes.map((theme) => {
            const selected = form.themes.includes(theme.key);

            return (
              <button
                key={theme.key}
                type="button"
                onClick={() => toggleTheme(theme.key)}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition active:scale-[0.96] ${
                  selected
                    ? "border-transparent bg-slate-950 text-white shadow-md shadow-slate-950/12"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {theme.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400">已选择：{selectedLabel || "未选择"}</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-slate-600" htmlFor="travelerCount">
          旅伴人数
        </label>
        <input
          id="travelerCount"
          name="travelerCount"
          type="number"
          min={1}
          max={20}
          value={form.travelerCount}
          onChange={(event) => updateField("travelerCount", event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3.5 text-[14px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "AI 正在生成计划..." : "AI 生成旅行计划"}
      </button>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
