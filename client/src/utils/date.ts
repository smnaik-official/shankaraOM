/**
 * Date utility for formatting dates across the entire application.
 * Consistent standard format: DD MM YYYY (e.g. 18 Oct 2026)
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDateDMY = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return '';

    // If already in DD MMM YYYY format (e.g. "18 Oct 2026" or "05 Sep 2026")
    if (/^\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}$/.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const day = parts[0].padStart(2, '0');
      const monthStr = parts[1].slice(0, 3);
      const monthCapitalized = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).toLowerCase();
      return `${day} ${monthCapitalized} ${parts[2]}`;
    }

    // In YYYY-MM-DD or ISO format YYYY-MM-DDTHH:mm:ss...
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const monthIdx = parseInt(month, 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day.padStart(2, '0')} ${MONTHS_SHORT[monthIdx]} ${year}`;
      }
    }

    // In DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      const monthIdx = parseInt(month, 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day.padStart(2, '0')} ${MONTHS_SHORT[monthIdx]} ${year}`;
      }
    }
  }

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateInput);
  }
};

/**
 * Alias to formatDateDMY for consistent DD MM YYYY formatting
 */
export const formatDateDDMMYYYY = formatDateDMY;

export const formatMonthYear = (monthStr: string): string => {
  if (!monthStr) return '';
  try {
    const [y, m] = monthStr.split('-').map(Number);
    if (!y || !m) return monthStr;
    const date = new Date(y, m - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return monthStr;
  }
};
