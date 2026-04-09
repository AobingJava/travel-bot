import type { PackingListItem, PackingCategory, PackingSubItem, ThemeKey } from "@/lib/types";
import { createId } from "./utils";

// 通用基础物品（所有旅行都需要）
const universalItems: Omit<PackingListItem, "id">[] = [
  // 证件财务
  { name: "身份证", category: "documents" },
  { name: "护照（出境游）", category: "documents" },
  { name: "钱包/现金", category: "documents" },
  { name: "信用卡/银行卡", category: "documents" },
  { name: "紧急联系人卡片", category: "documents" },
  { name: "旅行保险单据", category: "documents" },

  // 电子产品
  { name: "手机", category: "electronics" },
  { name: "充电器", category: "electronics" },
  { name: "充电宝", category: "electronics" },
  { name: "耳机", category: "electronics" },
  { name: "转换插头（出境游）", category: "electronics" },

  // 个护健康
  { name: "牙刷牙膏", category: "toiletries" },
  { name: "洗发水沐浴露", category: "toiletries" },
  { name: "毛巾", category: "toiletries" },
  { name: "防晒霜", category: "toiletries" },
  { name: "常用药品", category: "toiletries" },
  { name: "创可贴", category: "toiletries" },
  { name: "驱蚊液", category: "toiletries" },

  // 衣物
  { name: "换洗衣物（按天数）", category: "clothing" },
  { name: "内衣裤", category: "clothing" },
  { name: "袜子", category: "clothing" },
  { name: "拖鞋", category: "clothing" },
  { name: "睡衣", category: "clothing" },
];

// 根据主题分类的特定装备
const themeSpecificItems: Record<ThemeKey, Omit<PackingListItem, "id">[]> = {
  culture: [
    { name: "相机", category: "electronics" },
    { name: "备用存储卡", category: "electronics" },
    { name: "导游书/旅行指南", category: "documents" },
    { name: "笔记本和笔", category: "documents" },
    { name: "舒适的步行鞋", category: "clothing" },
    { name: "帽子（防晒）", category: "clothing" },
    { name: "太阳镜", category: "clothing" },
  ],
  food: [
    { name: "消食片/胃药", category: "toiletries" },
    { name: "湿纸巾", category: "toiletries" },
    { name: "便携水杯", category: "toiletries" },
    { name: "相机（拍美食）", category: "electronics" },
    { name: "美食探店清单", category: "documents" },
  ],
  shopping: [
    { name: "环保购物袋", category: "core" },
    { name: "行李箱（额外空间）", category: "core" },
    { name: "计算器/汇率转换", category: "electronics" },
    { name: "会员卡/优惠券", category: "documents" },
  ],
  nature: [
    { name: "登山鞋", category: "clothing" },
    { name: "冲锋衣/雨衣", category: "clothing" },
    { name: "保暖层", category: "clothing" },
    { name: "登山杖", category: "core" },
    { name: "望远镜", category: "electronics" },
    { name: "驱蚊液", category: "toiletries" },
    { name: "高倍防晒霜", category: "toiletries" },
    { name: "急救包", category: "toiletries" },
    { name: "高能量零食", category: "core" },
  ],
  nightlife: [
    { name: "时尚服装", category: "clothing" },
    { name: "外套（室内空调）", category: "clothing" },
    { name: "充电宝", category: "electronics" },
    { name: "口气清新剂", category: "toiletries" },
    { name: "小瓶香水", category: "toiletries" },
  ],
  family: [
    { name: "儿童常用药", category: "toiletries" },
    { name: "尿布/湿巾（婴幼儿）", category: "toiletries" },
    { name: "儿童玩具/绘本", category: "core" },
    { name: "婴儿食品/零食", category: "core" },
    { name: "备用衣物（儿童）", category: "clothing" },
    { name: "儿童防晒霜", category: "toiletries" },
    { name: "推车/背带", category: "core" },
    { name: "儿童证件照", category: "documents" },
  ],
};

// 根据天气条件添加的物品
const weatherItems: Record<string, Omit<PackingListItem, "id">[]> = {
  rain: [
    { name: "雨伞", category: "weather" },
    { name: "雨衣", category: "weather" },
    { name: "防水鞋套", category: "weather" },
    { name: "防水包", category: "weather" },
  ],
  cold: [
    { name: "羽绒服", category: "weather" },
    { name: "毛衣/保暖衣", category: "weather" },
    { name: "围巾手套", category: "weather" },
    { name: "保暖帽", category: "weather" },
    { name: "暖宝宝", category: "weather" },
  ],
  hot: [
    { name: "遮阳帽", category: "weather" },
    { name: "太阳镜", category: "weather" },
    { name: "防晒衣", category: "weather" },
    { name: "便携小风扇", category: "electronics" },
    { name: "冰袖", category: "weather" },
  ],
};

