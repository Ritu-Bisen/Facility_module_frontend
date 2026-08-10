import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateSupplyOrderPDF = (details, user) => {
  if (!details || !details.header) return;

  const doc = new jsPDF('portrait', 'pt', 'a4');
  const { header, items } = details;

  const facilityName = user?.facilityName || 'CIVIL SERGEON CUM HOSPITAL SUPRITENDANT';
  const districtName = 'GOVT. DISTRIC HOSPITAL DURG';
  const locationName = 'NEAR BUS STAND';

  // --- Header ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(facilityName, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
  doc.text(districtName, doc.internal.pageSize.getWidth() / 2, 55, { align: 'center' });
  doc.text(locationName, doc.internal.pageSize.getWidth() / 2, 70, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(40, 85, doc.internal.pageSize.getWidth() - 40, 85);

  // --- Meta Information ---
  doc.setFontSize(9);
  doc.text(`Dispatch No : STORE/2026/05`, 40, 105);
  doc.text(`Dispatch Date : 30-04-2026`, doc.internal.pageSize.getWidth() - 160, 105);
  
  doc.text(`Supplier/Vendor: ${header.supplierName || ''}`, 40, 125);
  doc.setFont('helvetica', 'normal');
  doc.text(`Address: ${header.address || ''}`, 40, 145);
  doc.text(`Phone: ${header.phone || ''}`, 40, 165);
  doc.text(`City: ${header.city || ''}`, 250, 165);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Purchase Order No: ${header.poNo || ''} dated: ${header.poDate || ''}`, 40, 185);
  doc.text(`Fund :- JDS`, 40, 205);

  doc.text(`Please undertake to supply the following Drugs & Medicines / Sutures & Surgical Materials to ${facilityName} as per the delivery schedule and terms and conditions mentioned :`, 40, 225, { maxWidth: doc.internal.pageSize.getWidth() - 80 });

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
    startY: 250,
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
  doc.rect(40, finalY, doc.internal.pageSize.getWidth() - 80, 20);
  
  const totalAmount = header.soValue || (items && items.length > 0 ? items[0].amount : 0);
  
  doc.text(`In Words: Seventeen Thousand Five Hundred and only`, 45, finalY + 14); // Hardcoded words for demo, we would add numberToWords logic in production
  doc.text(`Total ( in Rs.)`, 350, finalY + 14);
  doc.text(`${totalAmount}`, doc.internal.pageSize.getWidth() - 80, finalY + 14);

  // --- Signature Area ---
  doc.text(`(Signature of Authorized Signatory)`, doc.internal.pageSize.getWidth() - 200, finalY + 80);
  doc.text(`Seal & Stamp`, doc.internal.pageSize.getWidth() - 170, finalY + 95);

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
