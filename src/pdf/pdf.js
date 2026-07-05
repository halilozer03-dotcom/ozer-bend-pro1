import { jsPDF } from "jspdf";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const FEEDBACK_EMAIL = "halilozer03@gmail.com";

const PDF_DICT = {
  tr: {
    profil: "PROFİL",
    kapiProfili: "KAPI PROFİLİ",
    kosebentL: "KÖŞEBENT L",
    malzeme: "MALZEME",
    kalinlik: "KALINLIK",
    makine: "MAKİNE",
    altKalip: "ALT KALIP",
    ustKalip: "ÜST KALIP",
    aci: "AÇI",
    tarihSaat: "TARİH / SAAT",
    kesilecekEn: "KESİLECEK EN",
    kesilecekBoy: "KESİLECEK BOY",
    boyLabel: "BOY",
    slogan: "PROFESYONEL BÜKÜM ÇÖZÜMLERİ",
    shareTitle: "ÖZER BEND PRO PDF",
    shareText: "ÖZER BEND PRO teknik çizim PDF",
    shareDialogTitle: "PDF Paylaş",
    errorConfirmPrefix: "PDF işleminde hata oluştu:\n",
    errorConfirmSuffix: "\n\nBu hatayı e-posta ile geliştiriciye bildirmek ister misin?",
    errorSubject: "ÖZER BEND PRO - PDF Hata Bildirimi",
    genericErrorSubject: "ÖZER BEND PRO - Otomatik Hata Bildirimi",
    dateLocale: "tr-TR"
  },
  en: {
    profil: "PROFILE",
    kapiProfili: "DOOR PROFILE",
    kosebentL: "CORNER L",
    malzeme: "MATERIAL",
    kalinlik: "THICKNESS",
    makine: "MACHINE",
    altKalip: "LOWER DIE",
    ustKalip: "UPPER PUNCH",
    aci: "ANGLE",
    tarihSaat: "DATE / TIME",
    kesilecekEn: "CUT WIDTH",
    kesilecekBoy: "CUT LENGTH",
    boyLabel: "LENGTH",
    slogan: "PROFESSIONAL BENDING SOLUTIONS",
    shareTitle: "ÖZER BEND PRO PDF",
    shareText: "ÖZER BEND PRO technical drawing PDF",
    shareDialogTitle: "Share PDF",
    errorConfirmPrefix: "An error occurred while processing the PDF:\n",
    errorConfirmSuffix: "\n\nWould you like to report this error to the developer by email?",
    errorSubject: "ÖZER BEND PRO - PDF Error Report",
    genericErrorSubject: "ÖZER BEND PRO - Automatic Error Report",
    dateLocale: "en-US"
  },
  fr: {
    profil: "PROFIL",
    kapiProfili: "PROFIL PORTE",
    kosebentL: "CORNIÈRE L",
    malzeme: "MATIÈRE",
    kalinlik: "ÉPAISSEUR",
    makine: "MACHINE",
    altKalip: "MATRICE",
    ustKalip: "POINÇON",
    aci: "ANGLE",
    tarihSaat: "DATE / HEURE",
    kesilecekEn: "LARGEUR DE COUPE",
    kesilecekBoy: "LONGUEUR DE COUPE",
    boyLabel: "LONGUEUR",
    slogan: "SOLUTIONS DE PLIAGE PROFESSIONNELLES",
    shareTitle: "ÖZER BEND PRO PDF",
    shareText: "PDF du dessin technique ÖZER BEND PRO",
    shareDialogTitle: "Partager le PDF",
    errorConfirmPrefix: "Une erreur s'est produite lors du traitement du PDF :\n",
    errorConfirmSuffix: "\n\nSouhaitez-vous signaler cette erreur au développeur par e-mail ?",
    errorSubject: "ÖZER BEND PRO - Rapport d'erreur PDF",
    genericErrorSubject: "ÖZER BEND PRO - Rapport d'erreur automatique",
    dateLocale: "fr-FR"
  },
  de: {
    profil: "PROFIL",
    kapiProfili: "TÜRPROFIL",
    kosebentL: "WINKEL L",
    malzeme: "MATERIAL",
    kalinlik: "DICKE",
    makine: "MASCHINE",
    altKalip: "UNTERGESENK",
    ustKalip: "OBERSTEMPEL",
    aci: "WINKEL",
    tarihSaat: "DATUM / ZEIT",
    kesilecekEn: "SCHNITTBREITE",
    kesilecekBoy: "SCHNITTLÄNGE",
    boyLabel: "LÄNGE",
    slogan: "PROFESSIONELLE BIEGELÖSUNGEN",
    shareTitle: "ÖZER BEND PRO PDF",
    shareText: "ÖZER BEND PRO technische Zeichnung PDF",
    shareDialogTitle: "PDF teilen",
    errorConfirmPrefix: "Beim Erstellen des PDFs ist ein Fehler aufgetreten:\n",
    errorConfirmSuffix: "\n\nMöchtest du diesen Fehler per E-Mail an den Entwickler melden?",
    errorSubject: "ÖZER BEND PRO - PDF-Fehlermeldung",
    genericErrorSubject: "ÖZER BEND PRO - Automatische Fehlermeldung",
    dateLocale: "de-DE"
  }
};

