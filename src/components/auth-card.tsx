"use client";

import { useState, useTransition } from "react";

export function AuthCard({ redirectTo = "/" }: { redirectTo?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setError(null);
        setMessage(null);

        startTransition(async () => {
          const response = await fetch("/api/auth/request-link", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.get("email"),
              name: formData.get("name"),
              redirectTo,
            }),
          });

          const payload = (await response.json()) as {
            error?: string;
            message?: string;
            devLoginUrl?: string;
          };

          if (!response.ok) {
            setError(payload.error ?? "发送失败，请稍后再试。");
            return;
          }

          setMessage(
            payload.devLoginUrl
              ? `登录链接已生成。开发模式下可直接打开：${payload.devLoginUrl}`
              : payload.message ?? "登录链接已发送，请查收邮箱。",
          );
        });
      }}
      className="space-y-4 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-950">邮箱登录</h2>
        <p className="text-sm text-slate-500">
          用 magic link 登录后，可以接受邀请、同步通知和协作完成任务。
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="auth-name">
          称呼
        </label>
        <input
          id="auth-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-400"
          placeholder="例如：Aihe"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="auth-email">
          邮箱
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-400"
          placeholder="you@example.com"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "发送中..." : "发送登录链接"}
      </button>

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
