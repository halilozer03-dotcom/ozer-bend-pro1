import React, { useRef, useState, useCallback } from "react";

const GRID_MM = 5;
const MAJOR_GRID_MM = 50;
const VIEW_MM = 2400;
const ANGLE_STEP = 15;

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

export default function FreeDrawCanvas({ maxSegments, onCommit, onClose }) {
  const svgRef = useRef(null);
  const [points, setPoints] = useState([{ x: VIEW_MM / 2, y: VIEW_MM / 2 }]);
  const [drag, setDrag] = useState(null);
  const [angleSnap, setAngleSnap] = useState(true);

  const segmentCount = points.length - 1;
  const limitReached = segmentCount >= maxSegments;
  const lastPoint = points[points.length - 1];

  const computeSnappedTarget = useCallback(
    (rawX, rawY) => {
      let x = snap(rawX, GRID_MM);
      let y = snap(rawY, GRID_MM);
      if (angleSnap) {
        const dx = x - lastPoint.x;
        const dy = y - lastPoint.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
          const snappedAngle = Math.round(angleDeg / ANGLE_STEP) * ANGLE_STEP;
          const rad = (snappedAngle * Math.PI) / 180;
          x = snap(lastPoint.x + Math.cos(rad) * len, GRID_MM);
          y = snap(lastPoint.y + Math.sin(rad) * len, GRID_MM);
        }
      }
      return { x, y };
    },
    [lastPoint, angleSnap]
  );

  const handlePointerDown = (e) => {
    if (limitReached) return;
    e.target.setPointerCapture(e.pointerId);
    const p = toLocalPoint(svgRef.current, e.clientX, e.clientY);
    setDrag(computeSnappedTarget(p.x, p.y));
  };

  const handlePointerMove = (e) => {
    if (!drag) return;
    const p = toLocalPoint(svgRef.current, e.clientX, e.clientY);
    setDrag(computeSnappedTarget(p.x, p.y));
  };

  const handlePointerUp = () => {
    if (!drag) return;
    const dx = drag.x - lastPoint.x;
    const dy = drag.y - lastPoint.y;
    const len = Math.hypot(dx, dy);
    if (len >= GRID_MM) {
      setPoints((prev) => [...prev, drag]);
    }
    setDrag(null);
  };

  const undoLast = () => {
    setPoints((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const reset = () => {
    setPoints([{ x: VIEW_MM / 2, y: VIEW_MM / 2 }]);
    setDrag(null);
  };

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
  if (drag) {
    const dx = drag.x - lastPoint.x;
    const dy = drag.y - lastPoint.y;
    const len = Math.round(Math.hypot(dx, dy));
    const angleDeg = Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360);
    liveLabel = {
      x: (lastPoint.x + drag.x) / 2,
      y: (lastPoint.y + drag.y) / 2,
      text: `${len} mm  •  ${angleDeg}°`
    };
  }

  const gridLines = [];
  for (let g = 0; g <= VIEW_MM; g += MAJOR_GRID_MM) {
    gridLines.push(
      <line key={`v${g}`} x1={g} y1={0} x2={g} y2={VIEW_MM} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
    );
    gridLines.push(
      <line key={`h${g}`} x1={0} y1={g} x2={VIEW_MM} y2={g} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
    );
  }

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div style={{ position: "fixed", inset: 0, background: "#05070a", zIndex: 999, display: "flex", flexDirection: "column", touchAction: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", color: "#e8ecef", fontWeight: 700, fontSize: 18 }}>
        <span>Serbest Çizim ({segmentCount}/{maxSegments})</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#e8ecef", fontSize: 26 }}>✕</button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_MM} ${VIEW_MM}`}
        style={{ flex: 1, width: "100%", touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {gridLines}
        <path d={pathD} stroke="#c4cad2" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {drag && (
          <line x1={lastPoint.x} y1={lastPoint.y} x2={drag.x} y2={drag.y} stroke="#ffd35a" strokeWidth={6} strokeDasharray="14 8" />
        )}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={10} fill={i === 0 ? "#ffd35a" : "#c4cad2"} />
        ))}
        {liveLabel && (
          <g transform={`translate(${liveLabel.x}, ${liveLabel.y - 30})`}>
            <rect x={-90} y={-24} width={180} height={40} rx={10} fill="rgba(0,0,0,0.8)" />
            <text x={0} y={4} textAnchor="middle" fill="#ffd35a" fontSize={26} fontWeight={800}>{liveLabel.text}</text>
          </g>
        )}
      </svg>

      <div style={{ display: "flex", gap: 10, padding: 14, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setAngleSnap((v) => !v)}
          style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(207,213,218,.35)", background: angleSnap ? "#20262e" : "#12161c", color: "#eef1f3", fontWeight: 700 }}
        >
          {angleSnap ? "15° Açı Kilidi: Açık" : "15° Açı Kilidi: Kapalı"}
        </button>
        <button type="button" onClick={undoLast} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(207,213,218,.35)", background: "#1b2129", color: "#eef1f3", fontWeight: 700 }}>
          Geri Al
        </button>
        <button type="button" onClick={reset} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(207,213,218,.35)", background: "#1b2129", color: "#eef1f3", fontWeight: 700 }}>
          Sıfırla
        </button>
        <button
          type="button"
          onClick={finish}
          disabled={points.length < 2}
          style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #cfd5da", background: "#20262e", color: "#f4f6f7", fontWeight: 800, opacity: points.length < 2 ? 0.5 : 1 }}
        >
          Uygula ✓
        </button>
      </div>
    </div>
  );
}
