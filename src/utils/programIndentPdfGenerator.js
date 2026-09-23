import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateProgramIndentPDF(header, items = []) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Color Palette
  const primaryColor = [15, 23, 42]; // Royal Slate/Dark Blue #0f172a
  const secondaryColor = [30, 58, 138]; // Deep Blue #1e3a8a
  const textColor = [51, 65, 85];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AYUSH PROGRAM ITEM INDENT REPORT', pageWidth / 2, 13, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Chhattisgarh Medical Services Corporation / AYUSH Department', pageWidth / 2, 19, { align: 'center' });

  // Header Information Box
  let startY = 32;
  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, startY, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setTextColor(...secondaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('INDENT DETAILS', 18, startY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);

  // Left Column
  doc.text(`Indent No: ${header.indentNo || '-'}`, 18, startY + 14);
  doc.text(`Indent Date: ${header.indentDate || '-'}`, 18, startY + 21);

  // Right Column
  doc.text(`Financial Year: ${header.accYear || '-'}`, pageWidth / 2 + 5, startY + 14);
  doc.text(`Program: ${header.programName || '-'}`, pageWidth / 2 + 5, startY + 21);
  doc.text(`Status: ${header.status || 'Completed'}`, pageWidth / 2 + 5, startY + 27);

  // Items Table
  const tableColumn = ['#', 'Item Code', 'Item Name', 'Strength', 'Unit', 'Category', 'Indent Qty'];
  const tableRows = items.map((item, idx) => [
    idx + 1,
    item.itemCode || '-',
    item.itemName || '-',
    item.strength || '-',
    item.unit || '-',
    item.categoryName || item.groupName || item.mCategory || '-',
    item.qty || 0
  ]);

  autoTable(doc, {
    startY: startY + 36,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 8.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 55 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 32 },
      6: { halign: 'right', cellWidth: 20, fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  // Footer / Signatures
  const finalY = doc.lastAutoTable.finalY + 25;
  
  // Ensure signature fits on current page
  if (finalY < doc.internal.pageSize.getHeight() - 30) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textColor);

    doc.text('Prepared By', 25, finalY);
    doc.line(20, finalY - 5, 55, finalY - 5);

    doc.text('Verified By', pageWidth / 2 - 15, finalY);
    doc.line(pageWidth / 2 - 25, finalY - 5, pageWidth / 2 + 15, finalY - 5);

    doc.text('Authorized Signatory', pageWidth - 55, finalY);
    doc.line(pageWidth - 65, finalY - 5, pageWidth - 20, finalY - 5);
  }

  // Save File
  const filename = `Program_Indent_${(header.indentNo || 'report').replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
  doc.save(filename);
}
