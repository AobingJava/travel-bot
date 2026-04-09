import type { CreateTripInput } from "@/lib/types";

/** 出现在「热门推荐标签」最前面的可选关键词（需用户点击后才生效） */
export const MARATHON_SUGGESTION_CHIPS = ["马拉松", "跑马", "跑步"] as const;

/** 与跑马装备 / 小红书模板对应的勾选词（含用户自填赛事名、及「跑步」等） */
const MARATHON_TAG_PATTERN = /马拉松|跑马|半程|全马|越野跑|路跑|跑步赛事|跑步/u;

/**
 * 仅从行程描述里识别是否**展示**跑马类推荐标签（不自动写入行程）
 */
export function shouldSuggestMarathonTags(...parts: string[]): boolean {
  const text = parts
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!text) return false;
  return MARATHON_TAG_PATTERN.test(text);
}

/**
 * 用户是否在自定义标签里勾选了跑马相关意图（决定装备与小红书模板）
 */
export function tripHasMarathonProfile(input: Pick<CreateTripInput, "customTags">): boolean {
  const tags = input.customTags ?? [];
  return tags.some((t) => MARATHON_TAG_PATTERN.test(t.trim()));
}

export const MARATHON_PACKING_INTRO = "【跑马行李清单】：有其他遗漏的辛苦补充";

/** 与装备清单一一对应的子项名称 */
export const MARATHON_PACKING_SUBITEM_NAMES: string[] = [
  "手机、充电器",
  "运动手表、手环",
  "各种钥匙",
  "充电宝",
  "耳机",
  "束发带",
  "腰包、臂包（也可越野包）",
  "袖套、帽子（防晒喷雾等）",
  "上衣（与参赛服大差异的）",
  "跑鞋（严禁未穿过的新鞋）",
  "换洗衣物",
  "拖鞋（全马备上拖鞋到赛场）",
  "雨披（挡雨，无雨保暖）",
  "盐丸、能量胶等",
  "扎头用发绳",
  "各种cosplay造型用具",
];

export const MARATHON_XHS_PS = `PS:
一、比赛前：
1.领物后按照国际惯例拍定妆照
2.酒店可提前沟通跑马延后退房
3.着装建议穿与参赛服有明显差异的，参赛服可领物时拍照留念
二、比赛中：
4.摄影师一般集中在路的右边，想要美照记得张望。
5.补给站也在右边，提前用手示意或语言让别人让路，以防摔倒。不建议进补给站最前面位置，人特别多。
6.如遇见不适，找急救跑者，或者路边的志愿者。腿部的不适可以让用药喷一下，十分有效。
7.前3公里一定不要跟别人猛冲容易崩，保持自己的节奏。有余力可以后半程提速。

预祝安全完赛，无伤PB！`;

/**
 * 生成话题标签文案（带 #；固定三项 + 目的地 + 自定义里含跑马/跑步语义的标签）
 */
export function buildMarathonHashtagLine(destination: string, customTags?: string[]): string {
  const ordered: string[] = ["#跑马行李清单", "#跑马", "#马拉松比赛"];
  const seen = new Set(ordered);

  const pushTag = (raw: string) => {
    const s = raw.replace(/\s+/g, "").trim();
    if (!s || seen.has(`#${s}`)) return;
    ordered.push(`#${s}`);
    seen.add(`#${s}`);
  };

  pushTag(destination);
  for (const t of customTags ?? []) {
    const s = t.replace(/\s+/g, "").trim();
    if (!s || seen.has(`#${s}`)) continue;
    if (/马拉松|跑马|跑步/u.test(s)) {
      pushTag(t);
    }
  }

  return ordered.join(" ");
}

/** 流式接口里 generatePackingListOnly 返回前的原始分组（再走 normalizePackingListFromApi）；贴士仅保留 PS 正文，避免与清单行重复 */
export function buildMarathonPackingListRaw(): Record<string, unknown>[] {
  return [
    {
      name: MARATHON_PACKING_INTRO,
      category: "gear",
      subItems: MARATHON_PACKING_SUBITEM_NAMES.map((name) => ({ name })),
    },
  ];
}