function pdfDict(lang) {
  return PDF_DICT[lang] || PDF_DICT.tr;
}

function materialLabel(code, lang) {
  if (code === "Galvaniz") {
    if (lang === "en") return "Galvanized";
    if (lang === "de") return "Verzinkt";
    if (lang === "fr") return "Galvanisé";
    return "Galvaniz";
  }
  if (typeof code === "string" && code.startsWith("Alüminyum")) {
    const suffix = code.replace("Alüminyum", "").trim();
    const word = lang === "tr" ? "Alüminyum" : "Aluminium";
    return `${word} ${suffix}`.trim();
  }
  return code;
}

function reportPdfError(msg, context, lang) {
  const d = pdfDict(lang);
  const send = window.confirm(d.errorConfirmPrefix + msg + d.errorConfirmSuffix);
  if (send) {
    try {
      const body = `Error: ${msg}\n${context}\nDate: ${new Date().toLocaleString()}\nDevice: ${navigator.userAgent}`;
      const url = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(d.errorSubject)}&body=${encodeURIComponent(body)}`;
      window.location.href = url;
    } catch (_) {}
  }
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function fmt(value) {
  return safeNumber(value).toFixed(2);
}

function mm(value) {
  return `${safeNumber(value).toFixed(2)} mm`;
}

function makeFileName(data) {
  const name = data?.profileType === "l" ? "kosebent-l" : "kapi-profili";
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return `ozer-bend-pro-${name}-${stamp}.pdf`;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function openBlobInBrowser(blob, fileName, action) {
  const url = URL.createObjectURL(blob);

  if (action === "print") {
    const win = window.open(url, "_blank");
    if (win) {
      setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch (_) {}
      }, 700);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }
  }

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function outputPdf(doc, fileName, action = "save", lang = "tr") {
  const blob = doc.output("blob");
  const d = pdfDict(lang);

  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob);
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
        recursive: true
      });

      // "save" (PDF) ve "print" (YAZDIR) butonları: dosyayı gerçekten AÇ
      // (sistemin varsayılan PDF görüntüleyicisiyle), paylaşım ekranı değil.
      if (action === "save" || action === "print") {
        try {
          const { FileOpener } = await import("@capacitor-community/file-opener");
          await FileOpener.open({ filePath: saved.uri, contentType: "application/pdf" });
          return;
        } catch (openErr) {
          console.warn("FileOpener unavailable, falling back to Share:", openErr);
        }
      }

      // "share" (PAYLAŞ) butonu: gerçek native paylaşım penceresi.
      await Share.share({
        title: d.shareTitle,
        text: d.shareText,
        url: saved.uri,
        dialogTitle: d.shareDialogTitle
      });
      return;
    } catch (err) {
      const msg = String(err?.message || err || "");
      // Kullanıcı paylaşım/açma penceresini iptal edip geri döndüğünde
      // sistem bunu "hata" gibi bildirir; bu normal bir durumdur, kullanıcıyı
      // korkutan bir uyarı göstermeye gerek yok.
      const isCancel = /cancel/i.test(msg) || /iptal/i.test(msg) || /annulé/i.test(msg) || /abgebrochen/i.test(msg);
      if (!isCancel) {
        console.error("Android PDF output error:", err);
        reportPdfError(msg, `Action: ${action}, File: ${fileName}`, lang);
      } else {
        console.log("PDF action cancelled by user.");
      }
      return;
    }
  }

  if (action === "share") {
    try {
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          files: [file],
          title: d.shareTitle,
          text: d.shareText
        });
        return;
      }
    } catch (_) {}
  }

  openBlobInBrowser(blob, fileName, action);
}


function lineArrow(doc, x1, y1, x2, y2, size = 2.2) {
  doc.line(x1, y1, x2, y2);
  const a = Math.atan2(y2 - y1, x2 - x1);
  const drawHead = (x, y, rot) => {
    doc.line(x, y, x - size * Math.cos(rot - Math.PI / 7), y - size * Math.sin(rot - Math.PI / 7));
    doc.line(x, y, x - size * Math.cos(rot + Math.PI / 7), y - size * Math.sin(rot + Math.PI / 7));
  };
  drawHead(x2, y2, a);
  drawHead(x1, y1, a + Math.PI);
}

function dimH(doc, x1, x2, y, text, label = null, labelColor = [185, 28, 28]) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.28);
  doc.line(x1, y - 5, x1, y + 5);
  doc.line(x2, y - 5, x2, y + 5);
  lineArrow(doc, x1, y, x2, y, 2.0);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(text, (x1 + x2) / 2, y - 2.3, { align: "center" });
  if (label) {
    doc.setTextColor(...labelColor);
    doc.setFontSize(12);
    doc.text(label, (x1 + x2) / 2, y + 10, { align: "center" });
  }
}

function dimV(doc, x, y1, y2, valueText, label = null, labelSide = "left", labelColor = [185, 28, 28]) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.28);
  doc.line(x - 5, y1, x + 5, y1);
  doc.line(x - 5, y2, x + 5, y2);
  lineArrow(doc, x, y1, x, y2, 2.0);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  // Değer yazısı artık çizginin tam üzerinde değil, yanında (çizim çizgisine
  // paralel, ölçü çizgisi kesintisiz) — sayının ortasından geçmesin diye.
  const side = labelSide === "left" ? -1 : 1;
  doc.text(valueText, x + side * 9, (y1 + y2) / 2 + 1.5, { align: "center" });
  if (label) {
    doc.setTextColor(...labelColor);
    doc.setFontSize(13);
    doc.text(label, x + side * 21, (y1 + y2) / 2 + 1.5, { align: "center" });
  }
}

function drawFooterCell(doc, x, w, title, value, red) {
  doc.setDrawColor(120, 120, 120);
  doc.line(x, 180, x, 205);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(red ? 210 : 0, 0, 0);
  doc.setFontSize(title.length > 2 ? 11 : 14);
  doc.text(title, x + w / 2, 189, { align: "center" });
  doc.setTextColor(red ? 210 : 0, 0, 0);
  doc.setFontSize(title.length > 2 ? 13 : 9.5);
  doc.text(value, x + w / 2, 199, { align: "center" });
}

function drawInfoCell(doc, x, w, title, value) {
  doc.setDrawColor(120, 120, 120);
  doc.line(x, 29, x, 50);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(title, x + w / 2, 36, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(value, x + w / 2, 45, { align: "center" });
}

export async function createPdf(args) {
  const lang = args?.lang || "tr";
  try {
    await createPdfInner(args);
  } catch (err) {
    const msg = String(err?.message || err || "");
    const isCancel = /cancel/i.test(msg) || /iptal/i.test(msg) || /annulé/i.test(msg) || /abgebrochen/i.test(msg);
    if (!isCancel) {
      console.error("PDF creation error:", err);
      reportPdfError(msg, `Action: ${args?.action}, Profile: ${args?.data?.profileType}`, lang);
    }
  }
}

async function createPdfInner({ data, result, lang = "tr", action = "save" }) {
  const d = pdfDict(lang);
  const doc = new jsPDF("landscape", "mm", "a4");

  // jsPDF'in yerleşik Helvetica fontu Türkçe'ye özgü noktalı büyük İ (U+0130)
  // ve noktasız küçük ı (U+0131) harflerini desteklemiyor, "0" gibi yanlış
  // basıyor. Her metin çizimini otomatik düzeltmek için doc.text'i sarıyoruz.
  const originalText = doc.text.bind(doc);
  doc.text = (text, ...rest) => {
    const fixed = typeof text === "string"
      ? text.replace(/İ/g, "I").replace(/ı/g, "i")
      : Array.isArray(text)
        ? text.map((t) => typeof t === "string" ? t.replace(/İ/g, "I").replace(/ı/g, "i") : t)
        : text;
    return originalText(fixed, ...rest);
  };
  const red = [210, 0, 0];
  const ink = [0, 0, 0];
  const isLProfile = data.profileType === "l";

  const rawA = safeNumber(data.A);
  const rawB = safeNumber(data.B);
  const rawC = safeNumber(data.C);
  const rawD = safeNumber(data.D);
  const EN = safeNumber(data.EN);
  const H = safeNumber(data.H);
  const kalip = data.kalip || "V16";
  const upperDie = data.upperDie || "R8";
  const machine = data.machine || "DURMA Easy";
  const material = data.material || "DKP";
  const thickness = safeNumber(data.thickness, 2);
  const angle = safeNumber(data.aci, 90);
  const kesilecekEn = safeNumber(result.kesilecekEn);
  const kesilecekBoy = result.kesilecekBoy == null ? null : safeNumber(result.kesilecekBoy);
  const tarih = new Date().toLocaleDateString(d.dateLocale);
  const saat = new Date().toLocaleTimeString(d.dateLocale, { hour: "2-digit", minute: "2-digit" });
  const fileName = makeFileName(data);

  // Kapı profilinde PDF üzerinde istenen üretim okuması:
  // A = sol yatay ayak, B = sol dik kanat, C = sağ dik kanat, D = sağ yatay ayak.
  const A = rawA;
  const B = isLProfile ? rawB : rawC;
  const C = isLProfile ? rawC : rawD;
  const D = isLProfile ? rawD : rawB;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, 210, "F");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.45);
  doc.rect(1.5, 1.5, 294, 207);

  // Logo ve başlık.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  doc.setTextColor(0, 0, 0);
  doc.text("ÖZER", 96, 18);
  doc.setTextColor(...red);
  doc.text("BEND", 133, 18);
  doc.setTextColor(0, 0, 0);
  doc.text("PRO", 174, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(80, 80, 80);
  doc.text(d.slogan, 148.5, 25, { align: "center" });
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(4.5, 29, 292.5, 29);

  // Sade üst bilgi satırı.
  const info = [
    [d.profil, isLProfile ? d.kosebentL : d.kapiProfili, 42],
    [d.malzeme, materialLabel(material, lang), 32],
    [d.kalinlik, `${thickness.toFixed(2)} mm`, 34],
    [d.makine, machine, 42],
    [d.altKalip, kalip, 38],
    [d.ustKalip, upperDie.includes("R8") ? "R8" : upperDie, 38],
    [d.aci, `${angle}°`, 24],
    [d.tarihSaat, `${tarih}  ${saat}`, 45]
  ];
  let ix = 4.5;
  info.forEach(([title, value, width]) => {
    drawInfoCell(doc, ix, width, title, value);
    ix += width;
  });
  doc.line(292.5, 29, 292.5, 50);
  doc.line(4.5, 50, 292.5, 50);

  if (isLProfile) {
    // L profil için sade çizim korunur.
    const cx = 105, cy = 140;
    const lenA = 70;
    const lenB = 55;
    doc.setDrawColor(...ink);
    doc.setLineCap("round");
    doc.setLineJoin("round");
    doc.setLineWidth(2.8);
    doc.line(cx, cy, cx + lenA, cy);
    doc.line(cx, cy, cx, cy - lenB);
    dimH(doc, cx, cx + lenA, cy + 18, `A ${fmt(rawA)}`);
    dimV(doc, cx - 18, cy - lenB, cy, `B ${fmt(rawB)}`);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${angle}°`, cx + 8, cy - 9);
  } else {
    // Ana kapı profil çizimi.
    const x1 = 55;
    const x2 = 242;
    const yTop = 86;
    const yBot = 141;
    const foot = 23;

    doc.setDrawColor(...ink);
    doc.setLineCap("round");
    doc.setLineJoin("round");
    doc.setLineWidth(2.7);
    doc.line(x1, yTop, x2, yTop);
    doc.line(x1, yTop, x1, yBot);
    doc.line(x2, yTop, x2, yBot);
    doc.line(x1, yBot, x1 + foot, yBot);
    doc.line(x2 - foot, yBot, x2, yBot);

    // Ölçüler: sadece gerekli olanlar. B ve C dik kanatların yanında.
    dimH(doc, x1, x2, yTop - 14, fmt(EN));
    dimV(doc, x1 - 24, yTop, yBot, fmt(B), "B", "left", red);
    dimV(doc, x2 + 24, yTop, yBot, fmt(C), "C", "right", red);
    dimH(doc, x1, x1 + foot, yBot + 14, fmt(A), "A", red);
    dimH(doc, x2 - foot, x2, yBot + 14, fmt(D), "D", red);

    // Sadece sol üst 90 derece işareti (geçerli jsPDF komutlarıyla: küçük bir kare işaret).
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.28);
    doc.line(x1 + 8, yTop, x1 + 8, yTop + 8);
    doc.line(x1, yTop + 8, x1 + 8, yTop + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text("90°", x1 + 12, yTop + 12);

    // BOY (uzunluk) ölçü çizgisi: A'nın iç köşesinden (dikey kolla birleştiği
    // nokta) parçanın ortasına doğru, profil çizgisiyle aynı kalınlıkta.
    // Yazı, çizgiye paralel (aynı açıda döndürülmüş) olarak basılır.
    const boyX1 = x1, boyY1 = yBot;
    const boyX2 = x1 + 75, boyY2 = yTop + 15;
    doc.setDrawColor(...ink);
    doc.setLineCap("round");
    doc.setLineJoin("round");
    doc.setLineWidth(2.7);
    doc.line(boyX1, boyY1, boyX2, boyY2);
    const boyAngleDeg = -(Math.atan2(boyY2 - boyY1, boyX2 - boyX1) * 180 / Math.PI);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    const boyMidX = (boyX1 + boyX2) / 2;
    const boyMidY = (boyY1 + boyY2) / 2;
    doc.text(`${d.boyLabel}: ${fmt(H)} mm`, boyMidX - 4, boyMidY - 4, { angle: boyAngleDeg });
  }

  // Alt özet satırı.
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(4.5, 174, 288, 31);
  drawFooterCell(doc, 6, 40, "A", mm(A), true);
  drawFooterCell(doc, 46, 40, "B", mm(B), true);
  drawFooterCell(doc, 86, 40, "C", mm(C), true);
  drawFooterCell(doc, 126, 40, "D", mm(D), true);
  drawFooterCell(doc, 166, 62, d.kesilecekEn, mm(kesilecekEn), true);
  drawFooterCell(doc, 228, 63, d.kesilecekBoy, kesilecekBoy == null ? "-" : mm(kesilecekBoy), true);

  await outputPdf(doc, fileName, action, lang);
}
