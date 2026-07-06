// patch_keystore_and_freedraw_i18n.cjs
// 1) Sabit bir debug keystore ekler (keystore/ozerbend-debug.keystore) ve
//    workflow'a bunu ~/.android/debug.keystore'a kopyalayan bir adim ekler.
//    Boylece her derleme AYNI imzayla cikar, kaldirmadan uzerine kurulabilir
//    (ve bu arada localStorage/Firma Adi da silinmez).
// 2) freedraw.jsx'e kendi bagimsiz 11 dilli ceviri tablosunu ekler (ana dil
//    sozlugune dokunmadan, risksiz sekilde).
// 3) main.jsx'te <FreeDrawCanvas> cagrisina lang prop'u eklenir.

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MAIN_JSX = path.join(ROOT, "src", "main.jsx");
const FREEDRAW_JSX = path.join(ROOT, "src", "freedraw.jsx");
const KEYSTORE_DIR = path.join(ROOT, "keystore");
const KEYSTORE_FILE = path.join(KEYSTORE_DIR, "ozerbend-debug.keystore");
const WORKFLOWS_DIR = path.join(ROOT, ".github", "workflows");

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

/* ---------------------------------------------------------------------
   1) Sabit debug keystore
--------------------------------------------------------------------- */

const KEYSTORE_B64 = "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";

fs.mkdirSync(KEYSTORE_DIR, { recursive: true });
fs.writeFileSync(KEYSTORE_FILE, Buffer.from(KEYSTORE_B64, "base64"));
console.log("[OK] Sabit debug keystore olusturuldu: keystore/ozerbend-debug.keystore");

/* ---------------------------------------------------------------------
   2) Workflow'a keystore kopyalama adimi ekle
--------------------------------------------------------------------- */

const workflowFiles = fs.readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
if (workflowFiles.length === 0) {
  throw new Error("[HATA] .github/workflows icinde .yml dosyasi bulunamadi");
}
const workflowPath = path.join(WORKFLOWS_DIR, workflowFiles[0]);

replaceOnce(
  workflowPath,
  `      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21

      - name: Install dependencies
        run: npm install`,
  `      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21

      - name: Use fixed debug keystore (consistent signing across builds)
        run: |
          mkdir -p ~/.android
          cp keystore/ozerbend-debug.keystore ~/.android/debug.keystore

      - name: Install dependencies
        run: npm install`,
  `Workflow'a sabit keystore kopyalama adimi eklendi (${workflowFiles[0]})`
);

/* ---------------------------------------------------------------------
   3) freedraw.jsx - 11 dilli bagimsiz ceviri tablosu eklenir
--------------------------------------------------------------------- */

const I18N_BLOCK = `
const FREE_DRAW_I18N = {
  tr: { title: "Serbest Çizim", hint: "Ekrana dokunup sürükleyerek ilk çizgiyi çiz. İki parmakla yakınlaştır/uzaklaştır.", zoomOut: "− Uzaklaştır", zoomIn: "+ Yakınlaştır", angleOn: "15° Açı: Açık", angleOff: "15° Açı: Kapalı", undo: "Geri Al", resetBtn: "Sıfırla", apply: "Uygula ✓" },
  en: { title: "Free Draw", hint: "Touch and drag to draw the first line. Pinch with two fingers to zoom.", zoomOut: "− Zoom Out", zoomIn: "+ Zoom In", angleOn: "15° Snap: On", angleOff: "15° Snap: Off", undo: "Undo", resetBtn: "Reset", apply: "Apply ✓" },
  fr: { title: "Dessin Libre", hint: "Touchez et faites glisser pour dessiner la première ligne. Pincez avec deux doigts pour zoomer.", zoomOut: "− Zoom arrière", zoomIn: "+ Zoom avant", angleOn: "Angle 15° : Activé", angleOff: "Angle 15° : Désactivé", undo: "Annuler", resetBtn: "Réinitialiser", apply: "Appliquer ✓" },
  de: { title: "Freihandzeichnung", hint: "Berühren und ziehen, um die erste Linie zu zeichnen. Mit zwei Fingern zoomen.", zoomOut: "− Verkleinern", zoomIn: "+ Vergrößern", angleOn: "15°-Raster: Ein", angleOff: "15°-Raster: Aus", undo: "Rückgängig", resetBtn: "Zurücksetzen", apply: "Anwenden ✓" },
  es: { title: "Dibujo Libre", hint: "Toca y arrastra para dibujar la primera línea. Pellizca con dos dedos para hacer zoom.", zoomOut: "− Alejar", zoomIn: "+ Acercar", angleOn: "Ángulo 15°: Activado", angleOff: "Ángulo 15°: Desactivado", undo: "Deshacer", resetBtn: "Reiniciar", apply: "Aplicar ✓" },
  it: { title: "Disegno Libero", hint: "Tocca e trascina per disegnare la prima linea. Pizzica con due dita per zoomare.", zoomOut: "− Riduci", zoomIn: "+ Ingrandisci", angleOn: "Angolo 15°: Attivo", angleOff: "Angolo 15°: Disattivo", undo: "Annulla", resetBtn: "Reimposta", apply: "Applica ✓" },
  ru: { title: "Свободное рисование", hint: "Коснитесь и проведите, чтобы нарисовать первую линию. Сведите два пальца для масштабирования.", zoomOut: "− Уменьшить", zoomIn: "+ Увеличить", angleOn: "Угол 15°: Вкл", angleOff: "Угол 15°: Выкл", undo: "Отменить", resetBtn: "Сбросить", apply: "Применить ✓" },
  pt: { title: "Desenho Livre", hint: "Toque e arraste para desenhar a primeira linha. Belisque com dois dedos para ampliar.", zoomOut: "− Diminuir", zoomIn: "+ Ampliar", angleOn: "Ângulo 15°: Ativado", angleOff: "Ângulo 15°: Desativado", undo: "Desfazer", resetBtn: "Reiniciar", apply: "Aplicar ✓" },
  pl: { title: "Rysowanie Odręczne", hint: "Dotknij i przeciągnij, aby narysować pierwszą linię. Uszczypnij dwoma palcami, aby powiększyć.", zoomOut: "− Oddal", zoomIn: "+ Przybliż", angleOn: "Kąt 15°: Wł.", angleOff: "Kąt 15°: Wył.", undo: "Cofnij", resetBtn: "Resetuj", apply: "Zastosuj ✓" },
  zh: { title: "自由绘图", hint: "触摸并拖动以绘制第一条线。双指捏合可缩放。", zoomOut: "− 缩小", zoomIn: "+ 放大", angleOn: "15°角度：开", angleOff: "15°角度：关", undo: "撤销", resetBtn: "重置", apply: "应用 ✓" },
  ar: { title: "رسم حر", hint: "المس واسحب لرسم الخط الأول. اقرص بإصبعين للتكبير.", zoomOut: "− تصغير", zoomIn: "+ تكبير", angleOn: "زاوية 15°: مفعلة", angleOff: "زاوية 15°: معطلة", undo: "تراجع", resetBtn: "إعادة تعيين", apply: "تطبيق ✓" }
};
`;

