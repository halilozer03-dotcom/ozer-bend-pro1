// patch_trademark_i18n_v2.cjs
// Guncel satir numaralariyla (segment satirlari artik virgulle bitiyor,
// yani son anahtar degil) duzeltilmis surum. trademarkDisclaimer'i
// segment satirinin hemen ALTINA ekler (nesnenin neresinde oldugu
// fonksiyonel olarak onemli degil, JS'te anahtar sirasi sonucu etkilemez).

const fs = require("fs");
const path = require("path");

const MAIN_JSX = path.join(process.cwd(), "src", "main.jsx");

function replaceOnce(filePath, oldStr, newStr, label) {
  let content = fs.readFileSync(filePath, "utf8");
  const count = content.split(oldStr).length - 1;
  if (count === 0) {
    throw new Error(`[HATA] Eslesme bulunamadi: ${label}`);
  }
  if (count > 1) {
    throw new Error(`[HATA] Birden fazla eslesme bulundu (${count}): ${label}`);
  }
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`[OK] ${label}`);
}

const TRANSLATIONS_BY_LINE = [
  { line: 849, lang: "ar", text: "DURMA وHardox وأسماء المنتجات/العلامات التجارية الأخرى المذكورة في التطبيق هي علامات تجارية لأصحابها المعنيين. هذا التطبيق غير مرتبط بهذه الشركات ولم تتم الموافقة عليه من قبلها؛ تُستخدم هذه الأسماء فقط لأغراض التوافق/التعريف." },
  { line: 788, lang: "zh", text: "DURMA、Hardox 及应用程序中提到的其他产品/品牌名称均为其各自所有者的商标。本应用程序与这些公司无关，也未获得其认可；这些名称仅用于兼容性/识别目的。" },
  { line: 727, lang: "pl", text: "DURMA, Hardox i inne nazwy produktów/marek wymienione w aplikacji są znakami towarowymi ich odpowiednich właścicieli. Ta aplikacja nie jest powiązana z tymi firmami ani przez nie zatwierdzona; te nazwy są używane wyłącznie w celach kompatybilności/identyfikacji." },
  { line: 666, lang: "pt", text: "DURMA, Hardox e outros nomes de produtos/marcas mencionados no aplicativo são marcas registradas de seus respectivos proprietários. Este aplicativo não é afiliado nem endossado por essas empresas; esses nomes são usados apenas para fins de compatibilidade/identificação." },
  { line: 605, lang: "ru", text: "DURMA, Hardox и другие названия продуктов/торговых марок, упомянутые в приложении, являются товарными знаками соответствующих владельцев. Это приложение не связано с этими компаниями и не одобрено ими; эти названия используются исключительно в целях совместимости/идентификации." },
  { line: 544, lang: "it", text: "DURMA, Hardox e altri nomi di prodotti/marchi menzionati nell'app sono marchi dei rispettivi proprietari. Questa app non è affiliata né approvata da queste aziende; questi nomi sono utilizzati esclusivamente a scopo di compatibilità/identificazione." },
  { line: 483, lang: "es", text: "DURMA, Hardox y otros nombres de productos/marcas mencionados en la aplicación son marcas registradas de sus respectivos propietarios. Esta aplicación no está afiliada ni respaldada por estas empresas; estos nombres se utilizan únicamente con fines de compatibilidad/identificación." },
  { line: 422, lang: "de", text: "DURMA, Hardox und andere in der App genannte Produkt-/Markennamen sind Marken ihrer jeweiligen Inhaber. Diese App steht in keiner Verbindung zu diesen Unternehmen und wird von ihnen nicht unterstützt; diese Namen werden ausschließlich zu Kompatibilitäts-/Identifikationszwecken verwendet." },
  { line: 361, lang: "fr", text: "DURMA, Hardox et les autres noms de produits/marques mentionnés dans l'application sont des marques déposées de leurs propriétaires respectifs. Cette application n'est pas affiliée à ces entreprises ni approuvée par elles ; ces noms sont utilisés uniquement à des fins de compatibilité/identification." },
  { line: 300, lang: "en", text: "DURMA, Hardox and other product/brand names mentioned in the app are trademarks of their respective owners. This app is not affiliated with or endorsed by these companies; these names are used solely for compatibility/identification purposes." },
  { line: 239, lang: "tr", text: "DURMA, Hardox ve uygulama içinde geçen diğer ürün/marka adları ilgili sahiplerinin ticari markalarıdır. Bu uygulama bu firmalarla bağlantılı değildir ve onlar tarafından onaylanmamıştır; bu isimler yalnızca uyumluluk/tanımlama amacıyla kullanılmaktadır." }
];

let content = fs.readFileSync(MAIN_JSX, "utf8");
let lines = content.split("\n");

for (const { line, lang, text } of TRANSLATIONS_BY_LINE) {
  const idx = line - 1;
  const original = lines[idx];
  if (!/segment:\s*"[^"]*"\s*,?\s*$/.test(original)) {
    throw new Error(`[HATA] Satir ${line} beklenen 'segment:' satiri degil (${lang}). Islem durduruldu, dosya degistirilmedi.\nBulunan: ${original}`);
  }
  const trimmedEnd = original.replace(/\s*$/, "");
  const withComma = trimmedEnd.endsWith(",") ? trimmedEnd : trimmedEnd + ",";
  const indentMatch = original.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : "    ";
  lines[idx] = withComma;
  lines.splice(idx + 1, 0, `${indent}trademarkDisclaimer: "${text.replace(/"/g, '\\"')}"`);
  console.log(`[OK] trademarkDisclaimer eklendi (${lang}, satir ${line})`);
}

fs.writeFileSync(MAIN_JSX, lines.join("\n"), "utf8");

/* JSX'teki sabit Turkce metni {t.trademarkDisclaimer} ile degistir (henuz degistirilmediyse) */
const afterContent = fs.readFileSync(MAIN_JSX, "utf8");
const OLD_P = `            <p style={{ fontSize: 11.5, color: "#8b929b", lineHeight: 1.6, gridColumn: "1 / -1", marginTop: 4 }}>
              DURMA, Hardox ve uygulama içinde geçen diğer ürün/marka adları ilgili sahiplerinin
              ticari markalarıdır. Bu uygulama bu firmalarla bağlantılı değildir ve onlar
              tarafından onaylanmamıştır; bu isimler yalnızca uyumluluk/tanımlama amacıyla
              kullanılmaktadır.
            </p>`;
if (afterContent.includes(OLD_P)) {
  replaceOnce(
    MAIN_JSX,
    OLD_P,
    `            <p style={{ fontSize: 11.5, color: "#8b929b", lineHeight: 1.6, gridColumn: "1 / -1", marginTop: 4 }}>
              {t.trademarkDisclaimer}
            </p>`,
    "JSX'teki sabit metin {t.trademarkDisclaimer} ile degistirildi"
  );
} else {
  console.log("[BILGI] JSX zaten {t.trademarkDisclaimer} kullaniyor gibi gorunuyor, atlandi");
}

console.log("\n✅ MARKA FERAGATNAMESI 11 DILE EKLENDI VE DILE DUYARLI HALE GETIRILDI.");
console.log("Simdi: git add -A && git commit -m \"Marka feragatnamesi 11 dile cevrildi\" && git push -u origin main");
