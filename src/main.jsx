import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { createPdf } from "./pdf/pdf";
import logoUrl from "./assets/logo.jpg";

const FEEDBACK_EMAIL = "halilozer03@gmail.com";

function openFeedbackMail({ subject, message }) {
  try {
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = url;
  } catch (_) {}
}

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
// Dahili kodlar sabit kalır (hesaplamalar buna göre yapılır); ekranda
// gösterilecek isim materialLabel() ile dile göre çevrilir.
const materials = ["DKP", "Galvaniz", "INOX 304", "INOX 316", "Alüminyum 1050", "Alüminyum 5754", "Hardox"];
const thicknesses = [0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6];
const profileTypes = [
  { value: "kapi", labelTr: "Kapı Profili", labelFr: "Profil porte", labelEn: "Door Profile", labelDe: "Türprofil" },
  { value: "l", labelTr: "Köşebent (L)", labelFr: "Cornière (L)", labelEn: "Corner (L)", labelDe: "Winkel (L)" }
];

function materialLabel(code, lang) {
  if (code === "Galvaniz") {
    if (lang === "en") return "Galvanized";
    if (lang === "de") return "Verzinkt";
    if (lang === "fr") return "Galvanisé";
    return "Galvaniz";
  }
  if (code.startsWith("Alüminyum")) {
    const suffix = code.replace("Alüminyum", "").trim();
    const word = lang === "tr" ? "Alüminyum" : "Aluminium";
    return `${word} ${suffix}`.trim();
  }
  return code;
}

function autoBdValue({ material, thickness, lowerDie, upperDie }) {
  const t = Number(thickness) || 2;

  // Doğrulanmış makine değeri: DURMA Easy + M460 V16 + P97.75.R08 + DKP 2 mm = 3.30 mm / büküm
  if (lowerDie === "M.460.R/F V16" && upperDie === "P.97.75.R08/F" && material === "DKP" && t === 2) {
    return 3.30;
  }

  // V115 başlangıç katsayıları: gerçek üretim verileri geldikçe güncellenecek.
  // NOT: Hardox faktörü DOĞRULANMAMIŞ bir tahmindir (yüksek mukavemet nedeniyle
  // INOX'tan biraz yüksek varsayıldı). Gerçek test büküm yapmadan güvenme,
  // "Manuel BD" ile ölçtüğün değeri gir.
  const matFactor = material === "Hardox" ? 1.18 : material.includes("INOX") ? 1.10 : material.includes("Alüminyum") ? 0.92 : material === "Galvaniz" ? 1.02 : 1.00;
  const vFactor = lowerDie.includes("V12") ? 1.05 : lowerDie.includes("V16") ? 1.65 : lowerDie.includes("V22") ? 1.85 : lowerDie.includes("V35") ? 2.10 : lowerDie.includes("V50") ? 2.35 : 2.65;
  return Number((t * vFactor * matFactor).toFixed(2));
}

