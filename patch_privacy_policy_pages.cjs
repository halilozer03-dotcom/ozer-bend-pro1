// patch_privacy_policy_pages.cjs
// Gizlilik politikasini "docs/index.html" olarak ekler - GitHub Pages bu
// klasoru yayinlayabilir, boylece Play Console icin gereken sabit bir
// gizlilik politikasi linki elde edilir.

const fs = require("fs");
const path = require("path");

const DOCS_DIR = path.join(process.cwd(), "docs");
const INDEX_HTML = path.join(DOCS_DIR, "index.html");

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ÖZER BEND PRO — Gizlilik Politikası</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    max-width: 760px;
    margin: 0 auto;
    padding: 32px 20px 80px;
    line-height: 1.65;
    color: #1a1a1a;
    background: #fff;
  }
  h1 { font-size: 26px; margin-bottom: 4px; }
  h2 { font-size: 19px; margin-top: 36px; color: #222; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
  .updated { color: #666; font-size: 14px; margin-bottom: 28px; }
  strong { color: #111; }
  a { color: #0645ad; }
  ul { padding-left: 22px; }
  hr { border: none; border-top: 1px solid #e5e5e5; margin: 40px 0 16px; }
  .footer { color: #888; font-size: 13px; }
</style>
</head>
<body>

<h1>ÖZER BEND PRO — Gizlilik Politikası</h1>
<p class="updated"><strong>Son güncelleme:</strong> Temmuz 2026</p>

<h2>Genel Bakış</h2>
<p>ÖZER BEND PRO ("Uygulama"), sac metal büküm hesaplamaları yapan bir profesyonel araçtır. Kullanıcılarımızın gizliliğine önem veriyoruz. Bu politika, Uygulama'yı kullanırken hangi bilgilerin işlendiğini açıklar.</p>

<h2>Topladığımız Veriler</h2>
<p><strong>Uygulama, hiçbir kişisel veriyi bizim sunucularımıza veya üçüncü taraflara göndermez.</strong></p>
<p>Uygulama içinde girdiğiniz tüm bilgiler (ölçüler, malzeme seçimleri, favori kayıtlar, firma adı, dil tercihi vb.) <strong>yalnızca cihazınızın yerel hafızasında (localStorage)</strong> saklanır. Bu veriler:</p>
<ul>
  <li>İnternete gönderilmez</li>
  <li>Bizim tarafımızdan görüntülenemez veya erişilemez</li>
  <li>Yalnızca sizin cihazınızda kalır</li>
  <li>Uygulamayı cihazınızdan kaldırdığınızda silinir</li>
</ul>

<h2>Oluşturulan Dosyalar (PDF)</h2>
<p>Uygulama içinde oluşturduğunuz PDF teknik çizimleri tamamen cihazınızda üretilir ve yalnızca siz paylaşmayı/kaydetmeyi seçtiğinizde cihazınızın paylaşım/kaydetme sistemleri aracılığıyla işlenir. Bu dosyalar bizim tarafımızdan görülmez veya saklanmaz.</p>

<h2>Üçüncü Taraf Hizmetler</h2>
<p>Uygulama şu anda:</p>
<ul>
  <li>Reklam göstermemektedir</li>
  <li>Analitik/izleme yazılımı kullanmamaktadır</li>
  <li>Üçüncü taraf veri toplama hizmetleri (Google Analytics, Firebase Analytics vb.) içermemektedir</li>
</ul>
<p>Google Play Store üzerinden dağıtım yapıldığı için, Google'ın kendi gizlilik politikası (satın alma, indirme istatistikleri vb. için) ayrıca geçerlidir: <a href="https://policies.google.com/privacy" target="_blank">policies.google.com/privacy</a></p>

<h2>İzinler</h2>
<p>Uygulama, PDF dosyalarını kaydetmek/paylaşmak için cihazınızın dosya sistemine ve paylaşım özelliklerine erişim isteyebilir. Bu erişim yalnızca sizin talebiniz üzerine (PDF oluştur/paylaş/yazdır butonlarına bastığınızda) kullanılır.</p>

<h2>Çocukların Gizliliği</h2>
<p>Uygulama, sac metal büküm endüstrisinde çalışan profesyoneller için tasarlanmıştır ve çocuklara yönelik değildir. Bilerek 13 yaşın altındaki kişilerden veri toplamıyoruz (zaten hiçbir veri toplanmamaktadır).</p>

<h2>Bu Politikadaki Değişiklikler</h2>
<p>Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda bu sayfa güncellenecektir.</p>

<h2>İletişim</h2>
<p>Bu gizlilik politikası hakkında sorularınız için:<br>
<strong>E-posta:</strong> halilozer03@gmail.com</p>

<hr>
<p class="footer">Bu belge ÖZER BEND PRO uygulaması için hazırlanmıştır.</p>

</body>
</html>
`;

fs.mkdirSync(DOCS_DIR, { recursive: true });
fs.writeFileSync(INDEX_HTML, HTML_CONTENT, "utf8");
console.log("[OK] docs/index.html olusturuldu (gizlilik politikasi)");

console.log("\n✅ GIZLILIK POLITIKASI SAYFASI HAZIRLANDI.");
console.log("Simdi: git add -A && git commit -m \"Gizlilik politikasi sayfasi eklendi (GitHub Pages)\" && git push -u origin main");
console.log("Sonra GitHub'da: Settings > Pages > Source: Deploy from branch > Branch: main, klasor: /docs > Save");
console.log("Birkac dakika sonra sayfan su adreste yayinda olacak: https://halilozer03-dotcom.github.io/ozer-bend-pro1/");