// 根据活动类型添加的装备
const activityItems: Record<string, Omit<PackingListItem, "id">[]> = {
  skiing: [
    { name: "滑雪服", category: "gear" },
    { name: "滑雪镜", category: "gear" },
    { name: "滑雪手套", category: "gear" },
    { name: "护膝护腕", category: "gear" },
    { name: "滑雪袜", category: "gear" },
    { name: "保暖内衣", category: "clothing" },
  ],
  running: [
    { name: "跑步鞋", category: "clothing" },
    { name: "运动衣裤", category: "clothing" },
    { name: "运动袜", category: "clothing" },
    { name: "运动手表", category: "electronics" },
    { name: "腰包/臂包", category: "core" },
    { name: "运动毛巾", category: "toiletries" },
  ],
  swimming: [
    { name: "泳衣/泳裤", category: "clothing" },
    { name: "泳镜", category: "clothing" },
    { name: "泳帽", category: "clothing" },
    { name: "沙滩巾", category: "clothing" },
    { name: "防水手机袋", category: "electronics" },
    { name: "拖鞋", category: "clothing" },
  ],
  hiking: [
    { name: "登山鞋", category: "clothing" },
    { name: "速干衣裤", category: "clothing" },
    { name: "登山包", category: "core" },
    { name: "登山杖", category: "core" },
    { name: "头灯/手电筒", category: "electronics" },
    { name: "指南针", category: "electronics" },
  ],
  beach: [
    { name: "泳衣", category: "clothing" },
    { name: "沙滩鞋", category: "clothing" },
    { name: "沙滩巾", category: "clothing" },
    { name: "遮阳伞", category: "weather" },
    { name: "防水包", category: "weather" },
    { name: "沙滩玩具", category: "core" },
  ],
};

const categoryLabels: Record<PackingCategory, string> = {
  core: "核心必备",
  clothing: "衣物鞋包",
  electronics: "数码电子",
  toiletries: "个护健康",
  documents: "证件财务",
  weather: "天气用品",
  gear: "运动装备",
};

const VALID_PACKING_CATEGORIES: PackingCategory[] = [
  "core",
  "documents",
  "clothing",
  "electronics",
  "toiletries",
  "weather",
  "gear",
];

/** 模型漏写 category 或写成非法值时，按名称推断大类（与参考稿「核心必备 / 衣物 / 数码 / 个护」等对齐） */
export function inferPackingCategoryFromText(text: string): PackingCategory {
  const t = text.trim();
  if (!t) return "core";
  if (/滑雪|雪镜|雪板|雪鞋|护脸|单板|双板|固定器|雪杖|潜水镜|脚蹼|面镜|呼吸管|浮潜镜/i.test(t)) {
    return "gear";
  }
  if (/身份证|护照|签证|通行证|驾照|证件|门票|机票|行程单|保单|保险单|银行卡|信用卡|现金|钱包|票据/i.test(t)) {
    return "documents";
  }
  if (/手机|充电|充电宝|耳机|相机|存储卡|转换插|数据线|平板|电脑|电子|电池|自拍杆|头灯|手电筒/i.test(t)) {
    return "electronics";
  }
  if (/牙|洗漱|护肤|化妆|防晒|洗发|沐浴|毛巾|药品|药|创口|创可贴|驱蚊|湿巾|纸巾|润唇|分装|急救包/i.test(t)) {
    return "toiletries";
  }
  if (/雨伞|雨具|雨衣|防水鞋|防水包|暖宝宝|羽绒|遮阳|冰袖|太阳镜|墨镜/i.test(t)) {
    return "weather";
  }
  if (/衣|裤|鞋|袜|帽|外套|睡衣|拖鞋|内衣|滑雪服|抓绒|速干|冲锋|羊毛|围巾|手套|泳装|泳衣/i.test(t)) {
    return "clothing";
  }
  return "core";
}

export function isGenericPackGroupName(name: string): boolean {
  const t = name.trim();
  if (t.length < 2) return true;
  return /^(装备分组|未命名分组|未命名|分组|物品)$/u.test(t);
}

