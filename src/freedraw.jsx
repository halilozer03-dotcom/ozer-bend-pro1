import React, { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Line, Circle, Text, Rect, Group } from "react-konva";

const GRID_MM = 5;
const ANGLE_STEP = 15;
const MIN_SCALE = 0.15;
const MAX_SCALE = 20;
const GRID_RANGE = 4000;

function snap(v, step) {
  return Math.round(v / step) * step;
}

function gridStepForScale(scale, screenPx) {
  const approxSpan = screenPx / scale;
  if (approxSpan <= 150) return 10;
  if (approxSpan <= 400) return 25;
  if (approxSpan <= 900) return 50;
  if (approxSpan <= 2000) return 100;
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

const FD_DICT = {
  tr: { title: "Serbest Çizim", draw: "Çiz", edit: "Düzenle", drawMode: "Çiz Modu", editMode: "Düzenle Modu", zoomOut: "Uzaklaştır", zoomIn: "Yakınlaştır", angleOn: "15° Açı: Açık", angleOff: "15° Açı: Kapalı", undo: "Geri Al", reset: "Sıfırla", apply: "Uygula", hint: "Ekrana dokunup sürükleyerek ilk çizgiyi çiz. İki parmakla yakınlaştır/uzaklaştır." },
  en: { title: "Free Draw", draw: "Draw", edit: "Edit", drawMode: "Draw Mode", editMode: "Edit Mode", zoomOut: "Zoom Out", zoomIn: "Zoom In", angleOn: "15° Angle: On", angleOff: "15° Angle: Off", undo: "Undo", reset: "Reset", apply: "Apply", hint: "Touch and drag to draw the first line. Pinch with two fingers to zoom." },
  fr: { title: "Dessin libre", draw: "Dessiner", edit: "Modifier", drawMode: "Mode dessin", editMode: "Mode édition", zoomOut: "Réduire", zoomIn: "Agrandir", angleOn: "Angle 15° : Activé", angleOff: "Angle 15° : Désactivé", undo: "Annuler", reset: "Réinitialiser", apply: "Appliquer", hint: "Touchez et faites glisser pour tracer la première ligne. Pincez avec deux doigts pour zoomer." },
  de: { title: "Freies Zeichnen", draw: "Zeichnen", edit: "Bearbeiten", drawMode: "Zeichenmodus", editMode: "Bearbeitungsmodus", zoomOut: "Verkleinern", zoomIn: "Vergrößern", angleOn: "15°-Winkel: Ein", angleOff: "15°-Winkel: Aus", undo: "Rückgängig", reset: "Zurücksetzen", apply: "Anwenden", hint: "Zum Zeichnen der ersten Linie tippen und ziehen. Mit zwei Fingern zoomen." },
  es: { title: "Dibujo libre", draw: "Dibujar", edit: "Editar", drawMode: "Modo dibujo", editMode: "Modo edición", zoomOut: "Alejar", zoomIn: "Acercar", angleOn: "Ángulo 15°: Activado", angleOff: "Ángulo 15°: Desactivado", undo: "Deshacer", reset: "Restablecer", apply: "Aplicar", hint: "Toca y arrastra para dibujar la primera línea. Pellizca con dos dedos para hacer zoom." },
  it: { title: "Disegno libero", draw: "Disegna", edit: "Modifica", drawMode: "Modalità disegno", editMode: "Modalità modifica", zoomOut: "Riduci", zoomIn: "Ingrandisci", angleOn: "Angolo 15°: Attivo", angleOff: "Angolo 15°: Disattivo", undo: "Annulla", reset: "Reimposta", apply: "Applica", hint: "Tocca e trascina per disegnare la prima linea. Pizzica con due dita per lo zoom." },
  ru: { title: "Свободное рисование", draw: "Рисование", edit: "Правка", drawMode: "Режим рисования", editMode: "Режим правки", zoomOut: "Отдалить", zoomIn: "Приблизить", angleOn: "Угол 15°: Вкл", angleOff: "Угол 15°: Выкл", undo: "Отменить", reset: "Сброс", apply: "Применить", hint: "Коснитесь и проведите, чтобы нарисовать первую линию. Масштаб — двумя пальцами." },
  pt: { title: "Desenho livre", draw: "Desenhar", edit: "Editar", drawMode: "Modo desenho", editMode: "Modo edição", zoomOut: "Afastar", zoomIn: "Aproximar", angleOn: "Ângulo 15°: Ativado", angleOff: "Ângulo 15°: Desativado", undo: "Desfazer", reset: "Redefinir", apply: "Aplicar", hint: "Toque e arraste para desenhar a primeira linha. Belisque com dois dedos para ampliar." },
  pl: { title: "Rysowanie odręczne", draw: "Rysuj", edit: "Edytuj", drawMode: "Tryb rysowania", editMode: "Tryb edycji", zoomOut: "Oddal", zoomIn: "Przybliż", angleOn: "Kąt 15°: Wł.", angleOff: "Kąt 15°: Wył.", undo: "Cofnij", reset: "Resetuj", apply: "Zastosuj", hint: "Dotknij i przeciągnij, aby narysować pierwszą linię. Powiększaj dwoma palcami." },
  zh: { title: "自由绘图", draw: "绘制", edit: "编辑", drawMode: "绘制模式", editMode: "编辑模式", zoomOut: "缩小", zoomIn: "放大", angleOn: "15°角度：开", angleOff: "15°角度：关", undo: "撤销", reset: "重置", apply: "应用", hint: "触摸并拖动以绘制第一条线。双指缩放。" },
  ar: { title: "رسم حر", draw: "رسم", edit: "تعديل", drawMode: "وضع الرسم", editMode: "وضع التعديل", zoomOut: "تصغير", zoomIn: "تكبير", angleOn: "زاوية 15°: مفعّل", angleOff: "زاوية 15°: معطّل", undo: "تراجع", reset: "إعادة تعيين", apply: "تطبيق", hint: "المس واسحب لرسم الخط الأول. قرّب بإصبعين للتكبير." }
};

export default function FreeDrawCanvas({ maxSegments, onCommit, onClose, lang }) {
  const T = FD_DICT[lang] || FD_DICT.en;
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const pinchRef = useRef(null);

  const [size, setSize] = useState({ w: 320, h: 480 });
  const [scale, setScale] = useState(3);
  const [points, setPoints] = useState([]);
  const [history, setHistory] = useState([]);
  const [drag, setDrag] = useState(null);
  const [extendMode, setExtendMode] = useState("end");
  const [angleSnap, setAngleSnap] = useState(true);
  const [mode, setMode] = useState("draw");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth || 320, h: el.clientHeight || 480 });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("orientationchange", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", update);
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

  const pushHistory = () => setHistory((h) => [...h, points]);

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

  const worldFromStagePointer = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return {
      x: (pos.x - stage.x()) / scale,
      y: (pos.y - stage.y()) / scale
    };
  };

  const startDrawAt = (downX, downY) => {
    if (points.length === 0) {
      pushHistory();
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
    const modeSide = dFirst <= dLast ? "start" : "end";
    setExtendMode(modeSide);
    const anchor = modeSide === "start" ? first : last;
    setDrag(computeSnappedTarget(downX, downY, anchor));
  };

  const handleStageMouseDown = () => {
    if (mode !== "draw" || limitReached) return;
    const p = worldFromStagePointer();
    startDrawAt(snap(p.x, GRID_MM), snap(p.y, GRID_MM));
  };

  const handleStageMouseMove = () => {
    if (mode !== "draw" || !drag || !anchorPoint) return;
    const p = worldFromStagePointer();
    setDrag(computeSnappedTarget(p.x, p.y, anchorPoint));
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
      pushHistory();
      setPoints((prev) => {
        if (prev.length === 1) return [prev[0], drag];
        return extendMode === "start" ? [drag, ...prev] : [...prev, drag];
      });
    }
    setDrag(null);
  };

  const handleStageMouseUp = () => {
    if (mode !== "draw") return;
    commitDrag();
  };

  const handleTouchStart = (e) => {
    const touches = e.evt.touches;
    if (touches && touches.length === 2) {
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      pinchRef.current = { startDist: dist || 1, startScale: scale };
    }
  };
  const handleTouchMove = (e) => {
    const touches = e.evt.touches;
    if (touches && touches.length === 2 && pinchRef.current) {
      e.evt.preventDefault();
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      ) || 1;
      const factor = dist / pinchRef.current.startDist;
      const next = pinchRef.current.startScale * factor;
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)));
    }
  };
  const handleTouchEnd = (e) => {
    if (!e.evt.touches || e.evt.touches.length < 2) {
      pinchRef.current = null;
    }
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

  const zoomIn = () => setScale((v) => Math.min(MAX_SCALE, v * 1.4));
  const zoomOut = () => setScale((v) => Math.max(MIN_SCALE, v / 1.4));

  const moveVertex = (index, nx, ny) => {
    pushHistory();
    setPoints((prev) => {
      const next = [...prev];
      next[index] = { x: snap(nx, GRID_MM), y: snap(ny, GRID_MM) };
      return next;
    });
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
      const dir = diff >= 0 ? -1 : 1;
      const angle = Math.round(Math.abs(diff));
      return { length: s.length, angle, dir };
    });
    onCommit(finalSegments);
  };

  const stageX = size.w / 2;
  const stageY = size.h / 2;

  const gridStep = gridStepForScale(scale, Math.max(size.w, size.h));
  const gridLines = [];
  for (let g = -GRID_RANGE; g <= GRID_RANGE; g += gridStep) {
    gridLines.push(
      <Line key={`v${g}`} points={[g, -GRID_RANGE, g, GRID_RANGE]} stroke="rgba(255,255,255,0.10)" strokeWidth={1 / scale} />
    );
    gridLines.push(
      <Line key={`h${g}`} points={[-GRID_RANGE, g, GRID_RANGE, g]} stroke="rgba(255,255,255,0.10)" strokeWidth={1 / scale} />
    );
  }

  const flatPoints = [];
  points.forEach((p) => {
    flatPoints.push(p.x, p.y);
  });

  let liveLabel = null;
  if (drag && anchorPoint) {
    const dx = drag.x - anchorPoint.x;
    const dy = drag.y - anchorPoint.y;
    const len = Math.round(Math.hypot(dx, dy));
    const angleDeg = Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360);
    const lx = (anchorPoint.x + drag.x) / 2;
    const ly = (anchorPoint.y + drag.y) / 2 - 18 / scale;
    liveLabel = { x: lx, y: ly, text: `${len} mm  •  ${angleDeg}°` };
  }

  const strokeW = Math.max(0.6, 3 / scale);
  const dotR = Math.max(1.2, 5 / scale);

  return (
    <div ref={wrapRef} style={{ position: "fixed", inset: 0, background: "#05070a", zIndex: 999 }}>
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        x={stageX}
        y={stageY}
        scaleX={scale}
        scaleY={scale}
        style={{ touchAction: "none" }}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Layer>
          {gridLines}
          <Line points={[-GRID_RANGE, 0, GRID_RANGE, 0]} stroke="rgba(255,255,255,0.18)" strokeWidth={1.4 / scale} />
          <Line points={[0, -GRID_RANGE, 0, GRID_RANGE]} stroke="rgba(255,255,255,0.18)" strokeWidth={1.4 / scale} />

          {flatPoints.length >= 4 && (
            <Line points={flatPoints} stroke="#c4cad2" strokeWidth={strokeW} lineCap="round" lineJoin="round" />
          )}

          {drag && anchorPoint && (
            <Line
              points={[anchorPoint.x, anchorPoint.y, drag.x, drag.y]}
              stroke="#ffd35a"
              strokeWidth={strokeW}
              dash={[strokeW * 2.4, strokeW * 1.6]}
            />
          )}

          {points.map((p, i) => (
            <Circle
              key={i}
              x={p.x}
              y={p.y}
              radius={dotR}
              fill={i === 0 ? "#ffd35a" : "#c4cad2"}
              draggable={mode === "edit"}
              onDragMove={(e) => {
                const node = e.target;
                setPoints((prev) => {
                  const next = [...prev];
                  next[i] = { x: node.x(), y: node.y() };
                  return next;
                });
              }}
              onDragStart={() => pushHistory()}
              onDragEnd={(e) => {
                const node = e.target;
                moveVertex(i, node.x(), node.y());
              }}
            />
          ))}

          {liveLabel && (
            <Group x={liveLabel.x} y={liveLabel.y}>
              <Rect
                x={-40 / scale}
                y={-10 / scale}
                width={80 / scale}
                height={20 / scale}
                cornerRadius={4 / scale}
                fill="rgba(0,0,0,0.82)"
              />
              <Text
                text={liveLabel.text}
                x={-40 / scale}
                y={-6 / scale}
                width={80 / scale}
                align="center"
                fontSize={11 / scale}
                fontStyle="bold"
                fill="#ffd35a"
              />
            </Group>
          )}
        </Layer>
      </Stage>

      <div style={{
        position: "absolute", top: 10, left: 10, zIndex: 3,
        background: "rgba(5,7,10,0.75)", color: "#e8ecef", fontWeight: 700, fontSize: 13,
        padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)",
        pointerEvents: "none"
      }}>
        {T.title} {segmentCount}/{maxSegments} — {mode === "draw" ? T.draw : T.edit}
      </div>

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
          {T.hint}
        </div>
      )}

      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 3,
        display: "flex", gap: 8, flexWrap: "wrap",
        padding: "10px 10px calc(10px + env(safe-area-inset-bottom, 12px))",
        background: "linear-gradient(180deg, rgba(5,7,10,0) 0%, #05070a 45%)"
      }}>
        <button
          type="button"
          onClick={() => setMode((m) => (m === "draw" ? "edit" : "draw"))}
          style={btnStyle({ background: mode === "edit" ? "#3a2e10" : "#20262e", border: "1px solid " + (mode === "edit" ? "#ffd35a" : "rgba(207,213,218,.35)") })}
        >
          {mode === "draw" ? "✏️ " + T.drawMode : "✥ " + T.editMode}
        </button>
        <button type="button" onClick={zoomOut} style={btnStyle()}>− {T.zoomOut}</button>
        <button type="button" onClick={zoomIn} style={btnStyle()}>+ {T.zoomIn}</button>
        <button type="button" onClick={() => setAngleSnap((v) => !v)} style={btnStyle({ background: angleSnap ? "#20262e" : "#12161c" })}>
          {angleSnap ? T.angleOn : T.angleOff}
        </button>
        <button type="button" onClick={undoLast} disabled={history.length === 0} style={btnStyle({ opacity: history.length === 0 ? 0.5 : 1 })}>{T.undo}</button>
        <button type="button" onClick={reset} style={btnStyle()}>{T.reset}</button>
        <button
          type="button"
          onClick={finish}
          disabled={points.length < 2}
          style={btnStyle({ border: "1px solid #cfd5da", background: "#20262e", color: "#f4f6f7", fontWeight: 800, opacity: points.length < 2 ? 0.5 : 1 })}
        >
          {T.apply} ✓
        </button>
      </div>
    </div>
  );
}
