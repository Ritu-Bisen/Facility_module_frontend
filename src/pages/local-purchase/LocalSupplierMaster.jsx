import React, { useState, useEffect } from 'react';
import { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier } from '../../api/localPurchaseApi';
import { toast } from 'react-hot-toast';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function LocalSupplierMaster() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'form'
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState(null);
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (activeTab === 'list') {
      fetchSuppliers();
    }
  }, [activeTab]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await getSuppliers();
      if (res.success) {
        setSuppliers(res.data);
      }
    } catch (error) {
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id) => {
    setFormLoading(true);
    try {
      const res = await getSupplierById(id);
      if (res.success && res.data) {
        const s = res.data;
        setSupplierId(s.lpSupplierId);
        setSupplierCode(s.supplierCode || '');
        setSupplierName(s.supplierName || '');
        setAddress(s.address || '');
        setCity(s.city || '');
        setEmail(s.email || '');
        setPhone(s.phone1 || '');
        setActiveTab('form');
      }
    } catch (error) {
      toast.error('Failed to load supplier details');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await deleteSupplier(id);
        if (res.success) {
          toast.success(res.message);
          fetchSuppliers();
        }
      } catch (error) {
        toast.error('Failed to delete supplier');
      }
    }
  };

  const handleSave = async () => {
    if (!supplierName.trim()) {
      toast.error('Supplier Name is required');
      return;
    }
    
    // Check max lengths according to old CS validations
    if (supplierName.length > 150) return toast.error('Supplier Name too long (max 150)');
    if (address.length > 1000) return toast.error('Address too long (max 1000)');
    if (city.length > 150) return toast.error('City too long (max 150)');
    if (email.length > 150) return toast.error('Email too long (max 150)');
    if (phone.length > 150) return toast.error('Phone too long (max 150)');

    const payload = {
      supplierCode,
      supplierName,
      address,
      city,
      email,
      phone1: phone
    };

    setFormLoading(true);
    try {
      let res;
      if (supplierId) {
        res = await updateSupplier(supplierId, payload);
      } else {
        res = await createSupplier(payload);
      }

      if (res.success) {
        toast.success(res.message);
        handleClear();
        setActiveTab('list');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    } finally {
      setFormLoading(false);
    }
  };

  const handleClear = () => {
    setSupplierId(null);
    setSupplierCode('');
    setSupplierName('');
    setAddress('');
    setCity('');
    setEmail('');
    setPhone('');
  };

  const handleCancel = () => {
    if (supplierId) {
      // Refresh current
      handleEdit(supplierId);
    } else {
      handleClear();
      setActiveTab('list');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Header Title */}
              <div className="bg-white px-6 py-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Local Purchase Suppliers
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">Manage your local suppliers, contacts, and information</p>
                </div>
              </div>

              {/* Tabs Container */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200 bg-gray-50/50">
                  <button
                    onClick={() => setActiveTab('list')}
                    className={`py-3 px-8 font-medium text-sm transition-colors ${
                      activeTab === 'list' 
                        ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    Local Suppliers
                  </button>
                  <button
                    onClick={() => setActiveTab('form')}
                    className={`py-3 px-8 font-medium text-sm transition-colors ${
                      activeTab === 'form' 
                        ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    Add/Edit Local Supplier
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                  {/* LIST TAB */}
                  {activeTab === 'list' && (
                    <div className="overflow-x-auto">
                      {loading ? (
                        <div className="flex justify-center py-10">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-16">Sl.No</th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-32">Code</th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Name</th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center w-24">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {suppliers.length === 0 ? (
                              <tr>
                                <td colSpan="8" className="border border-gray-200 px-4 py-4 text-center text-gray-500">
                                  No Data Found
                                </td>
                              </tr>
                            ) : (
                              suppliers.map((s, index) => (
                                <tr key={s.lpSupplierId} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">{index + 1}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                      {s.supplierCode}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-gray-900 font-medium">{s.supplierName}</td>
                                  <td className="px-6 py-4 text-gray-500">{s.address}</td>
                                  <td className="px-6 py-4 text-gray-500">{s.city}</td>
                                  <td className="px-6 py-4 text-gray-500">{s.email}</td>
                                  <td className="px-6 py-4 text-gray-500">{s.phone1}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex justify-center space-x-4">
                                      <button 
                                        onClick={() => handleEdit(s.lpSupplierId)}
                                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                        title="Edit"
                                      >
                                        <PencilSquareIcon className="w-5 h-5" />
                                      </button>
                                      {s.deletable && (
                                        <button 
                                          onClick={() => handleDelete(s.lpSupplierId)}
                                          className="text-red-500 hover:text-red-700 transition-colors"
                                          title="Delete"
                                        >
                                          <TrashIcon className="w-5 h-5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* FORM TAB */}
                  {activeTab === 'form' && (
                    <div className="max-w-4xl mx-auto my-4">
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-medium leading-6 text-gray-900">
                            {supplierId ? 'Edit Supplier Information' : 'New Supplier Information'}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Please provide the local supplier's contact details and address.
                          </p>
                        </div>
                        
                        <div className="px-6 py-5 space-y-6 relative">
                          {formLoading && (
                            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-b-lg">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            <div className="md:col-span-1 pt-2">
                              <label className="block text-sm font-medium text-gray-700">Supplier Code</label>
                              <p className="text-xs text-gray-500 mt-1">Automatically generated if left blank.</p>
                            </div>
                            <div className="md:col-span-2">
                              <div className="w-full max-w-md px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 text-sm font-mono">
                                {supplierCode || 'Auto-Generated on Save'}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            <div className="md:col-span-1 pt-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Supplier Name <span className="text-red-500">*</span>
                              </label>
                            </div>
                            <div className="md:col-span-2">
                              <input
                                type="text"
                                className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2 outline-none transition-shadow"
                                maxLength={150}
                                value={supplierName}
                                placeholder="Enter supplier name..."
                                onChange={e => setSupplierName(e.target.value)}
                              />
                              <p className="mt-1 text-xs text-gray-400 text-right max-w-md">{supplierName.length}/150</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            <div className="md:col-span-1 pt-2">
                              <label className="block text-sm font-medium text-gray-700">Address</label>
                            </div>
                            <div className="md:col-span-2">
                              <textarea
                                className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2 outline-none transition-shadow"
                                rows={3}
                                maxLength={1000}
                                placeholder="Full street address..."
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                              />
                              <p className="mt-1 text-xs text-gray-400 text-right max-w-md">{address.length}/1000</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            <div className="md:col-span-1 pt-2">
                              <label className="block text-sm font-medium text-gray-700">City</label>
                            </div>
                            <div className="md:col-span-2">
                              <input
                                type="text"
                                className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2 outline-none transition-shadow"
                                maxLength={150}
                                placeholder="City name"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start border-t border-gray-200 pt-6">
                            <div className="md:col-span-1 pt-2">
                              <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                            </div>
                            <div className="md:col-span-2">
                              <input
                                type="email"
                                className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2 outline-none transition-shadow"
                                maxLength={150}
                                placeholder="contact@supplier.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            <div className="md:col-span-1 pt-2">
                              <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                            </div>
                            <div className="md:col-span-2">
                              <input
                                type="text"
                                className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2 outline-none transition-shadow"
                                maxLength={150}
                                placeholder="e.g. 9876543210"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/[^0-9\-() ]/g, ''))}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
                          <button
                            onClick={handleClear}
                            disabled={formLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            Clear
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={formLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={formLoading}
                            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            Save Supplier
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
