// patch_lang_pdf_persist.cjs
// 1) PDF_DICT'e eksik 7 dili ekler (es, it, ru, pt, pl, zh, ar)
// 2) materialLabel() fonksiyonunu tüm diller için genişletir (Galvaniz / Alüminyum)
// 3) profileTypes dizisine eksik dil etiketlerini ekler + seçim mantığını genelleştirir
// 4) Dil seçimini localStorage'a kaydeder, uygulama açılışında son seçilen dili yükler

const fs = require("fs");
const path = require("path");

const PDF_JS = path.join(process.cwd(), "src", "pdf", "pdf.js");
const MAIN_JSX = path.join(process.cwd(), "src", "main.jsx");

function replaceOnce(filePath, oldStr, newStr, label) {
  let content = fs.readFileSync(filePath, "utf8");
  const count = content.split(oldStr).length - 1;
  if (count === 0) {
    throw new Error(`[HATA] Eşleşme bulunamadı: ${label} (${filePath})`);
  }
  if (count > 1) {
    throw new Error(`[HATA] Birden fazla eşleşme bulundu (${count}): ${label} (${filePath})`);
  }
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`[OK] ${label}`);
}

/* ---------------------------------------------------------------------
   1) pdf.js -> PDF_DICT'e eksik diller
--------------------------------------------------------------------- */

const PDF_DICT_ANCHOR = `    dateLocale: "de-DE"
  }
};`;

