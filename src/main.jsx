import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { createPdf } from "./pdf/pdf";
import logoUrl from "./assets/logo.jpg";

const machines = [
  "DURMA Easy",
  "DURMA AD-S 30175",
  "DURMA AD-S 30220",
  "DURMA AD-S 37220",
  "DURMA AD-R 30135",
  "DURMA AD-R 30175",
  "DURMA HAP 30120",
  "DURMA HAP 30200",
  "Baykal APHS",
  "Ermaksan Speed-Bend",
  "Amada HFE",
  "Trumpf TruBend",
  "SafanDarley E-Brake",
  "LVD PPEB",
  "Gasparini PBS"
];

const lowerDies = [
  "M.460.R/F V12",
  "M.460.R/F V16",
  "M.460.R/F V22",
  "M.460.R/F V35",
  "M.460.R/F V50",
  "M.460.R/F V85"
];
const upperDies = [
  "P.97.75.R08/F",
  "P.97.75.R08/F - 02",
  "P.97.75.R08/F - 03",
  "P.97.75.R08/F - 04",
  "P.97.75.R08/F - 05",
  "P.97.75.R08/F - 06"
];
const materials = ["DKP", "Galvaniz", "INOX 304", "INOX 316", "Alüminyum 1050", "Alüminyum 5754"];
const thicknesses = [0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6];
const profileTypes = [
  { value: "kapi", labelTr: "Kapı Profili", labelFr: "Profil porte" },
  { value: "l", labelTr: "Köşebent (L)", labelFr: "Cornière (L)" }
];

