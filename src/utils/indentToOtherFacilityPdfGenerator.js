import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getIndentDetail } from '../api/indentToOtherFacilityApi';

export const generateIndentToOtherFacilityPDF = async (idOrData) => {
  try {
    let header = {};
    let items = [];

    if (typeof idOrData === 'object' && idOrData !== null) {
      header = idOrData.header || idOrData;
      items = idOrData.items || [];
    } else if (idOrData) {
      const res = await getIndentDetail(idOrData);
      if (res && res.success) {
        header = res.data?.header || {};
        items = res.data?.items || [];
      }
    }

    const doc = new jsPDF('portrait', 'pt', 'a4');

    // --- Header ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INDENT TO OTHER FACILITY', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('INDENT DOCUMENT', doc.internal.pageSize.getWidth() / 2, 56, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(40, 68, doc.internal.pageSize.getWidth() - 40, 68);

    // --- Meta Details ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    const indentDate = header.IndentDate || '—';
    const indentNo = header.IndentNo || '—';
    const fromFac = header.FromFacilityName || '—';
    const accYear = header.ShAccYear || '—';

    doc.text(`Indent Date : ${indentDate}`, 40, 88);
    doc.text(`Indent No : ${indentNo}`, 320, 88);
    doc.text(`From Facility : ${fromFac}`, 40, 104);
    doc.text(`Financial Year : ${accYear}`, 320, 104);

    // --- Table ---
    const tableBody = items.map((item, idx) => [
      idx + 1,
      item.itemCode || item.ITEMCODE || '—',
      item.itemName || item.ITEMNAME || '—',
      item.strength || item.STRENGTH1 || '—',
      item.requestedQty || item.REQUESTEDQTY || '0',
      item.approvedQty || item.APPROVEDQTY || '0'
    ]);

    autoTable(doc, {
      startY: 120,
      head: [['Sl. No.', 'Item Code', 'Item Name', 'Strength', 'Requested Qty', 'Approved Qty']],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.5 },
      headStyles: { fillColor: [30, 62, 44], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 40 },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 140;

    // --- Signatures ---
    const sigY = finalY + 50;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.line(60, sigY, 200, sigY);
    doc.text('Prepared By', 130, sigY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Pharmacist / Indenting Officer', 130, sigY + 26, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.line(380, sigY, 520, sigY);
    doc.text('Approved By', 450, sigY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('CMHO / Superintendent / MOIC', 450, sigY + 26, { align: 'center' });

    const fileName = `Indent_OtherFacility_${(indentNo || 'Doc').replace(/[^a-zA-Z0-9.\-_]/g, '_')}.pdf`;
    doc.save(fileName);
  } catch (err) {
    console.error('Error generating Indent to Other Facility PDF:', err);
    throw err;
  }
};
