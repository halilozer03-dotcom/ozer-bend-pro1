const fs = require("fs");
const P = "src/main.jsx";
let s = fs.readFileSync(P, "utf8");

if (s.includes('from "./license.js"')) { console.log("ATLANDI: main.jsx zaten yamali"); process.exit(0); }

// 1) import
const A1 = 'import FullscreenViewer from "./viewer3d";';
if (!s.includes(A1)) { console.error("HATA: anchor -> viewer3d import"); process.exit(1); }
s = s.replace(A1, A1 + '\nimport { canUse3D, getCompanyLogo, setCompanyLogo, isProUser, trialDaysLeft } from "./license.js";');

// 2) state + handler'lar
const A2 = "const [companyName, setCompanyName] = useState(";
const i2 = s.indexOf(A2);
if (i2 === -1) { console.error("HATA: anchor -> companyName state"); process.exit(1); }
const INS = `const [companyLogo, setCompanyLogoState] = useState(() => getCompanyLogo());
  const handleLogoFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, 600 / img.width);
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * sc);
        cv.height = Math.round(img.height * sc);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        const dataUrl = cv.toDataURL("image/png");
        setCompanyLogo(dataUrl);
        setCompanyLogoState(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const handleLogoRemove = () => { setCompanyLogo(null); setCompanyLogoState(null); };
  `;
s = s.slice(0, i2) + INS + s.slice(i2);

// 3) Ayarlar paneli: logo yukleme + deneme durumu
const re2 = /(placeholder="ÖZER BEND PRO"\s*\n\s*\/>\s*\n\s*<\/label>)/;
if (!re2.test(s)) { console.error("HATA: anchor -> firma adi blogu"); process.exit(1); }
s = s.replace(re2, `$1
            <label style={{ gridColumn: "1 / -1" }}>Firma Logosu (PDF sol üst köşede görünür)
              <input type="file" accept="image/*" onChange={handleLogoFile} />
              {companyLogo && (
                <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                  <img src={companyLogo} alt="logo" style={{ height: 40, background: "#fff", borderRadius: 4, padding: 2 }} />
                  <button type="button" onClick={handleLogoRemove}>Logoyu Kaldır</button>
                </span>
              )}
            </label>
            <p style={{ gridColumn: "1 / -1", fontSize: 12, color: "#c9a227", margin: "2px 0" }}>
              {isProUser()
                ? "PRO aktif — tüm özellikler açık"
                : (trialDaysLeft() > 0
                  ? "Deneme sürümü: " + trialDaysLeft() + " gün kaldı"
                  : "Deneme doldu — günde 3 PDF; logo ve 3D kilitli")}
            </p>`);

// 4) 3D kilidi
const re3 = /\{showFullscreen && \(\s*\n(\s*)<FullscreenViewer/;
if (!re3.test(s)) { console.error("HATA: anchor -> showFullscreen 3D"); process.exit(1); }
s = s.replace(re3, `{showFullscreen && !canUse3D() && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 42 }}>🔒</div>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>3D önizleme PRO özelliğidir / 3D preview is a PRO feature</div>
            <div style={{ color: "#bbb", fontSize: 13, maxWidth: 420 }}>7 günlük deneme süreniz doldu. Sınırsız PDF, logo ve 3D için PRO (9.99€, tek seferlik).</div>
            <button type="button" onClick={() => setShowFullscreen(false)} style={{ marginTop: 8, padding: "10px 22px", borderRadius: 8, border: "1px solid #c9a227", background: "#c9a227", color: "#000", fontWeight: 700 }}>Kapat / Close</button>
          </div>
        )}
        {showFullscreen && canUse3D() && (
$1<FullscreenViewer`);

fs.writeFileSync(P, s);
console.log("OK: main.jsx yamalandi (logo UI + 3D kilidi + deneme gostergesi)");
