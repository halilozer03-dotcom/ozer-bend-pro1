import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { createPdf } from "./pdf/pdf";
import FreeDrawCanvas from "./freedraw";
import WeightCalc from "./weightcalc";
import logoUrl from "./assets/logo.jpg";
import FullscreenViewer from "./viewer3d";
import { canUse3D, getCompanyLogo, setCompanyLogo, isProUser, trialDaysLeft } from "./license.js";
import { initBilling, purchasePro, restorePurchases, getProPriceString } from "./billing.js";

const SETTINGS_TXT = {
  tr: { companyName: "Firma Adı (PDF başlığında görünür)", logoLabel: "Firma Logosu (PDF sol üst köşede görünür)", logoRemove: "Logoyu Kaldır", proActive: "PRO aktif — tüm özellikler açık", buyPro: "PRO'ya Geç —", buying: "İşleniyor…", restore: "Satın Almaları Geri Yükle", trialLeft: (n) => "Deneme sürümü: " + n + " gün kaldı", trialOver: "Deneme sona erdi — günde 3 PDF; logo ve 3D kilitli" },
  en: { companyName: "Company Name (shown in PDF header)", logoLabel: "Company Logo (shown at top-left of PDF)", logoRemove: "Remove Logo", proActive: "PRO active — all features unlocked", buyPro: "Upgrade to PRO —", buying: "Processing…", restore: "Restore Purchases", trialLeft: (n) => "Trial: " + n + " day(s) left", trialOver: "Trial ended — 3 PDFs/day; logo & 3D locked" },
  fr: { companyName: "Nom de l'entreprise (visible dans l'en-tête du PDF)", logoLabel: "Logo de l'entreprise (en haut à gauche du PDF)", logoRemove: "Supprimer le logo", proActive: "PRO actif — toutes les fonctionnalités débloquées", buyPro: "Passer à PRO —", buying: "Traitement…", restore: "Restaurer les achats", trialLeft: (n) => "Essai : " + n + " jour(s) restant(s)", trialOver: "Essai terminé — 3 PDF/jour ; logo et 3D verrouillés" },
  de: { companyName: "Firmenname (erscheint in der PDF-Kopfzeile)", logoLabel: "Firmenlogo (oben links im PDF)", logoRemove: "Logo entfernen", proActive: "PRO aktiv — alle Funktionen freigeschaltet", buyPro: "Auf PRO upgraden —", buying: "Wird verarbeitet…", restore: "Käufe wiederherstellen", trialLeft: (n) => "Testversion: noch " + n + " Tag(e)", trialOver: "Test abgelaufen — 3 PDFs/Tag; Logo & 3D gesperrt" },
  es: { companyName: "Nombre de la empresa (visible en el encabezado del PDF)", logoLabel: "Logotipo de la empresa (arriba a la izquierda del PDF)", logoRemove: "Quitar logotipo", proActive: "PRO activo — todas las funciones desbloqueadas", buyPro: "Mejorar a PRO —", buying: "Procesando…", restore: "Restaurar compras", trialLeft: (n) => "Prueba: quedan " + n + " día(s)", trialOver: "Prueba finalizada — 3 PDF/día; logo y 3D bloqueados" },
  it: { companyName: "Nome azienda (visibile nell'intestazione del PDF)", logoLabel: "Logo aziendale (in alto a sinistra nel PDF)", logoRemove: "Rimuovi logo", proActive: "PRO attivo — tutte le funzioni sbloccate", buyPro: "Passa a PRO —", buying: "Elaborazione…", restore: "Ripristina acquisti", trialLeft: (n) => "Prova: " + n + " giorno/i rimasti", trialOver: "Prova terminata — 3 PDF/giorno; logo e 3D bloccati" },
  ru: { companyName: "Название компании (отображается в заголовке PDF)", logoLabel: "Логотип компании (вверху слева в PDF)", logoRemove: "Удалить логотип", proActive: "PRO активен — все функции доступны", buyPro: "Перейти на PRO —", buying: "Обработка…", restore: "Восстановить покупки", trialLeft: (n) => "Пробный период: осталось " + n + " дн.", trialOver: "Пробный период истёк — 3 PDF/день; логотип и 3D заблокированы" },
  pt: { companyName: "Nome da empresa (exibido no cabeçalho do PDF)", logoLabel: "Logotipo da empresa (no canto superior esquerdo do PDF)", logoRemove: "Remover logotipo", proActive: "PRO ativo — todos os recursos desbloqueados", buyPro: "Atualizar para PRO —", buying: "Processando…", restore: "Restaurar compras", trialLeft: (n) => "Teste: restam " + n + " dia(s)", trialOver: "Teste encerrado — 3 PDFs/dia; logo e 3D bloqueados" },
  pl: { companyName: "Nazwa firmy (widoczna w nagłówku PDF)", logoLabel: "Logo firmy (w lewym górnym rogu PDF)", logoRemove: "Usuń logo", proActive: "PRO aktywny — wszystkie funkcje odblokowane", buyPro: "Przejdź na PRO —", buying: "Przetwarzanie…", restore: "Przywróć zakupy", trialLeft: (n) => "Wersja próbna: pozostało " + n + " dni", trialOver: "Okres próbny zakończony — 3 PDF/dzień; logo i 3D zablokowane" },
  zh: { companyName: "公司名称（显示在PDF标题中）", logoLabel: "公司标志（显示在PDF左上角）", logoRemove: "移除标志", proActive: "PRO已激活 — 所有功能已解锁", buyPro: "升级到PRO —", buying: "处理中…", restore: "恢复购买", trialLeft: (n) => "试用期：剩余" + n + "天", trialOver: "试用已结束 — 每天3个PDF；标志和3D已锁定" },
  ar: { companyName: "اسم الشركة (يظهر في ترويسة PDF)", logoLabel: "شعار الشركة (أعلى يسار PDF)", logoRemove: "إزالة الشعار", proActive: "PRO مفعّل — جميع الميزات متاحة", buyPro: "الترقية إلى PRO —", buying: "جارٍ المعالجة…", restore: "استعادة المشتريات", trialLeft: (n) => "الفترة التجريبية: تبقى " + n + " يوم", trialOver: "انتهت الفترة التجريبية — 3 PDF يوميًا؛ الشعار وثلاثي الأبعاد مقفلان" }
};
const stx = (l) => SETTINGS_TXT[l] || SETTINGS_TXT.en;

const FEEDBACK_EMAIL = "ozerbend@gmail.com";

function openFeedbackMail({ subject, message }) {
  try {
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = url;
  } catch (_) {}
}

const machines = [
  "DURMA Easy",
  "Baykal APHS",
  "Ermaksan Speed-Bend",
  "Amada HFE",
  "Trumpf TruBend",
  "SafanDarley E-Brake",
  "LVD PPEB",
  "Gasparini PBS",
  "Bystronic Xpert",
  "Prima Power BCe",
  "Cincinnati Autoform",
  "HACO Synchro",
  "Adira PA",
  "Estun E21",
  "Boschert Compact"
];

const DIE_GROUPS = {
  EU_STANDARD: {
    lower: ["M.460.R/F V12", "M.460.R/F V16", "M.460.R/F V22", "M.460.R/F V35", "M.460.R/F V50", "M.460.R/F V85"],
    upper: ["P.97.75.R08/F", "P.97.75.R08/F - 02", "P.97.75.R08/F - 03", "P.97.75.R08/F - 04", "P.97.75.R08/F - 05", "P.97.75.R08/F - 06"]
  },
  AMADA_STYLE: {
    lower: ["WT100-V12", "WT100-V16", "WT100-V22", "WT100-V35", "WT100-V50"],
    upper: ["TP100-R06", "TP100-R08", "TP100-R10", "TP100-R12"]
  },
  TRUMPF_WILA: {
    lower: ["WNS1-V12", "WNS1-V16", "WNS1-V22", "WNS1-V35", "WNS1-V50"],
    upper: ["WNP1-R06", "WNP1-R08", "WNP1-R10", "WNP1-R12"]
  },
  AMERICAN_STYLE: {
    lower: ["AMS-V12", "AMS-V16", "AMS-V22", "AMS-V35", "AMS-V50"],
    upper: ["AMP-R06", "AMP-R08", "AMP-R10", "AMP-R12"]
  }
};

