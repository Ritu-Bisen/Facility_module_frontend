import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/axios';

export const generateMonthlyIndentPDF = async (idOrData, user, docType = 'INDENT') => {
  try {
    let header = {};
    let items = [];

    if (typeof idOrData === 'object' && idOrData !== null) {
      header = idOrData.header || idOrData;
      const rawItems = idOrData.items || idOrData.rows || idOrData;
      items = Array.isArray(rawItems) ? rawItems : [];
    } else if (idOrData) {
      const [headerRes, itemsRes] = await Promise.all([
        api.get(`/monthly-indent/${idOrData}`),
        api.get(`/monthly-indent/${idOrData}/items`)
      ]);
      header = headerRes.data || {};
      const rawItems = Array.isArray(itemsRes.data) ? itemsRes.data : (itemsRes.data?.items || itemsRes.data?.rows || []);
      items = Array.isArray(rawItems) ? rawItems : [];
    }

    const doc = new jsPDF('portrait', 'pt', 'a4');
    const title = docType === 'NOC' ? 'NOC FOR MONTHLY INDENT' : 'MONTHLY INDENT TO WAREHOUSE';

    // Retrieve logged-in user details from parameter or localStorage
    let activeUser = user;
    if (!activeUser || (!activeUser.firstName && !activeUser.facilityName && !activeUser.FIRSTNAME)) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) activeUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    // Determine logged-in facility display name (e.g., "DH-Durg" or "DH DURG")
    let facilityDisplayName = '';
    const fName = (activeUser?.firstName || activeUser?.FIRSTNAME || '').trim();
    const lName = (activeUser?.lastName || activeUser?.LASTNAME || '').trim();

    if (fName && lName) {
      facilityDisplayName = `${fName}-${lName}`;
    } else if (activeUser?.facilityName || activeUser?.FACILITYNAME) {
      facilityDisplayName = activeUser.facilityName || activeUser.FACILITYNAME;
    } else if (fName) {
      facilityDisplayName = fName;
    } else if (header.FACILITYNAME || header.facilityName) {
      facilityDisplayName = header.FACILITYNAME || header.facilityName;
    } else if (activeUser?.roleName || activeUser?.ROLENAME) {
      facilityDisplayName = activeUser.roleName || activeUser.ROLENAME;
    } else {
      facilityDisplayName = 'Facility';
    }

    // --- Header ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(facilityDisplayName, doc.internal.pageSize.getWidth() / 2, 56, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(40, 68, doc.internal.pageSize.getWidth() - 40, 68);

    // --- Meta Details Grid ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    const nocDate = header.NOCDATE || header.nocDate || '—';
    const nocNum = header.NOCNUMBER || header.nocNumber || '—';
    const accYear = header.ACCYEAR || header.AccYear || header.accYear || '—';
    const program = header.PROGRAMNAME || header.programName || 'Regular supply';

    doc.text(`Indent Date : ${nocDate}`, 40, 88);
    doc.text(`Indent No : ${nocNum}`, 320, 88);
    doc.text(`Fin Year : ${accYear}`, 40, 104);
    doc.text(`Program : ${program}`, 320, 104);

    // Helper to format item main category name (e.g. Drug, Consumable, Reagent, AYUSH)
    const getItemCategory = (item) => {
      if (!item) return 'Drug';
      
      // 1. Check main category fields
      const cat = String(item.MCATEGORY || item.mCategory || item.mcategory || item.CATEGORY || item.category || item.MCID || item.mcid || '').trim();
      const catUpper = cat.toUpperCase();
      
      if (catUpper.includes('CONSUM') || cat === '2') return 'Consumable';
      if (catUpper.includes('REAGENT') || cat === '3') return 'Reagent';
      if (catUpper.includes('AYUSH') || cat === '4') return 'AYUSH';
      if (catUpper.includes('DRUG') || cat === '1') return 'Drug';

      // 2. Item Code prefix rule (C... = Consumable, D... = Drug, R... = Reagent, A... = AYUSH)
      const code = String(item.ITEMCODE || item.ItemCode || item.itemCode || '').trim().toUpperCase();
      if (code.startsWith('C')) return 'Consumable';
      if (code.startsWith('R')) return 'Reagent';
      if (code.startsWith('A') && !code.startsWith('AM')) return 'AYUSH';
      if (code.startsWith('D')) return 'Drug';

      if (cat) return cat;
      return 'Drug';
    };

    // --- Items Table ---
    const tableBody = items.map((item, idx) => [
      idx + 1,
      item.ITEMCODE || item.ItemCode || '—',
      item.ITEMNAME || item.ItemName || '—',
      getItemCategory(item),
      item.STRENGTH1 || item.Strength1 || '—',
      item.UNIT || item.Unit || '—',
      item.REQUESTEDQTY || item.requestedqty || '0',
      item.WHSTOCK || item.whStock || '0'
    ]);

    autoTable(doc, {
      startY: 120,
      head: [['Sl. No.', 'Item Code', 'Item Name', 'Category', 'Strength', 'Unit', 'Requested Qty', 'Warehouse Stock']],
      body: tableBody.length > 0 ? tableBody : [['—', '—', 'No items found', '—', '—', '—', '0', '0']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.5 },
      headStyles: { fillColor: [30, 62, 44], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 },
        1: { cellWidth: 55 },
        2: { cellWidth: 140 },
        3: { cellWidth: 70 },
        4: { cellWidth: 60 },
        5: { cellWidth: 45 },
        6: { halign: 'right', cellWidth: 55 },
        7: { halign: 'right', cellWidth: 55 }
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

    const cleanNocNum = String(nocNum || 'Indent').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = docType === 'NOC' 
      ? `NOC_${cleanNocNum}.pdf`
      : `Monthly_Indent_${cleanNocNum}.pdf`;

    try {
      doc.save(fileName);
    } catch (saveErr) {
      console.warn('doc.save failed, triggering blob download fallback:', saveErr);
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (err) {
    console.error('Error generating Monthly Indent PDF:', err);
    throw err;
  }
};
