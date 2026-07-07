// patch_button_i18n.cjs
// "Serbest Cizim" ve "Agirlik Hesapla" butonlarini 11 dile cevirir.
// Satir numarasina gore (segment: satirinin hemen altina) ekleme yapar -
// daha once basariyla calisan yontemle ayni.

const fs = require("fs");
const path = require("path");

const MAIN_JSX = path.join(process.cwd(), "src", "main.jsx");

const TRANSLATIONS_BY_LINE = [
  { line: 849, lang: "ar", freeDraw: "رسم حر", weightCalc: "حاسبة الوزن" },
  { line: 788, lang: "zh", freeDraw: "自由绘图", weightCalc: "重量计算器" },
  { line: 727, lang: "pl", freeDraw: "Rysowanie Odręczne", weightCalc: "Kalkulator Wagi" },
  { line: 666, lang: "pt", freeDraw: "Desenho Livre", weightCalc: "Calculadora de Peso" },
  { line: 605, lang: "ru", freeDraw: "Свободное рисование", weightCalc: "Калькулятор веса" },
  { line: 544, lang: "it", freeDraw: "Disegno Libero", weightCalc: "Calcolatore di Peso" },
  { line: 483, lang: "es", freeDraw: "Dibujo Libre", weightCalc: "Calculadora de Peso" },
  { line: 422, lang: "de", freeDraw: "Freihandzeichnung", weightCalc: "Gewichtsrechner" },
  { line: 361, lang: "fr", freeDraw: "Dessin Libre", weightCalc: "Calculateur de Poids" },
  { line: 300, lang: "en", freeDraw: "Free Draw", weightCalc: "Weight Calculator" },
  { line: 239, lang: "tr", freeDraw: "Serbest Çizim", weightCalc: "Ağırlık Hesapla" }
];

let content = fs.readFileSync(MAIN_JSX, "utf8");
let lines = content.split("\n");

for (const { line, lang, freeDraw, weightCalc } of TRANSLATIONS_BY_LINE) {
  const idx = line - 1;
  const original = lines[idx];
  if (!/segment:\s*"[^"]*"\s*,?\s*$/.test(original)) {
    throw new Error(`[HATA] Satir ${line} beklenen 'segment:' satiri degil (${lang}). Islem durduruldu.\nBulunan: ${original}`);
  }
  const trimmedEnd = original.replace(/\s*$/, "");
  const withComma = trimmedEnd.endsWith(",") ? trimmedEnd : trimmedEnd + ",";
  const indentMatch = original.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : "    ";
  lines[idx] = withComma;
  lines.splice(
    idx + 1,
    0,
    `${indent}freeDrawBtn: "${freeDraw.replace(/"/g, '\\"')}",`,
    `${indent}weightCalcBtn: "${weightCalc.replace(/"/g, '\\"')}"`
  );
  console.log(`[OK] freeDrawBtn + weightCalcBtn eklendi (${lang}, satir ${line})`);
}

fs.writeFileSync(MAIN_JSX, lines.join("\n"), "utf8");

/* JSX'teki sabit metinleri {t.freeDrawBtn} / {t.weightCalcBtn} ile degistir */
function replaceOnce(filePath, oldStr, newStr, label) {
  let c = fs.readFileSync(filePath, "utf8");
  const count = c.split(oldStr).length - 1;
  if (count === 0) {
    throw new Error(`[HATA] Eslesme bulunamadi: ${label}`);
  }
  if (count > 1) {
    throw new Error(`[HATA] Birden fazla eslesme bulundu (${count}): ${label}`);
  }
  c = c.replace(oldStr, newStr);
  fs.writeFileSync(filePath, c, "utf8");
  console.log(`[OK] ${label}`);
}

replaceOnce(
  MAIN_JSX,
  `          Serbest Çizim
        </button>`,
  `          {t.freeDrawBtn}
        </button>`,
  "Serbest Cizim butonu {t.freeDrawBtn} yapildi"
);

replaceOnce(
  MAIN_JSX,
  `          ⚖️ Ağırlık Hesapla
        </button>`,
  `          ⚖️ {t.weightCalcBtn}
        </button>`,
  "Agirlik Hesapla butonu {t.weightCalcBtn} yapildi"
);

console.log("\n✅ BUTONLAR 11 DILE CEVRILDI.");
console.log("Simdi: git add -A && git commit -m \"Serbest Cizim ve Agirlik Hesapla butonlari 11 dile cevrildi\" && git push -u origin main");
