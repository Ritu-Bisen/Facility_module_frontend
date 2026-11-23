import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function numberToWords(amount) {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';
  const num = Math.round(Number(amount));
  if (num === 0) return 'Zero Rupees Only';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    } else {
      str += a[n];
    }
    return str;
  };

  let words = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const remainder = num % 100;

  if (crore > 0) words += `${inWords(crore)}Crore `;
  if (lakh > 0) words += `${inWords(lakh)}Lakh `;
  if (thousand > 0) words += `${inWords(thousand)}Thousand `;
  if (hundred > 0) words += `${inWords(hundred)}Hundred `;
  if (remainder > 0) {
    if (words !== '') words += 'and ';
    words += inWords(remainder);
  }

  return `${words.trim()} Rupees Only`;
}

export const generateSupplyOrderPDF = (details, user) => {
  if (!details || !details.header) return;

  const doc = new jsPDF('portrait', 'pt', 'a4');
  const { header, items } = details;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Retrieve Header1, Header2, Header3 from MASFACHEADERFOOTER (via details.header or user fallback)
  const header1 = (header.header1 || header.HEADER1 || user?.header1 || user?.facilityName || 'CIVIL SURGEON CUM HOSPITAL SUPERINTENDENT').trim();
  const header2 = (header.header2 || header.HEADER2 || user?.header2 || '').trim();
  const header3 = (header.header3 || header.HEADER3 || user?.header3 || '').trim();

  // --- Header ---
  let y = 35;
  if (header1) {
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(header1.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 13;
  }
  if (header2) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(header2.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 12;
  }
  if (header3) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(header3.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 11;
  }

  y += 3;
  doc.setLineWidth(0.5);
  doc.line(40, y, pageWidth - 40, y);
  y += 15;

  // --- Meta Information ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const dispatchNo = header.dispatchNo || '';
  const dispatchDate = header.dispatchDate || '';

  doc.text(`Dispatch No : ${dispatchNo}`, 40, y);
  doc.text(`Dispatch Date : ${dispatchDate}`, pageWidth - 180, y);
  y += 15;

  doc.text(`Supplier/Vendor: ${header.supplierName || ''}`, 40, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(`Address: ${header.address || ''}`, 40, y);
  y += 14;
  doc.text(`Phone: ${header.phone || ''}`, 40, y);
  doc.text(`City: ${header.city || ''}`, 250, y);
  y += 16;

  doc.setFont('helvetica', 'bold');
  doc.text(`Purchase Order No: ${header.poNo || ''} dated: ${header.poDate || ''}`, 40, y);
  y += 15;

  const fundName = header.fund || header.sourceName || (header.sourceId ? String(header.sourceId) : '') || '';
  doc.text(`Fund :- ${fundName}`, 40, y);
  y += 16;

  const destFacility = header1 || user?.facilityName || 'Facility';
  doc.setFont('helvetica', 'normal');
  doc.text(`Please undertake to supply the following Drugs & Medicines / Sutures & Surgical Materials to ${destFacility} as per the delivery schedule and terms and conditions mentioned :`, 40, y, { maxWidth: pageWidth - 80 });
  y += 24;

  // --- Items Table ---
  const tableBody = (items || []).map((item, idx) => [
    idx + 1,
    item.drugCode || '',
    item.itemName || '',
    item.strength || '',
    item.unit || '',
    item.manufacturer || '',
    item.orderQuantity || '',
    item.basicRate || '',
    item.gst || '',
    item.unitPrice || '',
    item.amount || ''
  ]);

  autoTable(doc, {
    startY: y,
    head: [['S.No', 'Drug Code', 'Item', 'Strength', 'Unit', 'Manufacturer', 'Order Quantity\n(in Nos)', 'Basic\nRate', 'GST\n(%)', 'Single Unit\nPrice With\nGST (in Rs)', 'Amount\n(in Rs)']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center', valign: 'middle', cellPadding: 4, lineColor: [0, 0, 0], lineWidth: 0.5 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      2: { halign: 'left', cellWidth: 80 }
    },
    didDrawPage: (data) => {
      // Footer gets drawn here if we wanted page numbers, but we just want summary at the end
    }
  });

  const finalY = doc.lastAutoTable.finalY;

  // --- Total Row ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setLineWidth(0.5);
  doc.rect(40, finalY, pageWidth - 80, 20);

  const totalAmount = header.soValue || (items && items.length > 0 ? items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0) : 0);

  doc.text(`In Words: ${numberToWords(totalAmount)}`, 45, finalY + 14);
  doc.text(`Total ( in Rs.)`, 350, finalY + 14);
  doc.text(`${parseFloat(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 80, finalY + 14, { align: 'right' });

  // --- Signature Area ---
  doc.text(`(Signature of Authorized Signatory)`, pageWidth - 200, finalY + 80);
  doc.text(`Seal & Stamp`, pageWidth - 170, finalY + 95);

  // --- Terms and Conditions ---
  doc.text(`Terms and Conditions :-`, 40, finalY + 140);
  doc.setFont('helvetica', 'normal');
  doc.text(`URGENT SUPPLY`, 40, finalY + 160);

  // --- Copy To ---
  doc.text(`Copy to:`, 40, finalY + 220);
  doc.text(`1. Supplier copy\n2. Acceptance copy by Supplier\n3. Store copy\n4. Accounts copy\n5. Master copy`, 40, finalY + 235);

  // --- Save file ---
  const safeSupplier = (header.supplierName || 'Supplier').replace(/[^a-zA-Z0-9.\-_ ]/g, '');
  const date = header.poDate || '00-00-0000';
  const filename = `LPO_${safeSupplier}_${date}.pdf`;

  doc.save(filename);
};
