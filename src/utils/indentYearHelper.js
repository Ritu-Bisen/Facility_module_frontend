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
