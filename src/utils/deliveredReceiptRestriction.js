import { getFinancialYears, getWarehouseIndents } from '../api/warehouseReceiptApi';

/**
 * Checks if the current user/facility is a DME facility.
 * DME facilities are excluded from the restriction.
 * Checks localStorage and user object.
 */
export const isDmeFacility = (user) => {
  const localFacType = (localStorage.getItem('facilityType') || '').trim().toUpperCase();
  const localFacTypeId = (localStorage.getItem('facilityTypeId') || localStorage.getItem('facilitytypeid') || '').trim();
  const localRoleName = (localStorage.getItem('roleName') || '').trim().toUpperCase();

  const userFacTypeCode = (user?.facilityTypeCode || user?.facilityType || '').trim().toUpperCase();
  const userFacTypeId = String(user?.facilityTypeId || user?.facilitytypeid || user?.facilityTypeID || '').trim();
  const userRoleName = (user?.roleName || '').trim().toUpperCase();

  // DME facility type codes / IDs (364 = DME, 378 = DME MC)
  if (
    localFacType === 'DME' ||
    localFacType === 'DME MC' ||
    localFacType.includes('DME') ||
    userFacTypeCode === 'DME' ||
    userFacTypeCode === 'DME MC' ||
    userFacTypeCode.includes('DME') ||
    localFacTypeId === '364' ||
    localFacTypeId === '378' ||
    userFacTypeId === '364' ||
    userFacTypeId === '378' ||
    localRoleName.includes('DME') ||
    userRoleName.includes('DME')
  ) {
    return true;
  }
  return false;
};

/**
 * Calculates working days between deliveryDate and today (excluding Saturdays and Sundays).
 */
export const calculateWorkingDaysSinceDelivery = (deliveryDateVal) => {
  if (!deliveryDateVal) return 0;
  let delDate = null;

  if (deliveryDateVal instanceof Date) {
    delDate = new Date(deliveryDateVal);
  } else if (typeof deliveryDateVal === 'string') {
    const trimmed = deliveryDateVal.trim();
    if (/^\d{2}-\d{2}-\d{4}/.test(trimmed)) {
      const parts = trimmed.split(' ')[0].split('-');
      delDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      delDate = new Date(trimmed);
    }
  }

  if (!delDate || isNaN(delDate.getTime())) return 0;
  delDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let count = 0;
  let cur = new Date(delDate);
  cur.setDate(cur.getDate() + 1); // Start counting from the day after delivery

  while (cur <= today) {
    const day = cur.getDay(); // 0 is Sunday, 6 is Saturday
    if (day !== 0 && day !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

/**
 * Fetches delivered indents and checks:
 * 1. hasAnyDeliveredPending: delivered items pending receipt
 * 2. hasOverdueDeliveredPending: delivered items pending receipt where working days (excl Sat & Sun) > 2 days
 */
export const checkPendingDeliveredStatus = async (user) => {
  if (!user?.facilityId || isDmeFacility(user)) {
    return {
      isRestricted: false,
      hasAnyDeliveredPending: false,
      hasOverdueDeliveredPending: false,
      overdueList: [],
      allDeliveredPendingList: []
    };
  }

  try {
    const finRes = await getFinancialYears();
    if (!finRes?.success || !Array.isArray(finRes.data) || finRes.data.length === 0) {
      return {
        isRestricted: false,
        hasAnyDeliveredPending: false,
        hasOverdueDeliveredPending: false,
        overdueList: [],
        allDeliveredPendingList: []
      };
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const finYearString = currentMonth >= 3 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;

    const defaultYearObj = finRes.data.find(
      (y) =>
        y &&
        (y.year === finYearString ||
          y.year === finYearString.replace(/20/g, '') ||
          (y.year && y.year.includes(finYearString.split('-')[0].slice(-2) + '-' + finYearString.split('-')[1].slice(-2))))
    );
    const yearId = defaultYearObj ? defaultYearObj.id : finRes.data[0].id;

    const indentsRes = await getWarehouseIndents(yearId);
    if (!indentsRes?.success || !Array.isArray(indentsRes.data)) {
      return {
        isRestricted: false,
        hasAnyDeliveredPending: false,
        hasOverdueDeliveredPending: false,
        overdueList: [],
        allDeliveredPendingList: []
      };
    }

    // Filter pending indents (not completed)
    const pendingItems = indentsRes.data.filter(
      (i) =>
        i &&
        (i.receiptStatus === 'Yet to be Received' ||
          i.receiptStatus === 'Partial Receipt' ||
          i.receiptStatus === 'Incomplete')
    );

    // Delivered pending items
    const deliveredPending = pendingItems.filter(
      (i) => Boolean(i.deliveryDate || i.dropDate1 || i.dropDateTime)
    );

    // Overdue delivered pending items (> 2 days excluding Saturday & Sunday)
    const overdueDelivered = deliveredPending.filter((i) => {
      const delDateStr = i.deliveryDate || i.dropDate1 || i.dropDateTime;
      const workingDays = calculateWorkingDaysSinceDelivery(delDateStr);
      return workingDays > 2;
    });

    return {
      isRestricted: overdueDelivered.length > 0,
      hasAnyDeliveredPending: deliveredPending.length > 0,
      hasOverdueDeliveredPending: overdueDelivered.length > 0,
      overdueList: overdueDelivered,
      allDeliveredPendingList: deliveredPending
    };
  } catch (error) {
    console.error('Error in checkPendingDeliveredStatus:', error);
    return {
      isRestricted: false,
      hasAnyDeliveredPending: false,
      hasOverdueDeliveredPending: false,
      overdueList: [],
      allDeliveredPendingList: []
    };
  }
};
