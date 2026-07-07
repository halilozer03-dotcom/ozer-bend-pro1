// patch_trademark_dedup_fix.cjs
// Onceki iki kez calisan patch'in olusturdugu tekrarlari temizler:
// 1) Dil sozlugunde 11 dilin hepsinde art arda gelen IKI AYNI
//    trademarkDisclaimer satirini TEK satira indirir (sozdizimi hatasini
//    de duzeltir - virgulsuz iki satir yan yana kalmisti).
// 2) Ayarlar panelindeki IKI AYNI <p> blogunu TEK bloga indirir ve
//    icerigini {t.trademarkDisclaimer} yapar.

const fs = require("fs");
const path = require("path");

const MAIN_JSX = path.join(process.cwd(), "src", "main.jsx");

let content = fs.readFileSync(MAIN_JSX, "utf8");
const before = content;

/* 1) Dil sozlugundeki tekrarlari temizle (11 dilin hepsi icin tek regex) */
const dupRegex = /(\n(\s*)trademarkDisclaimer: "((?:[^"\\]|\\.)*)")\n\s*trademarkDisclaimer: "\3"/g;
const dupCountBefore = (content.match(dupRegex) || []).length;
content = content.replace(dupRegex, "$1");
console.log(`[OK] Dil sozlugunde ${dupCountBefore} adet tekrar eden trademarkDisclaimer satiri temizlendi`);

/* 2) JSX'teki iki ayni <p> blogunu tek bloga indir + {t.trademarkDisclaimer} yap */
const P_BLOCK = `            <p style={{ fontSize: 11.5, color: "#8b929b", lineHeight: 1.6, gridColumn: "1 / -1", marginTop: 4 }}>
              DURMA, Hardox ve uygulama içinde geçen diğer ürün/marka adları ilgili sahiplerinin
              ticari markalarıdır. Bu uygulama bu firmalarla bağlantılı değildir ve onlar
              tarafından onaylanmamıştır; bu isimler yalnızca uyumluluk/tanımlama amacıyla
              kullanılmaktadır.
            </p>`;
const DOUBLE_P = P_BLOCK + "\n" + P_BLOCK;
const NEW_P = `            <p style={{ fontSize: 11.5, color: "#8b929b", lineHeight: 1.6, gridColumn: "1 / -1", marginTop: 4 }}>
              {t.trademarkDisclaimer}
            </p>`;

if (content.includes(DOUBLE_P)) {
  const count = content.split(DOUBLE_P).length - 1;
  if (count > 1) {
    throw new Error(`[HATA] JSX'teki cift blok beklenenden fazla yerde bulundu (${count})`);
  }
  content = content.replace(DOUBLE_P, NEW_P);
  console.log("[OK] JSX'teki iki ayni <p> blogu tek bloga indirildi ve {t.trademarkDisclaimer} yapildi");
} else if (content.includes(P_BLOCK)) {
  content = content.replace(P_BLOCK, NEW_P);
  console.log("[OK] JSX'teki tek <p> blogu {t.trademarkDisclaimer} yapildi (zaten tek kopyaydi)");
} else if (content.includes("{t.trademarkDisclaimer}")) {
  console.log("[BILGI] JSX zaten {t.trademarkDisclaimer} kullaniyor, degisiklik yapilmadi");
} else {
  throw new Error("[HATA] Ne cift ne tek <p> blogu bulunamadi - beklenmeyen durum");
}

if (content === before) {
  console.log("[BILGI] Dosyada hicbir degisiklik yapilmadi (zaten temizmis olabilir)");
} else {
  fs.writeFileSync(MAIN_JSX, content, "utf8");
}

console.log("\n✅ TEMIZLIK VE DUZELTME BASARIYLA TAMAMLANDI.");
console.log("Simdi: git add -A && git commit -m \"Marka feragatnamesi: tekrar eden kayitlar temizlendi\" && git push -u origin main");
