import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { renderToStaticMarkup } from "react-dom/server";
import { delayRender, continueRender } from "remotion";

/**
 * Renders a React SVG element to a THREE.CanvasTexture.
 * Use for bridging SVG characters into the 3D card pipeline.
 */
export function useSvgTexture(element: React.ReactElement, deps: unknown[] = [], w = 512, h = 768): THREE.CanvasTexture | null {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  const key = useMemo(() => JSON.stringify(deps), [deps]);

  useEffect(() => {
    const handle = delayRender("svg-texture");
    let cancelled = false;
    let current: THREE.CanvasTexture | null = null;
    const svg = renderToStaticMarkup(element);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      if (cancelled) { URL.revokeObjectURL(url); continueRender(handle); return; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      const scale = Math.min(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      current = t;
      setTex(t);
      URL.revokeObjectURL(url);
      continueRender(handle);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      continueRender(handle);
    };
    img.src = url;
    return () => {
      cancelled = true;
      if (current) current.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, w, h]);

  return tex;
}
