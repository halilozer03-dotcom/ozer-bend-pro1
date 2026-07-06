// patch_free_draw_v4.cjs
// 1) package.json'a @capacitor/screen-orientation eklenir (workflow her
//    derlemede "cap add android" + "cap sync android" calistirdigi icin
//    native tarafi elle duzenlemeye gerek yok).
// 2) freedraw.jsx: acilinca yatay moda kilitler, kapaninca serbest birakir.
// 3) Iki parmakla pinch-zoom eklenir (tek parmak = cizim, iki parmak = zoom).
// 4) Ust bar kaldirilir, sadece kucuk yuzen bir rozet (segment sayaci) ve
//    yuzen kapat (X) butonu kalir - butonlar disinda TUM ekran cizim sahasi.
// 5) Canli olcum etiketi artik ekran/viewBox sinirlarinin icinde kalacak
//    sekilde konum kirpma (clamp) yapiliyor - disari tasmiyor.

const fs = require("fs");
const path = require("path");

const PACKAGE_JSON = path.join(process.cwd(), "package.json");
const FREEDRAW_JSX = path.join(process.cwd(), "src", "freedraw.jsx");

/* ---------------------------------------------------------------------
   1) package.json: yeni bagimlilik ekle
--------------------------------------------------------------------- */

const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
if (!pkg.dependencies) pkg.dependencies = {};
if (!pkg.dependencies["@capacitor/screen-orientation"]) {
  pkg.dependencies["@capacitor/screen-orientation"] = "^7.0.0";
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  console.log("[OK] @capacitor/screen-orientation package.json'a eklendi");
} else {
  console.log("[BILGI] @capacitor/screen-orientation zaten package.json'da vardi");
}

/* ---------------------------------------------------------------------
   2) freedraw.jsx: tamamen yeniden yaz
--------------------------------------------------------------------- */

