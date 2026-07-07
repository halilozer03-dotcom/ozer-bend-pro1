const fs = require("fs");
const FILE = ".github/workflows/android.yml";
let src = fs.readFileSync(FILE, "utf8");
fs.writeFileSync(FILE + ".bak", src);
const OLD = `      - name: Generate app icons from logo
        run: npx capacitor-assets generate --android`;
const NEW = `      - name: Set versionCode from build number
        run: |
          sed -i "s/versionCode 1/versionCode ${{ github.run_number }}/" android/app/build.gradle
          echo "versionCode set to ${{ github.run_number }}"

      - name: Generate app icons from logo
        run: npx capacitor-assets generate --android`;
if (src.includes(OLD)) {
  src = src.replace(OLD, NEW);
  fs.writeFileSync(FILE, src);
  console.log("✅ Tamam");
} else {
  console.log("❌ Eşleşmedi");
}
