const STORAGE_KEY_PREFIX = "travel-bot:xhs-trip-map-cover:";

export function getTripMapCoverDataUrl(tripId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY_PREFIX + tripId);
  } catch {
    return null;
  }
}

/** 保存最近一次从行程/旅伴地图导出的封面，供「生成回忆」卡片优先使用 */
export function setTripMapCoverDataUrl(tripId: string, dataUrl: string): void {
  if (typeof window === "undefined" || !tripId) return;
  try {
    if (dataUrl.length > 4_500_000) return;
    localStorage.setItem(STORAGE_KEY_PREFIX + tripId, dataUrl);
  } catch {
    // quota or private mode
  }
}

export async function exportAmapCoverAndShare(options: {
  map: unknown;
  tripId?: string;
  downloadBaseName: string;
  shareTitle: string;
  shareText?: string;
}): Promise<void> {
  const { map, tripId, downloadBaseName, shareTitle, shareText = "可分享到小红书作封面或笔记配图" } =
    options;

  const { Screenshot } = await import("@amap/screenshot");
  const screenshot = new Screenshot(map);
  const dataUrl = await screenshot.toDataURL("image/png");

  if (tripId) {
    setTripMapCoverDataUrl(tripId, dataUrl);
  }

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], `${downloadBaseName}.png`, { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: shareTitle,
        text: shareText,
      });
    } catch {
      triggerDownload(dataUrl, downloadBaseName);
    }
  } else {
    triggerDownload(dataUrl, downloadBaseName);
  }
}

function triggerDownload(dataUrl: string, downloadBaseName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${downloadBaseName}.png`;
  link.click();
}
