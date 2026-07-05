import { jsPDF } from "jspdf";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

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

async function outputPdf(doc, fileName, action = "save") {
  const blob = doc.output("blob");

  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob);
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
        recursive: true
      });

      if (action === "save" || action === "print") {
        try {
          const { FileOpener } = await import("@capacitor-community/file-opener");
          await FileOpener.open({ filePath: saved.uri, contentType: "application/pdf" });
          return;
        } catch (openErr) {
          console.warn("FileOpener kullanılamadı, paylaşım penceresine düşülüyor:", openErr);
        }
      }

      await Share.share({
        title: "ÖZER BEND PRO PDF",
        text: "ÖZER BEND PRO teknik çizim PDF",
        url: saved.uri,
        dialogTitle: "PDF Paylaş"
      });
      return;
    } catch (err) {
      const msg = String(err?.message || err || "");
      const isCancel = /cancel/i.test(msg) || /iptal/i.test(msg);
      if (!isCancel) {
        console.error("Android PDF output error:", err);
        alert("PDF işleminde hata oluştu: " + msg);
      } else {
        console.log("PDF işlemi kullanıcı tarafından iptal edildi.");
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
          title: "ÖZER BEND PRO PDF",
          text: "ÖZER BEND PRO teknik çizim PDF"
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
  doc.text(valueText, x, (y1 + y2) / 2 + 1.5, { align: "center" });
  if (label) {
    doc.setTextColor(...labelColor);
    doc.setFontSize(13);
    doc.text(label, labelSide === "left" ? x - 13 : x + 13, (y1 + y2) / 2 + 1.5, { align: "center" });
  }
}

function drawFooterCell(doc, x, w, title, value, red) {
  doc.setDrawColor(120, 120, 120);
  doc.line(x, 180, x, 205);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(red ? 210 : 0, 0, 0);
  doc.setFontSize(14);
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
  try {
    await createPdfInner(args);
  } catch (err) {
    const msg = String(err?.message || err || "");
    const isCancel = /cancel/i.test(msg) || /iptal/i.test(msg);
    if (!isCancel) {
      console.error("PDF oluşturma hatası:", err);
      alert("PDF oluşturulurken hata oluştu: " + msg);
    }
  }
}

async function createPdfInner({ data, result, lang, action = "save" }) {
  const doc = new jsPDF("landscape", "mm", "a4");
  const red = [210, 0, 0];
  const ink = [0, 0, 0];
  const isLProfile = data.profileType === "l";

  const rawA = safeNumber(data.A);
  const rawB = safeNumber(data.B);
  const rawC = safeNumber(data.C);
  const rawD = safeNumber(data.D);
  const EN = safeNumber(data.EN);
  const kalip = data.kalip || "V16";
  const upperDie = data.upperDie || "R8";
  const machine = data.machine || "DURMA Easy";
  const material = data.material || "DKP";
  const thickness = safeNumber(data.thickness, 2);
  const angle = safeNumber(data.aci, 90);
  const kesilecekEn = safeNumber(result.kesilecekEn);
  const kesilecekBoy = result.kesilecekBoy == null ? null : safeNumber(result.kesilecekBoy);
  const tarih = new Date().toLocaleDateString("fr-FR");
  const saat = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const fileName = makeFileName(data);

  const A = rawA;
  const B = isLProfile ? rawB : rawC;
  const C = isLProfile ? rawC : rawD;
  const D = isLProfile ? rawD : rawB;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, 210, "F");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.45);
  doc.rect(3, 3, 291, 204);

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
  doc.text("PROFESYONEL BÜKÜM ÇÖZÜMLERİ", 148.5, 25, { align: "center" });
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(6, 29, 291, 29);

  const info = [
    ["PROFİL", isLProfile ? "KÖŞEBENT L" : "KAPI PROFİLİ", 42],
    ["MALZEME", material, 32],
    ["KALINLIK", `${thickness.toFixed(2)} mm`, 34],
    ["MAKİNE", machine, 42],
    ["ALT KALIP", kalip, 38],
    ["ÜST KALIP", upperDie.includes("R8") ? "R8" : upperDie, 38],
    ["AÇI", `${angle}°`, 24],
    ["TARİH / SAAT", `${tarih}  ${saat}`, 45]
  ];
  let ix = 6;
  info.forEach(([title, value, width]) => {
    drawInfoCell(doc, ix, width, title, value);
    ix += width;
  });
  doc.line(291, 29, 291, 50);
  doc.line(6, 50, 291, 50);

  if (isLProfile) {
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

    dimH(doc, x1, x2, yTop - 14, fmt(EN));
    dimV(doc, x1 - 24, yTop, yBot, fmt(B), "B", "left", red);
    dimV(doc, x2 + 24, yTop, yBot, fmt(C), "C", "right", red);
    dimH(doc, x1, x1 + foot, yBot + 14, fmt(A), "A", red);
    dimH(doc, x2 - foot, x2, yBot + 14, fmt(D), "D", red);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.28);
    doc.line(x1 + 8, yTop, x1 + 8, yTop + 8);
    doc.line(x1, yTop + 8, x1 + 8, yTop + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text("90°", x1 + 12, yTop + 12);
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(6, 174, 285, 31);
  drawFooterCell(doc, 6, 40, "A", mm(A), true);
  drawFooterCell(doc, 46, 40, "B", mm(B), true);
  drawFooterCell(doc, 86, 40, "C", mm(C), true);
  drawFooterCell(doc, 126, 40, "D", mm(D), true);
  drawFooterCell(doc, 166, 62, "KESİLECEK EN", mm(kesilecekEn), true);
  drawFooterCell(doc, 228, 63, "KESİLECEK BOY", kesilecekBoy == null ? "-" : mm(kesilecekBoy), true);

  await outputPdf(doc, fileName, action);
}
