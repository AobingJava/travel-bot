import type { PackingListItem } from "@/lib/types";
import {
  buildMarathonHashtagLine,
  MARATHON_PACKING_INTRO,
  MARATHON_XHS_PS,
} from "@/lib/trip-marathon";

/** 供回忆页勾选：每条对应清单里的一行展示文案 */
export type SelectablePackingRow = {
  id: string;
  text: string;
};

function subLineLabel(sub: { name: string; quantity?: number; quantityNote?: string }): string {
  const name = sub.name.trim();
  const note = sub.quantityNote?.trim();
  if (note) return `${name}（${note}）`;
  if (sub.quantity != null && sub.quantity > 1) return `${name} ×${sub.quantity}`;
  return name;
}

/**
 * 将行程装备清单压平为可选行（分组+子项展平，字符串数组每项一行）
 */
export function tripPackingToSelectableRows(
  packingList: string[] | PackingListItem[] | undefined,
): SelectablePackingRow[] {
  if (!packingList?.length) return [];
  const rows: SelectablePackingRow[] = [];

  packingList.forEach((entry, i) => {
    if (typeof entry === "string") {
      const t = entry.trim();
      if (t) rows.push({ id: `str-${i}`, text: t });
      return;
    }
    const group = entry.name?.trim() || "装备";
    if (/^📌\s*赛前[·.]赛中贴士/u.test(group) || /可作小红书|正文附言/u.test(group)) {
      return;
    }
    const skipGroupPrefix =
      group === MARATHON_PACKING_INTRO ||
      /^【跑马行李清单】/u.test(group) ||
      /^📌\s*赛前[·.]赛中贴士/u.test(group);
    if (entry.subItems?.length) {
      entry.subItems.forEach((sub) => {
        const line = subLineLabel(sub);
        if (!line) return;
        rows.push({
          id: `${entry.id}::${sub.id}`,
          text: skipGroupPrefix ? line : `${group}：${line}`,
        });
      });
    } else if (group) {
      rows.push({ id: entry.id, text: group });
    }
  });

  return rows;
}

export type BuildXhsPlainTextParams = {
  marathonMode: boolean;
  destination: string;
  tripName: string;
  marathonTagContext?: string[];
  attractions: { name: string; description?: string; address?: string }[];
  packingLines: string[];
};

function stripRedundantPackingLine(line: string): string {
  if (line.startsWith(MARATHON_PACKING_INTRO)) {
    const rest = line.slice(MARATHON_PACKING_INTRO.length).replace(/^[：:]\s*/u, "").trim();
    return rest || line;
  }
  return line;
}

/** 组装小红书粘贴用的纯文本 */
export function buildXhsPlainText(params: BuildXhsPlainTextParams): string {
  const { marathonMode, destination, tripName, marathonTagContext, attractions, packingLines } = params;

  const parts: string[] = [];

  if (marathonMode) {
    parts.push("跑马行李清单");
    parts.push(buildMarathonHashtagLine(destination, marathonTagContext));
    parts.push("");
    parts.push(MARATHON_PACKING_INTRO);
  } else {
    parts.push(`#旅行攻略 #${tripName.replace(/\s+/g, "")} #打卡圣地`);
    parts.push("");
    parts.push(`📍 ${destination}`);
    parts.push("");
  }

  if (!marathonMode && attractions.length > 0) {
    parts.push("【打卡地点】");
    attractions.forEach((a) => {
      parts.push(`· ${a.name}`);
      const detail = [a.description, a.address].filter(Boolean).join("｜");
      if (detail) parts.push(`  ${detail}`);
    });
    parts.push("");
  }

  if (packingLines.length > 0) {
    if (!marathonMode) {
      parts.push("【装备清单】");
    }
    packingLines.forEach((line) => {
      const clean = stripRedundantPackingLine(line);
      parts.push(marathonMode ? `- [ ] ${clean}` : `- ${clean}`);
    });
    parts.push("");
  }

  if (marathonMode && attractions.length > 0) {
    parts.push("【地点备忘】");
    attractions.forEach((a) => {
      parts.push(`· ${a.name}`);
      const detail = [a.description, a.address].filter(Boolean).join("｜");
      if (detail) parts.push(`  ${detail}`);
    });
    parts.push("");
  }

  if (marathonMode) {
    parts.push(MARATHON_XHS_PS);
  } else if (attractions[0]?.name) {
    parts.push(`这次在 ${destination}，${attractions.map((a) => a.name).join("、")} 都超值得记录～分享给大家！`);
  }

  return parts.join("\n").trim();
}