const MACHINE_DIE_GROUP = {
  "DURMA Easy": "EU_STANDARD",
  "Baykal APHS": "EU_STANDARD",
  "Ermaksan Speed-Bend": "EU_STANDARD",
  "LVD PPEB": "EU_STANDARD",
  "Gasparini PBS": "EU_STANDARD",
  "SafanDarley E-Brake": "EU_STANDARD",
  "Prima Power BCe": "EU_STANDARD",
  "Adira PA": "EU_STANDARD",
  "Boschert Compact": "EU_STANDARD",
  "HACO Synchro": "EU_STANDARD",
  "Bystronic Xpert": "EU_STANDARD",
  "Estun E21": "EU_STANDARD",
  "Amada HFE": "AMADA_STYLE",
  "Trumpf TruBend": "TRUMPF_WILA",
  "Cincinnati Autoform": "AMERICAN_STYLE"
};
// Dahili kodlar sabit kalır (hesaplamalar buna göre yapılır); ekranda
// gösterilecek isim materialLabel() ile dile göre çevrilir.
const materials = ["DKP", "Galvaniz", "INOX 304", "INOX 316", "Alüminyum 1050", "Alüminyum 5754", "Hardox"];
const MATERIAL_DENSITY = {
  "DKP": 7.85,
  "Galvaniz": 7.85,
  "INOX 304": 8.00,
  "INOX 316": 8.00,
  "Alüminyum 1050": 2.71,
  "Alüminyum 5754": 2.66,
  "Hardox": 7.85
};
const thicknesses = [0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6];
const profileTypes = [
  { value: "kapi", labelTr: "Kapı Profili", labelFr: "Profil porte", labelEn: "Door Profile", labelDe: "Türprofil",
    labelEs: "Perfil de Puerta", labelIt: "Profilo Porta", labelRu: "Профиль двери", labelPt: "Perfil da Porta",
    labelPl: "Profil Drzwiowy", labelZh: "门型材", labelAr: "بروفايل الباب" },
  { value: "l", labelTr: "Köşebent (L)", labelFr: "Cornière (L)", labelEn: "Corner (L)", labelDe: "Winkel (L)",
    labelEs: "Escuadra (L)", labelIt: "Angolare (L)", labelRu: "Угол (L)", labelPt: "Cantoneira (L)",
    labelPl: "Kątownik (L)", labelZh: "角型材 (L)", labelAr: "زاوية (L)" },
  { value: "genel", labelTr: "Genel Profil", labelFr: "Profil général", labelEn: "General Profile", labelDe: "Allgemeines Profil",
    labelEs: "Perfil General", labelIt: "Profilo Generale", labelRu: "Общий профиль", labelPt: "Perfil Geral",
    labelPl: "Profil Ogólny", labelZh: "通用型材", labelAr: "بروفايل عام" }
];

function profileTypeLabel(item, lang) {
  const key = "label" + lang.charAt(0).toUpperCase() + lang.slice(1);
  return item[key] || item.labelEn;
}

function materialLabel(code, lang) {
  const GALVANIZED = {
    tr: "Galvaniz", en: "Galvanized", de: "Verzinkt", fr: "Galvanisé",
    es: "Galvanizado", it: "Zincato", ru: "Оцинкованный", pt: "Galvanizado",
    pl: "Ocynkowany", zh: "镀锌", ar: "مجلفن"
  };
  const ALUMINUM = {
    tr: "Alüminyum", en: "Aluminium", de: "Aluminium", fr: "Aluminium",
    es: "Aluminio", it: "Alluminio", ru: "Алюминий", pt: "Alumínio",
    pl: "Aluminium", zh: "铝", ar: "ألمنيوم"
  };
  if (code === "Galvaniz") {
    return GALVANIZED[lang] || GALVANIZED.tr;
  }
  if (code.startsWith("Alüminyum")) {
    const suffix = code.replace("Alüminyum", "").trim();
    const word = ALUMINUM[lang] || ALUMINUM.tr;
    return `${word} ${suffix}`.trim();
  }
  return code;
}

function autoBdValue({ material, thickness, bendAngle, insideR }) {
  // K-faktor tabanli, aciya duyarli buku payi (bend deduction) hesabi.
  // Referans (dogrulanmis makine verisi): DURMA Easy + M460 V16 + P97.75.R08
  // + DKP 2mm + R=2.42mm + 90 derece => BD = 3.30 mm / bukum.
  // Bu referanstan K faktoru geriye hesaplanmistir: K(DKP) = 0.5535
  const T = Number(thickness) || 2;
  const R = Number(insideR) || 2.42;
  const angleDeg = Number(bendAngle) || 90;
  const angleRad = (angleDeg * Math.PI) / 180;

  // NOT: Sadece DKP degeri gercek makine verisiyle dogrulanmistir.
  // Diger malzemeler icin K faktoru, ayni oranli tahminle olceklenmistir;
  // gercek buku testi yapmadan guvenme, "Manuel BD" ile olcup gir.
  const kBase = 0.5535;
  const matFactor = material === "Hardox" ? 1.18 : material.includes("INOX") ? 1.10 : material.includes("Alüminyum") ? 0.92 : material === "Galvaniz" ? 1.02 : 1.00;
  const K = kBase * matFactor;

  const setback = Math.tan(angleRad / 2) * (R + T);
  const bendAllowance = angleRad * (R + K * T);
  const bd = 2 * setback - bendAllowance;
  return Number(bd.toFixed(2));
}

// Genel profil (N segment): her segment bir uzunluk, aralarındaki her eklemde
// bir büküm açısı ve yönü (yukarı/aşağı) var. Segment sayısı sınırsız.
function computeGeneralPoints(segments) {
  const pts = [{ x: 0, y: 0 }];
  let heading = 0;
  for (let i = 0; i < segments.length; i++) {
    const len = Number(segments[i].length) || 0;
    const rad = (heading * Math.PI) / 180;
    const prev = pts[pts.length - 1];
    pts.push({ x: prev.x + Math.cos(rad) * len, y: prev.y + Math.sin(rad) * len });
    if (i < segments.length - 1) {
      const ang = Number(segments[i].angle) || 90;
      const dir = segments[i].dir === -1 ? -1 : 1;
      heading += dir * (180 - ang);
    }
  }
  return pts;
}

function scalePointsToBox(pts, vbW, vbH, pad) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const scale = Math.min((vbW - pad * 2) / w, (vbH - pad * 2) / h, 10);
  const offX = (vbW - w * scale) / 2 - minX * scale;
  const offY = (vbH - h * scale) / 2 - minY * scale;
  return pts.map((p) => ({ x: p.x * scale + offX, y: p.y * scale + offY }));
}

