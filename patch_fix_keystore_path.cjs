// patch_fix_keystore_path.cjs
// Keystore dosyasi "android/keystore_release/" yerine "android/app/keystore_release/"
// klasorune konulmali - cunku Gradle'in build.gradle icindeki file() cagrisi,
// dosyanin bulundugu proje dizinine (android/app/) gore relative yol cozer.

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
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

const workflowFiles = fs.readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
if (workflowFiles.length === 0) {
  throw new Error("[HATA] .github/workflows icinde .yml dosyasi bulunamadi");
}
const workflowPath = path.join(WORKFLOWS_DIR, workflowFiles[0]);

replaceOnce(
  workflowPath,
  `          mkdir -p android/keystore_release
          echo "$RELEASE_KEYSTORE_BASE64" | base64 -d > android/keystore_release/release.keystore`,
  `          mkdir -p android/app/keystore_release
          echo "$RELEASE_KEYSTORE_BASE64" | base64 -d > android/app/keystore_release/release.keystore`,
  "Keystore dosya yolu android/app/keystore_release/ olarak duzeltildi"
);

console.log("\n✅ KEYSTORE YOLU DUZELTMESI BASARIYLA UYGULANDI.");
console.log("Simdi: git add -A && git commit -m \"Release keystore yolu duzeltildi (android/app altina)\" && git push -u origin main");
