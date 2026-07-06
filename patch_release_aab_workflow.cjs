// patch_release_aab_workflow.cjs
// Workflow'a, GitHub Secrets'tan okunan release keystore ile imzalanmis
// Play Store formatinda (.aab) bir derleme adimi ekler. Mevcut debug APK
// derlemesi (test icin) OLDUGU GIBI KALIR, bu YENI bir ek adim.
//
// ONEMLI: Bu patch'i calistirmadan ONCE GitHub reponda su 4 "Secret"i
// eklemen lazim (Settings > Secrets and variables > Actions > New repository secret):
//   RELEASE_KEYSTORE_BASE64   -> ozerbend-release.keystore dosyasinin base64 hali
//   RELEASE_KEYSTORE_PASSWORD -> keystore sifresi
//   RELEASE_KEY_ALIAS         -> ozerbendpro
//   RELEASE_KEY_PASSWORD      -> key sifresi (genelde keystore sifresiyle ayni)

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
  `      - name: Build APK
        working-directory: android
        run: |
          chmod +x gradlew
          ./gradlew assembleDebug

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: OZER_BEND_PRO_MASTER_APK
          path: android/app/build/outputs/apk/debug/app-debug.apk`,
  `      - name: Build APK
        working-directory: android
        run: |
          chmod +x gradlew
          ./gradlew assembleDebug

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: OZER_BEND_PRO_MASTER_APK
          path: android/app/build/outputs/apk/debug/app-debug.apk

      - name: Configure release signing (Play Store)
        if: \${{ secrets.RELEASE_KEYSTORE_BASE64 != '' }}
        env:
          RELEASE_KEYSTORE_BASE64: \${{ secrets.RELEASE_KEYSTORE_BASE64 }}
        run: |
          mkdir -p android/keystore_release
          echo "$RELEASE_KEYSTORE_BASE64" | base64 -d > android/keystore_release/release.keystore
          cat >> android/app/build.gradle << 'GRADLE_EOF'

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
          GRADLE_EOF

      - name: Build Release AAB (Play Store)
        if: \${{ secrets.RELEASE_KEYSTORE_BASE64 != '' }}
        working-directory: android
        env:
          RELEASE_KEYSTORE_PATH: keystore_release/release.keystore
          RELEASE_KEYSTORE_PASSWORD: \${{ secrets.RELEASE_KEYSTORE_PASSWORD }}
          RELEASE_KEY_ALIAS: \${{ secrets.RELEASE_KEY_ALIAS }}
          RELEASE_KEY_PASSWORD: \${{ secrets.RELEASE_KEY_PASSWORD }}
        run: |
          chmod +x gradlew
          ./gradlew bundleRelease

      - name: Upload Release AAB (Play Store)
        if: \${{ secrets.RELEASE_KEYSTORE_BASE64 != '' }}
        uses: actions/upload-artifact@v4
        with:
          name: OZER_BEND_PRO_RELEASE_AAB
          path: android/app/build/outputs/bundle/release/app-release.aab`,
  `Release AAB derleme adimlari workflow'a eklendi (${workflowFiles[0]})`
);

console.log("\n✅ RELEASE AAB WORKFLOW PATCH'I BASARIYLA UYGULANDI.");
console.log("ONEMLI: GitHub'da 4 Secret eklemeden bu adimlar calismaz (atlanir, hata vermez).");
console.log("Simdi: git add -A && git commit -m \"Play Store icin release AAB derleme adimi eklendi\" && git push -u origin main");
