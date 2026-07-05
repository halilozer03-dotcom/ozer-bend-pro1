// patch_kapi_3d_display_scale.cjs
// 1) main.jsx: Sadece "Kapi Profili" modunda, 3D onizlemede A/B/C/D (ayak/buku)
//    olculerini gorsel olarak 2 kat buyutur; EN (ana yuz) ve gercek hesaplamalar
//    (PDF, kesilecek en/boy, etiketler) HIC degismez. Sadece 3D viewer'a giden
//    nokta dizisi bu "gorsel abartili" versiyonu kullanir.
// 2) viewer3d.jsx: Malzemeyi daha mat yapar (karanlik ekranda asiri parlamasin).

const fs = require("fs");
const path = require("path");

const MAIN_JSX = path.join(process.cwd(), "src", "main.jsx");
const VIEWER_JSX = path.join(process.cwd(), "src", "viewer3d.jsx");

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

/* 1) crossSection3DDisplay: sadece kapi modunda A/B/C/D x2, EN degismez */
replaceOnce(
  MAIN_JSX,
  `}, [isGeneral, isLProfile, A, B, C, D, EN, bendAngle, lAngle, segments]);`,
  `}, [isGeneral, isLProfile, A, B, C, D, EN, bendAngle, lAngle, segments]);

  // Sadece "Kapi Profili" modunda, 3D onizlemede ayak/buku (A/B/C/D) olculerini
  // gorsel olarak buyutuyoruz ki bukumler ekranda net secilsin. EN (ana yuz
  // uzunlugu) ve tum gercek hesaplamalar (PDF, kesilecek en/boy, etiketler)
  // BU DEGERDEN ETKILENMEZ — sadece 3D gorunumu icin ayri bir nokta dizisi.
  const DISPLAY_LEG_SCALE = 2;
  const crossSection3DDisplay = useMemo(() => {
    if (!isKapi) return crossSection3D;
    return computeGeneralPoints([
      { length: A * DISPLAY_LEG_SCALE, angle: bendAngle, dir: 1 },
      { length: B * DISPLAY_LEG_SCALE, angle: bendAngle, dir: 1 },
      { length: EN, angle: bendAngle, dir: 1 },
      { length: C * DISPLAY_LEG_SCALE, angle: bendAngle, dir: 1 },
      { length: D * DISPLAY_LEG_SCALE }
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKapi, crossSection3D, A, B, C, D, EN, bendAngle]);`,
  "crossSection3DDisplay eklendi (sadece kapida A/B/C/D x2 gorsel buyutme)"
);

/* 2) Viewer'a gonderilen points'i display versiyonuyla degistir */
replaceOnce(
  MAIN_JSX,
  `points={crossSection3D}`,
  `points={crossSection3DDisplay}`,
  "3D viewer'a gorsel-buyutulmus kesit gonderiliyor"
);

/* 3) viewer3d.jsx: Malzemeyi matlastir (karanlik ekranda fazla parlamasin) */
replaceOnce(
  VIEWER_JSX,
  `const material = new THREE.MeshPhysicalMaterial({
    color: 0xc4cad2,
    metalness: 0.75,
    roughness: 0.28,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.15
  });`,
  `const material = new THREE.MeshPhysicalMaterial({
    color: 0xc4cad2,
    metalness: 0.5,
    roughness: 0.6,
    clearcoat: 0.1,
    clearcoatRoughness: 0.7,
    envMapIntensity: 0.5
  });`,
  "Malzeme matlastirildi (karanlik ekrana gore asiri parlama azaltildi)"
);

console.log("\n✅ KAPI 3D GORSEL BUYUTME + MAT MALZEME PATCH'I BASARIYLA UYGULANDI.");
console.log("Simdi: git add -A && git commit -m \"Kapi 3D: ayak buyutme (gorsel) + mat malzeme\" && git push -u origin main");
