import React, { useMemo, useState } from "react";

const MATERIALS = [
  { code: "DKP", label: "DKP", density: 7.85 },
  { code: "Galvaniz", label: "Galvaniz", density: 7.85 },
  { code: "INOX 304", label: "INOX 304", density: 8.00 },
  { code: "INOX 316", label: "INOX 316", density: 8.00 },
  { code: "Aluminyum 1050", label: "Alüminyum 1050", density: 2.71 },
  { code: "Aluminyum 5754", label: "Alüminyum 5754", density: 2.66 },
  { code: "Hardox", label: "Hardox", density: 7.85 },
  { code: "Pirinc", label: "Pirinç", density: 8.50 },
  { code: "Bronz", label: "Bronz", density: 8.80 },
  { code: "Bakir", label: "Bakır", density: 8.96 }
];

const fieldStyle = {
  width: "100%",
  background: "linear-gradient(180deg,#0d1118,#070a0f)",
  color: "#eef1f3",
  border: "1px solid #3a424c",
  borderRadius: 10,
  padding: "12px",
  fontSize: 18,
  marginTop: 6,
  boxSizing: "border-box"
};

const labelStyle = { fontWeight: 700, color: "#cfd5da", fontSize: 14, display: "block", marginTop: 16 };

export default function WeightCalc({ onClose }) {
  const [materialCode, setMaterialCode] = useState(MATERIALS[0].code);
  const [length, setLength] = useState(1000);
  const [width, setWidth] = useState(1000);
  const [thickness, setThickness] = useState(2);
  const [qty, setQty] = useState(1);

  const material = MATERIALS.find((m) => m.code === materialCode) || MATERIALS[0];

  const result = useMemo(() => {
    const L = Number(length) || 0;
    const W = Number(width) || 0;
    const T = Number(thickness) || 0;
    const Q = Number(qty) || 0;
    // Hacim (mm3) -> cm3'e cevir (/1000) -> gram (yogunluk g/cm3 ile carp) -> kg (/1000)
    const volumeCm3 = (L * W * T) / 1000;
    const unitWeightKg = (volumeCm3 * material.density) / 1000;
    const totalWeightKg = unitWeightKg * Q;
    return { volumeCm3, unitWeightKg, totalWeightKg };
  }, [length, width, thickness, qty, material]);

  const input = (labelText, value, setter, step) => (
    <label style={labelStyle}>
      {labelText}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => setter(Number(String(e.target.value).replace(",", ".")) || 0)}
        style={fieldStyle}
      />
    </label>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#05070a", zIndex: 999, overflowY: "auto" }}>
      <div style={{
        position: "sticky", top: 0, display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "calc(16px + env(safe-area-inset-top)) 20px 16px", background: "#05070a", borderBottom: "1px solid rgba(255,255,255,0.08)", zIndex: 2
      }}>
        <span style={{ color: "#e8ecef", fontWeight: 800, fontSize: 20 }}>Ağırlık Hesapla</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#e8ecef", fontSize: 24 }}>✕</button>
      </div>

      <div style={{ padding: "20px 20px 60px", maxWidth: 560, margin: "0 auto" }}>
        <label style={labelStyle}>
          Malzeme
          <select
            value={materialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            style={fieldStyle}
          >
            {MATERIALS.map((m) => (
              <option key={m.code} value={m.code}>{m.label} ({m.density} g/cm³)</option>
            ))}
          </select>
        </label>

        {input("Uzunluk (mm)", length, setLength)}
        {input("Genişlik (mm)", width, setWidth)}
        {input("Kalınlık (mm)", thickness, setThickness)}
        {input("Adet", qty, setQty)}

        <div style={{
          marginTop: 28, padding: 18, borderRadius: 14,
          background: "linear-gradient(180deg,#151b22,#0b0e12)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <div style={{ color: "#9aa3ab", fontSize: 14 }}>Hacim</div>
          <div style={{ color: "#eef1f3", fontWeight: 800, fontSize: 22, marginBottom: 14 }}>
            {result.volumeCm3.toFixed(2)} cm³
          </div>

          <div style={{ color: "#9aa3ab", fontSize: 14 }}>Birim Ağırlık (1 adet)</div>
          <div style={{ color: "#eef1f3", fontWeight: 800, fontSize: 22, marginBottom: 14 }}>
            {result.unitWeightKg.toFixed(3)} kg
          </div>

          <div style={{ color: "#9aa3ab", fontSize: 14 }}>Toplam Ağırlık ({qty || 0} adet)</div>
          <div style={{ color: "#ffd35a", fontWeight: 900, fontSize: 30 }}>
            {result.totalWeightKg.toFixed(3)} kg
          </div>
        </div>

        <p style={{ color: "#6b7480", fontSize: 12.5, marginTop: 18, lineHeight: 1.5 }}>
          Hesaplama: Hacim (Uzunluk × Genişlik × Kalınlık) × Malzeme Özgül Ağırlığı. Sonuç, düz sac plaka
          ağırlığıdır — büküm/kesim sırasında oluşan fire hesaba katılmaz.
        </p>
      </div>
    </div>
  );
}
