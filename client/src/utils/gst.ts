import { Client } from '../components/ClientList';

export interface GSTCalculationResult {
  isInterState: boolean; // true if outside Karnataka (IGST), false if inside Karnataka (CGST + SGST)
  supplyType: 'INTRA_STATE' | 'INTER_STATE' | 'NON_GST';
  taxLabel: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  total: number;
}

/**
 * Checks if a client is within Karnataka (State Code 29).
 * Shankara Online Solutions is in Karnataka.
 * Transactions with Karnataka clients have 9% CGST + 9% SGST.
 * Transactions with outside-Karnataka clients have 18% IGST.
 */
export const isKarnatakaLocation = (
  client?: Pick<Client, 'gstin' | 'state' | 'address'> | null
): boolean => {
  if (!client) return true; // Default to Karnataka if unspecified

  // 1. GSTIN state code check (first 2 digits: 29 for Karnataka)
  if (client.gstin && client.gstin.trim().length >= 2) {
    const code = client.gstin.trim().substring(0, 2);
    if (/^\d{2}$/.test(code)) {
      return code === '29';
    }
  }

  // 2. State field check
  if (client.state) {
    const s = client.state.toLowerCase();
    if (s.includes('karnataka') || s.includes('29')) {
      return true;
    }
    // If state specifies another state or non-29 code
    if (s.length > 0) {
      return false;
    }
  }

  // 3. Address field check
  if (client.address) {
    const a = client.address.toLowerCase();
    if (a.includes('karnataka') || a.includes('bangalore') || a.includes('bengaluru')) {
      return true;
    }
    // Check if address specifies known outside states
    if (
      a.includes('maharashtra') ||
      a.includes('mumbai') ||
      a.includes('delhi') ||
      a.includes('tamil nadu') ||
      a.includes('chennai') ||
      a.includes('telangana') ||
      a.includes('hyderabad') ||
      a.includes('kerala') ||
      a.includes('gujarat')
    ) {
      return false;
    }
  }

  return true;
};

/**
 * Calculates CGST, SGST, IGST based on billing entity and client location.
 */
export const calculateTaxes = (
  subtotal: number,
  type: 'COMPANY' | 'PERSONAL',
  isInterState: boolean
): GSTCalculationResult => {
  if (type !== 'COMPANY') {
    return {
      isInterState: false,
      supplyType: 'NON_GST',
      taxLabel: 'No GST (Personal Account)',
      subtotal,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalGst: 0,
      total: subtotal,
    };
  }

  if (isInterState) {
    const igst = subtotal * 0.18;
    return {
      isInterState: true,
      supplyType: 'INTER_STATE',
      taxLabel: 'Inter-State Supply (18% IGST)',
      subtotal,
      cgst: 0,
      sgst: 0,
      igst,
      totalGst: igst,
      total: subtotal + igst,
    };
  } else {
    const halfGst = (subtotal * 0.18) / 2;
    return {
      isInterState: false,
      supplyType: 'INTRA_STATE',
      taxLabel: 'Intra-State Karnataka (9% CGST + 9% SGST)',
      subtotal,
      cgst: halfGst,
      sgst: halfGst,
      igst: 0,
      totalGst: halfGst * 2,
      total: subtotal + halfGst * 2,
    };
  }
};
