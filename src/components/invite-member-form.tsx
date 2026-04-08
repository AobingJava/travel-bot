"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function InviteMemberForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setMessage(null);
        setError(null);

        startTransition(async () => {
          const response = await fetch(`/api/trips/${tripId}/invitations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.get("email"),
              name: formData.get("name"),
            }),
          });

          const payload = (await response.json()) as { error?: string };

          if (!response.ok) {
            setError(payload.error ?? "邀请失败，请稍后再试。");
            return;
          }

          setEmail("");
          setName("");
          setMessage("邀请已发出。");
          router.refresh();
        });
      }}
      className="space-y-3 rounded-[24px] border border-dashed border-slate-300 bg-white p-4"
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-950">邀请更多旅伴加入</p>
        <p className="text-xs text-slate-500">通过邮箱发出邀请，对方登录后即可确认同行。</p>
      </div>
      <input
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="旅伴姓名"
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
      />
      <input
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="旅伴邮箱"
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
        required
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "邀请中..." : "发送邀请"}
      </button>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
