const fs = require("fs");

// ---------- 1) src/license.js ----------
const LICENSE = `// OZER BEND PRO - Lisans / Deneme / Gunluk limit yonetimi (localStorage)
const KEYS = {
  trialStart: "obp_trial_start",
  pro: "obp_pro_active",
  logo: "obp_company_logo",
  pdfCount: "obp_pdf_daily"
};

export const TRIAL_DAYS = 7;
export const DAILY_FREE_PDF = 3;

(function initTrial() {
  try {
    if (!localStorage.getItem(KEYS.trialStart)) {
      localStorage.setItem(KEYS.trialStart, String(Date.now()));
    }
  } catch (e) {}
})();

export function isProUser() {
  try { return localStorage.getItem(KEYS.pro) === "1"; } catch (e) { return false; }
}

export function activatePro() {
  try { localStorage.setItem(KEYS.pro, "1"); } catch (e) {}
}

export function trialDaysLeft() {
  try {
    const start = Number(localStorage.getItem(KEYS.trialStart)) || Date.now();
    const gecen = Math.floor((Date.now() - start) / 86400000);
    return Math.max(0, TRIAL_DAYS - gecen);
  } catch (e) { return 0; }
}

export function isTrialActive() { return trialDaysLeft() > 0; }
export function canUse3D() { return isProUser() || isTrialActive(); }
export function canUseLogo() { return isProUser() || isTrialActive(); }

export function getCompanyLogo() {
  try { return localStorage.getItem(KEYS.logo) || null; } catch (e) { return null; }
}

export function setCompanyLogo(dataUrl) {
  try {
    if (dataUrl) localStorage.setItem(KEYS.logo, dataUrl);
    else localStorage.removeItem(KEYS.logo);
  } catch (e) {}
}

function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

export function pdfUsedToday() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.pdfCount) || "{}");
    return raw.date === todayKey() ? (raw.n || 0) : 0;
  } catch (e) { return 0; }
}

export function consumePdfCredit() {
  if (isProUser() || isTrialActive()) return { ok: true };
  const used = pdfUsedToday();
  if (used >= DAILY_FREE_PDF) {
    return {
      ok: false,
      message: "Gunluk ucretsiz PDF limiti doldu (3/3). Sinirsiz PDF icin PRO'ya gecin. / Daily free PDF limit reached (3/3). Upgrade to PRO."
    };
  }
  try {
    localStorage.setItem(KEYS.pdfCount, JSON.stringify({ date: todayKey(), n: used + 1 }));
  } catch (e) {}
  return { ok: true };
}
`;

fs.writeFileSync("src/license.js", LICENSE);
console.log("OK: src/license.js olusturuldu");

// ---------- 2) pdf.js yamasi ----------
const P = "src/pdf/pdf.js";
let s = fs.readFileSync(P, "utf8");

if (s.includes("../license.js")) {
  console.log("ATLANDI: pdf.js zaten yamali");
} else {
  const A1 = 'import { jsPDF } from "jspdf";';
  const A2 = '  const doc = new jsPDF("landscape", "mm", "a4");';
  const A3 = '  // Logo ve başlık.';
  for (const [ad, a] of [["import", A1], ["jsPDF satiri", A2], ["logo blogu", A3]]) {
    if (!s.includes(a)) { console.error("HATA: anchor bulunamadi -> " + ad); process.exit(1); }
  }

  s = s.replace(A1, A1 + '\nimport { consumePdfCredit, canUseLogo, getCompanyLogo } from "../license.js";');

  s = s.replace(A2,
`  const _gate = consumePdfCredit();
  if (!_gate.ok) { alert(_gate.message); return; }

` + A2);

  s = s.replace(A3,
`  try {
    const _logoData = canUseLogo() ? getCompanyLogo() : null;
    if (_logoData) {
      const _lp = doc.getImageProperties(_logoData);
      let _lh = 21;
      let _lw = (_lp.width / _lp.height) * _lh;
      if (_lw > 55) { _lh = _lh * (55 / _lw); _lw = 55; }
      doc.addImage(_logoData, _lp.fileType || "PNG", 5, 4, _lw, _lh);
    }
  } catch (_e) {}

` + A3);

  fs.writeFileSync(P, s);
  console.log("OK: pdf.js yamalandi (limit kapisi + PDF logo)");
}
