import Link from "next/link";

import { AuthCard } from "@/components/auth-card";

type AuthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectParam = resolvedSearchParams.redirect;
  const redirectTo =
    typeof redirectParam === "string" && redirectParam.startsWith("/")
      ? redirectParam
      : "/";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center gap-8 px-4 py-8 sm:px-6">
      <div className="text-center">
        <Link
          href="/"
          className="text-[13px] font-medium text-slate-400 transition hover:text-slate-700"
        >
          ← 返回首页
        </Link>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
          登录后继续协作
        </h1>
        <p className="mx-auto mt-2.5 max-w-xs text-[14px] leading-6 text-slate-500">
          邮箱 magic link 会把你带回当前行程，用于接受邀请、同步通知和完成分配任务。
        </p>
      </div>

      <AuthCard redirectTo={redirectTo} />
    </main>
  );
}
