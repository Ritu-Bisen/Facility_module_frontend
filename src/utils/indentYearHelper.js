/**
 * Utility to calculate dynamic annual indent header names based on the current calendar year.
 * 
 * Example for year 2026:
 * - currYr: "26" -> COSUMPTION_From_1APR_26
 * - nextYr1: "27", nextYr2: "28" -> Non_EDL_INDENT_27_28
 * - futureYearRange: "27-28"
 * - futureFullYearRange: "2027-28"
 */
export function getDynamicIndentHeaders() {
  const now = new Date();
  const currentYear = now.getFullYear(); // e.g., 2026
  const currYr = String(currentYear).slice(-2); // "26"
  const nextYr1 = String(currentYear + 1).slice(-2); // "27"
  const nextYr2 = String(currentYear + 2).slice(-2); // "28"

  const consumptionHeader = `COSUMPTION_From_1APR_${currYr}`;
  const indentHeader = `Non_EDL_INDENT_${nextYr1}_${nextYr2}`;
  const futureYearRange = `${nextYr1}-${nextYr2}`;
  const futureFullYearRange = `20${nextYr1}-${nextYr2}`;

  return {
    currentYear,
    currYr,
    nextYr1,
    nextYr2,
    consumptionHeader,
    indentHeader,
    futureYearRange,
    futureFullYearRange
  };
}

/**
 * Utility to find default financial year ID matching current financial year
 */
export function getDefaultFinYearId(yearsList = [], idKey = 'id', nameKey = 'year') {
  if (!Array.isArray(yearsList) || yearsList.length === 0) return '';
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0 = Jan, 3 = Apr
  const finYearString = currentMonth >= 3 
    ? `${currentYear}-${currentYear + 1}` 
    : `${currentYear - 1}-${currentYear}`;

  const defaultYearObj = yearsList.find(y => {
    if (!y) return false;
    const val = String(y[nameKey] || '');
    return val === finYearString ||
      val === finYearString.replace(/20/g, '') ||
      val.includes(finYearString.split('-')[0].slice(-2) + '-' + finYearString.split('-')[1].slice(-2));
  });

  return defaultYearObj ? defaultYearObj[idKey] : yearsList[0]?.[idKey] || '';
}

/**
 * Calculates current and future financial year strings based on Indian financial year (1 Apr - 31 Mar).
 * Example on 17 Nov 2026:
 * - current: "2026-2027", "26-27"
 * - future:  "2027-2028", "27-28"
 * Example on 1 Apr 2027:
 * - current: "2027-2028", "27-28"
 * - future:  "2028-2029", "28-29"
 */
export function getCurrentAndFutureFinYears(targetDate = new Date()) {
  const d = new Date(targetDate);
  const currentMonth = d.getMonth(); // 0 = Jan, 2 = Mar, 3 = Apr ... 11 = Dec
  const currentYear = d.getFullYear();

  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const endYear = startYear + 1;

  const currentFyShort = `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
  const currentFyFull = `${startYear}-${endYear}`;

  const futureStartYear = startYear + 1;
  const futureEndYear = startYear + 2;

  const futureFyShort = `${String(futureStartYear).slice(-2)}-${String(futureEndYear).slice(-2)}`;
  const futureFyFull = `${futureStartYear}-${futureEndYear}`;

  return {
    currentFyShort,
    currentFyFull,
    futureFyShort,
    futureFyFull
  };
}
