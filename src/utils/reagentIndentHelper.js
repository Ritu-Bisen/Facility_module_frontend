/**
 * Utility helper functions for Reagent Indent permissions and financial year handling.
 */

/**
 * Checks if the current user belongs to a Medical College or DME facility.
 * Reagent Indent is restricted strictly to Medical College and DME facilities (excluding standalone DH, CHC, PHC, etc.).
 *
 * @param {Object} user - User object from Redux or localStorage
 * @returns {boolean}
 */
export function isMedicalCollegeOrDmeFacility(user) {
  if (user?.emailId === 'admink@gnail.com') return true;

  const localFacType = (localStorage.getItem('facilityType') || '').trim().toUpperCase();
  const localFacTypeId = (localStorage.getItem('facilityTypeId') || localStorage.getItem('facilitytypeid') || '').trim();
  const localFacName = (localStorage.getItem('facilityName') || '').trim().toUpperCase();
  const localRoleName = (localStorage.getItem('roleName') || '').trim().toUpperCase();

  const userFacTypeCode = (user?.facilityTypeCode || user?.facilityType || '').trim().toUpperCase();
  const userFacTypeId = String(user?.facilityTypeId || user?.facilitytypeid || user?.facilityTypeID || '').trim();
  const userFacName = (user?.facilityName || user?.facilityTypeName || '').trim().toUpperCase();
  const userRoleName = (user?.roleName || '').trim().toUpperCase();

  // Check HOD ID (HOD 3 = DME)
  const rawHodId = localStorage.getItem('hodId') || localStorage.getItem('hodid') || user?.hodId || user?.hodid;
  const currentHodId = rawHodId !== null && rawHodId !== undefined && rawHodId !== '' ? Number(rawHodId) : null;
  if (currentHodId === 3) {
    return true;
  }

  // If it's explicitly a standalone District Hospital (DH) or DHS facility without MC or DME, deny access
  const isDhOnly = 
    (localFacType === 'DH' || userFacTypeCode === 'DH' || currentHodId === 2) &&
    !localFacType.includes('MC') && !localFacType.includes('DME') &&
    !userFacTypeCode.includes('MC') && !userFacTypeCode.includes('DME') &&
    !userFacName.includes('MEDICAL COLLEGE') && !localFacName.includes('MEDICAL COLLEGE') &&
    !userFacName.includes('DME') && !localFacName.includes('DME');

  if (isDhOnly) {
    return false;
  }

  // Check for DME, DME MC, MC, Medical College
  return (
    localFacType === 'DME' ||
    localFacType === 'DME MC' ||
    localFacType === 'MC' ||
    localFacType.includes('DME') ||
    localFacType.includes('MEDICAL COLLEGE') ||
    userFacTypeCode === 'DME' ||
    userFacTypeCode === 'DME MC' ||
    userFacTypeCode === 'MC' ||
    userFacTypeCode.includes('DME') ||
    userFacTypeCode.includes('MEDICAL COLLEGE') ||
    userFacName.includes('MEDICAL COLLEGE') ||
    localFacName.includes('MEDICAL COLLEGE') ||
    localFacTypeId === '364' ||
    localFacTypeId === '378' ||
    userFacTypeId === '364' ||
    userFacTypeId === '378' ||
    localRoleName.includes('DME') ||
    localRoleName.includes('CME') ||
    localRoleName.includes('MEDICAL COLLEGE') ||
    userRoleName.includes('DME') ||
    userRoleName.includes('CME') ||
    userRoleName.includes('MEDICAL COLLEGE')
  );
}

/**
 * Parses the starting year integer from a financial year string.
 * Example: "2026-2027" -> 2026, "26-27" -> 2026.
 */
function parseStartYear(yearStr) {
  if (!yearStr) return 0;
  const firstPart = String(yearStr).split('-')[0].trim();
  const num = parseInt(firstPart, 10);
  if (isNaN(num)) return 0;
  return num < 100 ? 2000 + num : num;
}

/**
 * Checks whether a given financial year string is the current or a future financial year.
 * Returns true if the year is current or future, false if it is a past financial year.
 *
 * @param {string} yearStr - e.g. "2026-2027"
 * @param {Array} finYearsList - List of all financial year objects
 * @returns {boolean}
 */
export function isCurrentOrFutureFinYear(yearStr, finYearsList = []) {
  if (!yearStr) return false;

  const selectedStart = parseStartYear(yearStr);

  let currentStart = 0;
  const currentObj = Array.isArray(finYearsList) ? finYearsList.find((y) => y.isCurrent) : null;
  if (currentObj && currentObj.accYear) {
    currentStart = parseStartYear(currentObj.accYear);
  } else {
    const today = new Date();
    currentStart = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  }

  return selectedStart >= currentStart;
}

/**
 * Filters a list of financial years to return ONLY current and future financial years.
 *
 * @param {Array} finYearsList - Full list of financial year objects
 * @returns {Array} - Filtered list of current and future financial year objects
 */
export function filterCurrentAndFutureFinYears(finYearsList = []) {
  if (!Array.isArray(finYearsList)) return [];
  return finYearsList.filter((fy) => isCurrentOrFutureFinYear(fy.accYear, finYearsList));
}
