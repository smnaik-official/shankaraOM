import React, { useState, useEffect } from 'react';
import { apiBatchSave } from '../services/api';
import {
  Plus,
  Edit,
  Trash2,
  Building,
  X,
  Search,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  gstin: string;
  address?: string;
  state?: string;
}

export const initialClients: Client[] = [
  {
    id: '1',
    name: 'M/s Tamagna Personalcare Pvt Ltd',
    email: 'contact@tamagna.com',
    phone: '+91 9876543210',
    gstin: '29ABICS5363G1ZY',
    address: '33, Gerupalya, Kumbalagodu, Behind KIADB Phase-2, Bangalore, Karnataka – 560074',
    state: 'Karnataka (29)',
  },
  {
    id: '2',
    name: 'The Art of Living Foundation',
    email: 'info@artofliving.org',
    phone: '+91 8765432109',
    gstin: '',
    address: '#433 Race Course Road, Farrer Park, Singapore, 218679',
    state: 'Singapore',
  },
  {
    id: '3',
    name: 'Tech Solutions Inc',
    email: 'hello@techsolutions.com',
    phone: '+91 7654321098',
    gstin: '27XYZDE1234F1Z5',
    address: 'Tower B, Tech Park, Bandra Kurla Complex, Mumbai, Maharashtra - 400051',
    state: 'Maharashtra (27)',
  },
];

const STORAGE_KEY = 'invoice_admin_clients';

export const getStoredClients = (): Client[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Upgrade Tamagna client details if old mock gstin
        const tamagna = parsed.find((c: any) => c.name?.toLowerCase().includes('tamagna'));
        if (tamagna && (tamagna.gstin === '29ABCDE1234F1Z5' || tamagna.address?.includes('Plot 42'))) {
          tamagna.gstin = '29ABICS5363G1ZY';
          tamagna.address = '33, Gerupalya, Kumbalagodu, Behind KIADB Phase-2, Bangalore, Karnataka – 560074';
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch (e) {}
        }
        const aol = parsed.find((c: any) => c.name?.toLowerCase().includes('art of living'));
        if (aol && (aol.gstin === '29AAATT1234F1Z5' || aol.address?.includes('Kanakapura'))) {
          aol.gstin = '';
          aol.address = '#433 Race Course Road, Farrer Park, Singapore, 218679';
          aol.state = 'Singapore';
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch (e) {}
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading clients from localStorage', err);
  }
  return [];
};

export const saveStoredClients = (clients: Client[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    window.dispatchEvent(new Event('clients_updated'));
    // Persist immediately to MongoDB Atlas Cloud
    apiBatchSave('clients', clients).catch((err) => {
      console.warn('[MongoDB Atlas] Auto-sync clients failed:', err);
    });
  } catch (err) {
    console.error('Error saving clients to localStorage', err);
  }
};

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(() => getStoredClients());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    gstin: '',
    address: '',
    state: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Listen for storage updates across tabs/components & cloud sync
  useEffect(() => {
    const handleSync = () => {
      setClients(getStoredClients());
    };
    window.addEventListener('clients_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('clients_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      gstin: '',
      address: '',
      state: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      gstin: client.gstin,
      address: client.address || '',
      state: client.state || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormError(null);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      setFormError('Please enter a valid Client / Company name.');
      return;
    }

    if (editingClient) {
      // Update existing client
      const updated = clients.map((c) =>
        c.id === editingClient.id
          ? ({
              ...c,
              name: formData.name!.trim(),
              email: formData.email?.trim() || '',
              phone: formData.phone?.trim() || '',
              gstin: formData.gstin?.trim().toUpperCase() || '',
              address: formData.address?.trim() || '',
              state: formData.state?.trim() || '',
            } as Client)
          : c
      );
      setClients(updated);
      saveStoredClients(updated);
      showToast(`Updated "${formData.name!.trim()}" successfully.`);
    } else {
      // Create new client
      const newClient: Client = {
        id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: formData.name!.trim(),
        email: formData.email?.trim() || '',
        phone: formData.phone?.trim() || '',
        gstin: formData.gstin?.trim().toUpperCase() || '',
        address: formData.address?.trim() || '',
        state: formData.state?.trim() || '',
      };
      const updated = [newClient, ...clients];
      setClients(updated);
      saveStoredClients(updated);
      showToast(`New client "${newClient.name}" added successfully.`);
    }

    handleCloseModal();
  };

  const handleConfirmDelete = () => {
    if (!clientToDelete) return;
    const updated = clients.filter((c) => c.id !== clientToDelete.id);
    setClients(updated);
    saveStoredClients(updated);
    showToast(`Client "${clientToDelete.name}" was deleted.`);
    setClientToDelete(null);
  };

  // Filtered clients based on search query
  const filteredClients = clients.filter((client) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      client.name.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      client.phone.toLowerCase().includes(q) ||
      client.gstin.toLowerCase().includes(q) ||
      (client.address && client.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl border border-gray-800 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Title and Add New Client Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Clients</h1>
          <p className="text-xs text-gray-500 mt-1">Manage customer directory, contact info, billing addresses, and GSTIN records</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800 flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Client
        </button>
      </div>

      {/* Search and Overview Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, phone, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
          <span>Showing <strong className="text-gray-900 font-semibold">{filteredClients.length}</strong> of {clients.length} clients</span>
        </div>
      </div>

      {/* Client List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-heading font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-heading font-semibold text-gray-900">{client.name}</div>
                        {client.address && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5" title={client.address}>
                            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-xs">{client.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">
                    {client.email ? (
                      <a
                        href={`mailto:${client.email}`}
                        className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{client.email}</span>
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Not set</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">
                    {client.phone ? (
                      <a
                        href={`tel:${client.phone}`}
                        className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{client.phone}</span>
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Not set</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {client.gstin ? (
                      <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md border border-gray-200 font-medium">
                        {client.gstin}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Unregistered</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit Client Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setClientToDelete(client)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="max-w-xs mx-auto text-gray-500 space-y-2">
                      <Building className="w-8 h-8 mx-auto text-gray-300" />
                      <p className="font-heading font-semibold text-gray-700">No clients found</p>
                      <p className="text-xs text-gray-400">
                        {searchQuery ? `No results match "${searchQuery}". Try a different keyword.` : 'Click "+ New Client" above to add your first client.'}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-xs text-indigo-600 font-medium hover:underline mt-1"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-lg font-heading font-bold text-gray-900">
                  {editingClient ? 'Edit Client Details' : 'Add New Client'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingClient
                    ? 'Update client information and tax invoicing records'
                    : 'Save new client details for invoicing and tracking'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveClient}>
              <div className="p-6 space-y-4 max-h-[calc(85vh-130px)] overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Client Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Client / Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M/s Tamagna Personalcare Pvt Ltd"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formError) setFormError(null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                  />
                </div>

                {/* Email Address & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. contact@tamagna.com"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* GSTIN & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      value={formData.gstin || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, gstin: e.target.value.toUpperCase() })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase text-gray-900 placeholder:text-gray-400 placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      State / Region
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Karnataka (29)"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Billing Address
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Plot 42, KIADB Industrial Area, Whitefield, Bangalore, Karnataka - 560066"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  {editingClient ? 'Save Changes' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-gray-900">Delete Client</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to delete <strong className="text-gray-900 font-semibold">{clientToDelete.name}</strong>?
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    This will remove the client from your active directory. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 rounded-lg transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm transition-colors"
              >
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