const PDF_DICT_NEW_LANGS = `    dateLocale: "de-DE"
  },
  es: {
    profil: "PERFIL",
    kapiProfili: "PERFIL DE PUERTA",
    kosebentL: "ESCUADRA L",
    malzeme: "MATERIAL",
    kalinlik: "ESPESOR",
    makine: "MÁQUINA",
    altKalip: "MATRIZ INFERIOR",
    ustKalip: "PUNZÓN SUPERIOR",
    aci: "ÁNGULO",
    tarihSaat: "FECHA / HORA",
    kesilecekEn: "ANCHO DE CORTE",
    kesilecekBoy: "LARGO DE CORTE",
    boyLabel: "LARGO",
    genelProfil: "PERFIL GENERAL",
    toplamUzunluk: "LARGO TOTAL",
    bukumSayisi: "NÚMERO DE PLIEGUES",
    slogan: "SOLUCIONES PROFESIONALES DE PLEGADO",
    shareTitle: "ÖZER BEND PRO PDF",
    shareText: "ÖZER BEND PRO plano técnico PDF",
    shareDialogTitle: "Compartir PDF",
    errorConfirmPrefix: "Se produjo un error al procesar el PDF:\\n",
    errorConfirmSuffix: "\\n\\n¿Desea informar este error al desarrollador por correo electrónico?",
    errorSubject: "ÖZER BEND PRO - Informe de error de PDF",
    genericErrorSubject: "ÖZER BEND PRO - Informe automático de error",
    dateLocale: "es-ES"
  },
  it: {
    profil: "PROFILO",
    kapiProfili: "PROFILO PORTA",
    kosebentL: "ANGOLARE L",
    malzeme: "MATERIALE",
    kalinlik: "SPESSORE",
    makine: "MACCHINA",
    altKalip: "STAMPO INFERIORE",
    ustKalip: "PUNZONE SUPERIORE",
    aci: "ANGOLO",
    tarihSaat: "DATA / ORA",
    kesilecekEn: "LARGHEZZA DI TAGLIO",
    kesilecekBoy: "LUNGHEZZA DI TAGLIO",
    boyLabel: "LUNGHEZZA",
    genelProfil: "PROFILO GENERALE",
    toplamUzunluk: "LUNGHEZZA TOTALE",
    bukumSayisi: "NUMERO DI PIEGHE",
    slogan: "SOLUZIONI PROFESSIONALI DI PIEGATURA",
    shareTitle: "ÖZER BEND PRO PDF",
    shareText: "ÖZER BEND PRO disegno tecnico PDF",
    shareDialogTitle: "Condividi PDF",
    errorConfirmPrefix: "Si è verificato un errore durante l'elaborazione del PDF:\\n",
    errorConfirmSuffix: "\\n\\nVuoi segnalare questo errore allo sviluppatore via email?",
    errorSubject: "ÖZER BEND PRO - Segnalazione errore PDF",
    genericErrorSubject: "ÖZER BEND PRO - Segnalazione automatica di errore",
    dateLocale: "it-IT"
  },
  ru: {
    profil: "ПРОФИЛЬ",
    kapiProfili: "ДВЕРНОЙ ПРОФИЛЬ",
    kosebentL: "УГОЛОК L",
    malzeme: "МАТЕРИАЛ",
    kalinlik: "ТОЛЩИНА",
    makine: "СТАНОК",
    altKalip: "НИЖНИЙ ШТАМП",
    ustKalip: "ВЕРХНИЙ ПУАНСОН",
    aci: "УГОЛ",
    tarihSaat: "ДАТА / ВРЕМЯ",
    kesilecekEn: "ШИРИНА РЕЗКИ",
    kesilecekBoy: "ДЛИНА РЕЗКИ",
    boyLabel: "ДЛИНА",
    genelProfil: "ОБЩИЙ ПРОФИЛЬ",
    toplamUzunluk: "ОБЩАЯ ДЛИНА",
    bukumSayisi: "КОЛИЧЕСТВО ГИБОВ",
    slogan: "ПРОФЕССИОНАЛЬНЫЕ РЕШЕНИЯ ДЛЯ ГИБКИ",
    shareTitle: "ÖZER BEND PRO PDF",
    shareText: "ÖZER BEND PRO технический чертеж PDF",
    shareDialogTitle: "Поделиться PDF",
    errorConfirmPrefix: "Произошла ошибка при создании PDF:\\n",
    errorConfirmSuffix: "\\n\\nХотите сообщить об этой ошибке разработчику по электронной почте?",
    errorSubject: "ÖZER BEND PRO - Отчет об ошибке PDF",
    genericErrorSubject: "ÖZER BEND PRO - Автоматический отчет об ошибке",
    dateLocale: "ru-RU"
  },
  pt: {
    profil: "PERFIL",
    kapiProfili: "PERFIL DE PORTA",
    kosebentL: "CANTONEIRA L",
    malzeme: "MATERIAL",
    kalinlik: "ESPESSURA",
    makine: "MÁQUINA",
    altKalip: "MATRIZ INFERIOR",
    ustKalip: "PUNÇÃO SUPERIOR",
    aci: "ÂNGULO",
    tarihSaat: "DATA / HORA",
    kesilecekEn: "LARGURA DE CORTE",
    kesilecekBoy: "COMPRIMENTO DE CORTE",
    boyLabel: "COMPRIMENTO",
    genelProfil: "PERFIL GERAL",
    toplamUzunluk: "COMPRIMENTO TOTAL",
    bukumSayisi: "NÚMERO DE DOBRAS",
    slogan: "SOLUÇÕES PROFISSIONAIS DE DOBRA",
    shareTitle: "ÖZER BEND PRO PDF",
    shareText: "ÖZER BEND PRO desenho técnico PDF",
    shareDialogTitle: "Compartilhar PDF",
    errorConfirmPrefix: "Ocorreu um erro ao processar o PDF:\\n",
    errorConfirmSuffix: "\\n\\nDeseja relatar este erro ao desenvolvedor por e-mail?",
    errorSubject: "ÖZER BEND PRO - Relatório de erro de PDF",
    genericErrorSubject: "ÖZER BEND PRO - Relatório automático de erro",
    dateLocale: "pt-PT"
  },
  pl: {
    profil: "PROFIL",
    kapiProfili: "PROFIL DRZWIOWY",
    kosebentL: "KĄTOWNIK L",
    malzeme: "MATERIAŁ",
    kalinlik: "GRUBOŚĆ",
    makine: "MASZYNA",
    altKalip: "MATRYCA DOLNA",
    ustKalip: "STEMPEL GÓRNY",
    aci: "KĄT",
    tarihSaat: "DATA / GODZINA",
    kesilecekEn: "SZEROKOŚĆ CIĘCIA",
    kesilecekBoy: "DŁUGOŚĆ CIĘCIA",
    boyLabel: "DŁUGOŚĆ",
    genelProfil: "PROFIL OGÓLNY",
    toplamUzunluk: "CAŁKOWITA DŁUGOŚĆ",
    bukumSayisi: "LICZBA GIĘĆ",
    slogan: "PROFESJONALNE ROZWIĄZANIA GIĘCIA",
    shareTitle: "ÖZER BEND PRO PDF",
    shareText: "ÖZER BEND PRO rysunek techniczny PDF",
    shareDialogTitle: "Udostępnij PDF",
    errorConfirmPrefix: "Wystąpił błąd podczas przetwarzania pliku PDF:\\n",
    errorConfirmSuffix: "\\n\\nCzy chcesz zgłosić ten błąd programiście e-mailem?",
    errorSubject: "ÖZER BEND PRO - Zgłoszenie błędu PDF",
    genericErrorSubject: "ÖZER BEND PRO - Automatyczne zgłoszenie błędu",
    dateLocale: "pl-PL"
  },
  zh: {
    profil: "型材",
    kapiProfili: "门型材",
    kosebentL: "L型角材",
    malzeme: "材料",
    kalinlik: "厚度",
    makine: "机器",
    altKalip: "下模",
    ustKalip: "上模",
    aci: "角度",
    tarihSaat: "日期 / 时间",
    kesilecekEn: "切割宽度",
    kesilecekBoy: "切割长度",
    boyLabel: "长度",
    genelProfil: "通用型材",
    toplamUzunluk: "总切割长度",
    bukumSayisi: "弯曲次数",
    slogan: "专业折弯解决方案",
    shareTitle: "ÖZER BEND PRO PDF",
    shareText: "ÖZER BEND PRO 技术图纸 PDF",
    shareDialogTitle: "分享PDF",
    errorConfirmPrefix: "处理PDF时发生错误:\\n",
    errorConfirmSuffix: "\\n\\n是否通过电子邮件向开发者报告此错误？",
    errorSubject: "ÖZER BEND PRO - PDF错误报告",
    genericErrorSubject: "ÖZER BEND PRO - 自动错误报告",
    dateLocale: "zh-CN"
  },
  ar: {
    profil: "الملف",
    kapiProfili: "بروفايل الباب",
    kosebentL: "زاوية L",
    malzeme: "المادة",
    kalinlik: "السماكة",
    makine: "الماكينة",
    altKalip: "القالب السفلي",
    ustKalip: "المكبس العلوي",
    aci: "الزاوية",
    tarihSaat: "التاريخ / الوقت",
    kesilecekEn: "عرض القص",
    kesilecekBoy: "طول القص",
    boyLabel: "الطول",
    genelProfil: "ملف عام",
    toplamUzunluk: "إجمالي طول القص",
    bukumSayisi: "عدد الثنيات",
    slogan: "حلول احترافية للثني",
    shareTitle: "ÖZER BEND PRO PDF",
    shareText: "ÖZER BEND PRO رسم فني PDF",
    shareDialogTitle: "مشاركة PDF",
    errorConfirmPrefix: "حدث خطأ أثناء معالجة ملف PDF:\\n",
    errorConfirmSuffix: "\\n\\nهل تريد الإبلاغ عن هذا الخطأ للمطور عبر البريد الإلكتروني؟",
    errorSubject: "ÖZER BEND PRO - تقرير خطأ PDF",
    genericErrorSubject: "ÖZER BEND PRO - تقرير خطأ تلقائي",
    dateLocale: "ar-DZ"
  }
};`;

