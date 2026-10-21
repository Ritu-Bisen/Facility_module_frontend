import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/axios';

/**
 * Generate PDF for Annual Indent containing ONLY saved items (facilityIndentQty > 0)
 * @param {Object} row - The indent row object (nocId, nocNumber, nocDate, status, accYear, categoryName, facilityId, etc.)
 * @param {Object} user - Logged in user details
 * @param {string|number} selectedYear - Selected financial year ID
 */
export const generateAnnualIndentPDF = async (row, user, selectedYear) => {
  try {
    const indentId = row.nocId || row.indentId;
    if (!indentId) {
      alert('Unable to identify Indent ID for download.');
      return;
    }

    // 1. Fetch saved items for this specific indent
    let items = [];
    try {
      const res = await api.get('/annual-indent/pdf/items', {
        params: { indentId }
      });
      const responseData = res.data?.data;
      const rawItems = Array.isArray(responseData)
        ? responseData
        : (Array.isArray(responseData?.items) ? responseData.items : (Array.isArray(responseData?.rows) ? responseData.rows : []));
      items = rawItems.filter(item => Number(item.facilityIndentQty || item.FACILITYINDENTQTY || 0) > 0);
    } catch (e) {
      console.warn('Dedicated /annual-indent/pdf/items call failed, falling back:', e);
    }

    // Fallback to create/items if needed
    if (items.length === 0) {
      try {
        const res = await api.get('/annual-indent/create/items', {
          params: {
            indentId,
            facilityId: row.facilityId || user?.facilityId || undefined,
            finYearId: row.accYrSetId || selectedYear || undefined
          }
        });
        const responseData = res.data?.data;
        const rawItems = Array.isArray(responseData)
          ? responseData
          : (Array.isArray(responseData?.items) ? responseData.items : (Array.isArray(responseData?.rows) ? responseData.rows : []));
        items = rawItems.filter(item => Number(item.facilityIndentQty || item.FACILITYINDENTQTY || 0) > 0);
      } catch (e) {
        console.warn('Fallback /annual-indent/create/items call failed:', e);
      }
    }

    if (items.length === 0) {
      alert('No saved items with indent quantity found in this Annual Indent.');
      return;
    }

    // Retrieve active user / facility display details
    let activeUser = user;
    if (!activeUser || (!activeUser.firstName && !activeUser.facilityName && !activeUser.FIRSTNAME)) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) activeUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    let facilityDisplayName = '';
    const fName = (activeUser?.firstName || activeUser?.FIRSTNAME || '').trim();
    const lName = (activeUser?.lastName || activeUser?.LASTNAME || '').trim();
    if (activeUser?.facilityName || activeUser?.FACILITYNAME || localStorage.getItem('facilityName')) {
      facilityDisplayName = activeUser?.facilityName || activeUser?.FACILITYNAME || localStorage.getItem('facilityName');
    } else if (fName && lName) {
      facilityDisplayName = `${fName}-${lName}`;
    } else if (fName) {
      facilityDisplayName = fName;
    } else {
      facilityDisplayName = 'Facility';
    }

    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Primary Theme: Forest Emerald #065f46
    const primaryColor = [6, 95, 70];

    // Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(40, 24, pageWidth - 80, 48, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('ANNUAL INDENT REPORT', pageWidth / 2, 44, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Chhattisgarh Medical Services Corporation Limited (CGMSC) | Government of Chhattisgarh', pageWidth / 2, 60, { align: 'center' });

    // Meta Details Box
    const startY = 82;
    doc.setLineWidth(0.5);
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(40, startY, pageWidth - 80, 48, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);

    const indentNo = row.nocNumber || row.indentNo || '—';
    const indentDate = row.nocDate || row.indentDate || '—';
    const accYear = row.accYear || '—';
    const category = row.categoryName || 'General';
    const status = row.status || 'Completed';

    // Left Column
    doc.text(`Facility: ${facilityDisplayName}`, 55, startY + 18);
    doc.text(`Indent No: ${indentNo}`, 55, startY + 36);

    // Mid Column
    doc.text(`Financial Year: ${accYear}`, 320, startY + 18);
    doc.text(`Indent Date: ${indentDate}`, 320, startY + 36);

    // Right Column
    doc.text(`Category: ${category}`, 580, startY + 18);
    doc.text(`Status: ${status}`, 580, startY + 36);

    // Calculate totals & map table rows
    let totalQty = 0;
    let totalValue = 0;

    const tableRows = items.map((item, idx) => {
      const qty = Number(item.facilityIndentQty || item.FACILITYINDENTQTY || 0);
      const rate = Number(item.rate || item.RATE || 0);
      const val = Number(item.indAprVal || item.INDAPRVAL || (qty * rate));
      totalQty += qty;
      totalValue += val;

      return [
        idx + 1,
        item.itemCode || item.ITEMCODE || '—',
        item.itemName || item.ITEMNAME || '—',
        item.strength || item.STRENGTH1 || '—',
        item.unit || item.UNIT || '—',
        item.groupName || item.GROUPNAME || '—',
        Number(item.currentStock || item.CURRENTSTOCK || 0).toLocaleString('en-IN'),
        Number(item.consumption || item.CONSUMPTION || 0).toLocaleString('en-IN'),
        qty.toLocaleString('en-IN'),
        rate.toFixed(2),
        val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ];
    });

    // Summary Total Row
    tableRows.push([
      {
        content: `Total (${items.length} Saved Items):`,
        colSpan: 8,
        styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [30, 41, 59] }
      },
      {
        content: totalQty.toLocaleString('en-IN'),
        styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [30, 41, 59] }
      },
      {
        content: '',
        styles: { halign: 'right', fillColor: [241, 245, 249] }
      },
      {
        content: `Rs. ${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [6, 95, 70] }
      }
    ]);

    autoTable(doc, {
      startY: startY + 56,
      margin: { left: 40, right: 40 },
      tableWidth: pageWidth - 80,
      head: [['#', 'Item Code', 'Item Name', 'Strength', 'Unit', 'Group Name', 'Current Stock', 'Consumption', 'Indent Qty', 'Rate (Rs.)', 'Approx Value (Rs.)']],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
        valign: 'middle',
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        valign: 'middle',
        minCellHeight: 22
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 26 },
        1: { halign: 'center', cellWidth: 55, fontStyle: 'bold' },
        2: { halign: 'left', cellWidth: 195.89 },
        3: { halign: 'left', cellWidth: 65 },
        4: { halign: 'center', cellWidth: 42 },
        5: { halign: 'left', cellWidth: 78 },
        6: { halign: 'right', cellWidth: 62 },
        7: { halign: 'right', cellWidth: 68 },
        8: { halign: 'right', cellWidth: 60, fontStyle: 'bold' },
        9: { halign: 'right', cellWidth: 55 },
        10: { halign: 'right', cellWidth: 75, fontStyle: 'bold' }
      }
    });

    // Add page numbers and generation timestamp to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, footerY);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 40, footerY, { align: 'right' });
    }

    const safeFilename = `Annual_Indent_${(indentNo || 'REPORT').replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
    doc.save(safeFilename);
  } catch (err) {
    console.error('Failed to generate Annual Indent PDF:', err);
    throw err;
  }
};
