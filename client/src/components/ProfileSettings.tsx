import React, { useState } from 'react';
import {
  Building2,
  User,
  MapPin,
  CreditCard,
  FileCheck,
  Save,
  CheckCircle2,
  RefreshCw,
  Mail,
  Phone,
  ShieldCheck,
  ExternalLink,
  QrCode,
  Upload,
  Trash2,
  PenTool,
} from 'lucide-react';
import {
  BillingEntityProfile,
  defaultBillingProfiles,
  useBillingProfiles,
} from '../data/profile';

const ProfileSettings: React.FC = () => {
  const { profiles, updateProfiles } = useBillingProfiles();
  const [activeTab, setActiveTab] = useState<'company' | 'personal'>('company');

  // Local state for editing
  const [companyForm, setCompanyForm] = useState<BillingEntityProfile>(profiles.company);
  const [personalForm, setPersonalForm] = useState<BillingEntityProfile>(profiles.personal);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfiles({
      company: companyForm,
      personal: personalForm,
    });
    showToast('Billing profiles updated successfully! Changes will reflect on all invoices & PDFs.');
  };

  const handleReset = () => {
    if (confirm('Reset billing details to system defaults for Shankara Online Solutions LLP and Personal?')) {
      setCompanyForm(defaultBillingProfiles.company);
      setPersonalForm(defaultBillingProfiles.personal);
      updateProfiles(defaultBillingProfiles);
      showToast('Reset to default billing details.');
    }
  };

  const activeForm = activeTab === 'company' ? companyForm : personalForm;
  const setActiveForm = (updated: BillingEntityProfile) => {
    if (activeTab === 'company') {
      setCompanyForm(updated);
    } else {
      setPersonalForm(updated);
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'qr' | 'signature'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      if (target === 'qr') {
        setActiveForm({
          ...activeForm,
          bankDetails: {
            ...activeForm.bankDetails,
            qrCodeImage: dataUri,
          },
        });
        showToast('Payment UPI QR Code image uploaded.');
      } else {
        setActiveForm({
          ...activeForm,
          authorizedSignatory: {
            ...activeForm.authorizedSignatory,
            signatureImage: dataUri,
          },
        });
        showToast('Authorized signature image uploaded.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (target: 'qr' | 'signature') => {
    if (target === 'qr') {
      setActiveForm({
        ...activeForm,
        bankDetails: {
          ...activeForm.bankDetails,
          qrCodeImage: undefined,
        },
      });
      showToast('Payment UPI QR Code removed.');
    } else {
      setActiveForm({
        ...activeForm,
        authorizedSignatory: {
          ...activeForm.authorizedSignatory,
          signatureImage: undefined,
        },
      });
      showToast('Signature image removed.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-in slide-in-from-top duration-200 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile & Billing Settings</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Configure legal entity names, addresses, GSTIN, and banking settlement details for invoices and credit notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Reset to default details"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save Profile Changes
          </button>
        </div>
      </div>

      {/* Entity Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Company Card Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
            activeTab === 'company'
              ? 'bg-white border-indigo-600 ring-2 ring-indigo-600/20 shadow-sm'
              : 'bg-white/60 border-gray-200 hover:bg-white hover:border-gray-300'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              activeTab === 'company'
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm text-gray-900 truncate">
                {companyForm.legalName || 'Shankara Online Solutions LLP'}
              </h3>
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                18% GST Registered
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {companyForm.city}, {companyForm.state} • GSTIN: {companyForm.gstin}
            </p>
          </div>
        </button>

        {/* Personal Card Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
            activeTab === 'personal'
              ? 'bg-white border-purple-600 ring-2 ring-purple-600/20 shadow-sm'
              : 'bg-white/60 border-gray-200 hover:bg-white hover:border-gray-300'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              activeTab === 'personal'
                ? 'bg-purple-50 text-purple-600 border border-purple-100'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm text-gray-900 truncate">
                {personalForm.legalName || 'Manjunath Naik S'}
              </h3>
              <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
                Non-GST invoice
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {personalForm.city}, {personalForm.state} • PAN: {personalForm.pan}
            </p>
          </div>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Entity & Identification */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  {activeTab === 'company' ? 'Company Legal Identity' : 'Personal Legal Identity'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Legal Entity / Billing Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={activeForm.legalName}
                    onChange={(e) => setActiveForm({ ...activeForm, legalName: e.target.value })}
                    placeholder="e.g. Shankara Online Solutions LLP"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Trade / Display Name
                  </label>
                  <input
                    type="text"
                    value={activeForm.tradeName}
                    onChange={(e) => setActiveForm({ ...activeForm, tradeName: e.target.value })}
                    placeholder="e.g. Shankara Online Solutions"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                  />
                </div>

                {activeTab === 'company' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        GSTIN <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={activeForm.gstin || ''}
                        onChange={(e) => setActiveForm({ ...activeForm, gstin: e.target.value.toUpperCase() })}
                        placeholder="29ABCDE1234F1Z5"
                        maxLength={15}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Company PAN</label>
                      <input
                        type="text"
                        value={activeForm.pan || ''}
                        onChange={(e) => setActiveForm({ ...activeForm, pan: e.target.value.toUpperCase() })}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Individual PAN</label>
                    <input
                      type="text"
                      value={activeForm.pan || ''}
                      onChange={(e) => setActiveForm({ ...activeForm, pan: e.target.value.toUpperCase() })}
                      placeholder="ABCPN1234M"
                      maxLength={10}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Registered Billing Address */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  {activeTab === 'company' ? 'Registered Office & Address' : 'Personal Billing Address'}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Street Address / Premises <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={activeForm.address}
                    onChange={(e) => setActiveForm({ ...activeForm, address: e.target.value })}
                    placeholder="e.g. #42, 3rd Floor, Tech Enclave, Indiranagar"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs resize-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">City</label>
                    <input
                      type="text"
                      value={activeForm.city}
                      onChange={(e) => setActiveForm({ ...activeForm, city: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">State</label>
                    <input
                      type="text"
                      value={activeForm.state}
                      onChange={(e) => setActiveForm({ ...activeForm, state: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">State Code</label>
                    <input
                      type="text"
                      value={activeForm.stateCode}
                      onChange={(e) => setActiveForm({ ...activeForm, stateCode: e.target.value })}
                      placeholder="29"
                      maxLength={2}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pincode</label>
                    <input
                      type="text"
                      value={activeForm.pincode}
                      onChange={(e) => setActiveForm({ ...activeForm, pincode: e.target.value })}
                      placeholder="560038"
                      maxLength={6}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> Billing Email
                    </label>
                    <input
                      type="email"
                      value={activeForm.email}
                      onChange={(e) => setActiveForm({ ...activeForm, email: e.target.value })}
                      placeholder="e.g. contact@shankarasolutions.com"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> Contact Phone
                    </label>
                    <input
                      type="text"
                      value={activeForm.phone}
                      onChange={(e) => setActiveForm({ ...activeForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Bank Account & Settlement Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  {activeTab === 'company' ? 'Company Bank Account & UPI' : 'Personal Bank Account & UPI'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={activeForm.bankDetails.accountName}
                    onChange={(e) =>
                      setActiveForm({
                        ...activeForm,
                        bankDetails: { ...activeForm.bankDetails, accountName: e.target.value },
                      })
                    }
                    placeholder="e.g. SHANKARA ONLINE SOLUTIONS LLP"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={activeForm.bankDetails.accountNumber}
                    onChange={(e) =>
                      setActiveForm({
                        ...activeForm,
                        bankDetails: { ...activeForm.bankDetails, accountNumber: e.target.value },
                      })
                    }
                    placeholder="50200012345678"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bank Name & Branch</label>
                  <input
                    type="text"
                    value={activeForm.bankDetails.bankName}
                    onChange={(e) =>
                      setActiveForm({
                        ...activeForm,
                        bankDetails: { ...activeForm.bankDetails, bankName: e.target.value },
                      })
                    }
                    placeholder="HDFC Bank, Indiranagar Branch"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={activeForm.bankDetails.ifsc}
                    onChange={(e) =>
                      setActiveForm({
                        ...activeForm,
                        bankDetails: { ...activeForm.bankDetails, ifsc: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="HDFC0001234"
                    maxLength={11}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    UPI ID (for instant payment links)
                  </label>
                  <input
                    type="text"
                    value={activeForm.bankDetails.upiId}
                    onChange={(e) =>
                      setActiveForm({
                        ...activeForm,
                        bankDetails: { ...activeForm.bankDetails, upiId: e.target.value },
                      })
                    }
                    placeholder="shankara@hdfcbank"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                  />
                </div>

                {/* Payment QR Code Upload Option */}
                <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" /> Payment UPI QR Code (Appears on PDFs)
                    </span>
                    {activeForm.bankDetails.qrCodeImage && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> QR Attached
                      </span>
                    )}
                  </label>

                  {activeForm.bankDetails.qrCodeImage ? (
                    <div className="flex items-center gap-4 p-3 bg-blue-50/50 border border-blue-200/70 rounded-xl">
                      <div className="w-20 h-20 bg-white p-1 rounded-lg border border-gray-200 shadow-2xs flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={activeForm.bankDetails.qrCodeImage}
                          alt="Payment QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-900">Payment QR Code Uploaded</div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          This QR code will be printed in the Payment Details section of downloaded tax invoices.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="cursor-pointer px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-[11px] font-semibold text-gray-700 transition-colors shadow-2xs flex items-center gap-1">
                            <Upload className="w-3 h-3 text-gray-500" />
                            <span>Replace QR</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => handleImageUpload(e, 'qr')}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage('qr')}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-md text-[11px] font-semibold text-rose-600 transition-colors shadow-2xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 cursor-pointer transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-indigo-100 text-gray-500 group-hover:text-indigo-600 flex items-center justify-center flex-shrink-0 transition-colors">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="text-center sm:text-left flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 group-hover:text-indigo-600">
                          Upload Payment UPI QR Code (PNG, JPG)
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Clients can scan this QR directly from the PDF invoice to pay into this account.
                        </p>
                      </div>
                      <span className="px-3 py-1.5 bg-white border border-gray-300 group-hover:border-indigo-300 rounded-lg text-xs font-semibold text-gray-700 shadow-2xs transition-colors flex items-center gap-1.5 flex-shrink-0">
                        <Upload className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-600" />
                        Choose File
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleImageUpload(e, 'qr')}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Authorized Signatory */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <FileCheck className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Authorized Signatory (Appears on PDFs)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Signatory Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={activeForm.authorizedSignatory.name}
                    onChange={(e) =>
                      setActiveForm({
                        ...activeForm,
                        authorizedSignatory: { ...activeForm.authorizedSignatory, name: e.target.value },
                      })
                    }
                    placeholder="Manjunath Naik S"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Designation / Role</label>
                  <input
                    type="text"
                    value={activeForm.authorizedSignatory.designation}
                    onChange={(e) =>
                      setActiveForm({
                        ...activeForm,
                        authorizedSignatory: { ...activeForm.authorizedSignatory, designation: e.target.value },
                      })
                    }
                    placeholder="e.g. Designated Partner / CEO"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-colors"
                  />
                </div>

                {/* Digital Signature Image Upload Option */}
                <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-purple-600" /> Digital Signature Image (Appears on PDFs)
                    </span>
                    {activeForm.authorizedSignatory.signatureImage && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Signature Uploaded
                      </span>
                    )}
                  </label>

                  {activeForm.authorizedSignatory.signatureImage ? (
                    <div className="flex items-center gap-4 p-3 bg-purple-50/50 border border-purple-200/70 rounded-xl">
                      <div className="w-32 h-16 bg-white p-2 rounded-lg border border-gray-200 shadow-2xs flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={activeForm.authorizedSignatory.signatureImage}
                          alt="Authorized Signature"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-900">Signature Image Attached</div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Placed directly above the signatory name on generated Tax Invoices and Credit Notes.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="cursor-pointer px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-[11px] font-semibold text-gray-700 transition-colors shadow-2xs flex items-center gap-1">
                            <Upload className="w-3 h-3 text-gray-500" />
                            <span>Replace Signature</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => handleImageUpload(e, 'signature')}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage('signature')}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-md text-[11px] font-semibold text-rose-600 transition-colors shadow-2xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50/20 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 cursor-pointer transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-purple-100 text-gray-500 group-hover:text-purple-600 flex items-center justify-center flex-shrink-0 transition-colors">
                        <PenTool className="w-5 h-5" />
                      </div>
                      <div className="text-center sm:text-left flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 group-hover:text-purple-600">
                          Upload Authorized Signature Image (PNG recommended)
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          A transparent PNG or clean photo of your signature to display on downloaded PDFs.
                        </p>
                      </div>
                      <span className="px-3 py-1.5 bg-white border border-gray-300 group-hover:border-purple-300 rounded-lg text-xs font-semibold text-gray-700 shadow-2xs transition-colors flex items-center gap-1.5 flex-shrink-0">
                        <Upload className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-600" />
                        Choose File
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleImageUpload(e, 'signature')}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Live Invoice Header & Payment Preview */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4 sticky top-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" /> Live Invoice PDF Preview
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Auto-updated</span>
              </div>

              {/* PDF Preview Simulated Header */}
              <div className="bg-gray-50/80 rounded-xl border border-gray-200/90 p-4 space-y-3 text-xs">
                <div className="border-b border-gray-200 pb-3">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 block tracking-wider">
                    Invoice Header
                  </span>
                  <div className="font-bold text-sm text-gray-900 mt-1">
                    {activeForm.legalName || 'Entity Name'}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    {activeForm.address || 'Street Address'}, {activeForm.city || 'City'}, {activeForm.state} -{' '}
                    {activeForm.pincode}
                  </p>
                  {activeTab === 'company' && activeForm.gstin && (
                    <div className="text-[11px] font-medium text-gray-700 mt-1">
                      GSTIN: {activeForm.gstin}
                    </div>
                  )}
                  {activeForm.pan && (
                    <div className="text-[11px] text-gray-500">PAN: {activeForm.pan}</div>
                  )}
                  <div className="text-[11px] text-gray-500 mt-1">
                    {activeForm.email} • {activeForm.phone}
                  </div>
                </div>

                {/* Simulated Payment Box */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider mb-1">
                    Payment Details Box
                  </span>
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">A/c Name:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[150px]">
                        {activeForm.bankDetails.accountName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">A/c No:</span>
                      <span className="font-medium text-gray-900">
                        {activeForm.bankDetails.accountNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">IFSC:</span>
                      <span className="font-medium text-gray-900">
                        {activeForm.bankDetails.ifsc || 'N/A'}
                      </span>
                    </div>
                    {activeForm.bankDetails.upiId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">UPI:</span>
                        <span className="font-medium text-indigo-700">{activeForm.bankDetails.upiId}</span>
                      </div>
                    )}

                    {/* QR Code Preview in Payment Box */}
                    {activeForm.bankDetails.qrCodeImage && (
                      <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                        <div className="w-14 h-14 bg-white p-0.5 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center">
                          <img
                            src={activeForm.bankDetails.qrCodeImage}
                            alt="QR Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-[10px] text-gray-500 leading-tight">
                          <span className="font-semibold text-gray-700 block">UPI QR Attached</span>
                          Appears on PDF invoice for client payments
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulated Signatory */}
                <div className="border-t border-gray-200 pt-2 text-right">
                  <span className="text-[10px] text-gray-400 block">Authorized Signatory</span>
                  {activeForm.authorizedSignatory.signatureImage ? (
                    <div className="flex justify-end my-1">
                      <img
                        src={activeForm.authorizedSignatory.signatureImage}
                        alt="Signature Preview"
                        className="h-9 max-w-[130px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-6" />
                  )}
                  <span className="font-semibold text-xs text-gray-900 block">
                    {activeForm.authorizedSignatory.name || 'Signatory'}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    {activeForm.authorizedSignatory.designation || 'Title'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Profile Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