replaceOnce(PDF_JS, PDF_DICT_ANCHOR, PDF_DICT_NEW_LANGS, "PDF_DICT'e 7 eksik dil eklendi (es, it, ru, pt, pl, zh, ar)");

/* ---------------------------------------------------------------------
   2) main.jsx -> materialLabel() fonksiyonunu tüm diller için genişlet
--------------------------------------------------------------------- */

const MATERIAL_LABEL_OLD = `function materialLabel(code, lang) {
  if (code === "Galvaniz") {
    if (lang === "en") return "Galvanized";
    if (lang === "de") return "Verzinkt";
    if (lang === "fr") return "Galvanisé";
    return "Galvaniz";
  }
  if (code.startsWith("Alüminyum")) {
    const suffix = code.replace("Alüminyum", "").trim();
    const word = lang === "tr" ? "Alüminyum" : "Aluminium";
    return \`\${word} \${suffix}\`.trim();
  }
  return code;
}`;

const MATERIAL_LABEL_NEW = `function materialLabel(code, lang) {
  const GALVANIZED = {
    tr: "Galvaniz", en: "Galvanized", de: "Verzinkt", fr: "Galvanisé",
    es: "Galvanizado", it: "Zincato", ru: "Оцинкованный", pt: "Galvanizado",
    pl: "Ocynkowany", zh: "镀锌", ar: "مجلفن"
  };
  const ALUMINUM = {
    tr: "Alüminyum", en: "Aluminium", de: "Aluminium", fr: "Aluminium",
    es: "Aluminio", it: "Alluminio", ru: "Алюминий", pt: "Alumínio",
    pl: "Aluminium", zh: "铝", ar: "ألمنيوم"
  };
  if (code === "Galvaniz") {
    return GALVANIZED[lang] || GALVANIZED.tr;
  }
  if (code.startsWith("Alüminyum")) {
    const suffix = code.replace("Alüminyum", "").trim();
    const word = ALUMINUM[lang] || ALUMINUM.tr;
    return \`\${word} \${suffix}\`.trim();
  }
  return code;
}`;

