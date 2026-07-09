// OZER BEND PRO - Lisans / Deneme / Gunluk limit yonetimi (localStorage)
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
