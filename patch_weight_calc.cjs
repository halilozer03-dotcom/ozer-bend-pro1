// patch_weight_calc.cjs
// Ozgul agirlik (yogunluk, g/cm3) tabanli agirlik hesaplama ekler.
// Sadece Kapi Profili modunda calisir, cunku BOY (uzunluk) girisi sadece
// o modda var - Kosebent/Genel Profil modlarinda uzunluk girisi olmadigi
// icin agirlik hesaplanamiyor (bu moda uzunluk eklenirse sonra genisletilebilir).

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

/* 1) Malzeme yogunluklari (g/cm3) */
replaceOnce(
  MAIN_JSX,
  `const materials = ["DKP", "Galvaniz", "INOX 304", "INOX 316", "Alüminyum 1050", "Alüminyum 5754", "Hardox"];`,
  `const materials = ["DKP", "Galvaniz", "INOX 304", "INOX 316", "Alüminyum 1050", "Alüminyum 5754", "Hardox"];
const MATERIAL_DENSITY = {
  "DKP": 7.85,
  "Galvaniz": 7.85,
  "INOX 304": 8.00,
  "INOX 316": 8.00,
  "Alüminyum 1050": 2.71,
  "Alüminyum 5754": 2.66,
  "Hardox": 7.85
};`,
  "Malzeme ozgul agirlik (yogunluk) tablosu eklendi"
);

/* 2) Agirlik hesabi + result objesine ekleme */
replaceOnce(
  MAIN_JSX,
  `const result = { kesilecekEn, kesilecekBoy, bdToplam };`,
  `const materialDensityGCm3 = MATERIAL_DENSITY[material] ?? 7.85;
  const weightKg = isKapi && kesilecekBoy != null
    ? (kesilecekEn * kesilecekBoy * Number(thickness) * materialDensityGCm3) / 1e6
    : null;
  const result = { kesilecekEn, kesilecekBoy, bdToplam, weightKg };`,
  "Agirlik hesabi eklendi (En x Boy x Kalinlik x Yogunluk)"
);

/* 3) Sonuc karti (UI) - sadece kapida, kesilecekBoy kartinin hemen altina */
replaceOnce(
  MAIN_JSX,
  `{isKapi && <div className="resultItem"><span>{t.ch}</span><b>{kesilecekBoy.toFixed(1)} mm</b></div>}`,
  `{isKapi && <div className="resultItem"><span>{t.ch}</span><b>{kesilecekBoy.toFixed(1)} mm</b></div>}
                {isKapi && result.weightKg != null && <div className="resultItem"><span>{t.weight}</span><b>{result.weightKg.toFixed(2)} kg</b></div>}`,
  "Agirlik sonuc karti eklendi (UI)"
);

/* 4) Tum dillere "weight" ceviri anahtarini ekle (yapisal regex ile) */
const WEIGHT_TRANSLATIONS = {
  tr: "AĞIRLIK",
  en: "WEIGHT",
  fr: "POIDS",
  de: "GEWICHT",
  es: "PESO",
  it: "PESO",
  ru: "ВЕС",
  pt: "PESO",
  pl: "WAGA",
  zh: "重量",
  ar: "الوزن"
};

let mainContent = fs.readFileSync(MAIN_JSX, "utf8");
const langBlockRegex = /\n  (tr|en|fr|de|es|it|ru|pt|pl|zh|ar): \{([\s\S]*?)\n  \}(,?)\n(?=  (?:tr|en|fr|de|es|it|ru|pt|pl|zh|ar): \{|\};)/g;
let langMatchCount = 0;
mainContent = mainContent.replace(langBlockRegex, (full, langCode, innerContent, trailingComma) => {
  langMatchCount++;
  const translation = WEIGHT_TRANSLATIONS[langCode];
  return `\n  ${langCode}: {${innerContent},\n    weight: "${translation}"\n  }${trailingComma}\n`;
});

if (langMatchCount !== 11) {
  throw new Error(`[HATA] Beklenen 11 dil blogu yerine ${langMatchCount} tane bulundu. Islem GERI ALINDI, dosya degistirilmedi.`);
}

fs.writeFileSync(MAIN_JSX, mainContent, "utf8");
console.log(`[OK] "weight" ceviri anahtari ${langMatchCount} dilin hepsine eklendi`);

console.log("\n✅ AGIRLIK HESAPLAMA OZELLIGI BASARIYLA EKLENDI.");
console.log("Simdi: git add -A && git commit -m \"Ozgul agirlik tabanli agirlik hesaplama eklendi (Kapi Profili)\" && git push -u origin main");
