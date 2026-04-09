"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

import { tripThemes } from "@/lib/types";

type FormState = {
  destination: string;
  startDate: string;
  endDate: string;
  themes: string[];
  customTags: string[];
  showCustomTagInput: boolean;
  newCustomTag: string;
};

const defaultState: FormState = {
  destination: "",
  startDate: "2026-05-10",
  endDate: "2026-05-17",
  themes: [],
  customTags: [],
  showCustomTagInput: false,
  newCustomTag: "",
};

// 基于小红书热门目的地整理的真实热门标签
const destinationTags = [
  {
    name: "日本",
    keywords: ["日本", "东京", "大阪", "京都", "奈良", "北海道", "冲绳", "镰仓", "神户", "横滨"],
    tags: ["樱花季", "温泉旅行", "神社巡礼", "动漫圣地", "和服体验", "怀石料理", "温泉旅馆", "富士山", "金阁寺", "伏见稻荷大社", "岚山", "涩谷"],
  },
  {
    name: "澳大利亚",
    keywords: ["澳大利亚", "澳洲", "悉尼", "墨尔本", "黄金海岸", "布里斯班", "珀斯", "大堡礁", "塔斯马尼亚"],
    tags: ["考拉抱抱", "大堡礁潜水", "悉尼歌剧院", "大洋路", "乌鲁鲁", "袋鼠岛", "冲浪者天堂", "菲利普岛", "蓝山国家公园", "墨尔本咖啡"],
  },
  {
    name: "美国",
    keywords: ["美国", "纽约", "洛杉矶", "旧金山", "拉斯维加斯", "夏威夷", "迈阿密", "西雅图", "波士顿", "芝加哥"],
    tags: ["国家公园", "一号公路", "大峡谷", "自由女神", "时代广场", "金门大桥", "环球影城", "迪士尼", "黄石公园", "羚羊谷", "马蹄湾", "百老汇"],
  },
  {
    name: "巴厘岛",
    keywords: ["巴厘岛", "印尼", "印度尼西亚", "登巴萨"],
    tags: ["海岛度假", "海边日落", "乌布梯田", "海神庙", "圣猴森林公园", "火山日出", "潜水", "网红秋千", "悬崖酒店", " SPA 按摩", "热带水果"],
  },
  {
    name: "泰国",
    keywords: ["泰国", "曼谷", "普吉岛", "清迈", "芭提雅", "苏梅岛", "甲米"],
    tags: ["泰式按摩", "夜市", "人妖秀", "大皇宫", "水上市场", "冬阴功", "芒果糯米饭", "泰式奶茶", "丛林飞跃", "浮潜", "长尾船", "寺庙"],
  },
  {
    name: "法国",
    keywords: ["法国", "巴黎", "尼斯", "里昂", "马赛", "普罗旺斯", "波尔多"],
    tags: ["埃菲尔铁塔", "卢浮宫", "凯旋门", "香榭丽舍", "圣母院", "薰衣草田", "香槟", "法式甜点", "塞纳河", "凡尔赛宫", "红酒庄"],
  },
  {
    name: "意大利",
    keywords: ["意大利", "罗马", "威尼斯", "佛罗伦萨", "米兰", "比萨", "那不勒斯", "五渔村"],
    tags: ["斗兽场", "许愿池", "贡多拉", "披萨", "意面", "Gelato 冰淇淋", "文艺复兴", "圣母百花大教堂", "斜塔", "阿马尔菲海岸"],
  },
  {
    name: "英国",
    keywords: ["英国", "伦敦", "爱丁堡", "曼彻斯特", "利物浦", "剑桥", "牛津"],
    tags: ["大英博物馆", "伦敦眼", "白金汉宫", "哈利波特", "英式下午茶", "贝克街", "苏格兰高地", "温莎城堡", "剑桥徐志摩", "牛津大学"],
  },
  {
    name: "瑞士",
    keywords: ["瑞士", "苏黎世", "日内瓦", "因特拉肯", "卢塞恩", "采尔马特", "少女峰"],
    tags: ["阿尔卑斯山", "雪山", "湖泊", "火车旅行", "巧克力", "瑞士军刀", "滑雪", "马特洪峰", "琉森湖", "童话小镇"],
  },
  {
    name: "新西兰",
    keywords: ["新西兰", "奥克兰", "皇后镇", "基督城", "惠灵顿", "罗托鲁瓦"],
    tags: ["指环王取景地", "极限运动", "蹦极", "冰川", "峡湾", "萤火虫洞", "毛利文化", "温泉", "自驾", "纯净自然"],
  },
  {
    name: "马尔代夫",
    keywords: ["马尔代夫", "马累"],
    tags: ["一岛一酒店", "水上屋", "玻璃海", "浮潜", "度假村", "蜜月", "潜水", "日落巡航", "海底餐厅", "无人沙滩"],
  },
  {
    name: "韩国",
    keywords: ["韩国", "首尔", "釜山", "济州岛", "仁川"],
    tags: ["韩剧打卡", "景福宫", "明洞购物", "韩式烤肉", "石锅拌饭", "泡菜", "汉江", "南山塔", "免税店", "化妆品种草"],
  },
  {
    name: "新加坡",
    keywords: ["新加坡", "星洲"],
    tags: ["环球影城", "滨海湾花园", "鱼尾狮", "樟宜机场", "牛车水", "小印度", "圣淘沙", "夜间动物园", "辣椒螃蟹", "城市花园"],
  },
  {
    name: "国内游",
    keywords: ["西藏", "云南", "丽江", "大理", "香格里拉", "三亚", "海南", "桂林", "阳朔", "张家界", "九寨沟", "黄山", "西安", "成都", "重庆", "杭州", "苏州", "北京", "上海"],
    tags: ["古镇", "民族风情", "雪山", "梯田", "喀斯特地貌", "美食之都", "火锅", "西湖", "园林", "故宫", "长城", "外滩", "兵马俑"],
  },
];

