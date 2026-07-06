// patch_history_15.cjs
// Favoriler ile ayni yapida ama OTOMATIK calisan bir "Gecmis Islemler"
// ozelligi ekler: her PDF olusturuldugunda (kaydet/yazdir/paylas) o anki
// tum girdiler otomatik olarak gecmise eklenir, en fazla 15 kayit tutulur
// (16.si eklenince en eskisi silinir). localStorage'da saklanir.

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

/* 1) State + fonksiyonlar */
replaceOnce(
  MAIN_JSX,
  `const [showFavorites, setShowFavorites] = useState(false);`,
  `const [showFavorites, setShowFavorites] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ozerbend_history");
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const persistHistory = (list) => {
    setHistory(list);
    try {
      localStorage.setItem("ozerbend_history", JSON.stringify(list));
    } catch (e) {}
  };

  const pushHistoryEntry = () => {
    const entry = {
      id: Date.now(),
      profileType, A, B, C, D, EN, H,
      segments: isGeneral ? segments : undefined,
      material, thickness, bendAngle, insideR, deduct, manualBd, manualBdValue,
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 15);
      try {
        localStorage.setItem("ozerbend_history", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const applyHistoryEntry = (item) => {
    setProfileType(item.profileType);
    setA(item.A); setB(item.B); setC(item.C); setD(item.D); setEN(item.EN); setH(item.H);
    if (item.segments) setSegments(item.segments);
    setMaterial(item.material); setThickness(item.thickness);
    setBendAngle(item.bendAngle); setInsideR(item.insideR);
    setDeduct(item.deduct); setManualBd(item.manualBd); setManualBdValue(item.manualBdValue);
    setShowHistory(false);
  };

  const deleteHistoryEntry = (id) => {
    persistHistory(history.filter((h) => h.id !== id));
  };

  const clearHistoryAll = () => {
    persistHistory([]);
  };`,
  "Gecmis Islemler state + fonksiyonlari eklendi"
);

/* 2) Buton (favoriler dugmesinin yanina) */
replaceOnce(
  MAIN_JSX,
  `<button type="button" className="favBtn" onClick={saveFavorite}>💾 {t.favSave}</button>`,
  `<button type="button" className="favBtn" onClick={saveFavorite}>💾 {t.favSave}</button>
                <button type="button" className="favBtn" onClick={() => setShowHistory(!showHistory)}>🕘 Geçmiş</button>`,
  "Gecmis Islemler butonu eklendi"
);

/* 3) Panel (segment editorunden hemen once) */
replaceOnce(
  MAIN_JSX,
  `      {isGeneral ? (`,
  `      {showHistory && (
        <div className="favPanel">
          {history.length === 0 ? (
            <p className="favEmpty">Henüz geçmiş işlem yok.</p>
          ) : (
            <>
              {history.map((item) => (
                <div className="favRow" key={item.id}>
                  <span>{new Date(item.id).toLocaleString()} — {item.profileType === "kapi" ? "Kapı" : item.profileType === "l" ? "Köşebent" : "Genel"}</span>
                  <div>
                    <button type="button" onClick={() => applyHistoryEntry(item)}>Yükle</button>
                    <button type="button" onClick={() => deleteHistoryEntry(item.id)}>Sil</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={clearHistoryAll} style={{ width: "100%", marginTop: 8 }}>Tümünü Temizle</button>
            </>
          )}
        </div>
      )}
      {isGeneral ? (`,
  "Gecmis Islemler paneli eklendi"
);

/* 4) PDF olusturulunca gecmise otomatik ekle (kaydet/yazdir/paylas ucu de) */
let content = fs.readFileSync(MAIN_JSX, "utf8");
const createPdfRegex = /onClick=\{\(\)\s*=>\s*createPdf\(\{\s*data,\s*result,\s*lang,\s*action:\s*"(save|print|share)"\s*\}\)\}/g;
const matches = content.match(createPdfRegex);
if (!matches || matches.length === 0) {
  throw new Error("[HATA] createPdf onClick cagrilari bulunamadi (adim 4)");
}
content = content.replace(createPdfRegex, (full, actionName) => {
  return `onClick={() => { pushHistoryEntry(); createPdf({ data, result, lang, action: "${actionName}" }); }}`;
});
fs.writeFileSync(MAIN_JSX, content, "utf8");
console.log(`[OK] PDF butonlarina otomatik gecmis kaydi eklendi (${matches.length} adet buton)`);

console.log("\n✅ GECMIS ISLEMLER (SON 15) OZELLIGI BASARIYLA EKLENDI.");
console.log("Simdi: git add -A && git commit -m \"Otomatik Gecmis Islemler (son 15) eklendi\" && git push -u origin main");
