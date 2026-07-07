// patch_machine_specific_dies.cjs
// Kalip listesini makineye ozel hale getirir. Gercek durumu yansitmak icin
// tek tek makine degil, gercek endustri bagliama sistemlerine gore
// gruplandirildi:
//   EU_STANDARD  -> Avrupa/Promecam tipi (DURMA, Baykal, Ermaksan, LVD,
//                   Gasparini, SafanDarley, Prima Power, Adira, Boschert,
//                   HACO, Bystronic, Estun gibi cogu Avrupa/Asya markasi
//                   bu ortak sistemi kullanir)
//   AMADA_STYLE  -> Amada'nin kendi ozel sistemi
//   TRUMPF_WILA  -> Trumpf/WILA New Standard sistemi
//   AMERICAN_STYLE -> Cincinnati gibi Amerikan tipi sistem
//
// NOT: AMADA/TRUMPF/AMERICAN icin verilen kalip kodlari GERCEKCI FORMATTA
// ORNEK/TEMSILI kodlardir (gercek katalog numaralari degil). Eger gercek
// kendi makinenin tam kalip kodlarini bilirsen, bana soyle, kesin dogru
// degerlerle guncelleriz.

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

/* 1) lowerDies/upperDies duz listelerini DIE_GROUPS + MACHINE_DIE_GROUP ile degistir */
replaceOnce(
  MAIN_JSX,
  `const lowerDies = [
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
];`,
  `const DIE_GROUPS = {
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
};`,
  "DIE_GROUPS + MACHINE_DIE_GROUP eklendi (lowerDies/upperDies duz listeleri kaldirildi)"
);

/* 2) Makineye gore aktif kalip listesini hesapla + gecersiz secim varsa sifirla */
replaceOnce(
  MAIN_JSX,
  `const [upperDie, setUpperDie] = useState("P.97.75.R08/F");`,
  `const [upperDie, setUpperDie] = useState("P.97.75.R08/F");

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
  }, [machine]);`,
  "Makineye ozel aktif kalip listesi hesaplamasi eklendi"
);

/* 3) JSX select() cagrilarini yeni listelere yonlendir */
replaceOnce(
  MAIN_JSX,
  `{select(t.lowerDieLabel, lowerDie, setLowerDie, lowerDies)}`,
  `{select(t.lowerDieLabel, lowerDie, setLowerDie, availableLowerDies)}`,
  "Alt Kalip secimi makineye ozel listeye baglandi"
);
replaceOnce(
  MAIN_JSX,
  `{select(t.upperDieLabel, upperDie, setUpperDie, upperDies)}`,
  `{select(t.upperDieLabel, upperDie, setUpperDie, availableUpperDies)}`,
  "Ust Kalip secimi makineye ozel listeye baglandi"
);

console.log("\n✅ MAKINEYE OZEL KALIP LISTESI BASARIYLA UYGULANDI.");
console.log("NOT: Amada/Trumpf/Cincinnati icin kalip kodlari temsilidir, gercek katalog");
console.log("numaralarini bilirsen bildir, kesin dogru degerlerle guncelleriz.");
console.log("Simdi: git add -A && git commit -m \"Kalip listesi makineye ozel (tooling sistemine gore) yapildi\" && git push -u origin main");
