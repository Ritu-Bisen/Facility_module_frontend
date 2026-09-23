import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { 
  ArrowLeftIcon, 
  PencilSquareIcon, 
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function FacilityReceiptManualPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramReceiptId = searchParams.get('ReceiptID') || searchParams.get('receiptId') || '';

  // Header State
  const [headerInfo, setHeaderInfo] = useState({
    receiptId: paramReceiptId || '0',
    receiptNo: 'Auto generated',
    receiptDate: '01-06-2023',
    facilityName: '',
    status: 'I'
  });
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editReceiptDate, setEditReceiptDate] = useState('01-06-2023');

  // Master Dropdowns
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);

  // Form Selections & Inputs
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [selectedItem, setSelectedItem] = useState('0');
  const [batchNo, setBatchNo] = useState('');
  const [batchQty, setBatchQty] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expDate, setExpDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('0');

  // Grid Data & States
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingBatch, setSavingBatch] = useState(false);
  const [freezing, setFreezing] = useState(false);

  useEffect(() => {
    initPage();
  }, [paramReceiptId]);

  const initPage = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchHeader(paramReceiptId),
        fetchCategories(),
        fetchLocations()
      ]);
    } catch (err) {
      console.error('Error initializing page:', err);
      toast.error(err.response?.data?.message || 'Failed to initialize page data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHeader = async (recId) => {
    try {
      const res = await api.get('/opening-stock/header', {
        params: recId ? { receiptId: recId } : {}
      });
      if (res.data && res.data.success) {
        const info = res.data.data;
        setHeaderInfo(info);
        setEditReceiptDate(info.receiptDate || '01-06-2023');
        fetchBatches(info.receiptId);
      }
    } catch (err) {
      console.error('Error fetching header:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/opening-stock/categories');
      if (res.data && res.data.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchItems = async (catId) => {
    try {
      const res = await api.get('/opening-stock/items', {
        params: { categoryId: catId }
      });
      if (res.data && res.data.success) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get('/opening-stock/locations');
      if (res.data && res.data.success) {
        setLocations(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const fetchBatches = async (recId) => {
    try {
      const res = await api.get('/opening-stock/batches', {
        params: recId ? { receiptId: recId } : {}
      });
      if (res.data && res.data.success) {
        setBatches(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    setSelectedCategory(catId);
    setSelectedItem('0');
    setItems([]);
    if (catId !== '0') {
      fetchItems(catId);
    }
  };

  const handleUpdateHeader = async () => {
    try {
      const res = await api.post('/opening-stock/header/update', {
        receiptId: headerInfo.receiptId,
        receiptNo: headerInfo.receiptNo,
        receiptDate: editReceiptDate
      });
      if (res.data && res.data.success) {
        setHeaderInfo((prev) => ({ ...prev, receiptDate: editReceiptDate }));
        setIsEditingHeader(false);
        toast.success('Header updated successfully');
      }
    } catch (err) {
      console.error('Error updating header:', err);
      toast.error(err.response?.data?.message || 'Failed to update header');
    }
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (selectedCategory === '0') {
      toast.error('Please Select Main Category');
      return;
    }
    if (selectedItem === '0') {
      toast.error('Please Select Item');
      return;
    }
    if (!batchNo.trim()) {
      toast.error('Please Enter Batch No');
      return;
    }
    if (!batchQty.trim() || isNaN(batchQty) || Number(batchQty) <= 0) {
      toast.error('Please Enter a valid Batch Quantity');
      return;
    }
    if (!mfgDate.trim()) {
      toast.error('Please Enter Mfg Date');
      return;
    }
    if (!expDate.trim()) {
      toast.error('Please Enter Exp Date');
      return;
    }
    if (selectedLocation === '0') {
      toast.error('Please Select Storage Location');
      return;
    }

    setSavingBatch(true);
    try {
      const payload = {
        receiptId: headerInfo.receiptId,
        itemId: selectedItem,
        batchNo: batchNo.trim(),
        batchQty: batchQty.trim(),
        mfgDate: mfgDate.trim(),
        expDate: expDate.trim(),
        locationId: selectedLocation
      };

      const res = await api.post('/opening-stock/save-batch', payload);
      if (res.data && res.data.success) {
        toast.success('Added Successfully');
        if (res.data.receiptId && res.data.receiptId !== headerInfo.receiptId) {
          setHeaderInfo((prev) => ({ ...prev, receiptId: res.data.receiptId }));
        }
        setBatchNo('');
        setBatchQty('');
        setMfgDate('');
        setExpDate('');
        fetchBatches(res.data.receiptId || headerInfo.receiptId);
      }
    } catch (err) {
      console.error('Error saving batch record:', err);
      toast.error(err.response?.data?.message || 'Failed to save batch record');
    } finally {
      setSavingBatch(false);
    }
  };

  const handleDeleteBatch = async (row) => {
    if (!window.confirm('Are you sure, you want to delete?')) return;

    try {
      const res = await api.delete(`/opening-stock/delete-batch/${row.inwNo}/${row.receiptItemId}`);
      if (res.data && res.data.success) {
        toast.success('Deleted Successfully');
        fetchBatches(headerInfo.receiptId);
      }
    } catch (err) {
      console.error('Error deleting batch record:', err);
      toast.error(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleShowAll = () => {
    fetchBatches(headerInfo.receiptId);
  };

  const handleFreeze = async () => {
    if (batches.length === 0) {
      toast.error('All the entries must be done before complete freezing the opening stock.');
      return;
    }

    if (!window.confirm('Are you sure you want to freeze opening stock? You cannot edit or add items after this.')) {
      return;
    }

    setFreezing(true);
    try {
      const res = await api.post('/opening-stock/freeze', {
        receiptId: headerInfo.receiptId
      });
      if (res.data && res.data.success) {
        toast.success('Freezed Successfully');
        navigate('/opening-stock');
      }
    } catch (err) {
      console.error('Error freezing opening stock:', err);
      toast.error(err.response?.data?.message || 'Failed to freeze opening stock');
    } finally {
      setFreezing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-full mx-auto space-y-6">
              
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/opening-stock')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Opening Stock Entry</h1>
                    <p className="text-xs text-gray-500 mt-1">Facility initial stock record & batch entry</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs font-medium text-gray-700 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <div>
                    <span className="text-gray-500">Stock No: </span>
                    <span className="font-mono font-bold text-gray-900">{headerInfo.receiptNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date: </span>
                    <span className="font-bold text-gray-900">{headerInfo.receiptDate}</span>
                  </div>
                </div>
              </div>

              {/* Add Batch Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-2">
                  Add Item Batch Record
                </h2>

                <form onSubmit={handleSaveBatch} className="space-y-4 text-xs">
                  {/* Category & Item */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Main Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="0">-- Select Category --</option>
                        {categories.map((cat) => (
                          <option key={cat.categoryId} value={cat.categoryId}>
                            {cat.categoryName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Select Item <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedItem}
                        onChange={(e) => setSelectedItem(e.target.value)}
                        disabled={selectedCategory === '0'}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="0">-- Select Item --</option>
                        {items.map((it) => (
                          <option key={it.itemId} value={it.itemId}>
                            {it.itemFullName || `${it.itemCode} - ${it.itemName}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Batch Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Batch No <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={batchNo}
                        onChange={(e) => setBatchNo(e.target.value)}
                        placeholder="Batch No"
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-800 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Batch Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={batchQty}
                        onChange={(e) => setBatchQty(e.target.value)}
                        placeholder="Quantity"
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-800 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Mfg Date (MM/yyyy) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={mfgDate}
                        onChange={(e) => setMfgDate(e.target.value)}
                        placeholder="MM/YYYY"
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-800 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Exp Date (MM/yyyy) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        placeholder="MM/YYYY"
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-800 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1">
                        Storage Location <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="0">Select Location</option>
                        {locations.map((loc) => (
                          <option key={loc.rackId} value={loc.rackId}>
                            {loc.locationNo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      disabled={savingBatch}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors focus:outline-none disabled:bg-blue-300"
                    >
                      <PlusIcon className="w-4 h-4 stroke-[3]" />
                      <span>{savingBatch ? 'Saving...' : 'Save Batch Record'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShowAll}
                      className="inline-flex items-center space-x-1 px-3.5 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <span>Show All</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Added Batches Grid */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Added Batch Records
                  </h3>
                  <span className="text-xs font-medium text-gray-500">
                    {batches.length} Records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="text-center py-8 text-xs text-gray-500">
                      <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading records...
                    </div>
                  ) : batches.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-500 font-medium">
                      No data found for selected filter conditions
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left divide-y divide-gray-200">
                      <thead className="bg-gray-100 text-gray-700 font-semibold uppercase text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12">Sl. No.</th>
                          <th className="py-2.5 px-3">Item Code</th>
                          <th className="py-2.5 px-4">Item Name</th>
                          <th className="py-2.5 px-3">Strength</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3 text-center">Item Stock</th>
                          <th className="py-2.5 px-3 text-center">Batch Stock</th>
                          <th className="py-2.5 px-3 text-right">Batch No</th>
                          <th className="py-2.5 px-3 text-right">MFG Date</th>
                          <th className="py-2.5 px-3 text-right">Exp. Date</th>
                          <th className="py-2.5 px-3 text-center w-14">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-gray-800">
                        {batches.map((row, idx) => (
                          <tr key={row.inwNo || idx} className="hover:bg-gray-50 transition-colors">
                            <td className="py-2.5 px-3 text-center text-gray-500 font-medium">
                              {row.slNo || idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-gray-900">
                              {row.itemCode}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-gray-800">
                              {row.itemName}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600">
                              {row.strength || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600">
                              {row.unit || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-gray-700">
                              {row.openingQty}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-blue-600">
                              {row.batchQty}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-900">
                              {row.batchNo}
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-600">
                              {row.mfgDate}
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-600">
                              {row.expDate}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleDeleteBatch(row)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Freeze Action */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center space-y-2">
                <button
                  onClick={handleFreeze}
                  disabled={freezing}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-colors focus:outline-none disabled:bg-gray-400"
                >
                  <LockClosedIcon className="w-4 h-4" />
                  <span>{freezing ? 'Freezing...' : 'Freeze Opening Stock'}</span>
                </button>
                <p className="text-xs text-red-600 font-medium">
                  Please ensure all the data before click on Freeze button because you cannot add any item after that.
                </p>
              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