function autoBdValue({ material, thickness, lowerDie, upperDie }) {
  const t = Number(thickness) || 2;

  // Doğrulanmış makine değeri: DURMA Easy + M460 V16 + P97.75.R08 + DKP 2 mm = 3.30 mm / büküm
  if (lowerDie === "M.460.R/F V16" && upperDie === "P.97.75.R08/F" && material === "DKP" && t === 2) {
    return 3.30;
  }

  // V115 başlangıç katsayıları: gerçek üretim verileri geldikçe güncellenecek.
  const matFactor = material.includes("INOX") ? 1.10 : material.includes("Alüminyum") ? 0.92 : material === "Galvaniz" ? 1.02 : 1.00;
  const vFactor = lowerDie.includes("V12") ? 1.05 : lowerDie.includes("V16") ? 1.65 : lowerDie.includes("V22") ? 1.85 : lowerDie.includes("V35") ? 2.10 : lowerDie.includes("V50") ? 2.35 : 2.65;
  return Number((t * vFactor * matFactor).toFixed(2));
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [lang, setLang] = useState("tr");
  const [showSettings, setShowSettings] = useState(false);

  const [profileType, setProfileType] = useState("kapi");

  const [A, setA] = useState(20);
  const [B, setB] = useState(20);
  const [C, setC] = useState(40);
  const [D, setD] = useState(40);
  const [EN, setEN] = useState(1000);
  const [H, setH] = useState(2000);

  const [machine, setMachine] = useState("DURMA Easy");
  const [lowerDie, setLowerDie] = useState("M.460.R/F V16");
  const [upperDie, setUpperDie] = useState("P.97.75.R08/F");
  const [material, setMaterial] = useState("DKP");
  const [thickness, setThickness] = useState(2);
  const [bendAngle, setBendAngle] = useState(90);
  const [insideR, setInsideR] = useState(2.42);
  const [deduct, setDeduct] = useState(15);
  const [manualBd, setManualBd] = useState(false);
  const [manualBdValue, setManualBdValue] = useState(3.30);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const computedBd = useMemo(() => autoBdValue({ material, thickness, lowerDie, upperDie }), [material, thickness, lowerDie, upperDie]);
  const bd = manualBd ? Number(manualBdValue) || 0 : computedBd;

  const tr = {
    app: "ÖZER BEND PRO V126",
    dims: "ÖLÇÜLER",
    profile: "PROFİL",
    settings: "AYARLAR",
    results: "KESİM SONUÇLARI",
    cw: "Kesilecek En",
    ch: "Kesilecek Boy",
    draw: "2D",
    pdf: "PDF",
    print: "YAZDIR",
    share: "PAYLAŞ",
    loading: "BAŞLATILIYOR...",
    view3d: "3D",
    doorProfile: "Kapı Profili",
    lProfile: "Köşebent (L)",
  };

  const fr = {
    app: "ÖZER BEND PRO V126",
    dims: "DIMENSIONS",
    profile: "PROFIL",
    settings: "RÉGLAGES",
    results: "RÉSULTATS DE COUPE",
    cw: "Largeur de découpe",
    ch: "Longueur de découpe",
    draw: "2D",
    pdf: "PDF",
    print: "IMPRIMER",
    share: "PARTAGER",
    loading: "INITIALISATION...",
    view3d: "3D",
    doorProfile: "Kapı Profili",
    lProfile: "Köşebent (L)",
  };

  const t = lang === "tr" ? tr : fr;
  const isLProfile = profileType === "l";
  const bendCount = isLProfile ? 1 : 4;
  const total = isLProfile ? A + B : A + B + C + D + EN;
  const bdToplam = bd * bendCount;
  // Kapı profilinde mevcut 15 mm düşüm korunur. Köşebent tek bükümde düşüm uygulanmaz.
  const kesilecekEn = isLProfile ? total - bdToplam : total - bdToplam - deduct;
  const kesilecekBoy = isLProfile ? null : H - deduct;
  const data = { profileType, A, B, C, D, EN, H, bd, deduct, material, kalip: lowerDie, upperDie, machine, thickness, aci: bendAngle, icR: insideR, bendCount };
  const result = { kesilecekEn, kesilecekBoy, bdToplam };

  // Köşebent (L) açı motoru: 90° tam L, 45° iç açı 45° olacak şekilde sol kol döner.
  // Ölçü okları her zaman büküm merkezinden kol ucuna kadar ve ilgili kola paralel kalır.
  const lAngle = Math.max(15, Math.min(180, Number(bendAngle) || 90));
  const theta = (180 - lAngle) * Math.PI / 180;
  const lScale = Math.min(6.2, 430 / Math.max(1, A), 205 / Math.max(1, B));
  const cx = 260;
  const cy = 280;
  const ax2 = cx + A * lScale;
  const ay2 = cy;
  const bx2 = cx + Math.cos(theta) * B * lScale;
  const by2 = cy - Math.sin(theta) * B * lScale;
  const bvx = bx2 - cx;
  const bvy = by2 - cy;
  const blen = Math.max(1, Math.hypot(bvx, bvy));
  const bPerpX = -bvy / blen;
  const bPerpY = bvx / blen;
  const bOff = -45;
  const bDimX1 = cx + bPerpX * bOff;
  const bDimY1 = cy + bPerpY * bOff;
  const bDimX2 = bx2 + bPerpX * bOff;
  const bDimY2 = by2 + bPerpY * bOff;
  const bTextX = (bDimX1 + bDimX2) / 2 + bPerpX * -18;
  const bTextY = (bDimY1 + bDimY2) / 2 + bPerpY * -18;
  const arcR = 54;
  const arcEndX = cx + Math.cos(theta) * arcR;
  const arcEndY = cy - Math.sin(theta) * arcR;
  const arcLarge = lAngle < 1 ? 1 : (180 - lAngle > 180 ? 1 : 0);

  const input = (label, value, setter) => (
    <label>
      {label}
      <input
        value={value}
        inputMode="decimal"
        onChange={(e) => setter(Number(String(e.target.value).replace(",", ".")) || 0)}
      />
    </label>
  );

  const select = (label, value, setter, options) => (
    <label>
      {label}
      <select value={value} onChange={(e) => setter(e.target.value)}>
        {options.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );

  if (showSplash) {
    return (
      <div className="splash splashClean">
        <img src={logoUrl} alt="ÖZER BEND PRO" className="splashLogoClean" />
      </div>
    );
  }

  return (
    <main className="app">
      <header className="top">
        <div className="brand">
          <img src={logoUrl} alt="ÖZER BEND PRO" />
          <h1>{t.app}</h1>
        </div>
        <div className="topButtons">
          <button onClick={() => setShowSettings(!showSettings)}>{t.settings}</button>
          <button onClick={() => setLang(lang === "tr" ? "fr" : "tr")}>{lang === "tr" ? "FR" : "TR"}</button>
        </div>
      </header>

      {showSettings && (
        <section className="panel settingsPanel">
          <h2>{t.settings}</h2>
          <div className="grid">
            {select("Makine / Presse", machine, setMachine, machines)}
            {select("Alt Kalıp / Matrice", lowerDie, setLowerDie, lowerDies)}
            {select("Üst Kalıp / Poinçon", upperDie, setUpperDie, upperDies)}
            {select("Malzeme / Matière", material, setMaterial, materials)}
            <label>Sac Kalınlığı / Épaisseur
              <select value={thickness} onChange={(e) => setThickness(Number(e.target.value))}>
                {thicknesses.map((item) => <option key={item} value={item}>{item} mm</option>)}
              </select>
            </label>
            {input("İç R / Rayon intérieur", insideR, setInsideR)}
            {input("Büküm Açısı / Angle", bendAngle, setBendAngle)}
            {input("15 mm Düşüm", deduct, setDeduct)}
          </div>

          <div className="bdCard">
            <div>
              <span>BD otomatik</span>
              <b>{computedBd.toFixed(2)} mm / büküm</b>
              <small>{machine} • {lowerDie} • {upperDie} • {material} • {thickness} mm</small>
            </div>
            <label className="switchLine">
              <input type="checkbox" checked={manualBd} onChange={(e) => setManualBd(e.target.checked)} />
              Manuel BD
            </label>
          </div>

          {manualBd && (
            <div className="grid oneLine">
              {input("Manuel BD mm / büküm", manualBdValue, setManualBdValue)}
            </div>
          )}
        </section>
      )}

      <section className="panel">
        <h2>{t.profile}</h2>
        <div className="profileChoice">
          {profileTypes.map((item) => (
            <button
              key={item.value}
              className={profileType === item.value ? "active" : ""}
              onClick={() => setProfileType(item.value)}
            >
              {lang === "tr" ? item.labelTr : item.labelFr}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{t.dims}</h2>
        <div className="grid">
          {input("A", A, setA)}
          {input("B", B, setB)}
          {isLProfile && input("Açı / Angle", bendAngle, setBendAngle)}
          {!isLProfile && input("C", C, setC)}
          {!isLProfile && input("D", D, setD)}
          {!isLProfile && input("EN", EN, setEN)}
          {!isLProfile && input("BOY", H, setH)}
        </div>
      </section>

      <section className="panel infoStrip">
        <div><span>Makine</span><b>{machine}</b></div>
        <div><span>Alt Kalıp</span><b>{lowerDie}</b></div>
        <div><span>Üst Kalıp</span><b>{upperDie}</b></div>
        <div><span>Malzeme</span><b>{material} {thickness} mm</b></div>
      </section>

      <section className="panel">
        <h2>{t.results}</h2>
        <div className="resultItem"><span>{t.cw}</span><b>{kesilecekEn.toFixed(1)} mm</b></div>
        {!isLProfile && <div className="resultItem"><span>{t.ch}</span><b>{kesilecekBoy.toFixed(1)} mm</b></div>}
      </section>

      <section className="panel">
        <h2>{t.draw}</h2>
        <div className="drawingBox">
          {isLProfile ? (
            <svg viewBox="0 0 900 360">
              <path d={`M${bx2} ${by2} L${cx} ${cy} L${ax2} ${ay2}`} className="profile" />

              {/* A ölçüsü: büküm merkezinden sağ uca, yatay kola paralel */}
              <line x1={cx} y1={cy + 36} x2={ax2} y2={cy + 36} className="dim" />
              <line x1={cx} y1={cy + 20} x2={cx} y2={cy + 52} className="dim" />
              <line x1={ax2} y1={cy + 20} x2={ax2} y2={cy + 52} className="dim" />
              <text x={(cx + ax2) / 2} y={cy + 68} className="txt">A: {A} mm</text>

              {/* B ölçüsü: büküm merkezinden sol kol ucuna, kola paralel */}
              <line x1={bDimX1} y1={bDimY1} x2={bDimX2} y2={bDimY2} className="dim" />
              <line x1={cx} y1={cy} x2={bDimX1} y2={bDimY1} className="dimSoft" />
              <line x1={bx2} y1={by2} x2={bDimX2} y2={bDimY2} className="dimSoft" />
              <text x={bTextX} y={bTextY} className="txt">B: {B} mm</text>

              {/* İç açı */}
              <path d={`M${cx + arcR} ${cy} A${arcR} ${arcR} 0 ${arcLarge} 0 ${arcEndX} ${arcEndY}`} className="angleArc" />
              <text x={cx + 80} y={cy - 36} className="angle">{lAngle}°</text>
              <text x="470" y="82" className="bottom">KÖŞEBENT (L) • TEK BÜKÜM</text>
            </svg>
          ) : (
            <svg viewBox="0 0 900 360">
              <path d="M160 270 L160 130 L740 130 L740 270 M160 270 L230 270 M670 270 L740 270" className="profile" />
              <line x1="160" y1="90" x2="740" y2="90" className="dim" />
              <text x="450" y="78" className="txt">EN: {EN} mm</text>
              <line x1="115" y1="130" x2="115" y2="270" className="dim" />
              <text x="70" y="205" className="txt">C: {C}</text>
              <line x1="785" y1="130" x2="785" y2="270" className="dim" />
              <text x="810" y="205" className="txt">D: {D}</text>
              <line x1="160" y1="310" x2="230" y2="310" className="dim" />
              <text x="195" y="340" className="txt">A: {A}</text>
              <line x1="670" y1="310" x2="740" y2="310" className="dim" />
              <text x="705" y="340" className="txt">B: {B}</text>
              <text x="180" y="155" className="angle">90°</text>
              <text x="180" y="250" className="angle">90°</text>
              <text x="705" y="155" className="angle">90°</text>
              <text x="705" y="250" className="angle">90°</text>
            </svg>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>{t.view3d} <small className="badge">V114 KİLİTLİ</small></h2>
        <div className="view3dBox">
          {isLProfile ? (
            <svg viewBox="0 0 900 430" className="iso3d">
              <defs>
                <linearGradient id="lMetalFace" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f3f4f5"/>
                  <stop offset="0.45" stopColor="#9aa1a8"/>
                  <stop offset="1" stopColor="#373c43"/>
                </linearGradient>
                <linearGradient id="lMetalDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#cfd3d7"/>
                  <stop offset="1" stopColor="#2a2f36"/>
                </linearGradient>
              </defs>
              {(() => {
                const ox = 290, oy = 295;
                const sc = Math.min(6.2, 430 / Math.max(1, A), 190 / Math.max(1, B));
                const ex = ox + A * sc;
                const ey = oy;
                const tx = ox + Math.cos(theta) * B * sc;
                const ty = oy - Math.sin(theta) * B * sc;
                const depthX = 58, depthY = -34;
                const strip = 18;
                return (
                  <>
                    <polygon points={`${ox},${oy} ${ex},${ey} ${ex + depthX},${ey + depthY} ${ox + depthX},${oy + depthY}`} fill="url(#lMetalFace)" stroke="#e5e7eb" strokeWidth="3" />
                    <polygon points={`${ox},${oy} ${tx},${ty} ${tx + depthX},${ty + depthY} ${ox + depthX},${oy + depthY}`} fill="url(#lMetalDark)" stroke="#e5e7eb" strokeWidth="3" />
                    <polygon points={`${ox},${oy} ${ox + depthX},${oy + depthY} ${ox + depthX + strip},${oy + depthY + 18} ${ox + strip},${oy + 18}`} fill="url(#lMetalFace)" opacity="0.55" stroke="#cfd3d9" strokeWidth="2" />
                    <line x1={ox} y1={oy + 45} x2={ex} y2={ey + 45} className="dim3d" />
                    <line x1={ox} y1={oy + 28} x2={ox} y2={oy + 62} className="dim3d" />
                    <line x1={ex} y1={ey + 28} x2={ex} y2={ey + 62} className="dim3d" />
                    <text x={(ox + ex) / 2} y={oy + 80} className="txt3d">A: {A}</text>
                    <line x1={ox - 45} y1={oy} x2={tx - 45} y2={ty} className="dim3d" />
                    <text x={(ox + tx) / 2 - 82} y={(oy + ty) / 2} className="txt3d">B: {B}</text>
                    <path d={`M${ox + 58} ${oy} A58 58 0 0 0 ${ox + Math.cos(theta) * 58} ${oy - Math.sin(theta) * 58}`} className="angleArc" />
                    <text x={ox + 82} y={oy - 42} className="txt3d">{lAngle}°</text>
                    <text x="450" y="400" className="bottom3d">KÖŞEBENT (L) • TEK BÜKÜM</text>
                  </>
                );
              })()}
            </svg>
          ) : (
          <svg viewBox="0 0 900 430" className="iso3d">
            <defs>
              <linearGradient id="metalFace" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f3f4f5"/>
                <stop offset="0.45" stopColor="#9aa1a8"/>
                <stop offset="1" stopColor="#373c43"/>
              </linearGradient>
              <linearGradient id="metalDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#cfd3d7"/>
                <stop offset="1" stopColor="#2a2f36"/>
              </linearGradient>
            </defs>

            {/* V114 geometri kilitli: sadece ayarlar sistemi eklendi */}
            <polygon points="220,285 650,285 720,235 290,235" fill="url(#metalFace)" stroke="#e5e7eb" strokeWidth="3"/>
            <polygon points="220,285 290,235 290,135 220,185" fill="url(#metalDark)" stroke="#e5e7eb" strokeWidth="3"/>
            <polygon points="650,285 720,235 720,135 650,185" fill="url(#metalDark)" stroke="#e5e7eb" strokeWidth="3"/>
            <polygon points="290,135 720,135 650,185 220,185" fill="url(#metalFace)" opacity="0.18" stroke="#cfd3d9" strokeWidth="2"/>
            <polygon points="290,135 360,135 290,185 220,185" fill="url(#metalFace)" stroke="#e5e7eb" strokeWidth="3"/>
            <polygon points="650,185 720,135 650,135 580,185" fill="url(#metalFace)" stroke="#e5e7eb" strokeWidth="3"/>

            <line x1="220" y1="320" x2="650" y2="320" className="dim3d"/>
            <text x="435" y="350" className="txt3d">EN: {EN}</text>
            <line x1="180" y1="185" x2="180" y2="285" className="dim3d"/>
            <text x="145" y="240" className="txt3d">C: {C}</text>
            <line x1="760" y1="135" x2="760" y2="235" className="dim3d"/>
            <text x="800" y="190" className="txt3d">D: {D}</text>
            <line x1="240" y1="115" x2="320" y2="115" className="dim3d"/>
            <text x="280" y="96" className="txt3d">A: {A}</text>
            <line x1="590" y1="115" x2="670" y2="115" className="dim3d"/>
            <text x="630" y="96" className="txt3d">B: {B}</text>
            <text x="450" y="392" className="bottom3d">A • B • C • D • EN • BOY</text>
          </svg>
          )}
        </div>
      </section>

      <div className="actions">
        <button type="button" onClick={() => createPdf({ data, result, lang: t, action: "save" })}>{t.pdf}</button>
        <button type="button" className="secondary" onClick={() => createPdf({ data, result, lang: t, action: "print" })}>{t.print}</button>
        <button type="button" className="secondary" onClick={() => createPdf({ data, result, lang: t, action: "share" })}>{t.share}</button>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
