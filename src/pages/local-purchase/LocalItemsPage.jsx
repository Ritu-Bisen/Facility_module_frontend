import React, { useState, useEffect } from 'react';
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import Footer from "../../components/layout/Footer";
import { PencilSquareIcon, TrashIcon, CheckCircleIcon, ExclamationCircleIcon, PlusIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import * as localItemsApi from "../../api/localItemsApi";

const LocalItemsPage = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'form'
  const [categories, setCategories] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [edlItems, setEdlItems] = useState([]);
  
  const [localItems, setLocalItems] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form State
  const initialFormState = {
    lpItemId: '',
    isEdl: 'NEDL', // 'EDL' or 'NEDL'
    edlItemCode: '',
    categoryId: '',
    itemTypeId: '',
    itemCode: '',
    itemName: '',
    strength: '',
    sku: '',
    packQty: '',
    multiple: '',
    unitCount: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchLocalItems();
    }
  }, [categoryFilter, activeTab]);

  const fetchInitialData = async () => {
    try {
      const [cats, types, edls] = await Promise.all([
        localItemsApi.getCategories(),
        localItemsApi.getItemTypes(),
        localItemsApi.getEdlItems()
      ]);
      setCategories(cats);
      setItemTypes(types);
      setEdlItems(edls);
    } catch (error) {
      console.error("Failed to load initial data", error);
      showMessage("Failed to load reference data", "error");
    }
  };

  const fetchLocalItems = async () => {
    setIsLoading(true);
    try {
      const items = await localItemsApi.getLocalItems(categoryFilter);
      setLocalItems(items);
    } catch (error) {
      console.error("Failed to fetch local items", error);
      showMessage("Failed to load local items", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleEdlTypeChange = (e) => {
    const isEdl = e.target.value;
    setFormData({
      ...initialFormState,
      isEdl
    });
  };

  const handleEdlItemSelect = async (e) => {
    const itemCode = e.target.value;
    if (!itemCode) {
      setFormData({ ...initialFormState, isEdl: 'EDL' });
      return;
    }
    
    try {
      const details = await localItemsApi.getEdlItemDetails(itemCode);
      if (details) {
        setFormData(prev => ({
          ...prev,
          edlItemCode: itemCode,
          itemCode: `LP${details.itemCode}`,
          itemName: details.itemName,
          strength: details.strength || '',
          sku: details.unit || '',
          packQty: details.packQty || '',
          categoryId: details.categoryId || '',
          itemTypeId: details.itemTypeId || '',
          unitCount: details.unitCount || '',
          multiple: details.multiple || ''
        }));
      }
    } catch (error) {
      console.error("Failed to fetch EDL details", error);
      showMessage("Failed to fetch EDL details", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item) => {
    setFormData({
      lpItemId: item.lpItemId,
      isEdl: item.edlItemCode ? 'EDL' : 'NEDL',
      edlItemCode: item.edlItemCode || '',
      categoryId: item.categoryId || '',
      itemTypeId: item.itemTypeId || '',
      itemCode: item.itemCode || '',
      itemName: item.description || '',
      strength: item.strength || '',
      sku: item.sku || '',
      packQty: item.packSize || '',
      multiple: item.multiple || '',
      unitCount: item.unitCount || ''
    });
    setActiveTab('form');
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete ${item.itemCode}?`)) return;
    
    try {
      await localItemsApi.deleteLocalItem(item.lpItemId);
      showMessage("Deleted successfully", "success");
      fetchLocalItems();
    } catch (error) {
      showMessage(error.response?.data?.error || "Failed to delete item", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await localItemsApi.saveLocalItem(formData);
      showMessage("Saved successfully", "success");
      handleClear();
      setActiveTab('list');
      fetchLocalItems();
    } catch (error) {
      showMessage(error.response?.data?.error || "Failed to save item", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setFormData({ ...initialFormState, isEdl: formData.isEdl });
  };

  const isFormDisabled = formData.isEdl === 'EDL' && formData.edlItemCode;

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 relative">
          
          {/* Header */}
          <div className="bg-[#bce6b6] py-3 px-6 shadow-sm border-b sticky top-0 z-10 flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800">Local Purchase Items</h1>
          </div>

          <div className="p-6">
            
            {message.text && (
              <div className={`mb-4 p-3 rounded flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                {message.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationCircleIcon className="w-5 h-5" />}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2 px-6 font-medium text-sm border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'list' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <ListBulletIcon className="w-4 h-4" /> Local Items
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`py-2 px-6 font-medium text-sm border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'form' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <PlusIcon className="w-4 h-4" /> Add/Edit Local Items
              </button>
            </div>

            {/* List Tab */}
            {activeTab === 'list' && (
              <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700">Category</label>
                  <select 
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b3b17] text-white">
                      <tr>
                        <th className="px-3 py-2 border-r border-[#155424] text-center w-[5%]">Sl.No</th>
                        <th className="px-3 py-2 border-r border-[#155424] text-center w-[10%]">Item Code</th>
                        <th className="px-3 py-2 border-r border-[#155424] w-[25%]">Description</th>
                        <th className="px-3 py-2 border-r border-[#155424] w-[15%]">Strength</th>
                        <th className="px-3 py-2 border-r border-[#155424] w-[10%]">SKU</th>
                        <th className="px-3 py-2 border-r border-[#155424] text-right w-[8%]">Pack Size</th>
                        <th className="px-3 py-2 border-r border-[#155424] w-[12%]">Category</th>
                        <th className="px-3 py-2 border-r border-[#155424] w-[10%]">ItemType</th>
                        <th className="px-3 py-2 text-center w-[5%]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan="9" className="px-4 py-8 text-center text-gray-500">Loading...</td>
                        </tr>
                      ) : localItems.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="px-4 py-8 text-center text-gray-500">No Data Found</td>
                        </tr>
                      ) : (
                        localItems.map((item, idx) => (
                          <tr key={item.lpItemId} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-center border-r border-gray-200">{idx + 1}</td>
                            <td className="px-3 py-2 text-center border-r border-gray-200">{item.itemCode}</td>
                            <td className="px-3 py-2 border-r border-gray-200 font-medium">{item.description}</td>
                            <td className="px-3 py-2 border-r border-gray-200">{item.strength}</td>
                            <td className="px-3 py-2 border-r border-gray-200">{item.sku}</td>
                            <td className="px-3 py-2 text-right border-r border-gray-200">{item.packSize}</td>
                            <td className="px-3 py-2 border-r border-gray-200">{item.categoryName}</td>
                            <td className="px-3 py-2 border-r border-gray-200">{item.itemTypeName}</td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800" title="Edit">
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                                {item.deletable && (
                                  <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800" title="Delete">
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Form Tab */}
            {activeTab === 'form' && (
              <div className="bg-white rounded-lg shadow border border-gray-200 max-w-4xl">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Item Specifications</h3>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                  
                  <div className="mb-6 flex gap-6 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="isEdl" value="EDL" checked={formData.isEdl === 'EDL'} onChange={handleEdlTypeChange} className="text-emerald-600 focus:ring-emerald-500" disabled={formData.lpItemId} />
                      <span className="text-sm font-medium text-gray-700">EDL</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="isEdl" value="NEDL" checked={formData.isEdl === 'NEDL'} onChange={handleEdlTypeChange} className="text-emerald-600 focus:ring-emerald-500" disabled={formData.lpItemId} />
                      <span className="text-sm font-medium text-gray-700">Non EDL</span>
                    </label>
                  </div>

                  {formData.isEdl === 'EDL' && (
                    <div className="mb-4 grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Select Drug</label>
                      <select 
                        className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full max-w-md focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                        value={formData.edlItemCode}
                        onChange={handleEdlItemSelect}
                        disabled={formData.lpItemId}
                      >
                        <option value="">Select EDL Items</option>
                        {edlItems.map(item => (
                          <option key={item.itemCode} value={item.itemCode}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Item Category</label>
                      <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} disabled={isFormDisabled} className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full max-w-sm focus:ring-emerald-500 shadow-sm" required>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Item Type</label>
                      <select name="itemTypeId" value={formData.itemTypeId} onChange={handleInputChange} disabled={isFormDisabled} className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full max-w-sm focus:ring-emerald-500 shadow-sm">
                        <option value="">Select Item Type</option>
                        {itemTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Item Code</label>
                      <input type="text" name="itemCode" value={formData.itemCode} readOnly className="border border-gray-300 rounded px-3 py-1.5 text-sm w-32 bg-gray-100 shadow-sm" placeholder="Auto-generated" />
                    </div>

                    <div className="grid grid-cols-[150px_1fr] items-start gap-4">
                      <label className="text-sm font-medium text-gray-700 pt-2">Drug Name</label>
                      <textarea name="itemName" value={formData.itemName} onChange={handleInputChange} disabled={isFormDisabled} maxLength="150" rows="3" className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-md focus:ring-emerald-500 shadow-sm" required></textarea>
                    </div>

                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Strength</label>
                      <div className="flex items-center gap-2">
                        <textarea name="strength" value={formData.strength} onChange={handleInputChange} disabled={isFormDisabled} maxLength="75" rows="1" className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:ring-emerald-500 shadow-sm"></textarea>
                        <span className="text-xs text-gray-500">ex ml,100mg,250mg,iu etc</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">SKU</label>
                      <div className="flex items-center gap-2">
                        <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} disabled={isFormDisabled} maxLength="50" className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:ring-emerald-500 shadow-sm" required />
                        <span className="text-xs text-gray-500">eg 10X10,Vial,Bottle</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Packing Quantity</label>
                      <div className="flex items-center gap-2">
                        <input type="number" name="packQty" value={formData.packQty} onChange={handleInputChange} disabled={isFormDisabled} className="border border-gray-300 rounded px-3 py-1.5 text-sm w-32 focus:ring-emerald-500 shadow-sm text-right" required />
                        <span className="text-xs text-gray-500">eg 10,100,50</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Multiple</label>
                      <div className="flex items-center gap-2">
                        <input type="number" name="multiple" value={formData.multiple} onChange={handleInputChange} disabled={isFormDisabled} className="border border-gray-300 rounded px-3 py-1.5 text-sm w-32 focus:ring-emerald-500 shadow-sm text-right" required />
                        <span className="text-xs text-gray-500">(Put No of Tablet in 1 Strip)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Unit Count</label>
                      <div className="flex items-center gap-2">
                        <input type="number" name="unitCount" value={formData.unitCount} onChange={handleInputChange} disabled={isFormDisabled} className="border border-gray-300 rounded px-3 py-1.5 text-sm w-32 focus:ring-emerald-500 shadow-sm text-right" required />
                        <span className="text-xs text-gray-500">(Put No of Tablet in 1 Box)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-4 bg-gray-50 p-4 border-t border-gray-200 justify-center">
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#2d6a36] text-white text-sm font-semibold rounded hover:bg-[#1a4a22] transition shadow">
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setActiveTab('list')} className="px-6 py-2 bg-gray-500 text-white text-sm font-semibold rounded hover:bg-gray-600 transition shadow">
                      Cancel
                    </button>
                    <button type="button" onClick={handleClear} className="px-6 py-2 bg-slate-700 text-white text-sm font-semibold rounded hover:bg-slate-800 transition shadow">
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default LocalItemsPage;