function mapPackingCategory(raw: unknown, itemName?: string): PackingCategory {
  if (typeof raw === "string" && VALID_PACKING_CATEGORIES.includes(raw as PackingCategory)) {
    return raw as PackingCategory;
  }
  if (itemName?.trim()) {
    return inferPackingCategoryFromText(itemName);
  }
  return "core";
}

function enrichSubItemQuantity(sub: PackingSubItem, tripDays: number): PackingSubItem {
  const n = sub.name;
  if (!n.trim()) return sub;
  const lower = n.toLowerCase();
  const disposable =
    lower.includes("一次性") && (lower.includes("内裤") || lower.includes("内衣"));
  const underwearPack =
    (lower.includes("内裤") || lower.includes("内衣")) && !lower.includes("洗衣");
  const socks = lower.includes("袜") && !lower.includes("滑雪袜");
  if (disposable || (underwearPack && sub.quantity == null)) {
    const q = tripDays * 2;
    return {
      ...sub,
      quantity: sub.quantity ?? q,
      quantityNote: sub.quantityNote ?? `按 ${tripDays} 天约 ${q} 件`,
    };
  }
  if (socks && sub.quantity == null) {
    const q = Math.max(tripDays + 1, 2);
    return {
      ...sub,
      quantity: q,
      quantityNote: sub.quantityNote ?? `约 ${q} 双（${tripDays} 天）`,
    };
  }
  if ((n.includes("换洗衣物") || n.includes("外衣") || n.includes("睡衣")) && sub.quantity == null) {
    return {
      ...sub,
      quantity: tripDays,
      quantityNote: sub.quantityNote ?? `${tripDays} 套（按行程天数）`,
    };
  }
  return sub;
}

function normalizeSubItem(raw: unknown, tripDays: number): PackingSubItem {
  if (typeof raw === "string") {
    return enrichSubItemQuantity(
      { id: createId("pack-sub"), name: raw.trim() || "物品", checked: false },
      tripDays,
    );
  }
  if (!raw || typeof raw !== "object") {
    return { id: createId("pack-sub"), name: "物品", checked: false };
  }
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name : "物品";
  const id = typeof o.id === "string" ? o.id : createId("pack-sub");
  const quantity = typeof o.quantity === "number" ? o.quantity : undefined;
  const quantityNote = typeof o.quantityNote === "string" ? o.quantityNote : undefined;
  return enrichSubItemQuantity(
    {
      id,
      name,
      checked: Boolean(o.checked),
      quantity,
      quantityNote,
    },
    tripDays,
  );
}

/**
 * 将智谱 / 模型返回的装备 JSON 规范为前端结构，补全 id、分类与子项数量提示。
 */
export function normalizePackingListFromApi(raw: unknown[] | undefined, tripDays: number): PackingListItem[] {
  if (!raw?.length) return [];
  const days = tripDays > 0 ? tripDays : 1;

  return raw.map((entry, i) => {
    if (typeof entry === "string") {
      const label = entry.trim() || "物品";
      return {
        id: createId("packing"),
        name: label,
        category: inferPackingCategoryFromText(label),
        checked: false,
      };
    }
    if (!entry || typeof entry !== "object") {
      return {
        id: createId("packing"),
        name: "未命名分组",
        category: "core",
        checked: false,
      };
    }
    const o = entry as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : createId("packing");
    const name = typeof o.name === "string" ? o.name : "装备分组";
    let category = mapPackingCategory(o.category, name);
    const subItems = Array.isArray(o.subItems)
      ? o.subItems.map((s) => normalizeSubItem(s, days))
      : undefined;
    // 分组标题（如 👉衣裤篇）常为 core，按子项再收敛大类
    if (category === "core" && subItems?.length) {
      const first = subItems[0]?.name ?? "";
      const inferred = inferPackingCategoryFromText(first);
      if (inferred !== "core") {
        category = inferred;
      }
    }
    return {
      id,
      name,
      category,
      checked: Boolean(o.checked),
      weatherDependent: Boolean(o.weatherDependent),
      subItems: subItems?.length ? subItems : undefined,
    };
  });
}

