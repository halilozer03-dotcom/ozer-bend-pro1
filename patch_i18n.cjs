const fs = require("fs");

const FD_CODE = `const FD_DICT = {
  tr: { title: "Serbest Çizim", draw: "Çiz", edit: "Düzenle", drawMode: "Çiz Modu", editMode: "Düzenle Modu", zoomOut: "Uzaklaştır", zoomIn: "Yakınlaştır", angleOn: "15° Açı: Açık", angleOff: "15° Açı: Kapalı", undo: "Geri Al", reset: "Sıfırla", apply: "Uygula", hint: "Ekrana dokunup sürükleyerek ilk çizgiyi çiz. İki parmakla yakınlaştır/uzaklaştır." },
  en: { title: "Free Draw", draw: "Draw", edit: "Edit", drawMode: "Draw Mode", editMode: "Edit Mode", zoomOut: "Zoom Out", zoomIn: "Zoom In", angleOn: "15° Angle: On", angleOff: "15° Angle: Off", undo: "Undo", reset: "Reset", apply: "Apply", hint: "Touch and drag to draw the first line. Pinch with two fingers to zoom." },
  fr: { title: "Dessin libre", draw: "Dessiner", edit: "Modifier", drawMode: "Mode dessin", editMode: "Mode édition", zoomOut: "Réduire", zoomIn: "Agrandir", angleOn: "Angle 15° : Activé", angleOff: "Angle 15° : Désactivé", undo: "Annuler", reset: "Réinitialiser", apply: "Appliquer", hint: "Touchez et faites glisser pour tracer la première ligne. Pincez avec deux doigts pour zoomer." },
  de: { title: "Freies Zeichnen", draw: "Zeichnen", edit: "Bearbeiten", drawMode: "Zeichenmodus", editMode: "Bearbeitungsmodus", zoomOut: "Verkleinern", zoomIn: "Vergrößern", angleOn: "15°-Winkel: Ein", angleOff: "15°-Winkel: Aus", undo: "Rückgängig", reset: "Zurücksetzen", apply: "Anwenden", hint: "Zum Zeichnen der ersten Linie tippen und ziehen. Mit zwei Fingern zoomen." },
  es: { title: "Dibujo libre", draw: "Dibujar", edit: "Editar", drawMode: "Modo dibujo", editMode: "Modo edición", zoomOut: "Alejar", zoomIn: "Acercar", angleOn: "Ángulo 15°: Activado", angleOff: "Ángulo 15°: Desactivado", undo: "Deshacer", reset: "Restablecer", apply: "Aplicar", hint: "Toca y arrastra para dibujar la primera línea. Pellizca con dos dedos para hacer zoom." },
  it: { title: "Disegno libero", draw: "Disegna", edit: "Modifica", drawMode: "Modalità disegno", editMode: "Modalità modifica", zoomOut: "Riduci", zoomIn: "Ingrandisci", angleOn: "Angolo 15°: Attivo", angleOff: "Angolo 15°: Disattivo", undo: "Annulla", reset: "Reimposta", apply: "Applica", hint: "Tocca e trascina per disegnare la prima linea. Pizzica con due dita per lo zoom." },
  ru: { title: "Свободное рисование", draw: "Рисование", edit: "Правка", drawMode: "Режим рисования", editMode: "Режим правки", zoomOut: "Отдалить", zoomIn: "Приблизить", angleOn: "Угол 15°: Вкл", angleOff: "Угол 15°: Выкл", undo: "Отменить", reset: "Сброс", apply: "Применить", hint: "Коснитесь и проведите, чтобы нарисовать первую линию. Масштаб — двумя пальцами." },
  pt: { title: "Desenho livre", draw: "Desenhar", edit: "Editar", drawMode: "Modo desenho", editMode: "Modo edição", zoomOut: "Afastar", zoomIn: "Aproximar", angleOn: "Ângulo 15°: Ativado", angleOff: "Ângulo 15°: Desativado", undo: "Desfazer", reset: "Redefinir", apply: "Aplicar", hint: "Toque e arraste para desenhar a primeira linha. Belisque com dois dedos para ampliar." },
  pl: { title: "Rysowanie odręczne", draw: "Rysuj", edit: "Edytuj", drawMode: "Tryb rysowania", editMode: "Tryb edycji", zoomOut: "Oddal", zoomIn: "Przybliż", angleOn: "Kąt 15°: Wł.", angleOff: "Kąt 15°: Wył.", undo: "Cofnij", reset: "Resetuj", apply: "Zastosuj", hint: "Dotknij i przeciągnij, aby narysować pierwszą linię. Powiększaj dwoma palcami." },
  zh: { title: "自由绘图", draw: "绘制", edit: "编辑", drawMode: "绘制模式", editMode: "编辑模式", zoomOut: "缩小", zoomIn: "放大", angleOn: "15°角度：开", angleOff: "15°角度：关", undo: "撤销", reset: "重置", apply: "应用", hint: "触摸并拖动以绘制第一条线。双指缩放。" },
  ar: { title: "رسم حر", draw: "رسم", edit: "تعديل", drawMode: "وضع الرسم", editMode: "وضع التعديل", zoomOut: "تصغير", zoomIn: "تكبير", angleOn: "زاوية 15°: مفعّل", angleOff: "زاوية 15°: معطّل", undo: "تراجع", reset: "إعادة تعيين", apply: "تطبيق", hint: "المس واسحب لرسم الخط الأول. قرّب بإصبعين للتكبير." }
};

`;