const DICT = {
  tr: {
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
    machineLabel: "Makine",
    lowerDieLabel: "Alt Kalıp",
    upperDieLabel: "Üst Kalıp",
    materialLabel: "Malzeme",
    thicknessLabel: "Sac Kalınlığı",
    insideRLabel: "İç R",
    angleLabel: "Büküm Açısı",
    deductLabel: "15 mm Düşüm",
    bdAutoLabel: "BD otomatik",
    bdUnit: "mm / büküm",
    manualBdToggle: "Manuel BD",
    manualBdInputLabel: "Manuel BD mm / büküm",
    hardoxWarning: "⚠️ Hardox için otomatik BD değeri DOĞRULANMAMIŞ bir tahmindir. Gerçek test büküm yapmadan üretime geçme — test bükümünden ölçtüğün gerçek değeri \"Manuel BD\" ile gir.",
    feedbackBtn: "📩 Geri Bildirim Gönder",
    feedbackSubjectManual: "ÖZER BEND PRO - Geri Bildirim",
    feedbackGreeting: "Merhaba,\n\nUygulamayla ilgili görüşüm/sorunum:\n\n",
    autoErrorSubject: "ÖZER BEND PRO - Otomatik Hata Bildirimi",
    autoErrorPrefix: "Uygulamada beklenmeyen bir hata oluştu:\n",
    autoErrorSuffix: "\n\nBu hatayı e-posta ile geliştiriciye bildirmek ister misin?",
    unknownError: "Bilinmeyen hata",
    unknownPromiseError: "Bilinmeyen promise hatası",
    lockedBadge: "V114 KİLİTLİ",
    cornerSingleBend: "KÖŞEBENT (L) • TEK BÜKÜM",
    lengthWord: "BOY",
    leftWord: "Sol",
    rightWord: "Sağ",
    bottomLeftWord: "Sol Alt",
    bottomRightWord: "Sağ Alt"
  },
  en: {
    app: "ÖZER BEND PRO V126",
    dims: "DIMENSIONS",
    profile: "PROFILE",
    settings: "SETTINGS",
    results: "CUTTING RESULTS",
    cw: "Cut Width",
    ch: "Cut Length",
    draw: "2D",
    pdf: "PDF",
    print: "PRINT",
    share: "SHARE",
    loading: "STARTING...",
    view3d: "3D",
    machineLabel: "Machine",
    lowerDieLabel: "Lower Die",
    upperDieLabel: "Upper Punch",
    materialLabel: "Material",
    thicknessLabel: "Sheet Thickness",
    insideRLabel: "Inside R",
    angleLabel: "Bend Angle",
    deductLabel: "15 mm Deduction",
    bdAutoLabel: "Auto BD",
    bdUnit: "mm / bend",
    manualBdToggle: "Manual BD",
    manualBdInputLabel: "Manual BD mm / bend",
    hardoxWarning: "⚠️ The automatic BD value for Hardox is an UNVERIFIED estimate. Do not go into production without a real test bend — enter the value measured from a test bend using \"Manual BD\".",
    feedbackBtn: "📩 Send Feedback",
    feedbackSubjectManual: "ÖZER BEND PRO - Feedback",
    feedbackGreeting: "Hello,\n\nMy feedback/issue about the app:\n\n",
    autoErrorSubject: "ÖZER BEND PRO - Automatic Error Report",
    autoErrorPrefix: "An unexpected error occurred in the app:\n",
    autoErrorSuffix: "\n\nWould you like to report this error to the developer by email?",
    unknownError: "Unknown error",
    unknownPromiseError: "Unknown promise error",
    lockedBadge: "V114 LOCKED",
    cornerSingleBend: "CORNER (L) • SINGLE BEND",
    lengthWord: "LENGTH",
    leftWord: "Left",
    rightWord: "Right",
    bottomLeftWord: "Bottom Left",
    bottomRightWord: "Bottom Right"
  },
  fr: {
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
    machineLabel: "Machine",
    lowerDieLabel: "Matrice",
    upperDieLabel: "Poinçon",
    materialLabel: "Matière",
    thicknessLabel: "Épaisseur",
    insideRLabel: "Rayon intérieur",
    angleLabel: "Angle de pliage",
    deductLabel: "Déduction 15 mm",
    bdAutoLabel: "BD auto",
    bdUnit: "mm / pli",
    manualBdToggle: "BD manuel",
    manualBdInputLabel: "BD manuel mm / pli",
    hardoxWarning: "⚠️ La valeur BD automatique pour le Hardox est une estimation NON VÉRIFIÉE. Ne passez pas en production sans un pliage d'essai réel — saisissez la valeur mesurée lors d'un pliage d'essai via « BD manuel ».",
    feedbackBtn: "📩 Envoyer un commentaire",
    feedbackSubjectManual: "ÖZER BEND PRO - Commentaire",
    feedbackGreeting: "Bonjour,\n\nMon commentaire/problème concernant l'application :\n\n",
    autoErrorSubject: "ÖZER BEND PRO - Rapport d'erreur automatique",
    autoErrorPrefix: "Une erreur inattendue s'est produite dans l'application :\n",
    autoErrorSuffix: "\n\nSouhaitez-vous signaler cette erreur au développeur par e-mail ?",
    unknownError: "Erreur inconnue",
    unknownPromiseError: "Erreur de promesse inconnue",
    lockedBadge: "V114 VERROUILLÉ",
    cornerSingleBend: "CORNIÈRE (L) • PLI UNIQUE",
    lengthWord: "LONGUEUR",
    leftWord: "Gauche",
    rightWord: "Droite",
    bottomLeftWord: "Bas Gauche",
    bottomRightWord: "Bas Droite"
  },
  de: {
    app: "ÖZER BEND PRO V126",
    dims: "ABMESSUNGEN",
    profile: "PROFIL",
    settings: "EINSTELLUNGEN",
    results: "SCHNITTERGEBNISSE",
    cw: "Schnittbreite",
    ch: "Schnittlänge",
    draw: "2D",
    pdf: "PDF",
    print: "DRUCKEN",
    share: "TEILEN",
    loading: "WIRD GESTARTET...",
    view3d: "3D",
    machineLabel: "Maschine",
    lowerDieLabel: "Untergesenk",
    upperDieLabel: "Oberstempel",
    materialLabel: "Material",
    thicknessLabel: "Blechdicke",
    insideRLabel: "Innenradius",
    angleLabel: "Biegewinkel",
    deductLabel: "15 mm Abzug",
    bdAutoLabel: "Automatisch BD",
    bdUnit: "mm / Biegung",
    manualBdToggle: "Manuelle BD",
    manualBdInputLabel: "Manuelle BD mm / Biegung",
    hardoxWarning: "⚠️ Der automatische BD-Wert für Hardox ist eine NICHT VERIFIZIERTE Schätzung. Gehen Sie ohne einen echten Testbiegevorgang nicht in die Produktion — geben Sie den beim Testbiegen gemessenen Wert unter „Manuelle BD\" ein.",
    feedbackBtn: "📩 Feedback senden",
    feedbackSubjectManual: "ÖZER BEND PRO - Feedback",
    feedbackGreeting: "Hallo,\n\nMein Feedback/Problem zur App:\n\n",
    autoErrorSubject: "ÖZER BEND PRO - Automatische Fehlermeldung",
    autoErrorPrefix: "In der App ist ein unerwarteter Fehler aufgetreten:\n",
    autoErrorSuffix: "\n\nMöchtest du diesen Fehler per E-Mail an den Entwickler melden?",
    unknownError: "Unbekannter Fehler",
    unknownPromiseError: "Unbekannter Promise-Fehler",
    lockedBadge: "V114 GESPERRT",
    cornerSingleBend: "WINKEL (L) • EINZELBIEGUNG",
    lengthWord: "LÄNGE",
    leftWord: "Links",
    rightWord: "Rechts",
    bottomLeftWord: "Unten Links",
    bottomRightWord: "Unten Rechts"
  }
};

