import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReagentAnnualIndentPDF = (indentData, user) => {
  try {
    const doc = new jsPDF('portrait', 'pt', 'a4');
    
    const indentNo = indentData.NOCNumber || indentData.indentNo || '23416/RG00001/26-27';
    const indentDate = indentData.NOCDATE || indentData.indentDate || '26-11-2025';
    const facilityName = user?.facilityName || 'CIVIL SURGEON CUM HOSPITAL SUPERINTENDENT';
    const finYear = indentData.AccYear || '2026-2027';

    // --- Header Banner ---
    doc.setFillColor(30, 62, 44); // Dark Green Banner
    doc.rect(40, 30, doc.internal.pageSize.getWidth() - 80, 45, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ANNUAL INDENT FOR EQUIPMENT BASED REAGENT', doc.internal.pageSize.getWidth() / 2, 58, { align: 'center' });

    doc.setTextColor(0, 0, 0);

    // --- Meta Details ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Facility Name : ${facilityName}`, 40, 95);
    doc.text(`Indent No. : ${indentNo}`, 40, 112);
    doc.text(`Indent Date : ${indentDate}`, 350, 112);
    doc.text(`Financial Year : ${finYear}`, 40, 129);

    doc.setLineWidth(0.5);
    doc.line(40, 138, doc.internal.pageSize.getWidth() - 40, 138);

    // --- Sample Reagent Table ---
    const tableBody = [
      [1, 'REG-201', 'CELL-DYN Ruby Sheath Fluid 20L', 'Abbott CELL-DYN Ruby Hematology', 'Abbott', '12 Nos', '₹ 14,500.00', '₹ 1,74,000.00'],
      [2, 'REG-202', 'Cobas c311 Cleaner Solution 500ml', 'Roche Cobas c311 Chemistry', 'Roche', '8 Nos', '₹ 8,900.00', '₹ 71,200.00'],
      [3, 'REG-203', 'Access TSH Assay Kit 100 Tests', 'Beckman Coulter Access 2', 'Beckman', '5 Kits', '₹ 22,400.00', '₹ 1,12,000.00']
    ];

    autoTable(doc, {
      startY: 148,
      head: [['Sl. No.', 'Item Code', 'Reagent Description', 'Equipment Name', 'Manufacturer', 'Req Qty', 'Rate (₹)', 'Total Amount (₹)']],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.5 },
      headStyles: { fillColor: [30, 62, 44], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 35 },
        1: { fontStyle: 'bold', cellWidth: 55 },
        5: { halign: 'center' },
        6: { halign: 'right' },
        7: { halign: 'right', fontStyle: 'bold' }
      }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 220;

    // --- Total & Words ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Estimated Indent Value: ₹ 3,57,200.00', 40, finalY + 20);

    // --- Signatures ---
    const sigY = finalY + 70;
    doc.line(40, sigY, 180, sigY);
    doc.text('Prepared By', 110, sigY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Pharmacist / Indenting Officer', 110, sigY + 26, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.line(380, sigY, 520, sigY);
    doc.text('Approved By', 450, sigY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('CMHO / Superintendent / MOIC', 450, sigY + 26, { align: 'center' });

    const fileName = `Annual_Indent_Reagent_${(indentNo || 'Doc').replace(/[^a-zA-Z0-9.\-_]/g, '_')}.pdf`;
    doc.save(fileName);
  } catch (err) {
    console.error('Error generating Reagent Annual Indent PDF:', err);
    throw err;
  }
};

export const generateReagentIndentLetterPDF = (indentData, user) => {
  try {
    const doc = new jsPDF('portrait', 'pt', 'a4');

    const indentNo = indentData.NOCNumber || indentData.indentNo || '23416/RG00001/26-27';
    const indentDate = indentData.NOCDATE || indentData.indentDate || '26-11-2025';
    const facilityName = user?.facilityName || 'CIVIL SURGEON CUM HOSPITAL SUPERINTENDENT';

    // --- Header ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICE OF THE CIVIL SURGEON CUM HOSPITAL SUPERINTENDENT', doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });
    doc.setFontSize(10);
    doc.text('GOVERNMENT DISTRICT HOSPITAL, DURG (C.G.)', doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });

    doc.setLineWidth(0.75);
    doc.line(40, 70, doc.internal.pageSize.getWidth() - 40, 70);

    // --- Letter Head Info ---
    doc.setFontSize(9);
    doc.text(`Dispatch No: CS/REAGENT/2026/LETTER/${indentNo.split('/')[1] || '001'}`, 40, 90);
    doc.text(`Date: ${indentDate}`, doc.internal.pageSize.getWidth() - 150, 90);

    doc.text('To,', 40, 115);
    doc.text('The Managing Director / CME Officer,', 40, 128);
    doc.text('Chhattisgarh Medical Services Corporation Ltd. (CGMSC),', 40, 141);
    doc.text('Raipur, Chhattisgarh.', 40, 154);

    doc.setFont('helvetica', 'bold');
    doc.text(`Subject : Indent Letter for Equipment Based Proprietary Reagents against Indent No: ${indentNo}.`, 40, 180);

    doc.setFont('helvetica', 'normal');
    const letterText = `Sir/Madam,\n\nWith reference to the subject cited above, please find enclosed herewith the Annual Indent for Equipment Based Proprietary Reagents for the financial year 2026-2027 required for the smooth operation of diagnostic machinery installed at ${facilityName}.\n\nKindly process the supply and issue necessary Proprietary Certificates at the earliest.`;
    
    doc.text(letterText, 40, 205, { maxWidth: doc.internal.pageSize.getWidth() - 80 });

    // --- Signature ---
    doc.setFont('helvetica', 'bold');
    doc.text('Yours faithfully,', doc.internal.pageSize.getWidth() - 180, 320);
    doc.text('Civil Surgeon Cum Superintendent', doc.internal.pageSize.getWidth() - 210, 370);
    doc.setFont('helvetica', 'normal');
    doc.text('Govt. District Hospital, Durg', doc.internal.pageSize.getWidth() - 195, 383);

    const fileName = `Indent_Letter_Reagent_${(indentNo || 'Doc').replace(/[^a-zA-Z0-9.\-_]/g, '_')}.pdf`;
    doc.save(fileName);
  } catch (err) {
    console.error('Error generating Reagent Indent Letter PDF:', err);
    throw err;
  }
};