const ST_CODE = `
const SETTINGS_TXT = {
  tr: { companyName: "Firma Adı (PDF başlığında görünür)", logoLabel: "Firma Logosu (PDF sol üst köşede görünür)", logoRemove: "Logoyu Kaldır", proActive: "PRO aktif — tüm özellikler açık", trialLeft: (n) => "Deneme sürümü: " + n + " gün kaldı", trialOver: "Deneme doldu — günde 3 PDF; logo ve 3D kilitli" },
  en: { companyName: "Company Name (shown in PDF header)", logoLabel: "Company Logo (shown at top-left of PDF)", logoRemove: "Remove Logo", proActive: "PRO active — all features unlocked", trialLeft: (n) => "Trial: " + n + " day(s) left", trialOver: "Trial ended — 3 PDFs/day; logo & 3D locked" },
  fr: { companyName: "Nom de l'entreprise (visible dans l'en-tête du PDF)", logoLabel: "Logo de l'entreprise (en haut à gauche du PDF)", logoRemove: "Supprimer le logo", proActive: "PRO actif — toutes les fonctionnalités débloquées", trialLeft: (n) => "Essai : " + n + " jour(s) restant(s)", trialOver: "Essai terminé — 3 PDF/jour ; logo et 3D verrouillés" },
  de: { companyName: "Firmenname (erscheint in der PDF-Kopfzeile)", logoLabel: "Firmenlogo (oben links im PDF)", logoRemove: "Logo entfernen", proActive: "PRO aktiv — alle Funktionen freigeschaltet", trialLeft: (n) => "Testversion: noch " + n + " Tag(e)", trialOver: "Test abgelaufen — 3 PDFs/Tag; Logo & 3D gesperrt" },
  es: { companyName: "Nombre de la empresa (visible en el encabezado del PDF)", logoLabel: "Logotipo de la empresa (arriba a la izquierda del PDF)", logoRemove: "Quitar logotipo", proActive: "PRO activo — todas las funciones desbloqueadas", trialLeft: (n) => "Prueba: quedan " + n + " día(s)", trialOver: "Prueba finalizada — 3 PDF/día; logo y 3D bloqueados" },
  it: { companyName: "Nome azienda (visibile nell'intestazione del PDF)", logoLabel: "Logo aziendale (in alto a sinistra nel PDF)", logoRemove: "Rimuovi logo", proActive: "PRO attivo — tutte le funzioni sbloccate", trialLeft: (n) => "Prova: " + n + " giorno/i rimasti", trialOver: "Prova terminata — 3 PDF/giorno; logo e 3D bloccati" },
  ru: { companyName: "Название компании (отображается в заголовке PDF)", logoLabel: "Логотип компании (вверху слева в PDF)", logoRemove: "Удалить логотип", proActive: "PRO активен — все функции доступны", trialLeft: (n) => "Пробный период: осталось " + n + " дн.", trialOver: "Пробный период истёк — 3 PDF/день; логотип и 3D заблокированы" },
  pt: { companyName: "Nome da empresa (exibido no cabeçalho do PDF)", logoLabel: "Logotipo da empresa (no canto superior esquerdo do PDF)", logoRemove: "Remover logotipo", proActive: "PRO ativo — todos os recursos desbloqueados", trialLeft: (n) => "Teste: restam " + n + " dia(s)", trialOver: "Teste encerrado — 3 PDFs/dia; logo e 3D bloqueados" },
  pl: { companyName: "Nazwa firmy (widoczna w nagłówku PDF)", logoLabel: "Logo firmy (w lewym górnym rogu PDF)", logoRemove: "Usuń logo", proActive: "PRO aktywny — wszystkie funkcje odblokowane", trialLeft: (n) => "Wersja próbna: pozostało " + n + " dni", trialOver: "Okres próbny zakończony — 3 PDF/dzień; logo i 3D zablokowane" },
  zh: { companyName: "公司名称（显示在PDF标题中）", logoLabel: "公司标志（显示在PDF左上角）", logoRemove: "移除标志", proActive: "PRO已激活 — 所有功能已解锁", trialLeft: (n) => "试用期：剩余" + n + "天", trialOver: "试用已结束 — 每天3个PDF；标志和3D已锁定" },
  ar: { companyName: "اسم الشركة (يظهر في ترويسة PDF)", logoLabel: "شعار الشركة (أعلى يسار PDF)", logoRemove: "إزالة الشعار", proActive: "PRO مفعّل — جميع الميزات متاحة", trialLeft: (n) => "الفترة التجريبية: تبقى " + n + " يوم", trialOver: "انتهت الفترة التجريبية — 3 PDF يوميًا؛ الشعار وثلاثي الأبعاد مقفلان" }
};
const stx = (l) => SETTINGS_TXT[l] || SETTINGS_TXT.en;`;

