// patch_fix_workflow_if.cjs
// GitHub Actions "if:" kosullarinda dogrudan "secrets" baglamini kullanmaya
// izin vermiyor ("Unrecognized named-value: 'secrets'" hatasi). Bu ucu "if:"
// satirini kaldiriyoruz - madem secret'lar zaten eklendi, bu adimlar hep
// calisabilir (secret'lar eksik olursa sadece o adim basarisiz olur, debug
// APK derlemesi etkilenmez).

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
  `      - name: Configure release signing (Play Store)
        if: \${{ secrets.RELEASE_KEYSTORE_BASE64 != '' }}
        env:`,
  `      - name: Configure release signing (Play Store)
        env:`,
  "1. gecersiz if: satiri kaldirildi (Configure release signing)"
);

replaceOnce(
  workflowPath,
  `      - name: Build Release AAB (Play Store)
        if: \${{ secrets.RELEASE_KEYSTORE_BASE64 != '' }}
        working-directory: android`,
  `      - name: Build Release AAB (Play Store)
        working-directory: android`,
  "2. gecersiz if: satiri kaldirildi (Build Release AAB)"
);

replaceOnce(
  workflowPath,
  `      - name: Upload Release AAB (Play Store)
        if: \${{ secrets.RELEASE_KEYSTORE_BASE64 != '' }}
        uses: actions/upload-artifact@v4`,
  `      - name: Upload Release AAB (Play Store)
        uses: actions/upload-artifact@v4`,
  "3. gecersiz if: satiri kaldirildi (Upload Release AAB)"
);

/* 4) Heredoc'u (bash/YAML girinti catismasi riski) daha guvenli echo-append ile degistir */
replaceOnce(
  workflowPath,
  `          cat >> android/app/build.gradle << 'GRADLE_EOF'

          android {
              signingConfigs {
                  release {
                      storeFile file(System.getenv("RELEASE_KEYSTORE_PATH") ?: "keystore_release/release.keystore")
                      storePassword System.getenv("RELEASE_KEYSTORE_PASSWORD")
                      keyAlias System.getenv("RELEASE_KEY_ALIAS")
                      keyPassword System.getenv("RELEASE_KEY_PASSWORD")
                  }
              }
              buildTypes {
                  release {
                      signingConfig signingConfigs.release
                  }
              }
          }
          GRADLE_EOF`,
  `          {
            echo ""
            echo "android {"
            echo "    signingConfigs {"
            echo "        release {"
            echo "            storeFile file(System.getenv(\\"RELEASE_KEYSTORE_PATH\\") ?: \\"keystore_release/release.keystore\\")"
            echo "            storePassword System.getenv(\\"RELEASE_KEYSTORE_PASSWORD\\")"
            echo "            keyAlias System.getenv(\\"RELEASE_KEY_ALIAS\\")"
            echo "            keyPassword System.getenv(\\"RELEASE_KEY_PASSWORD\\")"
            echo "        }"
            echo "    }"
            echo "    buildTypes {"
            echo "        release {"
            echo "            signingConfig signingConfigs.release"
            echo "        }"
            echo "    }"
            echo "}"
          } >> android/app/build.gradle`,
  "4. Riskli heredoc, guvenli echo-append yontemiyle degistirildi"
);

console.log("\n✅ WORKFLOW IF: HATASI DUZELTILDI.");
console.log("Simdi: git add -A && git commit -m \"Workflow: gecersiz if secrets kosullari kaldirildi\" && git push -u origin main");