replaceOnce(MAIN_JSX, MATERIAL_LABEL_OLD, MATERIAL_LABEL_NEW, "materialLabel() tüm diller için genişletildi");

/* ---------------------------------------------------------------------
   3) main.jsx -> profileTypes dizisine eksik dil etiketleri
--------------------------------------------------------------------- */

const PROFILE_TYPES_OLD = `const profileTypes = [
  { value: "kapi", labelTr: "Kapı Profili", labelFr: "Profil porte", labelEn: "Door Profile", labelDe: "Türprofil" },
  { value: "l", labelTr: "Köşebent (L)", labelFr: "Cornière (L)", labelEn: "Corner (L)", labelDe: "Winkel (L)" },
  { value: "genel", labelTr: "Genel Profil", labelFr: "Profil général", labelEn: "General Profile", labelDe: "Allgemeines Profil" }
];`;

const PROFILE_TYPES_NEW = `const profileTypes = [
  { value: "kapi", labelTr: "Kapı Profili", labelFr: "Profil porte", labelEn: "Door Profile", labelDe: "Türprofil",
    labelEs: "Perfil de Puerta", labelIt: "Profilo Porta", labelRu: "Профиль двери", labelPt: "Perfil da Porta",
    labelPl: "Profil Drzwiowy", labelZh: "门型材", labelAr: "بروفايل الباب" },
  { value: "l", labelTr: "Köşebent (L)", labelFr: "Cornière (L)", labelEn: "Corner (L)", labelDe: "Winkel (L)",
    labelEs: "Escuadra (L)", labelIt: "Angolare (L)", labelRu: "Угол (L)", labelPt: "Cantoneira (L)",
    labelPl: "Kątownik (L)", labelZh: "角型材 (L)", labelAr: "زاوية (L)" },
  { value: "genel", labelTr: "Genel Profil", labelFr: "Profil général", labelEn: "General Profile", labelDe: "Allgemeines Profil",
    labelEs: "Perfil General", labelIt: "Profilo Generale", labelRu: "Общий профиль", labelPt: "Perfil Geral",
    labelPl: "Profil Ogólny", labelZh: "通用型材", labelAr: "بروفايل عام" }
];

function profileTypeLabel(item, lang) {
  const key = "label" + lang.charAt(0).toUpperCase() + lang.slice(1);
  return item[key] || item.labelEn;
}`;

replaceOnce(MAIN_JSX, PROFILE_TYPES_OLD, PROFILE_TYPES_NEW, "profileTypes dizisine 7 eksik dil etiketi eklendi");

/* ---------------------------------------------------------------------
   4) main.jsx -> profil etiketi seçim mantığını genelleştir
--------------------------------------------------------------------- */

const LABEL_SELECT_OLD = `{lang === "tr" ? item.labelTr : lang === "fr" ? item.labelFr : lang === "de" ? item.labelDe : item.labelEn}`;
const LABEL_SELECT_NEW = `{profileTypeLabel(item, lang)}`;

replaceOnce(MAIN_JSX, LABEL_SELECT_OLD, LABEL_SELECT_NEW, "Profil etiketi seçim mantığı tüm diller için genelleştirildi");

/* ---------------------------------------------------------------------
   5) main.jsx -> dil seçimini localStorage'a kaydet / açılışta yükle
--------------------------------------------------------------------- */

const LANG_STATE_OLD = `const [lang, setLang] = useState("tr");`;

const LANG_STATE_NEW = `const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("ozerbend_lang");
      if (saved) return saved;
    } catch (e) {}
    return "tr";
  });

  useEffect(() => {
    try {
      localStorage.setItem("ozerbend_lang", lang);
    } catch (e) {}
  }, [lang]);`;

replaceOnce(MAIN_JSX, LANG_STATE_OLD, LANG_STATE_NEW, "Dil seçimi localStorage'a kaydediliyor / açılışta yükleniyor");

console.log("\n✅ TÜM PATCH'LER BAŞARIYLA UYGULANDI.");
console.log("Şimdi: git add -A && git commit -m \"Dil kalıcılığı + PDF çoklu dil + eksik ceviriler\" && git push -u origin main");
