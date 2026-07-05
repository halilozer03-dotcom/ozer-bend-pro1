const fs = require('fs');
const filePath = 'src/main.jsx';
let content = fs.readFileSync(filePath, 'utf8');
let changed = 0;

const ar = `  ar: {
    app: "ÖZER BEND PRO V126",
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
    feedbackGreeting: "مرحباً،\\n\\nملاحظاتي حول التطبيق:\\n\\n",
    autoErrorSubject: "ÖZER BEND PRO - تقرير خطأ تلقائي",
    autoErrorPrefix: "حدث خطأ غير متوقع في التطبيق:\\n",
    autoErrorSuffix: "\\n\\nهل تريد الإبلاغ عن هذا الخطأ للمطور؟",
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
    segment: "قطعة"
  }`;

const dictEndRegex = /(\n  \})\n\};\n\nconst LANGUAGES = \[/;
if (dictEndRegex.test(content)) {
  content = content.replace(dictEndRegex, `$1,\n${ar}\n};\n\nconst LANGUAGES = [`);
  changed++;
  console.log('Arapca DICT blogu eklendi.');
} else {
  console.error('UYARI: DICT sonu bulunamadi.');
}

const langArrRegex = /(\{ code: "zh", flag: "[^"]*", label: "中文" \})\n\];/;
if (langArrRegex.test(content)) {
  content = content.replace(langArrRegex, `$1,\n  { code: "ar", flag: "🇩🇿", label: "الجزائر" }\n];`);
  changed++;
  console.log('Arapca LANGUAGES dizisine eklendi.');
} else {
  console.error('UYARI: LANGUAGES dizisi hedefi bulunamadi (zh sonrasi).');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`\nTamamlandi. ${changed}/2 blok degistirildi. (Sadece metin - RTL dir YOK, CSS degisikligi YOK)`);
