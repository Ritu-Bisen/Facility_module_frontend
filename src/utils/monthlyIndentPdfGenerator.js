import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/axios';

export const generateMonthlyIndentPDF = async (idOrData, user, docType = 'INDENT') => {
  try {
    let header = {};
    let items = [];

    if (typeof idOrData === 'object' && idOrData !== null) {
      header = idOrData.header || idOrData;
      items = idOrData.items || [];
    } else if (idOrData) {
      const [headerRes, itemsRes] = await Promise.all([
        api.get(`/monthly-indent/${idOrData}`),
        api.get(`/monthly-indent/${idOrData}/items`)
      ]);
      header = headerRes.data || {};
      items = itemsRes.data || [];
    }

    const doc = new jsPDF('portrait', 'pt', 'a4');
    const title = docType === 'NOC' ? 'NOC FOR MONTHLY INDENT' : 'MONTHLY INDENT TO WAREHOUSE';
    const role = user?.roleName || header.FACILITYNAME || 'Facility';

    // --- Header ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(role, doc.internal.pageSize.getWidth() / 2, 56, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(40, 68, doc.internal.pageSize.getWidth() - 40, 68);

    // --- Meta Details Grid ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    const nocDate = header.NOCDATE || header.nocDate || '—';
    const nocNum = header.NOCNUMBER || header.nocNumber || '—';
    const accYear = header.ACCYEAR || header.AccYear || header.accYear || '—';
    const program = header.PROGRAMNAME || header.programName || 'Regular Supply';

    doc.text(`Indent Date : ${nocDate}`, 40, 88);
    doc.text(`Indent No : ${nocNum}`, 320, 88);
    doc.text(`Fin Year : ${accYear}`, 40, 104);
    doc.text(`Program : ${program}`, 320, 104);

    // --- Items Table ---
    const tableBody = items.map((item, idx) => [
      idx + 1,
      item.ITEMCODE || item.ItemCode || '—',
      item.ITEMNAME || item.ItemName || '—',
      item.STRENGTH1 || item.Strength1 || '—',
      item.UNIT || item.Unit || '—',
      item.REQUESTEDQTY || item.requestedqty || '0',
      item.WHSTOCK || item.whStock || '0'
    ]);

    autoTable(doc, {
      startY: 120,
      head: [['Sl. No.', 'Item Code', 'Item Name', 'Strength', 'Unit', 'Requested Qty', 'Warehouse Stock']],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.5 },
      headStyles: { fillColor: [30, 62, 44], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 40 },
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 140;

    // --- Signature Area ---
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

    const fileName = docType === 'NOC' 
      ? `NOC_${nocNum.replace(/[^a-zA-Z0-9.\-_]/g, '_')}.pdf`
      : `Monthly_Indent_${nocNum.replace(/[^a-zA-Z0-9.\-_]/g, '_')}.pdf`;

    doc.save(fileName);
  } catch (err) {
    console.error('Error generating Monthly Indent PDF:', err);
    throw err;
  }
};
