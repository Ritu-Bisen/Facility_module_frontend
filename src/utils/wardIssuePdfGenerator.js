import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/axios';

export const generateWardIssuePDF = async (idOrData, type = 'ward') => {
  try {
    let header = {};
    let items = [];

    if (typeof idOrData === 'object' && idOrData !== null) {
      header = idOrData.header || idOrData;
      items = idOrData.items || [];
    } else if (idOrData) {
      const res = await api.get(`/ward-issue/${idOrData}/print`);
      header = res.data?.header || {};
      items = res.data?.items || [];
    }

    const doc = new jsPDF('portrait', 'pt', 'a4');
    const isShc = type === 'shc';
    const voucherTitle = isShc ? 'SHC ISSUE VOUCHER' : 'WARD ISSUE VOUCHER';

    // --- Header Banner ---
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(40, 30, doc.internal.pageSize.getWidth() - 80, 45, 'F');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('CGMSC', 55, 52);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('Chhattisgarh Medical Services Corporation Ltd.', 55, 64);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(voucherTitle, doc.internal.pageSize.getWidth() - 55, 56, { align: 'right' });

    doc.setTextColor(0, 0, 0);

    // --- Meta Info ---
    doc.setFontSize(8.5);

    const fmtDate = (dStr) => {
      if (!dStr) return '—';
      try {
        const d = new Date(dStr);
        return isNaN(d.getTime()) ? (dStr.split('T')[0] || dStr) : d.toLocaleDateString('en-GB');
      } catch (e) {
        return dStr;
      }
    };

    const facName = header.FacilityName || '—';
    const location = [header.DistrictName, header.StateName].filter(Boolean).join(', ');
    const fullFacilityText = location ? `${facName} (${location})` : facName;
    const destination = isShc 
      ? `${header.WardName || '—'} (${header.WardCode || ''})`
      : `${header.WardName || '—'} (${header.WardCode || ''})`;
    const issueDate = fmtDate(header.IssueDate);
    const voucherNo = header.IssueNo || '—';
    const reqBy = header.WRequestBy || '—';
    const reqDate = fmtDate(header.WRequestDate);

    const leftX = 40;
    const rightX = 350;
    let currentY = 92;

    // Line 1: Facility Name (Left) & Issue Date (Right)
    doc.setFont('helvetica', 'bold');
    doc.text('Facility:', leftX, currentY);
    doc.setFont('helvetica', 'normal');
    const splitFac = doc.splitTextToSize(fullFacilityText, 255);
    doc.text(splitFac, leftX + 45, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Issue Date:', rightX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(issueDate, rightX + 60, currentY);

    currentY += Math.max(splitFac.length * 11, 14);

    // Line 2: Issued To Ward (Left) & Voucher No (Right)
    doc.setFont('helvetica', 'bold');
    doc.text(isShc ? 'Transfer To:' : 'Issued To Ward:', leftX, currentY);
    doc.setFont('helvetica', 'normal');
    const labelWidth = isShc ? 60 : 80;
    const splitDest = doc.splitTextToSize(destination, 220);
    doc.text(splitDest, leftX + labelWidth, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Voucher No:', rightX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(voucherNo, rightX + 60, currentY);

    currentY += Math.max(splitDest.length * 11, 14);

    // Line 3: Requested By (Left) & Req Date (Right)
    doc.setFont('helvetica', 'bold');
    doc.text('Requested By:', leftX, currentY);
    doc.setFont('helvetica', 'normal');
    const splitReqBy = doc.splitTextToSize(reqBy, 220);
    doc.text(splitReqBy, leftX + 70, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Req Date:', rightX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(reqDate, rightX + 60, currentY);

    currentY += Math.max(splitReqBy.length * 11, 16);

    // --- Table ---
    const tableBody = items.map((item, idx) => {
      const batchesText = (item.batches || []).map(b => 
        `Batch: ${b.BatchNo || '—'} | Qty: ${b.IssueQty || 0} | Exp: ${fmtDate(b.ExpDate)} | Loc: ${b.StockLocation || '—'}`
      ).join('\n');

      return [
        idx + 1,
        `${item.ItemCode || ''} - ${item.ItemName || ''}\nStrength: ${item.Strength || '—'} | SKU: ${item.SKU || '—'}`,
        `Stock: ${item.CurrentStock !== undefined && item.CurrentStock !== null ? Number(item.CurrentStock).toLocaleString('en-IN') : '0'}\nReq Qty: ${item.Allotted || '0'}`,
        item.IssueQty || '0',
        batchesText || '—'
      ];
    });

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Sl. No.', 'Item Details', 'Stock & Request Info', 'Issue Qty', 'Batches Details']],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.5 },
      headStyles: { fillColor: [30, 62, 44], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 35 },
        1: { cellWidth: 150 },
        2: { cellWidth: 100 },
        3: { halign: 'right', cellWidth: 60 }
      }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 160;

    // --- Signatures ---
    const sigY = finalY + 50;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    doc.line(40, sigY, 160, sigY);
    doc.text('Issued By', 100, sigY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('store keeper', 100, sigY + 24, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.line(220, sigY, 340, sigY);
    doc.text('Checked By', 280, sigY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('superintendent / MOIC', 280, sigY + 24, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.line(400, sigY, 520, sigY);
    doc.text('Received By', 460, sigY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('ward in-charge', 460, sigY + 24, { align: 'center' });

    const prefix = isShc ? 'SHC_Issue' : 'Ward_Issue';
    const fileName = `${prefix}_${(voucherNo || 'Doc').replace(/[^a-zA-Z0-9.\-_]/g, '_')}.pdf`;
    doc.save(fileName);
  } catch (err) {
    console.error('Error generating Ward Issue PDF:', err);
    throw err;
  }
};
