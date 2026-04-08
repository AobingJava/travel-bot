const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY ?? "";
const AMAP_SECURITY_CODE = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE ?? "";

let loadPromise: Promise<void> | null = null;

export function getAmapKey() {
  return AMAP_KEY;
}

export function loadAmap(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const fail = (error: Error) => {
      loadPromise = null;
      reject(error);
    };

    if (typeof window === "undefined") {
      fail(new Error("AMap can only be loaded in the browser"));
      return;
    }

    if (window.AMap) {
      resolve();
      return;
    }

    // Set security config before loading script (required for JS API 2.0)
    if (AMAP_SECURITY_CODE) {
      window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
    }

    if (!AMAP_KEY) {
      fail(new Error("NEXT_PUBLIC_AMAP_KEY is not configured"));
      return;
    }

    const cbName = "_amap_init_" + Date.now();

    const cleanup = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[cbName];
      const el = document.getElementById("amap-script");
      if (el) el.remove();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[cbName] = () => {
      cleanup();
      if (window.AMap) {
        resolve();
      } else {
        fail(new Error("AMap global not found after script load"));
      }
    };

    const script = document.createElement("script");
    script.id = "amap-script";
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&callback=${cbName}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      fail(new Error("Failed to load Amap SDK script"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
