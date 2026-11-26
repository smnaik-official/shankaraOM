import { useState, useEffect } from 'react';

export interface BillingEntityProfile {
  legalName: string;
  tradeName: string;
  gstin?: string;
  pan?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  email: string;
  phone: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    ifsc: string;
    upiId: string;
    qrCodeImage?: string;
  };
  authorizedSignatory: {
    name: string;
    designation: string;
    signatureImage?: string;
  };
}

export interface BillingProfilesConfig {
  company: BillingEntityProfile;
  personal: BillingEntityProfile;
}

export const defaultBillingProfiles: BillingProfilesConfig = {
  company: {
    legalName: 'M/s SHANKARA ONLINE SOLUTIONS LLP.',
    tradeName: 'Shankara Online Solutions',
    gstin: '29ADXFS0028E1ZT',
    pan: 'ADXFS0028E',
    address: '#33, 2nd Cross, Shankarappa Layout,\nH.V Halli, Near Manipal Hospital Road,\nRajarajeshwari Nagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    stateCode: '29',
    pincode: '560098',
    email: 'naik@shankaraonline.com',
    phone: '+91-9986703161',
    bankDetails: {
      accountName: 'SHANKARA ONLINE SOLUTIONS LLP',
      accountNumber: '50200041387947',
      bankName: 'HDFC BANK',
      branch: 'Rajarajeshwari Nagar Branch, Bengaluru',
      ifsc: 'HDFC0001039',
      upiId: 'smnaik@UPI',
    },
    authorizedSignatory: {
      name: 'Manjunath Naik S',
      designation: '(Founder, CEO)',
    },
  },
  personal: {
    legalName: 'MANJUNATH NAIK S',
    tradeName: 'Manjunath Naik',
    pan: 'AMAPN1977B',
    address: '#33, 2nd Cross, Shankarappa Layout,\nH.V Halli, Near Manipal Hospital Road,\nRajarajeshwari Nagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    stateCode: '29',
    pincode: '560098',
    email: 'mail4m.naik@gmail.com',
    phone: '+91-9986703161',
    bankDetails: {
      accountName: 'MANJUNATH NAIK S',
      accountNumber: '50100013517782',
      bankName: 'HDFC BANK',
      branch: 'MG Road, Bengaluru',
      ifsc: 'HDFC0000076',
      upiId: '9986703161@paytm',
    },
    authorizedSignatory: {
      name: 'Manjunath Naik S',
      designation: '',
    },
  },
};

const STORAGE_KEY_PROFILES = 'invoice_admin_billing_profiles';

export const getStoredBillingProfiles = (): BillingProfilesConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (!raw) return defaultBillingProfiles;
    const parsed = JSON.parse(raw);

    // Auto-migrate from older mock data to official credentials
    if (parsed.company && (parsed.company.gstin === '29ABCDE1234F1Z5' || parsed.company.address?.includes('Tech Enclave') || parsed.company.bankDetails?.accountNumber === '50200012345678')) {
      parsed.company = { ...defaultBillingProfiles.company };
      try {
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(parsed));
      } catch (e) {}
    }
    if (parsed.personal && (parsed.personal.pan === 'ABCPN1234M' || parsed.personal.pan === 'ADXFS0028E' || parsed.personal.address?.includes('Palm Meadows') || parsed.personal.bankDetails?.accountNumber === '50200041387947')) {
      parsed.personal = { ...defaultBillingProfiles.personal };
      try {
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(parsed));
      } catch (e) {}
    }

    return {
      company: {
        ...defaultBillingProfiles.company,
        ...(parsed.company || {}),
        bankDetails: {
          ...defaultBillingProfiles.company.bankDetails,
          ...((parsed.company && parsed.company.bankDetails) || {}),
        },
        authorizedSignatory: {
          ...defaultBillingProfiles.company.authorizedSignatory,
          ...((parsed.company && parsed.company.authorizedSignatory) || {}),
        },
      },
      personal: {
        ...defaultBillingProfiles.personal,
        ...(parsed.personal || {}),
        bankDetails: {
          ...defaultBillingProfiles.personal.bankDetails,
          ...((parsed.personal && parsed.personal.bankDetails) || {}),
        },
        authorizedSignatory: {
          ...defaultBillingProfiles.personal.authorizedSignatory,
          ...((parsed.personal && parsed.personal.authorizedSignatory) || {}),
        },
      },
    };
  } catch (err) {
    console.error('Failed to parse billing profiles from localStorage', err);
    return defaultBillingProfiles;
  }
};

export const saveStoredBillingProfiles = (profiles: BillingProfilesConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    // Dispatch custom event for real-time syncing across components
    window.dispatchEvent(new Event('billing_profiles_updated'));
  } catch (err) {
    console.error('Failed to save billing profiles to localStorage', err);
  }
};

export const useBillingProfiles = () => {
  const [profiles, setProfiles] = useState<BillingProfilesConfig>(getStoredBillingProfiles);

  useEffect(() => {
    const handleUpdate = () => {
      setProfiles(getStoredBillingProfiles());
    };
    window.addEventListener('billing_profiles_updated', handleUpdate);
    return () => window.removeEventListener('billing_profiles_updated', handleUpdate);
  }, []);

  const updateProfiles = (newProfiles: BillingProfilesConfig) => {
    saveStoredBillingProfiles(newProfiles);
    setProfiles(newProfiles);
  };

  return { profiles, updateProfiles };
};