export function generatePackingList({
  themes,
  tripDays,
  customTags,
  season,
}: {
  themes: ThemeKey[];
  tripDays: number;
  customTags?: string[];
  season?: "spring" | "summer" | "autumn" | "winter";
}): PackingListItem[] {
  const items: PackingListItem[] = [];

  // 1. 添加通用基础物品
  universalItems.forEach((item) => {
    items.push({ ...item, id: createId("packing") });
  });

  // 2. 根据旅行天数计算衣物数量
  const clothingItems = items.filter((item) => item.category === "clothing");
  clothingItems.forEach((item) => {
    if (item.name.includes("换洗") || item.name.includes("内衣") || item.name.includes("袜子")) {
      item.name = `${item.name.replace(/（.*）/, "")}（${tripDays}件）`;
    }
  });

  // 3. 根据主题添加特定装备
  themes.forEach((theme) => {
    const themeItems = themeSpecificItems[theme] || [];
    themeItems.forEach((item) => {
      // 避免重复添加
      if (!items.some((existing) => existing.name === item.name)) {
        items.push({ ...item, id: createId("packing") });
      }
    });
  });

  // 4. 根据自定义标签添加特殊装备
  const tagsLower = (customTags || []).map((tag) => tag.toLowerCase());

  if (tagsLower.some((tag) => tag.includes("滑雪") || tag.includes("ski"))) {
    activityItems.skiing.forEach((item) => {
      if (!items.some((existing) => existing.name === item.name)) {
        items.push({ ...item, id: createId("packing") });
      }
    });
  }

  if (tagsLower.some((tag) => tag.includes("跑步") || tag.includes("run") || tag.includes("马拉松"))) {
    activityItems.running.forEach((item) => {
      if (!items.some((existing) => existing.name === item.name)) {
        items.push({ ...item, id: createId("packing") });
      }
    });
  }

  if (tagsLower.some((tag) => tag.includes("游泳") || tag.includes("潜水") || tag.includes("水上"))) {
    activityItems.swimming.forEach((item) => {
      if (!items.some((existing) => existing.name === item.name)) {
        items.push({ ...item, id: createId("packing") });
      }
    });
  }

  if (tagsLower.some((tag) => tag.includes("徒步") || tag.includes("登山") || tag.includes("hike"))) {
    activityItems.hiking.forEach((item) => {
      if (!items.some((existing) => existing.name === item.name)) {
        items.push({ ...item, id: createId("packing") });
      }
    });
  }

  if (tagsLower.some((tag) => tag.includes("海滩") || tag.includes("海边") || tag.includes("beach"))) {
    activityItems.beach.forEach((item) => {
      if (!items.some((existing) => existing.name === item.name)) {
        items.push({ ...item, id: createId("packing") });
      }
    });
  }

  // 5. 根据季节添加天气相关物品
  if (season === "winter" || season === "autumn") {
    weatherItems.cold.forEach((item) => {
      if (!items.some((existing) => existing.name === item.name)) {
        items.push({ ...item, id: createId("packing"), weatherDependent: true });
      }
    });
  } else if (season === "summer") {
    weatherItems.hot.forEach((item) => {
      if (!items.some((existing) => existing.name === item.name)) {
        items.push({ ...item, id: createId("packing"), weatherDependent: true });
      }
    });
  }

  // 6. 按分类排序
  const categoryOrder: PackingCategory[] = [
    "core",
    "documents",
    "clothing",
    "electronics",
    "toiletries",
    "weather",
    "gear",
  ];
  items.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));

  return items;
}

export function getPackingCategoryLabel(category: PackingCategory): string {
  return categoryLabels[category] || category;
}

export function getPackingCategoryIcon(category: PackingCategory): string {
  const icons: Record<PackingCategory, string> = {
    core: "shield",
    clothing: "checkroom",
    electronics: "power",
    toiletries: "medication",
    documents: "badge",
    weather: "umbrella",
    gear: "downhill_skiing",
  };
  return icons[category] || "inventory_2";
}

/** 参考稿风格：大类标题区圆形图标的背景/文字色 */
export function getPackingCategoryCardTone(category: PackingCategory): {
  circle: string;
  icon: string;
} {
  const tones: Record<PackingCategory, { circle: string; icon: string }> = {
    core: {
      circle: "bg-primary-container",
      icon: "text-on-primary",
    },
    documents: {
      circle: "bg-primary-container",
      icon: "text-on-primary",
    },
    clothing: {
      circle: "bg-secondary-container",
      icon: "text-on-secondary-container",
    },
    electronics: {
      circle: "bg-tertiary-container",
      icon: "text-on-tertiary-container",
    },
    toiletries: {
      circle: "bg-surface-container-highest",
      icon: "text-on-surface",
    },
    weather: {
      circle: "bg-surface-container-high",
      icon: "text-on-surface",
    },
    gear: {
      circle: "bg-secondary-container",
      icon: "text-on-secondary-container",
    },
  };
  return tones[category] ?? tones.core;
}
