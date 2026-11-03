import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Calculates shelf life % from MfgDate, ExpDate, and Receipt/Voucher Date.
 */
function calculateShelfLife(mfgDateStr, expDateStr, receiptDateStr) {
  try {
    if (!mfgDateStr || !expDateStr || !receiptDateStr) return '0.00';
    const parseDate = (s) => {
      if (!s) return null;
      if (typeof s === 'string' && s.includes('-')) {
        const parts = s.split('-');
        if (parts[0].length === 2 && parts[2].length === 4) {
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`).getTime();
        }
      }
      return new Date(s).getTime();
    };

    const mfg = parseDate(mfgDateStr);
    const exp = parseDate(expDateStr);
    const rec = parseDate(receiptDateStr);

    if (!mfg || !exp || !rec) return '0.00';
    const total = exp - mfg;
    const remaining = exp - rec;
    if (total <= 0) return '0.00';
    const pct = (remaining / total) * 100;
    return Math.max(0, Math.min(100, pct)).toFixed(2);
  } catch {
    return '0.00';
  }
}

/**
 * Generates and downloads the Material Receipt Certificate (MRC) PDF matching exact standard layout.
 */
export const generateMrcPdf = (mrcData) => {
  if (!mrcData || !mrcData.header) {
    throw new Error('Invalid MRC data');
  }

  const { header, items } = mrcData;

  // Create A4 portrait PDF (595.28 x 841.89 pt)
  const doc = new jsPDF('portrait', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 35;
  const marginRight = pageWidth - 35;

  // Header Section
  let y = 30;

  // Line 1: Facility Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  const facilityTitle = (header.facilityName || 'DH SARGUJA').toUpperCase();
  doc.text(facilityTitle, pageWidth / 2, y, { align: 'center' });
  y += 14;

  // Line 2: Designation / Hospital
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const line2 = (header.header1 || 'CIVIL SURGEON, CUM HOSPITAL SUPERINTENDENT, DISTRICT HOSPITAL').toUpperCase();
  doc.text(line2, pageWidth / 2, y, { align: 'center' });
  y += 13;

  // Line 3: Address
  const addrCombined = [header.header2, header.header3].filter(Boolean).join(' ') || 
    [header.supplierAddress, header.supplierCity].filter(Boolean).join(' ') || 
    'DARRIPARA AMBIKAPUR SURGUJA CHATTISGARH';
  doc.text(addrCombined.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 11;

  // Horizontal divider line
  doc.setLineWidth(0.75);
  doc.line(marginLeft, y, marginRight, y);
  y += 15;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MATERIAL RECEIPT CERTIFICATE', pageWidth / 2, y, { align: 'center' });
  y += 18;

  // Sub-header details
  doc.setFontSize(8);

  const leftX = marginLeft;
  const midX = 175;
  const rightX = 295;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt No: ${header.receiptNo || ''}`, leftX, y);

  doc.text('Supplier Name & Address :', rightX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(header.supplierName || '', rightX + 108, y);
  y += 13;

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text(`MRC No: ${header.mrcNumber || ''}`, leftX, y);
  doc.text(`MRC Date: ${header.mrcDate || ''}`, midX, y);

  if (header.supplierCity || header.supplierAddress) {
    doc.setFont('helvetica', 'normal');
    const supAddr = header.supplierCity ? `${header.supplierCity}` : header.supplierAddress;
    doc.text(supAddr, rightX, y);
  }
  y += 13;

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text(`St.Reg.No: ${header.stkRegNo || ''}`, leftX, y);
  doc.text(`Voucher Date: ${header.voucherDate || ''}`, midX, y);
  y += 18;

  // Row 4: Purchase Order No, Invoice No, Invoice Date
  doc.setFont('helvetica', 'bold');
  doc.text(`Purchase Order No: ${header.poNo || ''} Dt.${header.poDate || ''}`, leftX, y);
  doc.text(`Invoice No: ${header.invoiceNo || ''}`, rightX - 20, y);
  doc.text(`Invoice Date: ${header.invoiceDate || ''}`, marginRight - 120, y);
  y += 10;

  // Prepare table data
  let totalReceiptValue = 0;
  const tableRows = (items || []).map((item) => {
    const batchVal = Number(item.batchReceivedValue) || (Number(item.batchQty || 0) * Number(item.price || 0));
    totalReceiptValue += batchVal;

    const shelfLife = calculateShelfLife(
      item.mfgDate,
      item.expDate,
      header.voucherDate || header.receiptDate || header.mrcDate
    );

    const formattedName = `Name:${item.itemName || ''}\nStrength${item.strength || ''}`;
    const formattedPrice = item.price ? Number(item.price).toFixed(2) : '0.00';

    return [
      item.itemCode || '',
      formattedName,
      item.orderQty != null ? String(item.orderQty) : '',
      formattedPrice,
      item.totalReceiptQty != null ? String(item.totalReceiptQty) : '',
      item.batchNo || '',
      item.mfgDate || '',
      item.expDate || '',
      item.batchQty != null ? String(item.batchQty) : '',
      String(Math.round(batchVal)),
      shelfLife
    ];
  });

  // Table rendering
  autoTable(doc, {
    startY: y,
    margin: { left: marginLeft, right: 35 },
    head: [[
      'Code',
      'Name',
      'Order\nQty',
      'Price\n(Rs)',
      'Total\nReceipt\nQty',
      'BatchNo.',
      'Mfg Date',
      'Exp Date',
      'BatchQty',
      'Batch\nReceived\nValue',
      'Self\nLife %'
    ]],
    body: tableRows,
    foot: [[
      { content: 'Total Receipt Value (in Rs)', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: String(Math.round(totalReceiptValue)), styles: { halign: 'center', fontStyle: 'bold' } },
      { content: '', styles: { halign: 'center' } }
    ]],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      cellPadding: 3,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 40, halign: 'center' },      // Code
      1: { cellWidth: 124, halign: 'left' },        // Name
      2: { cellWidth: 36, halign: 'center' },      // Order Qty
      3: { cellWidth: 36, halign: 'center' },      // Price (Rs)
      4: { cellWidth: 40, halign: 'center' },      // Total Receipt Qty
      5: { cellWidth: 44, halign: 'center' },      // BatchNo.
      6: { cellWidth: 45, halign: 'center' },      // Mfg Date
      7: { cellWidth: 45, halign: 'center' },      // Exp Date
      8: { cellWidth: 38, halign: 'center' },      // BatchQty
      9: { cellWidth: 44, halign: 'center' },      // Batch Received Value
      10: { cellWidth: 32, halign: 'center' }      // Self Life %
    }
  });

  const finalY = doc.lastAutoTable.finalY + 12;

  // Remarks
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Remarks: ${header.remarks || 'ok'}`, marginLeft, finalY);

  // Declarations & Signatures Section
  const declY = finalY + 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  // Left declarations
  doc.text('1. Physically Checked and Verified', marginLeft, declY);
  doc.text('2. The quality accepted is in confirmity with the Specification', marginLeft, declY + 14);
  doc.text('3. The rates on which the supplies are received is as per  local purchase order', marginLeft, declY + 28);
  doc.text('4. The material received from local purchase invoice details are correct.', marginLeft, declY + 42);

  // Signatures on the right
  const sigCol1X = 320;
  const sigCol2X = 445;

  doc.setFont('helvetica', 'bold');
  doc.text('Verified by', sigCol1X, declY + 14);
  doc.text('Approved By', sigCol2X, declY + 14);

  doc.text('Store Incharge/Pharmacist', sigCol1X - 20, declY + 44);
  doc.text('Incharge Officer', sigCol2X - 5, declY + 44);

  // Copy to section below declarations
  const copyToY = declY + 54;
  doc.setFont('helvetica', 'normal');
  doc.text('Copy to:', marginLeft, copyToY);
  doc.text(': Purchase Department/Officer', marginLeft + 5, copyToY + 14);
  doc.text(': Accounts Departement/Officer', marginLeft + 5, copyToY + 26);
  doc.text(': Store Department/Officer', marginLeft + 5, copyToY + 38);

  // Save / Download PDF
  const filename = `MRC_${header.mrcNumber || header.receiptNo || 'Receipt'}.pdf`.replace(/[\/\\?%*:|"<>]/g, '_');
  doc.save(filename);

  return filename;
};