// 根据目的地获取热门标签
function getDestinationTags(destination: string): string[] {
  if (!destination.trim()) return [];

  const lowerDestination = destination.toLowerCase();

  for (const { keywords, tags } of destinationTags) {
    if (keywords.some((keyword) => lowerDestination.includes(keyword.toLowerCase()))) {
      // 过滤掉空标签，然后截取最多 8 个
      return tags.filter((tag) => tag && tag.trim()).slice(0, 8);
    }
  }

  return [];
}

export function CreateTripForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamedThemes, setStreamedThemes] = useState<string[]>([]);
  const [showThemes, setShowThemes] = useState(false);

  // 使用防抖，只有在用户停止输入 500ms 后才分析目的地
  useEffect(() => {
    const hasDestination = form.destination.trim().length > 0;

    if (!hasDestination) {
      setIsAnalyzing(false);
      setStreamedThemes([]);
      setShowThemes(false);
      // 清空已选择的主题
      setForm((current) => ({ ...current, themes: [] }));
      return;
    }

    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const recommended = getDestinationTags(form.destination);
      setIsAnalyzing(false);

      // 流式输出效果：逐个显示推荐的主题，每个间隔 50ms
      if (recommended.length > 0) {
        setShowThemes(true);
        setStreamedThemes([]);

        // 使用 setTimeout 逐个添加标签，避免 setInterval 的状态问题
        const timeouts: NodeJS.Timeout[] = [];
        recommended.forEach((tag, index) => {
          const timeout = setTimeout(() => {
            setStreamedThemes((prev) => [...prev, tag]);
          }, index * 50);
          timeouts.push(timeout);
        });

        return () => {
          timeouts.forEach(clearTimeout);
        };
      } else {
        setShowThemes(false);
        setStreamedThemes([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.destination]);

  const selectedLabel = useMemo(
    () =>
      showThemes
        ? tripThemes
            .filter((theme) => form.themes.includes(theme.key))
            .map((theme) => theme.label)
            .join(" / ")
        : "",
    [form.themes, showThemes],
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

  function addCustomTag() {
    if (form.newCustomTag.trim()) {
      setForm((current) => ({
        ...current,
        customTags: [...current.customTags, current.newCustomTag.trim()],
        newCustomTag: "",
        showCustomTagInput: false,
      }));
    }
  }

  function removeCustomTag(tag: string) {
    setForm((current) => ({
      ...current,
      customTags: current.customTags.filter((t) => t !== tag),
    }));
  }

  function handleCustomTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    } else if (e.key === "Escape") {
      setForm((current) => ({ ...current, showCustomTagInput: false, newCustomTag: "" }));
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);

    // 检查是否至少选择了一个主题或标签
    const shouldValidate = showThemes && streamedThemes.length > 0;

    if (shouldValidate && form.themes.length === 0 && form.customTags.length === 0) {
      setError("至少选择一个旅行主题或添加一个自定义标签");
      return;
    }

    startTransition(async () => {
      const destination = formData.get("destination") as string;
      const startDate = formData.get("startDate") as string;
      const endDate = formData.get("endDate") as string;

      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination,
          startDate,
          endDate,
          themes: form.themes,
          customTags: form.customTags,
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
          placeholder="例如：巴厘岛、京都、巴黎"
        />
      </div>

      {/* 日期选择区域 */}
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

      {/* 热门推荐标签 - 输入目的地后才显示 */}
      {showThemes && streamedThemes.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-600">热门推荐标签</span>
            {isAnalyzing && (
              <span className="text-xs text-slate-400 animate-pulse">正在分析目的地...</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {streamedThemes.filter((tag) => tag && tag.trim()).map((tag, index) => {
              // 查找对应的 theme key
              const matchingTheme = tripThemes.find((theme) => theme.label === tag);
              const isSelected = matchingTheme ? form.themes.includes(matchingTheme.key) : false;
              const isCustomTagSelected = !matchingTheme && form.customTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (matchingTheme) {
                      toggleTheme(matchingTheme.key);
                    } else {
                      // 添加到自定义标签
                      if (form.customTags.includes(tag)) {
                        removeCustomTag(tag);
                      } else {
                        setForm((current) => ({
                          ...current,
                          customTags: [...current.customTags, tag],
                        }));
                      }
                    }
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all active:scale-[0.96] ${
                    isSelected || isCustomTagSelected
                      ? "border-transparent bg-slate-950 text-white shadow-md shadow-slate-950/12"
                      : "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400"
                  }`}
                  style={{ animation: 'fadeIn 0.3s ease-in-out both', animationDelay: `${index * 50}ms` }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 旅行主题区域 - 输入目的地后才显示 */}
      {showThemes && streamedThemes.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[13px] font-medium text-slate-600">旅行主题</span>
          <div className="flex flex-wrap gap-1.5">
            {tripThemes.map((theme) => {
              const selected = form.themes.includes(theme.key);
              const isRecommended = streamedThemes.includes(theme.key);

              // 推荐主题的不同颜色样式
              const recommendedStyles = {
                nature: "border-emerald-300 bg-emerald-50 text-emerald-700",
                food: "border-orange-300 bg-orange-50 text-orange-700",
                culture: "border-amber-300 bg-amber-50 text-amber-700",
                shopping: "border-pink-300 bg-pink-50 text-pink-700",
                nightlife: "border-purple-300 bg-purple-50 text-purple-700",
                family: "border-blue-300 bg-blue-50 text-blue-700",
              };

              const recommendedStyle = isRecommended
                ? recommendedStyles[theme.key] || "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300";

              return (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => toggleTheme(theme.key)}
                  className={`relative rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all active:scale-[0.96] ${
                    selected
                      ? "border-transparent bg-slate-950 text-white shadow-md shadow-slate-950/12"
                      : recommendedStyle
                  }`}
                >
                  {theme.label}
                </button>
              );
            })}

            {/* 自定义标签添加按钮 */}
            {form.showCustomTagInput ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={form.newCustomTag}
                  onChange={(e) => updateField("newCustomTag", e.target.value)}
                  onKeyDown={handleCustomTagKeyDown}
                  onBlur={() => {
                    if (!form.newCustomTag.trim()) {
                      setForm((current) => ({ ...current, showCustomTagInput: false }));
                    }
                  }}
                  autoFocus
                  className="w-24 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[13px] text-slate-950 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                  placeholder="输入标签..."
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => updateField("showCustomTagInput", true)}
                className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-[13px] font-medium text-slate-500 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加标签
              </button>
            )}

            {/* 已添加的自定义标签 */}
            {form.customTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeCustomTag(tag)}
                  className="ml-1 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            已选择：{selectedLabel || form.customTags.length > 0 ? form.customTags.join(", ") : "未选择"}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="group relative inline-flex items-center justify-center w-full px-8 py-4 font-headline font-bold text-white transition-all duration-200 bg-gradient-to-br from-primary to-primary-fixed rounded-lg shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="text-lg">{isPending ? "AI 正在生成计划..." : "开启行程"}</span>
        <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
