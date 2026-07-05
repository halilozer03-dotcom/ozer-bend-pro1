// patch_free_draw_layout_fix.cjs
// 1) freedraw.jsx layout'unu saglamlastirir: header/svg/toolbar artik absolute
//    konumlandirma ile kesin yerlerde - flex belirsizligi kalmiyor.
// 2) Alt toolbar'a telefonun gezinme cubuguyla cakismamasi icin
//    safe-area-inset-bottom boslugu eklenir.
// 3) main.jsx'teki "Serbest Cizim" ana menu butonunun stilini diger
//    butonlarla ayni (duz koyu) tasarima getirir.

const fs = require("fs");
const path = require("path");

const MAIN_JSX = path.join(process.cwd(), "src", "main.jsx");
const FREEDRAW_JSX = path.join(process.cwd(), "src", "freedraw.jsx");

function replaceOnce(filePath, oldStr, newStr, label) {
  let content = fs.readFileSync(filePath, "utf8");
  const count = content.split(oldStr).length - 1;
  if (count === 0) {
    throw new Error(`[HATA] Eslesme bulunamadi: ${label}`);
  }
  if (count > 1) {
    throw new Error(`[HATA] Birden fazla eslesme bulundu (${count}): ${label}`);
  }
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`[OK] ${label}`);
}

/* ---------------------------------------------------------------------
   1) freedraw.jsx: tamamen yeniden yaz (absolute layout)
--------------------------------------------------------------------- */

const FREEDRAW_CONTENT = `import React, { useRef, useState, useCallback } from "react";

const GRID_MM = 5;
const ANGLE_STEP = 15;
const MIN_VIEW = 60;
const MAX_VIEW = 4000;
const HEADER_H = 56;

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
  const [points, setPoints] = useState([]);
  const [history, setHistory] = useState([]);
  const [drag, setDrag] = useState(null);
  const [extendMode, setExtendMode] = useState("end");
  const [angleSnap, setAngleSnap] = useState(true);
  const [viewSize, setViewSize] = useState(300);

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

  const handlePointerDown = (e) => {
    if (limitReached) return;
    e.target.setPointerCapture(e.pointerId);
    const p = toLocalPoint(svgRef.current, e.clientX, e.clientY);
    const downX = snap(p.x, GRID_MM);
    const downY = snap(p.y, GRID_MM);

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

  const handlePointerMove = (e) => {
    if (!drag || !anchorPoint) return;
    const p = toLocalPoint(svgRef.current, e.clientX, e.clientY);
    setDrag(computeSnappedTarget(p.x, p.y, anchorPoint));
  };

  const handlePointerUp = () => {
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

  let liveLabel = null;
  if (drag && anchorPoint) {
    const dx = drag.x - anchorPoint.x;
    const dy = drag.y - anchorPoint.y;
    const len = Math.round(Math.hypot(dx, dy));
    const angleDeg = Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360);
    liveLabel = {
      x: (anchorPoint.x + drag.x) / 2,
      y: (anchorPoint.y + drag.y) / 2,
      text: \`\${len} mm  •  \${angleDeg}°\`
    };
  }

  const half = viewSize / 2;
  const vbX = -half;
  const vbY = -half;
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
      {/* Ust bar - kesin yukseklikte, her zaman en ustte */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: HEADER_H,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 16px", color: "#e8ecef", fontWeight: 700, fontSize: 17,
        background: "#05070a", zIndex: 3, borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        <span>Serbest Çizim ({segmentCount}/{maxSegments})</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#e8ecef", fontSize: 24 }}>✕</button>
      </div>

      {/* Cizim alani - basliktan itibaren ekranin geri kalanini tamamen doldurur */}
      <div style={{ position: "absolute", top: HEADER_H, left: 0, right: 0, bottom: 0 }}>
        {points.length === 0 && (
          <div style={{ position: "absolute", top: 10, left: 0, right: 0, textAlign: "center", color: "#9aa3ab", fontSize: 14, padding: "0 20px", zIndex: 2, pointerEvents: "none" }}>
            Ekrana dokunup sürükleyerek ilk çizgiyi çiz.
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox={\`\${vbX} \${vbY} \${viewSize} \${viewSize}\`}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
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
            <g transform={\`translate(\${liveLabel.x}, \${liveLabel.y - dotR * 3})\`}>
              <rect x={-viewSize * 0.16} y={-viewSize * 0.045} width={viewSize * 0.32} height={viewSize * 0.09} rx={viewSize * 0.02} fill="rgba(0,0,0,0.8)" />
              <text x={0} y={viewSize * 0.012} textAnchor="middle" fill="#ffd35a" fontSize={viewSize * 0.05} fontWeight={800}>{liveLabel.text}</text>
            </g>
          )}
        </svg>
      </div>

      {/* Alt toolbar - EKRANIN EN ALTINDA, telefonun gezinme cubugu icin guvenli bosluk birakilir */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 3,
        display: "flex", gap: 8, flexWrap: "wrap",
        padding: "10px 10px calc(10px + env(safe-area-inset-bottom, 12px))",
        background: "linear-gradient(180deg, rgba(5,7,10,0) 0%, #05070a 40%)"
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
console.log("[OK] src/freedraw.jsx yeniden yazildi (absolute layout, guvenli alan boslugu)");

/* ---------------------------------------------------------------------
   2) main.jsx: "Serbest Cizim" ana menu butonunun stilini duzelt
--------------------------------------------------------------------- */

replaceOnce(
  MAIN_JSX,
  `        <button
          type="button"
          onClick={() => setFreeDrawOpen(true)}
          style={{ width: "100%", marginTop: 10 }}
        >
          Serbest Çizim
        </button>`,
  `        <button
          type="button"
          onClick={() => setFreeDrawOpen(true)}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "14px 18px",
            borderRadius: 12,
            border: "1px solid rgba(207,213,218,.35)",
            background: "#1b2129",
            color: "#eef1f3",
            fontWeight: 700,
            fontSize: 16
          }}
        >
          Serbest Çizim
        </button>`,
  "Serbest Cizim ana menu butonu stili duzeltildi (diger butonlarla ayni)"
);

console.log("\n✅ YERLESIM VE STIL DUZELTMESI BASARIYLA UYGULANDI.");
console.log("Simdi: git add -A && git commit -m \"Serbest Cizim: yerlesim ve buton stili duzeltmesi\" && git push -u origin main");
