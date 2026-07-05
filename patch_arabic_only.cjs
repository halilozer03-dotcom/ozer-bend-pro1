const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');
let changed = 0;

const ar = `  ar: {
    app: "OZER BEND PRO V126",
    dims: "Al abaad",
    profile: "Al malaf",
    settings: "Al eedadat",
    results: "Nataej al qas",
    cw: "Ard al qas",
    ch: "Tool al qas",
    draw: "2D",
    pdf: "PDF",
    print: "Tebaa",
    share: "Mosharaka",
    loading: "Jari al bad...",
    view3d: "3D",
    machineLabel: "Al makina",
    lowerDieLabel: "Al qaleb al sofli",
    upperDieLabel: "Al mekbas al olwi",
    materialLabel: "Al madda",
    thicknessLabel: "Somk al saf iha",
    insideRLabel: "Nesf al qotr al dakheli",
    angleLabel: "Zawiyat al thani",
    deductLabel: "Khasm 15 mm",
    bdAutoLabel: "BD telqaii",
    bdUnit: "mm / thanya",
    manualBdToggle: "BD yadawi",
    manualBdInputLabel: "BD yadawi mm / thanya",
    hardoxWarning: "Qimat BD al telqaiya le maddat Hardox hiya taqdeer ghayr moakkad. La tabda al entaj bidoon thanya ekhtebar haqiqiya.",
    feedbackBtn: "Ersal molahazat",
    feedbackSubjectManual: "OZER BEND PRO - Molahazat",
    feedbackGreeting: "Marhaban,\\n\\nMolahazati/moshkelati hawla al tatbiq:\\n\\n",
    autoErrorSubject: "OZER BEND PRO - Taqreer khata telqaii",
    autoErrorPrefix: "Hadatha khata ghayr motawaqqa fi al tatbiq:\\n",
    autoErrorSuffix: "\\n\\nHal tureed al eblagh an hatha al khata lel motawwer an tareeq al bareed al elektroni?",
    unknownError: "Khata ghayr maroof",
    unknownPromiseError: "Khata promise ghayr maroof",
    lockedBadge: "V114 moqfal",
    cornerSingleBend: "Zawiya (L) - thanya wahida",
    lengthWord: "Al tool",
    leftWord: "Yasar",
    rightWord: "Yameen",
    bottomLeftWord: "Asfal yasar",
    bottomRightWord: "Asfal yameen",
    genelProfil: "Malaf aam",
    segmentUzunluk: "Al tool",
    segmentAci: "Al zawiya",
    segmentYon: "Al ittijah",
    yonYukari: "Aala",
    yonAsagi: "Asfal",
    segmentEkle: "+ Edafat qeta",
    segmentSil: "Ezala",
    favorites: "Al mofaddala",
    favSave: "Hefz",
    favLoad: "Tahmeel",
    favDelete: "Hazf",
    favEmpty: "La tojad mofaddalat mahfoza.",
    favNamePrompt: "Esm al mofaddala:",
    toplamUzunluk: "Ejmali tool al qas",
    bukumSayisi: "Adad al thanayat",
    segment: "Qeta"
  }`;

const dictEndRegex = /(\n  \})\n\};\n\nconst LANGUAGES = \[/;
if (dictEndRegex.test(content)) {
  content = content.replace(dictEndRegex, `$1,\n${ar}\n};\n\nconst LANGUAGES = [`);
  changed++;
} else {
  console.error('UYARI: DICT sonu bulunamadi.');
}

const langArrRegex = /\{ code: "zh", flag: "CN", label: "中文" \}\n\];/;
const langArrReplacement = `{ code: "zh", flag: "CN", label: "中文" },
  { code: "ar", flag: "SA", label: "Arabic" }
];`;

if (langArrRegex.test(content)) {
  content = content.replace(langArrRegex, langArrReplacement);
  changed++;
} else {
  console.error('UYARI: LANGUAGES dizisi hedefi bulunamadi (zh sonrasi).');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Tamamlandi. ${changed}/2 blok degistirildi. (Sadece Arapca metin - Latin harfleriyle transliterasyon, RTL yok, ozel karakter yok)`);
