import type { PackingListItem, PackingCategory, ThemeKey } from "@/lib/types";
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
    { name: "滑雪服", category: "clothing" },
    { name: "滑雪镜", category: "clothing" },
    { name: "滑雪手套", category: "clothing" },
    { name: "护膝护腕", category: "clothing" },
    { name: "滑雪袜", category: "clothing" },
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
};

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
  const categoryOrder: PackingCategory[] = ["core", "documents", "clothing", "electronics", "toiletries", "weather"];
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
    documents: "description",
    weather: "umbrella",
  };
  return icons[category] || "inventory_2";
}
