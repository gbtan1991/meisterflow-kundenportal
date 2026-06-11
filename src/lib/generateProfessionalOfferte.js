import jsPDF from "jspdf";
import { formatDatum, formatCHF } from "@/lib/format";

export function generateProfessionalOfferte(offerte, firma) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // ===== HEADER =====
  if (firma?.logo_url) {
    try {
      doc.addImage(firma.logo_url, "JPEG", margin, y, 20, 20);
    } catch (e) {
      console.log("Logo nicht verfügbar");
    }
  }

  const headerX = margin + 28;
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  if (firma?.firmenname) {
    doc.text(firma.firmenname, headerX, y);
    y += 4;
  }

  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 100, 100);
  if (firma?.adresse) {
    doc.text(firma.adresse, headerX, y);
    y += 3;
  }
  if (firma?.plz && firma?.ort) {
    doc.text(`${firma.plz} ${firma.ort}`, headerX, y);
    y += 3;
  }
  if (firma?.telefon) {
    doc.text(`Tel: ${firma.telefon}`, headerX, y);
    y += 3;
  }
  if (firma?.email_verbunden_adresse) {
    doc.text(firma.email_verbunden_adresse, headerX, y);
    y += 3;
  }
  if (firma?.domain) {
    doc.text(firma.domain, headerX, y);
  }

  y = margin + 28;

  // ===== OFFERTE TITEL =====
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("OFFERTE", margin, y);
  y += 16;

  // ===== METADATEN =====
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(0, 0, 0);

  doc.setFont(undefined, "bold");
  doc.text("Für:", margin, y);
  doc.setFont(undefined, "normal");
  doc.text(offerte.kunde_name || "-", margin + 12, y);
  y += 5;

  doc.setFont(undefined, "bold");
  doc.text("Datum:", margin, y);
  doc.setFont(undefined, "normal");
  doc.text(formatDatum(offerte.datum), margin + 12, y);
  y += 5;

  doc.setFont(undefined, "bold");
  doc.text("Offertennummer:", margin, y);
  doc.setFont(undefined, "normal");
  doc.text(offerte.nummer || "-", margin + 35, y);
  y += 5;

  doc.setFont(undefined, "bold");
  doc.text("Gültig bis:", margin, y);
  doc.setFont(undefined, "normal");
  doc.text(formatDatum(offerte.gueltig_bis || offerte.datum), margin + 22, y);
  y += 12;

  // Projekt Title
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(offerte.titel || "Projekt", margin, y);
  y += 12;

  // ===== 1. LEISTUNGSUMFANG =====
  addSectionTitle(doc, "LEISTUNGEN", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(40, 40, 40);

  if (offerte.leistungen && offerte.leistungen.length > 0) {
    offerte.leistungen.forEach((leistung) => {
      doc.text(`• ${leistung}`, margin + 3, y);
      y += 5;
    });
  } else {
    doc.text("• Beratung und Analyse", margin + 3, y);
    y += 5;
    doc.text("• Konzept und Planung", margin + 3, y);
    y += 5;
    doc.text("• Umsetzung", margin + 3, y);
    y += 5;
    doc.text("• Testing und Optimierung", margin + 3, y);
  }
  y += 10;

  // Check Page Break
  if (pageHeight - y < 80) {
    doc.addPage();
    y = margin;
  }

  // ===== 2. PROJEKTABLAUF =====
  addSectionTitle(doc, "PROJEKTABLAUF", margin, y);
  y += 8;

  const phases = [
    { num: "1", name: "Analyse & Planung" },
    { num: "2", name: "Design & Konzept" },
    { num: "3", name: "Umsetzung" },
    { num: "4", name: "Testing" },
    { num: "5", name: "Übergabe" },
  ];

  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);

  phases.forEach((phase, idx) => {
    doc.text(`${phase.num}. ${phase.name}`, margin + 3, y);
    y += 5;
  });

  y += 10;

  // Check Page Break
  if (pageHeight - y < 80) {
    doc.addPage();
    y = margin;
  }

  // ===== 3. INVESTITION =====
  addSectionTitle(doc, "INVESTITION", margin, y);
  y += 8;

  // Berechnung
  const einmalig = offerte.betrag_einmalig || 0;
  const monatlich = offerte.betrag_monatlich || 0;
  const subtotal = einmalig + monatlich;
  const mwst = subtotal * 0.081;
  const total = subtotal + mwst;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(40, 40, 40);

  if (einmalig > 0) {
    doc.text("Einmaliger Betrag", margin, y);
    doc.setFont(undefined, "bold");
    doc.text(formatCHF(einmalig), pageWidth - margin - 3, y, { align: "right" });
    doc.setFont(undefined, "normal");
    y += 5;
  }

  if (monatlich > 0) {
    doc.text("Monatlich", margin, y);
    doc.setFont(undefined, "bold");
    doc.text(formatCHF(monatlich) + " / Monat", pageWidth - margin - 3, y, { align: "right" });
    doc.setFont(undefined, "normal");
    y += 5;
  }

  y += 3;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Subtotal
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text("Subtotal (exkl. MwSt.)", margin, y);
  doc.setFont(undefined, "bold");
  doc.text(formatCHF(subtotal), pageWidth - margin - 3, y, { align: "right" });
  y += 5;

  // MwSt
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("MwSt. (8.1%)", margin, y);
  doc.text(formatCHF(mwst), pageWidth - margin - 3, y, { align: "right" });
  y += 6;

  // Total
  doc.setFont(undefined, "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("TOTAL (inkl. MwSt.)", margin, y);
  doc.text(formatCHF(total), pageWidth - margin - 3, y, { align: "right" });

  y += 12;

  // Check Page Break
  if (pageHeight - y < 60) {
    doc.addPage();
    y = margin;
  }

  // ===== 4. NÄCHSTE SCHRITTE =====
  addSectionTitle(doc, "NÄCHSTE SCHRITTE", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(40, 40, 40);

  const steps = [
    "1. Offerte prüfen",
    "2. Freigabe erteilen",
    "3. Projektstart",
    "4. Umsetzung beginnen",
    "5. Übergabe & Schulung",
  ];

  steps.forEach((step) => {
    doc.text(step, margin + 3, y);
    y += 5;
  });

  y += 10;

  // ===== 5. SCHLUSSWORT =====
  if (pageHeight - y < 40) {
    doc.addPage();
    y = margin;
  }

  addSectionTitle(doc, "KONTAKT", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(
    "Wir freuen uns auf Ihre Rückmeldung und beantworten gerne Ihre Fragen zur vorliegenden Offerte.",
    margin,
    y,
    { maxWidth: contentWidth }
  );
  y += 10;

  if (firma?.telefon) {
    doc.setFont(undefined, "bold");
    doc.text("Telefon:", margin, y);
    doc.setFont(undefined, "normal");
    doc.text(firma.telefon, margin + 20, y);
    y += 5;
  }

  if (firma?.email_verbunden_adresse) {
    doc.setFont(undefined, "bold");
    doc.text("Email:", margin, y);
    doc.setFont(undefined, "normal");
    doc.text(firma.email_verbunden_adresse, margin + 18, y);
  }

  return doc;
}

function addSectionTitle(doc, title, x, y) {
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(title, x, y);
}