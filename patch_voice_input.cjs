// patch_voice_input.cjs
// Sesli komutla olcu girisi ekler. @capacitor-community/speech-recognition
// (Android'in kendi native ses tanima motorunu kullanir, ucretsiz, API
// ucreti yok) ile "A yirmi B kirk En bin Boy iki bin" gibi tek cumlede
// birden fazla alani ayni anda doldurabilirsin.

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PACKAGE_JSON = path.join(ROOT, "package.json");
const MAIN_JSX = path.join(ROOT, "src", "main.jsx");

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

/* 1) package.json'a plugin ekle */
const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
if (!pkg.dependencies) pkg.dependencies = {};
if (!pkg.dependencies["@capacitor-community/speech-recognition"]) {
  pkg.dependencies["@capacitor-community/speech-recognition"] = "latest";
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  console.log("[OK] @capacitor-community/speech-recognition package.json'a eklendi");
} else {
  console.log("[BILGI] plugin zaten package.json'da vardi");
}

/* 2) Import */
replaceOnce(
  MAIN_JSX,
  `import FreeDrawCanvas from "./freedraw";`,
  `import FreeDrawCanvas from "./freedraw";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";`,
  "SpeechRecognition import edildi"
);

/* 3) State + parse/apply/start fonksiyonlari (favoriler state'inin hemen ustune) */
replaceOnce(
  MAIN_JSX,
  `const [favorites, setFavorites] = useState([]);`,
  `const [listening, setListening] = useState(false);
  const [voiceLastTranscript, setVoiceLastTranscript] = useState("");

  const parseVoiceTranscript = (text) => {
    const words = String(text || "").toLowerCase().replace(/[.,]/g, "").split(/\\s+/).filter(Boolean);
    const FIELD_MAP = {
      a: "A",
      b: "B", be: "B",
      c: "C", ce: "C",
      d: "D", de: "D",
      en: "EN",
      boy: "H",
      "kalınlık": "thickness", kalinlik: "thickness",
      "açı": "bendAngle", aci: "bendAngle"
    };
    const NUM_WORDS = {
      "sıfır": 0, sifir: 0, bir: 1, iki: 2, "üç": 3, uc: 3, "dört": 4, dort: 4,
      "beş": 5, bes: 5, "altı": 6, alti: 6, yedi: 7, sekiz: 8, dokuz: 9,
      on: 10, yirmi: 20, otuz: 30, "kırk": 40, kirk: 40, elli: 50,
      "altmış": 60, altmis: 60, "yetmiş": 70, yetmis: 70, seksen: 80, doksan: 90,
      "yüz": 100, yuz: 100, bin: 1000
    };
    const results = {};
    let i = 0;
    while (i < words.length) {
      const w = words[i];
      if (FIELD_MAP[w]) {
        const field = FIELD_MAP[w];
        i++;
        const numTokens = [];
        while (i < words.length && !FIELD_MAP[words[i]]) {
          numTokens.push(words[i]);
          i++;
        }
        const joined = numTokens.join(" ");
        const digitMatch = joined.match(/\\d+(\\.\\d+)?/);
        let value = null;
        if (digitMatch) {
          value = parseFloat(digitMatch[0]);
        } else {
          let total = 0, current = 0;
          for (const t of numTokens) {
            const val = NUM_WORDS[t];
            if (val === undefined) continue;
            if (val === 100 || val === 1000) {
              current = (current === 0 ? 1 : current) * val;
              total += current;
              current = 0;
            } else {
              current += val;
            }
          }
          value = total + current;
        }
        if (value !== null && !Number.isNaN(value) && value > 0) {
          results[field] = value;
        }
      } else {
        i++;
      }
    }
    return results;
  };

  const applyVoiceTranscript = (transcript) => {
    const parsed = parseVoiceTranscript(transcript);
    if (parsed.A !== undefined) setA(parsed.A);
    if (parsed.B !== undefined) setB(parsed.B);
    if (parsed.C !== undefined) setC(parsed.C);
    if (parsed.D !== undefined) setD(parsed.D);
    if (parsed.EN !== undefined) setEN(parsed.EN);
    if (parsed.H !== undefined) setH(parsed.H);
    if (parsed.thickness !== undefined) setThickness(parsed.thickness);
    if (parsed.bendAngle !== undefined) setBendAngle(parsed.bendAngle);
    setVoiceLastTranscript(transcript);
  };

  const startVoiceInput = async () => {
    try {
      const permStatus = await SpeechRecognition.checkPermissions();
      if (permStatus.speechRecognition !== "granted") {
        const req = await SpeechRecognition.requestPermissions();
        if (req.speechRecognition !== "granted") {
          window.alert("Mikrofon izni verilmedi.");
          return;
        }
      }
      setListening(true);
      const result = await SpeechRecognition.start({
        language: "tr-TR",
        maxResults: 1,
        prompt: "Ölçüleri söyleyin (örn: a yirmi b kırk en bin boy iki bin)",
        popup: false
      });
      setListening(false);
      const transcript = (result && result.matches && result.matches[0]) || "";
      if (transcript) applyVoiceTranscript(transcript);
    } catch (e) {
      setListening(false);
    }
  };

  const [favorites, setFavorites] = useState([]);`,
  "Sesli giris fonksiyonlari eklendi"
);

/* 4) Buton (Gecmis butonunun yanina) */
replaceOnce(
  MAIN_JSX,
  `<button type="button" className="favBtn" onClick={() => setShowHistory(!showHistory)}>🕘 Geçmiş</button>`,
  `<button type="button" className="favBtn" onClick={() => setShowHistory(!showHistory)}>🕘 Geçmiş</button>
                <button type="button" className="favBtn" onClick={startVoiceInput} disabled={listening}>{listening ? "🎙️ Dinliyor..." : "🎤 Sesli Giriş"}</button>`,
  "Sesli Giris butonu eklendi"
);

console.log("\n✅ SESLI GIRIS OZELLIGI BASARIYLA EKLENDI.");
console.log("Simdi: git add -A && git commit -m \"Sesli komutla olcu girisi eklendi\" && git push -u origin main");
