import jsPDF from 'jspdf';

export const generateProfessionalRechnung = (rechnung, firma, positionen = []) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let yPos = margin;

  // Header - Firmenlogo/Name
  if (firma?.logo_url) {
    try {
      doc.addImage(firma.logo_url, 'PNG', margin, yPos, 40, 20);
      yPos += 25;
    } catch (e) {
      // Logo nicht verfügbar
    }
  }

  // Firmendaten
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(firma?.firmenname || 'MeisterFlow', margin, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const firmaDaten = [
    firma?.adresse || '',
    `${firma?.plz || ''} ${firma?.ort || ''}`,
    firma?.email || '',
    firma?.telefon || '',
  ].filter(Boolean);
  
  firmaDaten.forEach((zeile) => {
    doc.text(zeile, margin, yPos);
    yPos += 3;
  });

  yPos += 5;

  // Trennlinie
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Titel + Nummer
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('RECHNUNG', margin, yPos);
  yPos += 2;

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`Nummer: ${rechnung.nummer}`, margin, yPos);
  yPos += 4;

  // Rechnungsinformationen (Links)
  const rechnungs_col = margin;
  const kunde_col = pageWidth / 2;

  doc.setFont(undefined, 'bold');
  doc.text('Rechnungsdaten:', rechnungs_col, yPos);
  doc.text('Kundeninformationen:', kunde_col, yPos);
  yPos += 5;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);

  const rechnungsDaten = [
    `Datum: ${new Date(rechnung.datum).toLocaleDateString('de-CH')}`,
    `Fällig am: ${new Date(rechnung.faellig_am).toLocaleDateString('de-CH')}`,
    `Status: ${{ offen: 'Offen', bezahlt: 'Bezahlt', ueberfaellig: 'Überfällig', storniert: 'Storniert' }[rechnung.status] || rechnung.status}`,
  ];

  const kundenDaten = [
    rechnung.kunde_name || '',
    rechnung.ansprechpartner || '',
    rechnung.adresse || '',
    `${rechnung.plz || ''} ${rechnung.ort || ''}`,
    rechnung.email || '',
  ].filter(Boolean);

  const maxRows = Math.max(rechnungsDaten.length, kundenDaten.length);
  for (let i = 0; i < maxRows; i++) {
    if (rechnungsDaten[i]) doc.text(rechnungsDaten[i], rechnungs_col, yPos);
    if (kundenDaten[i]) doc.text(kundenDaten[i], kunde_col, yPos);
    yPos += 4;
  }

  yPos += 3;

  // Positionen Tabelle
  const tableStartY = yPos;
  const colPositionen = [
    { name: 'Beschreibung', x: margin, width: 90 },
    { name: 'Menge', x: margin + 95, width: 25 },
    { name: 'Preis/Einheit', x: margin + 125, width: 30 },
    { name: 'Total', x: margin + 160, width: 30 },
  ];

  // Tabellenheader
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 3, contentWidth, 6, 'F');

  colPositionen.forEach((col) => {
    doc.text(col.name, col.x, yPos);
  });

  yPos += 7;

  // Positionen
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);

  let total = 0;
  const positionen_data = Array.isArray(positionen) ? positionen : rechnung.positionen || [];
  
  positionen_data.forEach((pos) => {
    const menge = parseFloat(pos.menge) || 1;
    const preis = parseFloat(pos.einzelpreis) || 0;
    const zeilentotal = menge * preis;
    total += zeilentotal;

    const beschreibung = pos.beschreibung || 'Dienstleistung';
    const beschreibungLines = doc.splitTextToSize(beschreibung, colPositionen[0].width - 5);

    doc.text(beschreibungLines, colPositionen[0].x, yPos);
    doc.text(menge.toString(), colPositionen[1].x, yPos);
    doc.text(`CHF ${preis.toFixed(2)}`, colPositionen[2].x, yPos);
    doc.text(`CHF ${zeilentotal.toFixed(2)}`, colPositionen[3].x, yPos);

    yPos += beschreibungLines.length * 4 + 3;

    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }
  });

  // Trennlinie vor Zusammenfassung
  yPos += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin + 120, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Zusammenfassung (rechts)
  const summaryX = margin + 130;
  const summaryLabelWidth = 30;

  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');

  const mwst = total * 0.081;
  const totalMitMwst = total + mwst;

  doc.text('Zwischensumme:', summaryX, yPos);
  doc.text(`CHF ${total.toFixed(2)}`, summaryX + summaryLabelWidth, yPos, { align: 'right' });
  yPos += 4;

  doc.text('MwSt. (8.1%):', summaryX, yPos);
  doc.text(`CHF ${mwst.toFixed(2)}`, summaryX + summaryLabelWidth, yPos, { align: 'right' });
  yPos += 5;

  // Total
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Total:', summaryX, yPos);
  doc.text(`CHF ${totalMitMwst.toFixed(2)}`, summaryX + summaryLabelWidth, yPos, { align: 'right' });

  // Notizen falls vorhanden
  if (rechnung.notizen) {
    yPos += 12;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Notizen:', margin, yPos);
    yPos += 3;
    const notizLines = doc.splitTextToSize(rechnung.notizen, contentWidth);
    doc.text(notizLines, margin, yPos);
  }

  return doc;
};