const FREEDRAW_CONTENT = `import React, { useRef, useState, useCallback, useEffect } from "react";

const GRID_MM = 5;
const ANGLE_STEP = 15;
const MIN_VIEW = 60;
const MAX_VIEW = 4000;

function snap(v, step) {
  return Math.round(v / step) * step;
}

function toLocalPoint(svgEl, clientX, clientY) {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const local = pt.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}

function gridStepFor(viewSize) {
  if (viewSize <= 150) return 10;
  if (viewSize <= 400) return 25;
  if (viewSize <= 900) return 50;
  if (viewSize <= 2000) return 100;
  return 250;
}

const btnStyle = (extra) => ({
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(207,213,218,.35)",
  background: "#1b2129",
  color: "#eef1f3",
  fontWeight: 700,
  fontSize: 14,
  whiteSpace: "nowrap",
  ...extra
});

export default function FreeDrawCanvas({ maxSegments, onCommit, onClose }) {
  const svgRef = useRef(null);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);

  const [points, setPoints] = useState([]);
  const [history, setHistory] = useState([]);
  const [drag, setDrag] = useState(null);
  const [extendMode, setExtendMode] = useState("end");
  const [angleSnap, setAngleSnap] = useState(true);
  const [viewSize, setViewSize] = useState(300);

  // Ekran acilinca yatay moda kilitle, kapaninca serbest birak.
  useEffect(() => {
    let ScreenOrientation;
    import("@capacitor/screen-orientation")
      .then((mod) => {
        ScreenOrientation = mod.ScreenOrientation;
        return ScreenOrientation.lock({ orientation: "landscape" });
      })
      .catch(() => {});
    return () => {
      if (ScreenOrientation) {
        ScreenOrientation.unlock().catch(() => {});
      }
    };
  }, []);

  const segmentCount = Math.max(0, points.length - 1);
  const limitReached = segmentCount >= maxSegments;

  const anchorPoint =
    points.length === 0
      ? null
      : extendMode === "start"
      ? points[0]
      : points[points.length - 1];

  const computeSnappedTarget = useCallback(
    (rawX, rawY, anchor) => {
      let x = snap(rawX, GRID_MM);
      let y = snap(rawY, GRID_MM);
      if (angleSnap && anchor) {
        const dx = x - anchor.x;
        const dy = y - anchor.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
          const snappedAngle = Math.round(angleDeg / ANGLE_STEP) * ANGLE_STEP;
          const rad = (snappedAngle * Math.PI) / 180;
          x = snap(anchor.x + Math.cos(rad) * len, GRID_MM);
          y = snap(anchor.y + Math.sin(rad) * len, GRID_MM);
        }
      }
      return { x, y };
    },
    [angleSnap]
  );

  const startDrawAt = (downX, downY) => {
    if (points.length === 0) {
      setHistory((h) => [...h, points]);
      setPoints([{ x: downX, y: downY }]);
      setExtendMode("end");
      setDrag({ x: downX, y: downY });
      return;
    }
    if (points.length === 1) {
      setExtendMode("end");
      setDrag(computeSnappedTarget(downX, downY, points[0]));
      return;
    }
    const first = points[0];
    const last = points[points.length - 1];
    const dFirst = Math.hypot(downX - first.x, downY - first.y);
    const dLast = Math.hypot(downX - last.x, downY - last.y);
    const mode = dFirst <= dLast ? "start" : "end";
    setExtendMode(mode);
    const anchor = mode === "start" ? first : last;
    setDrag(computeSnappedTarget(downX, downY, anchor));
  };

  const handlePointerDown = (e) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.target.setPointerCapture(e.pointerId);

    if (pointersRef.current.size === 2) {
      // Iki parmak: cizimi iptal et, pinch-zoom moduna gec.
      setDrag(null);
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current = { startDist: dist || 1, startView: viewSize };
      return;
    }
    if (pointersRef.current.size > 2) return;

    if (limitReached) return;
    const p = toLocalPoint(svgRef.current, e.clientX, e.clientY);
    startDrawAt(snap(p.x, GRID_MM), snap(p.y, GRID_MM));
  };

  const handlePointerMove = (e) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const scale = pinchRef.current.startDist / dist;
      const next = Math.round(pinchRef.current.startView * scale);
      setViewSize(Math.min(MAX_VIEW, Math.max(MIN_VIEW, next)));
      return;
    }

    if (!drag || !anchorPoint) return;
    const p = toLocalPoint(svgRef.current, e.clientX, e.clientY);
    setDrag(computeSnappedTarget(p.x, p.y, anchorPoint));
  };

  const endPointer = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      commitDrag();
    }
  };

  const commitDrag = () => {
    if (!drag || !anchorPoint) {
      setDrag(null);
      return;
    }
    const dx = drag.x - anchorPoint.x;
    const dy = drag.y - anchorPoint.y;
    const len = Math.hypot(dx, dy);
    if (len >= GRID_MM) {
      setHistory((h) => [...h, points]);
      setPoints((prev) => {
        if (prev.length === 1) return [prev[0], drag];
        return extendMode === "start" ? [drag, ...prev] : [...prev, drag];
      });
    }
    setDrag(null);
  };

  const undoLast = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prevState = h[h.length - 1];
      setPoints(prevState);
      return h.slice(0, -1);
    });
  };

  const reset = () => {
    setHistory([]);
    setPoints([]);
    setDrag(null);
  };

  const zoomIn = () => setViewSize((v) => Math.max(MIN_VIEW, Math.round(v / 1.4)));
  const zoomOut = () => setViewSize((v) => Math.min(MAX_VIEW, Math.round(v * 1.4)));

  const finish = () => {
    if (points.length < 2) return;
    const segs = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      segs.push({ length: Math.round(Math.hypot(dx, dy)), dx, dy });
    }
    const finalSegments = segs.map((s, i) => {
      if (i === segs.length - 1) return { length: s.length };
      const next = segs[i + 1];
      const a1 = Math.atan2(s.dy, s.dx);
      const a2 = Math.atan2(next.dy, next.dx);
      let diff = ((a2 - a1) * 180) / Math.PI;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      const dir = diff >= 0 ? 1 : -1;
      const angle = Math.round(Math.abs(diff));
      return { length: s.length, angle, dir };
    });
    onCommit(finalSegments);
  };

  const half = viewSize / 2;
  const vbX = -half;
  const vbY = -half;

  let liveLabel = null;
  if (drag && anchorPoint) {
    const dx = drag.x - anchorPoint.x;
    const dy = drag.y - anchorPoint.y;
    const len = Math.round(Math.hypot(dx, dy));
    const angleDeg = Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360);
    const labelW = viewSize * 0.32;
    const labelH = viewSize * 0.09;
    let lx = (anchorPoint.x + drag.x) / 2;
    let ly = (anchorPoint.y + drag.y) / 2 - viewSize * 0.06;
    // Etiket viewBox sinirlarinin disina tasmasin diye kirp.
    const minX = vbX + labelW / 2 + 4;
    const maxX = vbX + viewSize - labelW / 2 - 4;
    const minY = vbY + labelH / 2 + 4;
    const maxY = vbY + viewSize - labelH / 2 - 4;
    lx = Math.min(maxX, Math.max(minX, lx));
    ly = Math.min(maxY, Math.max(minY, ly));
    liveLabel = { x: lx, y: ly, w: labelW, h: labelH, text: \`\${len} mm  •  \${angleDeg}°\` };
  }

  const gridStep = gridStepFor(viewSize);
  const gridLines = [];
  for (let g = Math.floor(vbX / gridStep) * gridStep; g <= half; g += gridStep) {
    gridLines.push(
      <line key={\`v\${g}\`} x1={g} y1={vbY} x2={g} y2={half} stroke="rgba(255,255,255,0.10)" strokeWidth={viewSize / 300} />
    );
    gridLines.push(
      <line key={\`h\${g}\`} x1={vbX} y1={g} x2={half} y2={g} stroke="rgba(255,255,255,0.10)" strokeWidth={viewSize / 300} />
    );
  }

  const pathD =
    points.length > 0
      ? points.map((p, i) => \`\${i === 0 ? "M" : "L"} \${p.x} \${p.y}\`).join(" ")
      : "";

  const strokeW = Math.max(1, viewSize / 60);
  const dotR = Math.max(2, viewSize / 40);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#05070a", zIndex: 999 }}>
      {/* Cizim alani - butonlar disinda TUM ekran */}
      <svg
        ref={svgRef}
        viewBox={\`\${vbX} \${vbY} \${viewSize} \${viewSize}\`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        {gridLines}
        <line x1={vbX} y1={0} x2={half} y2={0} stroke="rgba(255,255,255,0.18)" strokeWidth={viewSize / 250} />
        <line x1={0} y1={vbY} x2={0} y2={half} stroke="rgba(255,255,255,0.18)" strokeWidth={viewSize / 250} />
        {pathD && <path d={pathD} stroke="#c4cad2" strokeWidth={strokeW} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {drag && anchorPoint && (
          <line x1={anchorPoint.x} y1={anchorPoint.y} x2={drag.x} y2={drag.y} stroke="#ffd35a" strokeWidth={strokeW} strokeDasharray={\`\${strokeW * 2.4} \${strokeW * 1.6}\`} />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={dotR} fill={i === 0 ? "#ffd35a" : "#c4cad2"} />
        ))}
        {liveLabel && (
          <g transform={\`translate(\${liveLabel.x}, \${liveLabel.y})\`}>
            <rect x={-liveLabel.w / 2} y={-liveLabel.h / 2} width={liveLabel.w} height={liveLabel.h} rx={viewSize * 0.02} fill="rgba(0,0,0,0.82)" />
            <text x={0} y={viewSize * 0.012} textAnchor="middle" fill="#ffd35a" fontSize={viewSize * 0.05} fontWeight={800}>{liveLabel.text}</text>
          </g>
        )}
      </svg>

      {/* Yuzen rozet: segment sayaci */}
      <div style={{
        position: "absolute", top: 10, left: 10, zIndex: 3,
        background: "rgba(5,7,10,0.75)", color: "#e8ecef", fontWeight: 700, fontSize: 13,
        padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)",
        pointerEvents: "none"
      }}>
        Serbest Çizim {segmentCount}/{maxSegments}
      </div>

      {/* Yuzen kapat butonu */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 6, right: 6, zIndex: 3,
          width: 40, height: 40, borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(5,7,10,0.75)", color: "#e8ecef", fontSize: 18
        }}
      >✕</button>

      {points.length === 0 && (
        <div style={{ position: "absolute", top: 56, left: 0, right: 0, textAlign: "center", color: "#9aa3ab", fontSize: 14, padding: "0 20px", zIndex: 2, pointerEvents: "none" }}>
          Ekrana dokunup sürükleyerek ilk çizgiyi çiz. İki parmakla yakınlaştır/uzaklaştır.
        </div>
      )}

      {/* Alt toolbar - guvenli alan boslugu ile */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 3,
        display: "flex", gap: 8, flexWrap: "wrap",
        padding: "10px 10px calc(10px + env(safe-area-inset-bottom, 12px))",
        background: "linear-gradient(180deg, rgba(5,7,10,0) 0%, #05070a 45%)"
      }}>
        <button type="button" onClick={zoomOut} style={btnStyle()}>− Uzaklaştır</button>
        <button type="button" onClick={zoomIn} style={btnStyle()}>+ Yakınlaştır</button>
        <button type="button" onClick={() => setAngleSnap((v) => !v)} style={btnStyle({ background: angleSnap ? "#20262e" : "#12161c" })}>
          {angleSnap ? "15° Açı: Açık" : "15° Açı: Kapalı"}
        </button>
        <button type="button" onClick={undoLast} disabled={history.length === 0} style={btnStyle({ opacity: history.length === 0 ? 0.5 : 1 })}>Geri Al</button>
        <button type="button" onClick={reset} style={btnStyle()}>Sıfırla</button>
        <button
          type="button"
          onClick={finish}
          disabled={points.length < 2}
          style={btnStyle({ border: "1px solid #cfd5da", background: "#20262e", color: "#f4f6f7", fontWeight: 800, opacity: points.length < 2 ? 0.5 : 1 })}
        >
          Uygula ✓
        </button>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(FREEDRAW_JSX, FREEDRAW_CONTENT, "utf8");
console.log("[OK] src/freedraw.jsx guncellendi (v4 - yatay mod, pinch-zoom, tam ekran, sinir-ici etiket)");

console.log("\n✅ SERBEST CIZIM V4 BASARIYLA UYGULANDI.");
console.log("Simdi: git add -A && git commit -m \"Serbest Cizim v4: yatay mod + pinch-zoom + tam ekran + sinirli etiket\" && git push -u origin main");