const DICT = {
  tr: {
    app: "ÖZER BEND PRO V1",
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
    bottomRightWord: "Sağ Alt",
    genelProfil: "GENEL PROFİL",
    segmentUzunluk: "Uzunluk",
    segmentAci: "Açı",
    segmentYon: "Yön",
    yonYukari: "Yukarı",
    yonAsagi: "Aşağı",
    segmentEkle: "+ Segment Ekle",
    segmentSil: "Kaldır",
    favorites: "Favoriler",
    favSave: "Kaydet",
    favLoad: "Yükle",
    favDelete: "Sil",
    favEmpty: "Kayıtlı favori yok.",
    favNamePrompt: "Favori adı:",
    toplamUzunluk: "Toplam Kesilecek Uzunluk",
    bukumSayisi: "Büküm Sayısı",
    segment: "Segment",
    freeDrawBtn: "Serbest Çizim",
    weightCalcBtn: "Ağırlık Hesapla",
    trademarkDisclaimer: "DURMA, Hardox ve uygulama içinde geçen diğer ürün/marka adları ilgili sahiplerinin ticari markalarıdır. Bu uygulama bu firmalarla bağlantılı değildir ve onlar tarafından onaylanmamıştır; bu isimler yalnızca uyumluluk/tanımlama amacıyla kullanılmaktadır."
  },
  en: {
    app: "ÖZER BEND PRO V1",
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
    bottomRightWord: "Bottom Right",
    genelProfil: "GENERAL PROFILE",
    segmentUzunluk: "Length",
    segmentAci: "Angle",
    segmentYon: "Direction",
    yonYukari: "Up",
    yonAsagi: "Down",
    segmentEkle: "+ Add Segment",
    segmentSil: "Remove",
    favorites: "Favorites",
    favSave: "Save",
    favLoad: "Load",
    favDelete: "Delete",
    favEmpty: "No favorites saved.",
    favNamePrompt: "Favorite name:",
    toplamUzunluk: "Total Cut Length",
    bukumSayisi: "Bend Count",
    segment: "Segment",
    freeDrawBtn: "Free Draw",
    weightCalcBtn: "Weight Calculator",
    trademarkDisclaimer: "DURMA, Hardox and other product/brand names mentioned in the app are trademarks of their respective owners. This app is not affiliated with or endorsed by these companies; these names are used solely for compatibility/identification purposes."
  },
  fr: {
    app: "ÖZER BEND PRO V1",
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
    bottomRightWord: "Bas Droite",
    genelProfil: "PROFIL GÉNÉRAL",
    segmentUzunluk: "Longueur",
    segmentAci: "Angle",
    segmentYon: "Direction",
    yonYukari: "Haut",
    yonAsagi: "Bas",
    segmentEkle: "+ Ajouter un segment",
    segmentSil: "Retirer",
    favorites: "Favoris",
    favSave: "Enregistrer",
    favLoad: "Charger",
    favDelete: "Supprimer",
    favEmpty: "Aucun favori enregistré.",
    favNamePrompt: "Nom du favori :",
    toplamUzunluk: "Longueur totale de coupe",
    bukumSayisi: "Nombre de plis",
    segment: "Segment",
    freeDrawBtn: "Dessin Libre",
    weightCalcBtn: "Calculateur de Poids",
    trademarkDisclaimer: "DURMA, Hardox et les autres noms de produits/marques mentionnés dans l'application sont des marques déposées de leurs propriétaires respectifs. Cette application n'est pas affiliée à ces entreprises ni approuvée par elles ; ces noms sont utilisés uniquement à des fins de compatibilité/identification."
  },
  de: {
    app: "ÖZER BEND PRO V1",
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
    bottomRightWord: "Unten Rechts",
    genelProfil: "ALLGEMEINES PROFIL",
    segmentUzunluk: "Länge",
    segmentAci: "Winkel",
    segmentYon: "Richtung",
    yonYukari: "Oben",
    yonAsagi: "Unten",
    segmentEkle: "+ Segment hinzufügen",
    segmentSil: "Entfernen",
    favorites: "Favoriten",
    favSave: "Speichern",
    favLoad: "Laden",
    favDelete: "Löschen",
    favEmpty: "Keine Favoriten gespeichert.",
    favNamePrompt: "Favoritenname:",
    toplamUzunluk: "Gesamte Schnittlänge",
    bukumSayisi: "Anzahl der Biegungen",
    segment: "Segment",
    freeDrawBtn: "Freihandzeichnung",
    weightCalcBtn: "Gewichtsrechner",
    trademarkDisclaimer: "DURMA, Hardox und andere in der App genannte Produkt-/Markennamen sind Marken ihrer jeweiligen Inhaber. Diese App steht in keiner Verbindung zu diesen Unternehmen und wird von ihnen nicht unterstützt; diese Namen werden ausschließlich zu Kompatibilitäts-/Identifikationszwecken verwendet."
  },
  es: {
    app: "ÖZER BEND PRO V1",
    dims: "DIMENSIONES",
    profile: "PERFIL",
    settings: "AJUSTES",
    results: "RESULTADOS DE CORTE",
    cw: "Ancho de corte",
    ch: "Longitud de corte",
    draw: "2D",
    pdf: "PDF",
    print: "IMPRIMIR",
    share: "COMPARTIR",
    loading: "INICIANDO...",
    view3d: "3D",
    machineLabel: "Máquina",
    lowerDieLabel: "Matriz Inferior",
    upperDieLabel: "Punzón Superior",
    materialLabel: "Material",
    thicknessLabel: "Espesor de Chapa",
    insideRLabel: "Radio Interior",
    angleLabel: "Ángulo de Plegado",
    deductLabel: "Deducción de 15 mm",
    bdAutoLabel: "BD Automático",
    bdUnit: "mm / pliegue",
    manualBdToggle: "BD Manual",
    manualBdInputLabel: "BD Manual mm / pliegue",
    hardoxWarning: "El valor automático de BD para Hardox es una estimación NO VERIFICADA. No inicie la producción sin un pliegue de prueba real, introduzca el valor medido usando BD Manual.",
    feedbackBtn: "Enviar Comentarios",
    feedbackSubjectManual: "ÖZER BEND PRO - Comentarios",
    feedbackGreeting: "Hola,\n\nMi comentario/problema sobre la app:\n\n",
    autoErrorSubject: "ÖZER BEND PRO - Informe de Error Automático",
    autoErrorPrefix: "Ocurrió un error inesperado en la app:\n",
    autoErrorSuffix: "\n\n¿Desea informar este error al desarrollador por correo electrónico?",
    unknownError: "Error desconocido",
    unknownPromiseError: "Error de promise desconocido",
    lockedBadge: "V114 BLOQUEADO",
    cornerSingleBend: "ESQUINA (L) - PLIEGUE UNICO",
    lengthWord: "LONGITUD",
    leftWord: "Izquierda",
    rightWord: "Derecha",
    bottomLeftWord: "Inferior Izquierda",
    bottomRightWord: "Inferior Derecha",
    genelProfil: "PERFIL GENERAL",
    segmentUzunluk: "Longitud",
    segmentAci: "Ángulo",
    segmentYon: "Dirección",
    yonYukari: "Arriba",
    yonAsagi: "Abajo",
    segmentEkle: "+ Añadir Segmento",
    segmentSil: "Quitar",
    favorites: "Favoritos",
    favSave: "Guardar",
    favLoad: "Cargar",
    favDelete: "Eliminar",
    favEmpty: "No hay favoritos guardados.",
    favNamePrompt: "Nombre del favorito:",
    toplamUzunluk: "Longitud Total de Corte",
    bukumSayisi: "Número de Pliegues",
    segment: "Segmento",
    freeDrawBtn: "Dibujo Libre",
    weightCalcBtn: "Calculadora de Peso",
    trademarkDisclaimer: "DURMA, Hardox y otros nombres de productos/marcas mencionados en la aplicación son marcas registradas de sus respectivos propietarios. Esta aplicación no está afiliada ni respaldada por estas empresas; estos nombres se utilizan únicamente con fines de compatibilidad/identificación."
  },
  it: {
    app: "ÖZER BEND PRO V1",
    dims: "DIMENSIONI",
    profile: "PROFILO",
    settings: "IMPOSTAZIONI",
    results: "RISULTATI DI TAGLIO",
    cw: "Larghezza di taglio",
    ch: "Lunghezza di taglio",
    draw: "2D",
    pdf: "PDF",
    print: "STAMPA",
    share: "CONDIVIDI",
    loading: "AVVIO...",
    view3d: "3D",
    machineLabel: "Macchina",
    lowerDieLabel: "Matrice Inferiore",
    upperDieLabel: "Punzone Superiore",
    materialLabel: "Materiale",
    thicknessLabel: "Spessore Lamiera",
    insideRLabel: "Raggio Interno",
    angleLabel: "Angolo di Piega",
    deductLabel: "Detrazione 15 mm",
    bdAutoLabel: "BD Automatico",
    bdUnit: "mm / piega",
    manualBdToggle: "BD Manuale",
    manualBdInputLabel: "BD Manuale mm / piega",
    hardoxWarning: "Il valore automatico di BD per Hardox è una stima NON VERIFICATA. Non avviare la produzione senza una piega di prova reale, inserisci il valore misurato usando BD Manuale.",
    feedbackBtn: "Invia Feedback",
    feedbackSubjectManual: "ÖZER BEND PRO - Feedback",
    feedbackGreeting: "Ciao,\n\nIl mio feedback/problema sull'app:\n\n",
    autoErrorSubject: "ÖZER BEND PRO - Segnalazione Errore Automatica",
    autoErrorPrefix: "Si è verificato un errore imprevisto nell'app:\n",
    autoErrorSuffix: "\n\nVuoi segnalare questo errore allo sviluppatore via email?",
    unknownError: "Errore sconosciuto",
    unknownPromiseError: "Errore di promise sconosciuto",
    lockedBadge: "V114 BLOCCATO",
    cornerSingleBend: "ANGOLO (L) - PIEGA SINGOLA",
    lengthWord: "LUNGHEZZA",
    leftWord: "Sinistra",
    rightWord: "Destra",
    bottomLeftWord: "In Basso a Sinistra",
    bottomRightWord: "In Basso a Destra",
    genelProfil: "PROFILO GENERALE",
    segmentUzunluk: "Lunghezza",
    segmentAci: "Angolo",
    segmentYon: "Direzione",
    yonYukari: "Su",
    yonAsagi: "Giù",
    segmentEkle: "+ Aggiungi Segmento",
    segmentSil: "Rimuovi",
    favorites: "Preferiti",
    favSave: "Salva",
    favLoad: "Carica",
    favDelete: "Elimina",
    favEmpty: "Nessun preferito salvato.",
    favNamePrompt: "Nome preferito:",
    toplamUzunluk: "Lunghezza Totale di Taglio",
    bukumSayisi: "Numero di Pieghe",
    segment: "Segmento",
    freeDrawBtn: "Disegno Libero",
    weightCalcBtn: "Calcolatore di Peso",
    trademarkDisclaimer: "DURMA, Hardox e altri nomi di prodotti/marchi menzionati nell'app sono marchi dei rispettivi proprietari. Questa app non è affiliata né approvata da queste aziende; questi nomi sono utilizzati esclusivamente a scopo di compatibilità/identificazione."
  },
  ru: {
    app: "ÖZER BEND PRO V1",
    dims: "РАЗМЕРЫ",
    profile: "ПРОФИЛЬ",
    settings: "НАСТРОЙКИ",
    results: "РЕЗУЛЬТАТЫ РАСКРОЯ",
    cw: "Ширина раскроя",
    ch: "Длина раскроя",
    draw: "2D",
    pdf: "PDF",
    print: "ПЕЧАТЬ",
    share: "ПОДЕЛИТЬСЯ",
    loading: "ЗАПУСК...",
    view3d: "3D",
    machineLabel: "Станок",
    lowerDieLabel: "Нижний штамп",
    upperDieLabel: "Верхний пуансон",
    materialLabel: "Материал",
    thicknessLabel: "Толщина листа",
    insideRLabel: "Внутренний радиус",
    angleLabel: "Угол гиба",
    deductLabel: "Вычет 15 мм",
    bdAutoLabel: "Авто BD",
    bdUnit: "мм / гиб",
    manualBdToggle: "Ручной BD",
    manualBdInputLabel: "Ручной BD мм / гиб",
    hardoxWarning: "Автоматическое значение BD для Hardox является неподтверждённой оценкой. Не начинайте производство без реального пробного гиба, введите значение измеренное на пробном гибе используя Ручной BD.",
    feedbackBtn: "Отправить отзыв",
    feedbackSubjectManual: "ÖZER BEND PRO - Отзыв",
    feedbackGreeting: "Здравствуйте,\n\nМой отзыв/проблема о приложении:\n\n",
    autoErrorSubject: "ÖZER BEND PRO - Автоматический отчёт об ошибке",
    autoErrorPrefix: "В приложении произошла непредвиденная ошибка:\n",
    autoErrorSuffix: "\n\nХотите сообщить об этой ошибке разработчику по электронной почте?",
    unknownError: "Неизвестная ошибка",
    unknownPromiseError: "Неизвестная ошибка promise",
    lockedBadge: "V114 ЗАБЛОКИРОВАНО",
    cornerSingleBend: "УГОЛ (L) - ОДИНОЧНЫЙ ГИБ",
    lengthWord: "ДЛИНА",
    leftWord: "Левый",
    rightWord: "Правый",
    bottomLeftWord: "Нижний левый",
    bottomRightWord: "Нижний правый",
    genelProfil: "ОБЩИЙ ПРОФИЛЬ",
    segmentUzunluk: "Длина",
    segmentAci: "Угол",
    segmentYon: "Направление",
    yonYukari: "Вверх",
    yonAsagi: "Вниз",
    segmentEkle: "+ Добавить сегмент",
    segmentSil: "Удалить",
    favorites: "Избранное",
    favSave: "Сохранить",
    favLoad: "Загрузить",
    favDelete: "Удалить",
    favEmpty: "Нет сохранённых избранных.",
    favNamePrompt: "Название избранного:",
    toplamUzunluk: "Общая длина раскроя",
    bukumSayisi: "Количество гибов",
    segment: "Сегмент",
    freeDrawBtn: "Свободное рисование",
    weightCalcBtn: "Калькулятор веса",
    trademarkDisclaimer: "DURMA, Hardox и другие названия продуктов/торговых марок, упомянутые в приложении, являются товарными знаками соответствующих владельцев. Это приложение не связано с этими компаниями и не одобрено ими; эти названия используются исключительно в целях совместимости/идентификации."
  },
  pt: {
    app: "ÖZER BEND PRO V1",
    dims: "DIMENSÕES",
    profile: "PERFIL",
    settings: "CONFIGURAÇÕES",
    results: "RESULTADOS DE CORTE",
    cw: "Largura de corte",
    ch: "Comprimento de corte",
    draw: "2D",
    pdf: "PDF",
    print: "IMPRIMIR",
    share: "COMPARTILHAR",
    loading: "INICIANDO...",
    view3d: "3D",
    machineLabel: "Máquina",
    lowerDieLabel: "Matriz Inferior",
    upperDieLabel: "Punção Superior",
    materialLabel: "Material",
    thicknessLabel: "Espessura da Chapa",
    insideRLabel: "Raio Interno",
    angleLabel: "Ângulo de Dobra",
    deductLabel: "Dedução de 15 mm",
    bdAutoLabel: "BD Automático",
    bdUnit: "mm / dobra",
    manualBdToggle: "BD Manual",
    manualBdInputLabel: "BD Manual mm / dobra",
    hardoxWarning: "O valor automático de BD para Hardox é uma estimativa NÃO VERIFICADA. Não inicie a produção sem uma dobra de teste real, insira o valor medido usando BD Manual.",
    feedbackBtn: "Enviar Feedback",
    feedbackSubjectManual: "ÖZER BEND PRO - Feedback",
    feedbackGreeting: "Olá,\n\nMeu feedback/problema sobre o app:\n\n",
    autoErrorSubject: "ÖZER BEND PRO - Relatório de Erro Automático",
    autoErrorPrefix: "Ocorreu um erro inesperado no app:\n",
    autoErrorSuffix: "\n\nDeseja relatar este erro ao desenvolvedor por e-mail?",
    unknownError: "Erro desconhecido",
    unknownPromiseError: "Erro de promise desconhecido",
    lockedBadge: "V114 BLOQUEADO",
    cornerSingleBend: "CANTO (L) - DOBRA UNICA",
    lengthWord: "COMPRIMENTO",
    leftWord: "Esquerda",
    rightWord: "Direita",
    bottomLeftWord: "Inferior Esquerda",
    bottomRightWord: "Inferior Direita",
    genelProfil: "PERFIL GERAL",
    segmentUzunluk: "Comprimento",
    segmentAci: "Ângulo",
    segmentYon: "Direção",
    yonYukari: "Cima",
    yonAsagi: "Baixo",
    segmentEkle: "+ Adicionar Segmento",
    segmentSil: "Remover",
    favorites: "Favoritos",
    favSave: "Salvar",
    favLoad: "Carregar",
    favDelete: "Excluir",
    favEmpty: "Nenhum favorito salvo.",
    favNamePrompt: "Nome do favorito:",
    toplamUzunluk: "Comprimento Total de Corte",
    bukumSayisi: "Número de Dobras",
    segment: "Segmento",
    freeDrawBtn: "Desenho Livre",
    weightCalcBtn: "Calculadora de Peso",
    trademarkDisclaimer: "DURMA, Hardox e outros nomes de produtos/marcas mencionados no aplicativo são marcas registradas de seus respectivos proprietários. Este aplicativo não é afiliado nem endossado por essas empresas; esses nomes são usados apenas para fins de compatibilidade/identificação."
  },
  pl: {
    app: "ÖZER BEND PRO V1",
    dims: "WYMIARY",
    profile: "PROFIL",
    settings: "USTAWIENIA",
    results: "WYNIKI CIĘCIA",
    cw: "Szerokość cięcia",
    ch: "Długość cięcia",
    draw: "2D",
    pdf: "PDF",
    print: "DRUKUJ",
    share: "UDOSTĘPNIJ",
    loading: "URUCHAMIANIE...",
    view3d: "3D",
    machineLabel: "Maszyna",
    lowerDieLabel: "Matryca Dolna",
    upperDieLabel: "Stempel Górny",
    materialLabel: "Materiał",
    thicknessLabel: "Grubość Blachy",
    insideRLabel: "Promień Wewnętrzny",
    angleLabel: "Kąt Gięcia",
    deductLabel: "Odjęcie 15 mm",
    bdAutoLabel: "Auto BD",
    bdUnit: "mm / gięcie",
    manualBdToggle: "Ręczne BD",
    manualBdInputLabel: "Ręczne BD mm / gięcie",
    hardoxWarning: "Automatyczna wartość BD dla Hardox jest niezweryfikowanym oszacowaniem. Nie rozpoczynaj produkcji bez rzeczywistego gięcia próbnego, wprowadź wartość zmierzoną używając Ręczne BD.",
    feedbackBtn: "Wyślij Opinię",
    feedbackSubjectManual: "ÖZER BEND PRO - Opinia",
    feedbackGreeting: "Cześć,\n\nMoja opinia/problem dotyczący aplikacji:\n\n",
    autoErrorSubject: "ÖZER BEND PRO - Automatyczny Raport Błędu",
    autoErrorPrefix: "W aplikacji wystąpił nieoczekiwany błąd:\n",
    autoErrorSuffix: "\n\nCzy chcesz zgłosić ten błąd programiście e-mailem?",
    unknownError: "Nieznany błąd",
    unknownPromiseError: "Nieznany błąd promise",
    lockedBadge: "V114 ZABLOKOWANE",
    cornerSingleBend: "NAROŻNIK (L) - POJEDYNCZE GIĘCIE",
    lengthWord: "DŁUGOŚĆ",
    leftWord: "Lewy",
    rightWord: "Prawy",
    bottomLeftWord: "Dolny Lewy",
    bottomRightWord: "Dolny Prawy",
    genelProfil: "PROFIL OGÓLNY",
    segmentUzunluk: "Długość",
    segmentAci: "Kąt",
    segmentYon: "Kierunek",
    yonYukari: "Góra",
    yonAsagi: "Dół",
    segmentEkle: "+ Dodaj Segment",
    segmentSil: "Usuń",
    favorites: "Ulubione",
    favSave: "Zapisz",
    favLoad: "Wczytaj",
    favDelete: "Usuń",
    favEmpty: "Brak zapisanych ulubionych.",
    favNamePrompt: "Nazwa ulubionego:",
    toplamUzunluk: "Całkowita Długość Cięcia",
    bukumSayisi: "Liczba Gięć",
    segment: "Segment",
    freeDrawBtn: "Rysowanie Odręczne",
    weightCalcBtn: "Kalkulator Wagi",
    trademarkDisclaimer: "DURMA, Hardox i inne nazwy produktów/marek wymienione w aplikacji są znakami towarowymi ich odpowiednich właścicieli. Ta aplikacja nie jest powiązana z tymi firmami ani przez nie zatwierdzona; te nazwy są używane wyłącznie w celach kompatybilności/identyfikacji."
  },
  zh: {
    app: "ÖZER BEND PRO V1",
    dims: "尺寸",
    profile: "型材",
    settings: "设置",
    results: "切割结果",
    cw: "切割宽度",
    ch: "切割长度",
    draw: "2D",
    pdf: "PDF",
    print: "打印",
    share: "分享",
    loading: "启动中...",
    view3d: "3D",
    machineLabel: "机床",
    lowerDieLabel: "下模",
    upperDieLabel: "上模",
    materialLabel: "材料",
    thicknessLabel: "板材厚度",
    insideRLabel: "内半径",
    angleLabel: "弯曲角度",
    deductLabel: "15毫米扣除",
    bdAutoLabel: "自动BD",
    bdUnit: "毫米/弯",
    manualBdToggle: "手动BD",
    manualBdInputLabel: "手动BD 毫米/弯",
    hardoxWarning: "Hardox材料的自动BD值为未经验证的估算值,请勿在没有实际试弯的情况下开始生产,请使用手动BD输入试弯测量的数值。",
    feedbackBtn: "发送反馈",
    feedbackSubjectManual: "ÖZER BEND PRO - 反馈",
    feedbackGreeting: "您好,\n\n我对该应用的反馈/问题:\n\n",
    autoErrorSubject: "ÖZER BEND PRO - 自动错误报告",
    autoErrorPrefix: "应用程序发生意外错误:\n",
    autoErrorSuffix: "\n\n是否要通过电子邮件向开发者报告此错误?",
    unknownError: "未知错误",
    unknownPromiseError: "未知的Promise错误",
    lockedBadge: "V114 已锁定",
    cornerSingleBend: "转角(L) - 单弯",
    lengthWord: "长度",
    leftWord: "左",
    rightWord: "右",
    bottomLeftWord: "左下",
    bottomRightWord: "右下",
    genelProfil: "通用型材",
    segmentUzunluk: "长度",
    segmentAci: "角度",
    segmentYon: "方向",
    yonYukari: "向上",
    yonAsagi: "向下",
    segmentEkle: "+ 添加段",
    segmentSil: "删除",
    favorites: "收藏",
    favSave: "保存",
    favLoad: "加载",
    favDelete: "删除",
    favEmpty: "没有已保存的收藏。",
    favNamePrompt: "收藏名称:",
    toplamUzunluk: "总切割长度",
    bukumSayisi: "弯曲次数",
    segment: "段",
    freeDrawBtn: "自由绘图",
    weightCalcBtn: "重量计算器",
    trademarkDisclaimer: "DURMA、Hardox 及应用程序中提到的其他产品/品牌名称均为其各自所有者的商标。本应用程序与这些公司无关，也未获得其认可；这些名称仅用于兼容性/识别目的。"
  },
  ar: {
    app: "ÖZER BEND PRO V1",
    dims: "الأبعاد",
    profile: "الملف",
    settings: "الإعدادات",
    results: "نتائج القص",
    cw: "عرض القص",
    ch: "طول القص",
    draw: "2D",
    pdf: "PDF",
    print: "طباعة",
    share: "مشاركة",
    loading: "جاري البدء...",
    view3d: "3D",
    machineLabel: "الماكينة",
    lowerDieLabel: "القالب السفلي",
    upperDieLabel: "المكبس العلوي",
    materialLabel: "المادة",
    thicknessLabel: "سماكة الصفيحة",
    insideRLabel: "نصف القطر الداخلي",
    angleLabel: "زاوية الثني",
    deductLabel: "خصم 15 مم",
    bdAutoLabel: "BD تلقائي",
    bdUnit: "مم / ثنية",
    manualBdToggle: "BD يدوي",
    manualBdInputLabel: "BD يدوي مم / ثنية",
    hardoxWarning: "قيمة BD التلقائية لمادة Hardox هي تقدير غير مؤكد. لا تبدأ الإنتاج دون ثنية اختبار حقيقية.",
    feedbackBtn: "إرسال ملاحظات",
    feedbackSubjectManual: "ÖZER BEND PRO - ملاحظات",
    feedbackGreeting: "مرحباً،\n\nملاحظاتي حول التطبيق:\n\n",
    autoErrorSubject: "ÖZER BEND PRO - تقرير خطأ تلقائي",
    autoErrorPrefix: "حدث خطأ غير متوقع في التطبيق:\n",
    autoErrorSuffix: "\n\nهل تريد الإبلاغ عن هذا الخطأ للمطور؟",
    unknownError: "خطأ غير معروف",
    unknownPromiseError: "خطأ غير معروف",
    lockedBadge: "V114 مقفل",
    cornerSingleBend: "زاوية (L) - ثنية واحدة",
    lengthWord: "الطول",
    leftWord: "يسار",
    rightWord: "يمين",
    bottomLeftWord: "أسفل يسار",
    bottomRightWord: "أسفل يمين",
    genelProfil: "ملف عام",
    segmentUzunluk: "الطول",
    segmentAci: "الزاوية",
    segmentYon: "الاتجاه",
    yonYukari: "أعلى",
    yonAsagi: "أسفل",
    segmentEkle: "+ إضافة قطعة",
    segmentSil: "إزالة",
    favorites: "المفضلة",
    favSave: "حفظ",
    favLoad: "تحميل",
    favDelete: "حذف",
    favEmpty: "لا توجد مفضلات محفوظة.",
    favNamePrompt: "اسم المفضلة:",
    toplamUzunluk: "إجمالي طول القص",
    bukumSayisi: "عدد الثنيات",
    segment: "قطعة",
    freeDrawBtn: "رسم حر",
    weightCalcBtn: "حاسبة الوزن",
    trademarkDisclaimer: "DURMA وHardox وأسماء المنتجات/العلامات التجارية الأخرى المذكورة في التطبيق هي علامات تجارية لأصحابها المعنيين. هذا التطبيق غير مرتبط بهذه الشركات ولم تتم الموافقة عليه من قبلها؛ تُستخدم هذه الأسماء فقط لأغراض التوافق/التعريف."
  }
};