// ---------- freedraw.jsx ----------
let f = fs.readFileSync("src/freedraw.jsx", "utf8");
let m = fs.readFileSync("src/main.jsx", "utf8");
const doF = !f.includes("FD_DICT");
const doM = !m.includes("SETTINGS_TXT");

if (doF) {
  const sig = 'export default function FreeDrawCanvas({ maxSegments, onCommit, onClose }) {';
  const checks = [
    ["imza", f.includes(sig)],
    ["baslik", f.includes("Serbest Çizim {segmentCount}/{maxSegments}")],
    ["ciz-duzenle", f.includes('"Çiz" : "Düzenle"')],
    ["ipucu", f.includes("Ekrana dokunup sürükleyerek ilk çizgiyi çiz. İki parmakla yakınlaştır/uzaklaştır.")],
    ["mod butonu", /"([^"]*)Çiz Modu" : "([^"]*)Düzenle Modu"/.test(f)],
    ["uzaklastir", />(.) Uzaklaştır<\/button>/.test(f)],
    ["yakinlastir", f.includes(">+ Yakınlaştır</button>")],
    ["aci", f.includes('{angleSnap ? "15° Açı: Açık" : "15° Açı: Kapalı"}')],
    ["geri al", f.includes(">Geri Al</button>")],
    ["sifirla", f.includes(">Sıfırla</button>")],
    ["uygula tek", (f.match(/Uygula/g) || []).length === 1]
  ];
  for (const [ad, ok] of checks) { if (!ok) { console.error("HATA: freedraw anchor -> " + ad); process.exit(1); } }

  f = f.replace(sig, FD_CODE + 'export default function FreeDrawCanvas({ maxSegments, onCommit, onClose, lang }) {\n  const T = FD_DICT[lang] || FD_DICT.en;');
  f = f.replace("Serbest Çizim {segmentCount}/{maxSegments}", "{T.title} {segmentCount}/{maxSegments}");
  f = f.replace('"Çiz" : "Düzenle"', "T.draw : T.edit");
  f = f.replace("Ekrana dokunup sürükleyerek ilk çizgiyi çiz. İki parmakla yakınlaştır/uzaklaştır.", "{T.hint}");
  f = f.replace(/"([^"]*)Çiz Modu" : "([^"]*)Düzenle Modu"/, '"$1" + T.drawMode : "$2" + T.editMode');
  f = f.replace(/>(.) Uzaklaştır<\/button>/, ">$1 {T.zoomOut}</button>");
  f = f.replace(">+ Yakınlaştır</button>", ">+ {T.zoomIn}</button>");
  f = f.replace('{angleSnap ? "15° Açı: Açık" : "15° Açı: Kapalı"}', "{angleSnap ? T.angleOn : T.angleOff}");
  f = f.replace(">Geri Al</button>", ">{T.undo}</button>");
  f = f.replace(">Sıfırla</button>", ">{T.reset}</button>");
  f = f.replace(/Uygula .?/, "{T.apply} ✓");
}

// ---------- main.jsx ----------
if (doM) {
  const IMP = 'import { canUse3D, getCompanyLogo, setCompanyLogo, isProUser, trialDaysLeft } from "./license.js";';
  const checks2 = [
    ["license import", m.includes(IMP)],
    ["firma adi", m.includes("<label>Firma Adı (PDF başlığında görünür)")],
    ["logo label", m.includes(">Firma Logosu (PDF sol üst köşede görünür)")],
    ["logo kaldir", m.includes(">Logoyu Kaldır</button>")],
    ["deneme kaldi", m.includes('"Deneme sürümü: " + trialDaysLeft() + " gün kaldı"')],
    ["pro aktif", /"PRO aktif[^"]*"/.test(m)],
    ["deneme doldu", /"Deneme doldu[^"]*"/.test(m)]
  ];
  for (const [ad, ok] of checks2) { if (!ok) { console.error("HATA: main anchor -> " + ad); process.exit(1); } }

  m = m.replace(IMP, IMP + "\n" + ST_CODE);
  m = m.replace("<label>Firma Adı (PDF başlığında görünür)", "<label>{stx(lang).companyName}");
  m = m.replace(">Firma Logosu (PDF sol üst köşede görünür)", ">{stx(lang).logoLabel}");
  m = m.replace(">Logoyu Kaldır</button>", ">{stx(lang).logoRemove}</button>");
  m = m.replace(/"PRO aktif[^"]*"/, "stx(lang).proActive");
  m = m.replace('"Deneme sürümü: " + trialDaysLeft() + " gün kaldı"', "stx(lang).trialLeft(trialDaysLeft())");
  m = m.replace(/"Deneme doldu[^"]*"/, "stx(lang).trialOver");
}

if (doF) { fs.writeFileSync("src/freedraw.jsx", f); console.log("OK: freedraw.jsx 11 dile baglandi"); } else { console.log("ATLANDI: freedraw zaten yamali"); }
if (doM) { fs.writeFileSync("src/main.jsx", m); console.log("OK: main.jsx ayar etiketleri 11 dile baglandi"); } else { console.log("ATLANDI: main zaten yamali"); }