replaceOnce(
  FREEDRAW_JSX,
  `const btnStyle = (extra) => ({`,
  `${I18N_BLOCK}
const btnStyle = (extra) => ({`,
  "freedraw.jsx icine 11 dilli bagimsiz ceviri tablosu eklendi"
);

replaceOnce(
  FREEDRAW_JSX,
  `export default function FreeDrawCanvas({ maxSegments, onCommit, onClose }) {`,
  `export default function FreeDrawCanvas({ maxSegments, onCommit, onClose, lang }) {
  const T = FREE_DRAW_I18N[lang] || FREE_DRAW_I18N.tr;`,
  "FreeDrawCanvas icine lang prop'u ve T (aktif ceviri) eklendi"
);

replaceOnce(
  FREEDRAW_JSX,
  `        Serbest Çizim {segmentCount}/{maxSegments}`,
  `        {T.title} {segmentCount}/{maxSegments}`,
  "Baslik metni cevrildi"
);

replaceOnce(
  FREEDRAW_JSX,
  `          Ekrana dokunup sürükleyerek ilk çizgiyi çiz. İki parmakla yakınlaştır/uzaklaştır.`,
  `          {T.hint}`,
  "Ipucu metni cevrildi"
);

replaceOnce(
  FREEDRAW_JSX,
  `        <button type="button" onClick={zoomOut} style={btnStyle()}>− Uzaklaştır</button>
        <button type="button" onClick={zoomIn} style={btnStyle()}>+ Yakınlaştır</button>
        <button type="button" onClick={() => setAngleSnap((v) => !v)} style={btnStyle({ background: angleSnap ? "#20262e" : "#12161c" })}>
          {angleSnap ? "15° Açı: Açık" : "15° Açı: Kapalı"}
        </button>
        <button type="button" onClick={undoLast} disabled={history.length === 0} style={btnStyle({ opacity: history.length === 0 ? 0.5 : 1 })}>Geri Al</button>
        <button type="button" onClick={reset} style={btnStyle()}>Sıfırla</button>
        <button
          type="button"
          onClick={finish}
          disabled={points.length < 2}
          style={btnStyle({ border: "1px solid #cfd5da", background: "#20262e", color: "#f4f6f7", fontWeight: 800, opacity: points.length < 2 ? 0.5 : 1 })}
        >
          Uygula ✓
        </button>`,
  `        <button type="button" onClick={zoomOut} style={btnStyle()}>{T.zoomOut}</button>
        <button type="button" onClick={zoomIn} style={btnStyle()}>{T.zoomIn}</button>
        <button type="button" onClick={() => setAngleSnap((v) => !v)} style={btnStyle({ background: angleSnap ? "#20262e" : "#12161c" })}>
          {angleSnap ? T.angleOn : T.angleOff}
        </button>
        <button type="button" onClick={undoLast} disabled={history.length === 0} style={btnStyle({ opacity: history.length === 0 ? 0.5 : 1 })}>{T.undo}</button>
        <button type="button" onClick={reset} style={btnStyle()}>{T.resetBtn}</button>
        <button
          type="button"
          onClick={finish}
          disabled={points.length < 2}
          style={btnStyle({ border: "1px solid #cfd5da", background: "#20262e", color: "#f4f6f7", fontWeight: 800, opacity: points.length < 2 ? 0.5 : 1 })}
        >
          {T.apply}
        </button>`,
  "Alt toolbar butonlari cevrildi"
);

/* ---------------------------------------------------------------------
   4) main.jsx: <FreeDrawCanvas> cagrisina lang prop'u ekle
--------------------------------------------------------------------- */

replaceOnce(
  MAIN_JSX,
  `        <FreeDrawCanvas
          maxSegments={15}`,
  `        <FreeDrawCanvas
          maxSegments={15}
          lang={lang}`,
  "main.jsx: FreeDrawCanvas'a lang prop'u eklendi"
);

console.log("\n✅ KEYSTORE + SERBEST CIZIM COK DILLI DESTEK BASARIYLA UYGULANDI.");
console.log("NOT: Bundan sonraki derlemede APK'yi ESKI uygulamayi KALDIRMADAN, uzerine kurabilirsin (ayni imza).");
console.log("Simdi: git add -A && git commit -m \"Sabit debug keystore + Serbest Cizim cok dilli destek\" && git push -u origin main");