const LANGUAGES = [
  { code: "tr", flag: "🇹🇷", label: "Türkçe" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
  { code: "pl", flag: "🇵🇱", label: "Polski" },
  { code: "zh", flag: "🇨🇳", label: "中文" },
  { code: "ar", flag: "🇩🇿", label: "الجزائر" }
];

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("ozerbend_lang");
      if (saved) return saved;
    } catch (e) {}
    return "tr";
  });

  useEffect(() => {
    try {
      localStorage.setItem("ozerbend_lang", lang);
    } catch (e) {}
  }, [lang]);
  const [showSettings, setShowSettings] = useState(false);
  const [companyLogo, setCompanyLogoState] = useState(() => getCompanyLogo());
  const [proActive, setProActive] = useState(() => isProUser());
  const [proPriceLabel, setProPriceLabel] = useState(null);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseMsg, setPurchaseMsg] = useState(null);

  useEffect(() => {
    initBilling().then(() => {
      setProActive(isProUser());
      getProPriceString().then((price) => { if (price) setProPriceLabel(price); });
    });
  }, []);

  const handleBuyPro = async () => {
    setPurchaseBusy(true);
    setPurchaseMsg(null);
    const res = await purchasePro();
    setPurchaseBusy(false);
    if (res.ok && res.active) {
      setProActive(true);
      setPurchaseMsg({ ok: true, text: stx(lang).proActive });
    } else if (!res.cancelled) {
      setPurchaseMsg({ ok: false, text: res.message });
    }
  };

  const handleRestorePurchases = async () => {
    setPurchaseBusy(true);
    setPurchaseMsg(null);
    const res = await restorePurchases();
    setPurchaseBusy(false);
    if (res.ok && res.active) {
      setProActive(true);
      setPurchaseMsg({ ok: true, text: stx(lang).proActive });
    } else if (res.ok && !res.active) {
      setPurchaseMsg({ ok: false, text: lang === "tr" ? "Bu hesaba ait aktif satın alma bulunamadı." : "No active purchase found for this account." });
    } else {
      setPurchaseMsg({ ok: false, text: res.message });
    }
  };
  const handleLogoFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, 600 / img.width);
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * sc);
        cv.height = Math.round(img.height * sc);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        const dataUrl = cv.toDataURL("image/png");
        setCompanyLogo(dataUrl);
        setCompanyLogoState(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const handleLogoRemove = () => { setCompanyLogo(null); setCompanyLogoState(null); };
  const [companyName, setCompanyName] = useState(() => {
    try {
      const saved = localStorage.getItem("ozerbend_company");
      if (saved) return saved;
    } catch (e) {}
    return "";
  });
  useEffect(() => {
    try {
      localStorage.setItem("ozerbend_company", companyName);
    } catch (e) {}
  }, [companyName]);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef(null);

  const [profileType, setProfileType] = useState("kapi");
  const [freeDrawOpen, setFreeDrawOpen] = useState(false);
  const [weightCalcOpen, setWeightCalcOpen] = useState(false);

  const [A, setA] = useState(20);
  const [B, setB] = useState(20);
  const [C, setC] = useState(40);
  const [D, setD] = useState(40);
  const [EN, setEN] = useState(1000);
  const [H, setH] = useState(2000);

  const [segments, setSegments] = useState([
    { length: 100, angle: 90, dir: 1 },
    { length: 100, angle: 90, dir: 1 },
    { length: 100 }
  ]);

  const [machine, setMachine] = useState("DURMA Easy");
  const [lowerDie, setLowerDie] = useState("M.460.R/F V16");
  const [upperDie, setUpperDie] = useState("P.97.75.R08/F");

  const dieGroupKey = MACHINE_DIE_GROUP[machine] || "EU_STANDARD";
  const availableLowerDies = DIE_GROUPS[dieGroupKey].lower;
  const availableUpperDies = DIE_GROUPS[dieGroupKey].upper;

  useEffect(() => {
    if (!availableLowerDies.includes(lowerDie)) {
      setLowerDie(availableLowerDies[0]);
    }
    if (!availableUpperDies.includes(upperDie)) {
      setUpperDie(availableUpperDies[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machine]);
  const [material, setMaterial] = useState("DKP");
  const [thickness, setThickness] = useState(2);
  const [bendAngle, setBendAngle] = useState(90);
  const [insideR, setInsideR] = useState(2.42);
  const [deduct, setDeduct] = useState(15);
  const [manualBd, setManualBd] = useState(false);
  const [manualBdValue, setManualBdValue] = useState(3.30);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ozerbend_history");
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const persistHistory = (list) => {
    setHistory(list);
    try {
      localStorage.setItem("ozerbend_history", JSON.stringify(list));
    } catch (e) {}
  };

  const pushHistoryEntry = () => {
    const entry = {
      id: Date.now(),
      profileType, A, B, C, D, EN, H,
      segments: isGeneral ? segments : undefined,
      material, thickness, bendAngle, insideR, deduct, manualBd, manualBdValue,
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 15);
      try {
        localStorage.setItem("ozerbend_history", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const applyHistoryEntry = (item) => {
    setProfileType(item.profileType);
    setA(item.A); setB(item.B); setC(item.C); setD(item.D); setEN(item.EN); setH(item.H);
    if (item.segments) setSegments(item.segments);
    setMaterial(item.material); setThickness(item.thickness);
    setBendAngle(item.bendAngle); setInsideR(item.insideR);
    setDeduct(item.deduct); setManualBd(item.manualBd); setManualBdValue(item.manualBdValue);
    setShowHistory(false);
  };

  const deleteHistoryEntry = (id) => {
    persistHistory(history.filter((h) => h.id !== id));
  };

  const clearHistoryAll = () => {
    persistHistory([]);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ozerbend_favorites");
      if (raw) setFavorites(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const persistFavorites = (list) => {
    setFavorites(list);
    try {
      localStorage.setItem("ozerbend_favorites", JSON.stringify(list));
    } catch (e) {}
  };

  const saveFavorite = () => {
    const name = window.prompt(t.favNamePrompt || "Favori adi:");
    if (!name) return;
    const fav = {
      id: Date.now(),
      name,
      profileType, A, B, C, D, EN, H,
      segments: isGeneral ? segments : undefined,
      material, thickness, bendAngle, insideR, deduct, manualBd, manualBdValue,
    };
    persistFavorites([fav, ...favorites]);
  };

  const applyFavorite = (fav) => {
    setProfileType(fav.profileType);
    setA(fav.A); setB(fav.B); setC(fav.C); setD(fav.D); setEN(fav.EN); setH(fav.H);
    if (fav.segments) setSegments(fav.segments);
    setMaterial(fav.material); setThickness(fav.thickness);
    setBendAngle(fav.bendAngle); setInsideR(fav.insideR);
    setDeduct(fav.deduct); setManualBd(fav.manualBd); setManualBdValue(fav.manualBdValue);
    setShowFavorites(false);
  };

  const deleteFavorite = (id) => {
    persistFavorites(favorites.filter((f) => f.id !== id));
  };

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

  const computedBd = useMemo(() => autoBdValue({ material, thickness, bendAngle, insideR }), [material, thickness, bendAngle, insideR]);
  const bd = manualBd ? Number(manualBdValue) || 0 : computedBd;

  const isLProfile = profileType === "l";
  const isGeneral = profileType === "genel";
  const isKapi = profileType === "kapi";
  const bendCount = isLProfile ? 1 : isGeneral ? Math.max(0, segments.length - 1) : 4;
  const total = isLProfile ? A + B : isGeneral ? segments.reduce((s, seg) => s + (Number(seg.length) || 0), 0) : A + B + C + D + EN;
  const bdToplam = bd * bendCount;
  // Kapı profilinde mevcut 15 mm düşüm korunur. Köşebent ve genel profilde
  // ekstra düşüm uygulanmaz, sadece büküm başına BD çıkarılır.
  const kesilecekEn = isKapi ? total - bdToplam - deduct : total - bdToplam;
  const kesilecekBoy = isKapi ? H - deduct : null;
  const data = { profileType, A, B, C, D, EN, H, bd, deduct, material, kalip: lowerDie, upperDie, machine, thickness, aci: bendAngle, icR: insideR, bendCount, segments: isGeneral ? segments : undefined, companyName };
  const materialDensityGCm3 = MATERIAL_DENSITY[material] ?? 7.85;
  const weightKg = isKapi && kesilecekBoy != null
    ? (kesilecekEn * kesilecekBoy * Number(thickness) * materialDensityGCm3) / 1e6
    : null;
  const result = { kesilecekEn, kesilecekBoy, bdToplam, weightKg };

  const addSegment = () => {
    setSegments((prev) => {
      const next = [...prev];
      const lastIdx = next.length - 1;
      next[lastIdx] = { ...next[lastIdx], angle: next[lastIdx].angle ?? 90, dir: next[lastIdx].dir ?? 1 };
      next.push({ length: 100 });
      return next;
    });
  };
  const removeSegment = () => {
    setSegments((prev) => {
      if (prev.length <= 2) return prev;
      const next = prev.slice(0, -1);
      const lastIdx = next.length - 1;
      next[lastIdx] = { length: next[lastIdx].length };
      return next;
    });
  };
  const updateSegment = (i, field, value) => {
    setSegments((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const genelPointsReal = isGeneral ? computeGeneralPoints(segments) : [];
  const genelPointsSvg = isGeneral ? scalePointsToBox(genelPointsReal, 900, 340, 45) : [];

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

  // 3D görünüm için: her profil türünü aynı segment zincirine çevirip tek bir
  // kesit (cross-section) nokta dizisi üretiyoruz. Sadece görselleştirme
  // amaçlıdır, sayısal hesaplamaları (BD, kesilecek ölçü) etkilemez.
  // useMemo: sadece gerçekten ilgili değerler değiştiğinde yeniden hesaplanır,
  // böylece 3D sahne ilgisiz her render'da sıfırdan kurulmaz (döndürme
  // konumu korunur).
  const crossSection3D = useMemo(() => {
    if (isGeneral) return genelPointsReal;
    if (isLProfile) return computeGeneralPoints([{ length: B, angle: lAngle, dir: -1 }, { length: A }]);
    return computeGeneralPoints([
      { length: A, angle: bendAngle, dir: 1 },
      { length: B, angle: bendAngle, dir: 1 },
      { length: EN, angle: bendAngle, dir: 1 },
      { length: C, angle: bendAngle, dir: 1 },
      { length: D }
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeneral, isLProfile, A, B, C, D, EN, bendAngle, lAngle, segments]);

  // Sadece "Kapi Profili" modunda, 3D onizlemede ayak/buku (A/B/C/D) olculerini
  // gorsel olarak buyutuyoruz ki bukumler ekranda net secilsin. EN (ana yuz
  // uzunlugu) ve tum gercek hesaplamalar (PDF, kesilecek en/boy, etiketler)
  // BU DEGERDEN ETKILENMEZ — sadece 3D gorunumu icin ayri bir nokta dizisi.
  const DISPLAY_LEG_SCALE = 2;
  const crossSection3DDisplay = useMemo(() => {
    if (!isKapi) return crossSection3D;
    return computeGeneralPoints([
      { length: A * DISPLAY_LEG_SCALE, angle: bendAngle, dir: 1 },
      { length: B * DISPLAY_LEG_SCALE, angle: bendAngle, dir: 1 },
      { length: EN, angle: bendAngle, dir: 1 },
      { length: C * DISPLAY_LEG_SCALE, angle: bendAngle, dir: 1 },
      { length: D * DISPLAY_LEG_SCALE }
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKapi, crossSection3D, A, B, C, D, EN, bendAngle]);
  const crossSectionXs = crossSection3D.map((p) => p.x);
  const crossSectionYs = crossSection3D.map((p) => p.y);
  const crossSectionSize = Math.max(
    1,
    Math.max(...crossSectionXs) - Math.min(...crossSectionXs),
    Math.max(...crossSectionYs) - Math.min(...crossSectionYs)
  );
  const extrusionDepth3D = isKapi && H > 0 ? H : crossSectionSize * 1.3;
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

  const drawing2D = isLProfile ? (
    <svg viewBox="0 0 900 360">
      <path d={`M${bx2} ${by2} L${cx} ${cy} L${ax2} ${ay2}`} className="profile" />
      <line x1={cx} y1={cy + 36} x2={ax2} y2={cy + 36} className="dim" />
      <line x1={cx} y1={cy + 20} x2={cx} y2={cy + 52} className="dim" />
      <line x1={ax2} y1={cy + 20} x2={ax2} y2={cy + 52} className="dim" />
      <text x={(cx + ax2) / 2} y={cy + 68} className="txt">A: {A} mm</text>
      <line x1={bDimX1} y1={bDimY1} x2={bDimX2} y2={bDimY2} className="dim" />
      <line x1={cx} y1={cy} x2={bDimX1} y2={bDimY1} className="dimSoft" />
      <line x1={bx2} y1={by2} x2={bDimX2} y2={bDimY2} className="dimSoft" />
      <text x={bTextX} y={bTextY} className="txt">B: {B} mm</text>
      <path d={`M${cx + arcR} ${cy} A${arcR} ${arcR} 0 ${arcLarge} 0 ${arcEndX} ${arcEndY}`} className="angleArc" />
      <text x={cx + 80} y={cy - 36} className="angle">{lAngle}°</text>
      <text x="470" y="82" className="bottom">{t.cornerSingleBend}</text>
    </svg>
  ) : isGeneral ? (
    <svg viewBox="0 0 900 340">
      <path
        d={genelPointsSvg.length ? "M" + genelPointsSvg.map((p) => `${p.x} ${p.y}`).join(" L") : ""}
        className="profile"
      />
      {(() => {
        const cx = genelPointsSvg.reduce((s, pt) => s + pt.x, 0) / genelPointsSvg.length;
        const cy = genelPointsSvg.reduce((s, pt) => s + pt.y, 0) / genelPointsSvg.length;
        return genelPointsSvg.slice(0, -1).map((p, i) => {
          const p2 = genelPointsSvg[i + 1];
          const midX = (p.x + p2.x) / 2;
          const midY = (p.y + p2.y) / 2;
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          let nx = -dy / len;
          let ny = dx / len;
          if (nx * (midX - cx) + ny * (midY - cy) < 0) {
            nx = -nx;
            ny = -ny;
          }
          const offset = 30;
          const labelX = midX + nx * offset;
          const labelY = midY + ny * offset;
          const lengthValue = Math.round(segments[i].length * 100) / 100;
          let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
          if (angleDeg > 90) angleDeg -= 180;
          if (angleDeg < -90) angleDeg += 180;
          return (
            <text
              key={"seg" + i}
              x={labelX}
              y={labelY}
              className="txt"
              textAnchor="middle"
              transform={`rotate(${angleDeg} ${labelX} ${labelY})`}
            >
              {lengthValue} mm
            </text>
          );
        });
      })()}
      {(() => {
        const cx = genelPointsSvg.reduce((s, pt) => s + pt.x, 0) / genelPointsSvg.length;
        const cy = genelPointsSvg.reduce((s, pt) => s + pt.y, 0) / genelPointsSvg.length;
        const allRightAngles = segments.every((seg) => (seg.angle ?? 90) === 90);
        const elements = [];

        genelPointsSvg.slice(1, -1).forEach((p, i) => {
          const prev = genelPointsSvg[i];
          const next = genelPointsSvg[i + 2];
          const dx1 = p.x - prev.x;
          const dy1 = p.y - prev.y;
          const dx2 = next.x - p.x;
          const dy2 = next.y - p.y;
          const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
          const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
          const ux1 = dx1 / len1;
          const uy1 = dy1 / len1;
          const ux2 = dx2 / len2;
          const uy2 = dy2 / len2;
          const angleValue = segments[i].angle ?? 90;
          const isRight = angleValue === 90;

          if (isRight) {
            const tickSize = 14;
            const c1x = p.x - ux1 * tickSize;
            const c1y = p.y - uy1 * tickSize;
            const c2x = p.x + ux2 * tickSize;
            const c2y = p.y + uy2 * tickSize;
            const cornerX = c1x + ux2 * tickSize;
            const cornerY = c1y + uy2 * tickSize;
            elements.push(
              <polyline
                key={"tick" + i}
                points={`${c1x},${c1y} ${cornerX},${cornerY} ${c2x},${c2y}`}
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
            );
          } else {
            let bx = -ux1 + ux2;
            let by = -uy1 + uy2;
            const blen = Math.sqrt(bx * bx + by * by) || 1;
            bx /= blen;
            by /= blen;
            if (bx * (cx - p.x) + by * (cy - p.y) < 0) {
              bx = -bx;
              by = -by;
            }
            const offset = 26;
            const labelX = p.x + bx * offset;
            const labelY = p.y + by * offset;
            elements.push(
              <text key={"ang" + i} x={labelX} y={labelY} className="angle">
                {angleValue}°
              </text>
            );
          }
        });

        if (allRightAngles) {
          const p0 = genelPointsSvg[0];
          const dx0 = cx - p0.x;
          const dy0 = cy - p0.y;
          const len0 = Math.sqrt(dx0 * dx0 + dy0 * dy0) || 1;
          const cornerOffset = 34;
          const labelX0 = p0.x + (dx0 / len0) * cornerOffset;
          const labelY0 = p0.y + (dy0 / len0) * cornerOffset;
          elements.push(
            <text key="ang-single" x={labelX0} y={labelY0} className="angle" textAnchor="middle">
              90°
            </text>
          );
        }

        return elements;
      })()}
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
      <line x1="160" y1="270" x2="340" y2="160" className="profile" />
      <text x="230" y="190" className="txt" transform="rotate(-31.4 230 190)">{H} mm</text>
    </svg>
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
            <label>{stx(lang).companyName}
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ÖZER BEND PRO"
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>{stx(lang).logoLabel}
              <input type="file" accept="image/*" onChange={handleLogoFile} />
              {companyLogo && (
                <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                  <img src={companyLogo} alt="logo" style={{ height: 40, background: "#fff", borderRadius: 4, padding: 2 }} />
                  <button type="button" onClick={handleLogoRemove}>{stx(lang).logoRemove}</button>
                </span>
              )}
            </label>
            <p style={{ gridColumn: "1 / -1", fontSize: 12, color: "#c9a227", margin: "2px 0" }}>
              {proActive
                ? stx(lang).proActive
                : (trialDaysLeft() > 0
                  ? stx(lang).trialLeft(trialDaysLeft())
                  : stx(lang).trialOver)}
            </p>
            <p style={{ fontSize: 11.5, color: "#8b929b", lineHeight: 1.6, gridColumn: "1 / -1", marginTop: 4 }}>
              © {new Date().getFullYear()} ÖZER BEND PRO. All rights reserved. DURMA, Hardox and other
              product/brand names mentioned in this app are trademarks of their respective owners.
              This app is not affiliated with or endorsed by these companies; these names are used
              solely for compatibility/identification purposes.
            </p>
            {select(t.machineLabel, machine, setMachine, machines)}
            {select(t.lowerDieLabel, lowerDie, setLowerDie, availableLowerDies)}
            {select(t.upperDieLabel, upperDie, setUpperDie, availableUpperDies)}
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

      {!proActive && (
        <section className="panel" style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", background: "linear-gradient(135deg,#1f1a12,#17130f)", border: "1px solid #c9a227" }}>
          <span style={{ fontSize: 12.5, color: "#c9a227", fontWeight: 600 }}>
            {trialDaysLeft() > 0 ? stx(lang).trialLeft(trialDaysLeft()) : stx(lang).trialOver}
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={purchaseBusy}
              onClick={handleBuyPro}
              style={{ background: "#c9a227", color: "#17130f", fontWeight: 700, border: "none", borderRadius: 6, padding: "8px 14px", cursor: purchaseBusy ? "wait" : "pointer" }}
            >
              {purchaseBusy ? stx(lang).buying : `${stx(lang).buyPro} ${proPriceLabel || "€4,99"}`}
            </button>
            <button
              type="button"
              disabled={purchaseBusy}
              onClick={handleRestorePurchases}
              style={{ background: "transparent", color: "#c9a227", border: "1px solid #c9a227", borderRadius: 6, padding: "7px 12px", fontSize: 12.5, cursor: purchaseBusy ? "wait" : "pointer" }}
            >
              {stx(lang).restore}
            </button>
          </div>
          {purchaseMsg && (
            <span style={{ width: "100%", fontSize: 12, color: purchaseMsg.ok ? "#4caf50" : "#e05555" }}>
              {purchaseMsg.text}
            </span>
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
              {profileTypeLabel(item, lang)}
            </button>
          ))}
        </div>
        <button
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
          {t.freeDrawBtn}
        </button>
        <button
          type="button"
          onClick={() => setWeightCalcOpen(true)}
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
          ⚖️ {t.weightCalcBtn}
        </button>
        {weightCalcOpen && <WeightCalc onClose={() => setWeightCalcOpen(false)} />}
      </section>

      {freeDrawOpen && (
        <FreeDrawCanvas
          maxSegments={15}
          lang={lang}
          onClose={() => setFreeDrawOpen(false)}
          onCommit={(segs) => {
            setSegments(segs);
            setProfileType("genel");
            setFreeDrawOpen(false);
          }}
        />
      )}

      <section className="panel">
        <div className="dimsHeaderRow">
        <h2>{t.dims}</h2>
        <div className="favWrap">
          <button type="button" className="favBtn" onClick={() => setShowFavorites(!showFavorites)}>⭐ {t.favorites}</button>
          <button type="button" className="favBtn" onClick={saveFavorite}>💾 {t.favSave}</button>
                <button type="button" className="favBtn" onClick={() => setShowHistory(!showHistory)}>🕘 Geçmiş</button>
        </div>
      </div>
      {showFavorites && (
        <div className="favPanel">
          {favorites.length === 0 ? (
            <p className="favEmpty">{t.favEmpty}</p>
          ) : (
            favorites.map((fav) => (
              <div className="favRow" key={fav.id}>
                <span>{fav.name}</span>
                <div>
                  <button type="button" onClick={() => applyFavorite(fav)}>{t.favLoad}</button>
                  <button type="button" onClick={() => deleteFavorite(fav.id)}>{t.favDelete}</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
        {showHistory && (
        <div className="favPanel">
          {history.length === 0 ? (
            <p className="favEmpty">Henüz geçmiş işlem yok.</p>
          ) : (
            <>
              {history.map((item) => (
                <div className="favRow" key={item.id}>
                  <span>{new Date(item.id).toLocaleString()} — {item.profileType === "kapi" ? "Kapı" : item.profileType === "l" ? "Köşebent" : "Genel"}</span>
                  <div>
                    <button type="button" onClick={() => applyHistoryEntry(item)}>Yükle</button>
                    <button type="button" onClick={() => deleteHistoryEntry(item.id)}>Sil</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={clearHistoryAll} style={{ width: "100%", marginTop: 8 }}>Tümünü Temizle</button>
            </>
          )}
        </div>
      )}
      {isGeneral ? (
          <div className="segmentEditor">
            {segments.map((seg, i) => (
              <div className="segmentRow" key={i}>
                <span className="segmentIndex">{t.segment} {i + 1}</span>
                <label>{t.segmentUzunluk}
                  <input
                    value={seg.length}
                    inputMode="decimal"
                    onChange={(e) => updateSegment(i, "length", Number(String(e.target.value).replace(",", ".")) || 0)}
                  />
                </label>
                {i < segments.length - 1 && (
                  <>
                    <label>{t.segmentAci}
                      <input
                        value={seg.angle ?? 90}
                        inputMode="decimal"
                        onChange={(e) => updateSegment(i, "angle", Number(String(e.target.value).replace(",", ".")) || 0)}
                      />
                    </label>
                    <button
                      type="button"
                      className={"dirBtn " + (seg.dir === -1 ? "dirDown" : "dirUp")}
                      onClick={() => updateSegment(i, "dir", seg.dir === -1 ? 1 : -1)}
                    >
                      {seg.dir === -1 ? `↓ ${t.yonAsagi}` : `↑ ${t.yonYukari}`}
                    </button>
                  </>
                )}
              </div>
            ))}
            <div className="segmentButtons">
              <button type="button" onClick={addSegment}>{t.segmentEkle}</button>
              {segments.length > 2 && <button type="button" onClick={removeSegment}>{t.segmentSil}</button>}
            </div>
          </div>
        ) : (
          <div className="grid">
            {input(isLProfile ? "A" : `A (${t.bottomLeftWord})`, A, setA)}
            {input(isLProfile ? "B" : `B (${t.bottomRightWord})`, B, setB)}
            {isLProfile && input(t.angleLabel, bendAngle, setBendAngle)}
            {isKapi && input(`C (${t.leftWord})`, C, setC)}
            {isKapi && input(`D (${t.rightWord})`, D, setD)}
            {isKapi && input("EN", EN, setEN)}
            {isKapi && input(t.lengthWord, H, setH)}
          </div>
        )}
      </section>

      <section className="panel infoStrip">
        <div><span>{t.machineLabel}</span><b>{machine}</b></div>
        <div><span>{t.lowerDieLabel}</span><b>{lowerDie}</b></div>
        <div><span>{t.upperDieLabel}</span><b>{upperDie}</b></div>
        <div><span>{t.materialLabel}</span><b>{materialLabel(material, lang)} {thickness} mm</b></div>
      </section>

      <section className="panel">
        <h2>{t.results}</h2>
        {isGeneral ? (
          <>
            <div className="resultItem"><span>{t.toplamUzunluk}</span><b>{kesilecekEn.toFixed(1)} mm</b></div>
            <div className="resultItem"><span>{t.bukumSayisi}</span><b>{bendCount}</b></div>
          </>
        ) : (
          <>
            <div className="resultItem"><span>{t.cw}</span><b>{kesilecekEn.toFixed(1)} mm</b></div>
            {isKapi && <div className="resultItem"><span>{t.ch}</span><b>{kesilecekBoy.toFixed(1)} mm</b></div>}
                {isKapi && result.weightKg != null && <div className="resultItem"><span>{t.weight}</span><b>{result.weightKg.toFixed(2)} kg</b></div>}
          </>
        )}
      </section>

      <section className="panel">
        <h2>{t.draw}</h2>
        <div className="drawingBox" onClick={() => setShowFullscreen(true)} role="button">
          <div className="fsOpenHint">🔍</div>
          {drawing2D}
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

      {showFullscreen && !canUse3D() && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 42 }}>🔒</div>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>3D önizleme PRO özelliğidir / 3D preview is a PRO feature</div>
            <div style={{ color: "#bbb", fontSize: 13, maxWidth: 420 }}>7 günlük deneme süreniz doldu. Sınırsız PDF, logo ve 3D için PRO (4.99€, tek seferlik).</div>
            <button type="button" onClick={() => setShowFullscreen(false)} style={{ marginTop: 8, padding: "10px 22px", borderRadius: 8, border: "1px solid #c9a227", background: "#c9a227", color: "#000", fontWeight: 700 }}>Kapat / Close</button>
          </div>
        )}
        {showFullscreen && canUse3D() && (
        <FullscreenViewer
          points={crossSection3DDisplay}
          thickness={thickness}
          depth={extrusionDepth3D}
          svgContent={drawing2D}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
