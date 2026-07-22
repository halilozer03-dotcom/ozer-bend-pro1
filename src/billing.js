// OZER BEND PRO - RevenueCat / Google Play Billing entegrasyonu
// Kurulum notlari asagida, dosyanin sonunda.
import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";
import { activatePro } from "./license.js";

// RevenueCat Dashboard > Project Settings > API Keys > Public app-specific API key (Android/Google Play)
// BURAYA KENDI ANAHTARINI YAPISTIR:
const REVENUECAT_ANDROID_API_KEY = "REPLACE_WITH_REVENUECAT_PUBLIC_ANDROID_KEY";

// RevenueCat Dashboard > Entitlements bolumunde olusturdugun entitlement id'si
const ENTITLEMENT_ID = "pro";

let initialized = false;
let initFailed = false;

export function isBillingConfigured() {
  return REVENUECAT_ANDROID_API_KEY && !REVENUECAT_ANDROID_API_KEY.startsWith("REPLACE_WITH");
}

export async function initBilling() {
  if (initialized || initFailed) return;
  if (!isBillingConfigured()) {
    initFailed = true;
    console.warn("RevenueCat API anahtari tanimlanmamis (src/billing.js).");
    return;
  }
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
    await Purchases.configure({ apiKey: REVENUECAT_ANDROID_API_KEY });
    initialized = true;
    await syncProStatus();
  } catch (e) {
    initFailed = true;
    console.warn("RevenueCat baslatma hatasi:", e);
  }
}

// Uygulama acilisinda ve satin alma sonrasi gercek yetkiyi (entitlement) kontrol eder
export async function syncProStatus() {
  if (!initialized) return isBillingConfigured() ? false : null;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const active = Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
    if (active) activatePro();
    return active;
  } catch (e) {
    console.warn("RevenueCat durum kontrolu hatasi:", e);
    return false;
  }
}

async function getProPackage() {
  const offerings = await Purchases.getOfferings();
  const current = offerings?.current;
  const pkg = current?.availablePackages?.[0];
  if (!pkg) {
    throw new Error("Pro paketi bulunamadi. RevenueCat panelinde Offering/Package tanimli mi kontrol et.");
  }
  return pkg;
}

// Play Console'da tanimli GERCEK fiyati (localized, ornek "€4,99") dondurur.
// Boylece fiyat degistiginde koda dokunmaya gerek kalmaz.
export async function getProPriceString() {
  if (!initialized) return null;
  try {
    const pkg = await getProPackage();
    return pkg?.product?.priceString || null;
  } catch (e) {
    return null;
  }
}

// Donen deger: { ok: true, active: boolean } veya { ok: false, cancelled: boolean, message: string }
export async function purchasePro() {
  if (!initialized) {
    return { ok: false, cancelled: false, message: "Odeme sistemi hazir degil. Lutfen tekrar dene." };
  }
  try {
    const pkg = await getProPackage();
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const active = Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
    if (active) activatePro();
    return { ok: true, active };
  } catch (e) {
    const cancelled = Boolean(e?.userCancelled);
    return { ok: false, cancelled, message: cancelled ? "" : (e?.message || "Satin alma basarisiz oldu.") };
  }
}

export async function restorePurchases() {
  if (!initialized) return { ok: false, active: false, message: "Odeme sistemi hazir degil." };
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const active = Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]);
    if (active) activatePro();
    return { ok: true, active };
  } catch (e) {
    return { ok: false, active: false, message: e?.message || "Geri yukleme basarisiz oldu." };
  }
}

/*
KURULUM ADIMLARI (kod disinda, sen yapman gereken islemler):

1) Google Play Console'da uygulama icinde "Uretilen Urunler" (Monetize > Products > In-app products)
   bolumune git, non-consumable (managed product) bir urun olustur.
   Onerilen Product ID: obp_pro_lifetime  (fiyat: 4.99 EUR)

2) RevenueCat'e (revenuecat.com) ucretsiz hesap ac, yeni proje olustur.
   Project Settings > Integrations > Google Play Store'dan Play Console servis hesabi
   JSON'unu baglayarak Google Play'i baglica.

3) RevenueCat panelinde:
   - Products: obp_pro_lifetime urununu import et
   - Entitlements: "pro" adinda bir entitlement olustur, obp_pro_lifetime'i buna bagla
   - Offerings: "default" offering olustur, icine obp_pro_lifetime'i "Package" olarak ekle

4) Project Settings > API keys > Public Google API Key degerini kopyala,
   bu dosyadaki REVENUECAT_ANDROID_API_KEY sabitine yapistir.

5) npm install ile @revenuecat/purchases-capacitor kurulacak (package.json'a eklendi),
   sonra `npx cap sync android` (workflow'da zaten var).
*/