const LANGUAGES = [
  { code: "tr", flag: "🇹🇷", label: "Türkçe" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" }
];

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [lang, setLang] = useState("tr");
  const [showSettings, setShowSettings] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef(null);

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

  const t = DICT[lang] || DICT.tr;

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Uygulama genelinde beklenmeyen hataları yakala ve isteğe bağlı olarak
  // geliştiriciye e-posta ile bildirme seçeneği sun. Metinler seçili dile göre.
  useEffect(() => {
    const reportIfWanted = (msg) => {
      const send = window.confirm(t.autoErrorPrefix + msg + t.autoErrorSuffix);
      if (send) {
        openFeedbackMail({
          subject: t.autoErrorSubject,
          message: `Error: ${msg}\nDate: ${new Date().toLocaleString()}\nDevice: ${navigator.userAgent}`
        });
      }
    };
    const handleError = (event) => {
      const msg = event?.error?.message || event?.message || t.unknownError;
      reportIfWanted(msg);
    };
    const handleRejection = (event) => {
      const msg = event?.reason?.message || String(event?.reason || t.unknownPromiseError);
      reportIfWanted(msg);
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [lang]);

  // Dil menüsü açıkken dışarıya dokunulursa menüyü kapat.
  useEffect(() => {
    if (!showLangMenu) return;
    const handleOutside = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [showLangMenu]);

  const computedBd = useMemo(() => autoBdValue({ material, thickness, lowerDie, upperDie }), [material, thickness, lowerDie, upperDie]);
  const bd = manualBd ? Number(manualBdValue) || 0 : computedBd;

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

  const select = (label, value, setter, options, labelFn) => (
    <label>
      {label}
      <select value={value} onChange={(e) => setter(e.target.value)}>
        {options.map((item) => <option key={item} value={item}>{labelFn ? labelFn(item) : item}</option>)}
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

  const currentLangInfo = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <main className="app">
      <header className="top">
        <div className="brand">
          <img src={logoUrl} alt="ÖZER BEND PRO" />
          <h1>{t.app}</h1>
        </div>
        <div className="topButtons">
          <button onClick={() => setShowSettings(!showSettings)}>{t.settings}</button>
          <div className="langMenuWrap" ref={langMenuRef}>
            <button className="langMenuBtn" onClick={() => setShowLangMenu(!showLangMenu)}>
              <span className="flag">{currentLangInfo.flag}</span> {currentLangInfo.code.toUpperCase()} ▾
            </button>
            {showLangMenu && (
              <div className="langMenu">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    className={lang === l.code ? "active" : ""}
                    onClick={() => {
                      setLang(l.code);
                      setShowLangMenu(false);
                    }}
                  >
                    <span className="flag">{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {showSettings && (
        <section className="panel settingsPanel">
          <h2>{t.settings}</h2>
          <div className="grid">
            {select(t.machineLabel, machine, setMachine, machines)}
            {select(t.lowerDieLabel, lowerDie, setLowerDie, lowerDies)}
            {select(t.upperDieLabel, upperDie, setUpperDie, upperDies)}
            {select(t.materialLabel, material, setMaterial, materials, (code) => materialLabel(code, lang))}
            <label>{t.thicknessLabel}
              <select value={thickness} onChange={(e) => setThickness(Number(e.target.value))}>
                {thicknesses.map((item) => <option key={item} value={item}>{item} mm</option>)}
              </select>
            </label>
            {input(t.insideRLabel, insideR, setInsideR)}
            {input(t.angleLabel, bendAngle, setBendAngle)}
            {input(t.deductLabel, deduct, setDeduct)}
          </div>

          <div className="bdCard">
            <div>
              <span>{t.bdAutoLabel}</span>
              <b>{computedBd.toFixed(2)} {t.bdUnit}</b>
              <small>{machine} • {lowerDie} • {upperDie} • {materialLabel(material, lang)} • {thickness} mm</small>
            </div>
            <label className="switchLine">
              <input type="checkbox" checked={manualBd} onChange={(e) => setManualBd(e.target.checked)} />
              {t.manualBdToggle}
            </label>
          </div>

          {material === "Hardox" && !manualBd && (
            <div className="hardoxWarning">
              {t.hardoxWarning}
            </div>
          )}

          {manualBd && (
            <div className="grid oneLine">
              {input(t.manualBdInputLabel, manualBdValue, setManualBdValue)}
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
              {lang === "tr" ? item.labelTr : lang === "fr" ? item.labelFr : lang === "de" ? item.labelDe : item.labelEn}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{t.dims}</h2>
        <div className="grid">
          {input(isLProfile ? "A" : `A (${t.bottomLeftWord})`, A, setA)}
          {input(isLProfile ? "B" : `B (${t.bottomRightWord})`, B, setB)}
          {isLProfile && input(t.angleLabel, bendAngle, setBendAngle)}
          {!isLProfile && input(`C (${t.leftWord})`, C, setC)}
          {!isLProfile && input(`D (${t.rightWord})`, D, setD)}
          {!isLProfile && input("EN", EN, setEN)}
          {!isLProfile && input(t.lengthWord, H, setH)}
        </div>
      </section>

      <section className="panel infoStrip">
        <div><span>{t.machineLabel}</span><b>{machine}</b></div>
        <div><span>{t.lowerDieLabel}</span><b>{lowerDie}</b></div>
        <div><span>{t.upperDieLabel}</span><b>{upperDie}</b></div>
        <div><span>{t.materialLabel}</span><b>{materialLabel(material, lang)} {thickness} mm</b></div>
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
              <text x="470" y="82" className="bottom">{t.cornerSingleBend}</text>
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

              {/* BOY (uzunluk) ölçü çizgisi: A'nın iç köşesinden (dikey kolla
                  birleştiği nokta) parçanın ortasına doğru, profil çizgisiyle
                  aynı kalınlıkta çizilir. Yazı çizgiye paralel döner. */}
              <line x1="160" y1="270" x2="340" y2="160" className="profile" />
              <text x="230" y="190" className="txt" transform="rotate(-31.4 230 190)">{t.lengthWord}: {H} mm</text>
            </svg>
          )}
        </div>
      </section>

      <section className="panel">
        <h2>{t.view3d} <small className="badge">{t.lockedBadge}</small></h2>
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
                    <text x="450" y="400" className="bottom3d">{t.cornerSingleBend}</text>
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
            <text x="450" y="392" className="bottom3d">A • B • C • D • EN • {t.lengthWord}</text>
          </svg>
          )}
        </div>
      </section>

      <div className="actions">
        <button type="button" onClick={() => createPdf({ data, result, lang, action: "save" })}>{t.pdf}</button>
        <button type="button" className="secondary" onClick={() => createPdf({ data, result, lang, action: "print" })}>{t.print}</button>
        <button type="button" className="secondary" onClick={() => createPdf({ data, result, lang, action: "share" })}>{t.share}</button>
      </div>

      <div className="actions actionsSingle">
        <button
          type="button"
          className="secondary feedbackBtn"
          onClick={() => openFeedbackMail({
            subject: t.feedbackSubjectManual,
            message: t.feedbackGreeting
          })}
        >
          {t.feedbackBtn}
        </button>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
