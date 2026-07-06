// patch_history_panel_fix.cjs
// Onceki patch_history_15.cjs'in 3. adimi ("{isGeneral ? (" iki kez
// gectigi icin) basarisiz oldu. Bu script SADECE o eksik adimi, daha
// kesin (regex tabanli, benzersiz baglam iceren) bir sekilde tamamlar.
// Diger 3 adim zaten basariyla uygulanmisti, onlara dokunulmuyor.

const fs = require("fs");
const path = require("path");

const MAIN_JSX = path.join(process.cwd(), "src", "main.jsx");

let content = fs.readFileSync(MAIN_JSX, "utf8");

// Favoriler panelinin kapanisindan hemen sonraki ilk "{isGeneral ? ("
// - bu benzersiz baglam: "))" + ")}" + "</div>" + ")}" + "{isGeneral ? ("
const anchorRegex = /(\)\)\s*\)\}\s*<\/div>\s*\)\}\s*)(\{isGeneral \? \()/;

const match = content.match(anchorRegex);
if (!match) {
  throw new Error("[HATA] Favoriler paneli sonrasi 'isGeneral' konumu bulunamadi");
}

const HISTORY_PANEL = `{showHistory && (
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
      `;

content = content.replace(anchorRegex, (full, before, after) => before + HISTORY_PANEL + after);

fs.writeFileSync(MAIN_JSX, content, "utf8");
console.log("[OK] Gecmis Islemler paneli dogru (tek) konuma eklendi");

console.log("\n✅ TAMAMLAYICI PATCH BASARIYLA UYGULANDI.");
console.log("Simdi: git add -A && git commit -m \"Gecmis Islemler paneli konumu duzeltildi\" && git push -u origin main");
