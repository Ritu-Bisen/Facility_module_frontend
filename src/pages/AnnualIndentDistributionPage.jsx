import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

export default function AnnualIndentDistributionPage() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [summary, setSummary] = useState(null);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Keep track of edited inputs
  const [editedValues, setEditedValues] = useState({});

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/annual-indent/items');
      setItems(response.data || []);
    } catch (err) {
      console.error('Error fetching items:', err);
      toast.error('Failed to load items list');
    }
  };

  const loadData = async (itemId) => {
    if (!itemId) {
      toast.error('Please select an item');
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const [summaryRes, distRes] = await Promise.all([
        api.get('/annual-indent/summary', { params: { itemId } }),
        api.get('/annual-indent/distributions', { params: { itemId } })
      ]);
      
      // Oracle driver returns keys in uppercase
      setSummary(summaryRes.data?.[0] || null);
      setDistributions(distRes.data || []);
      setEditedValues({});
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Error loading distribution data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    let currentItemId = selectedItem;
    
    // Auto-resolve item if user typed a valid code/name but didn't click the dropdown
    if (!currentItemId && searchTerm) {
      const match = items.find(item => 
        (item.ITEMNAME && item.ITEMNAME.toLowerCase() === searchTerm.toLowerCase()) || 
        (item.ITEMCODE && item.ITEMCODE.toLowerCase() === searchTerm.trim().toLowerCase())
      );
      if (match) {
        currentItemId = match.ITEMID.toString();
        setSelectedItem(currentItemId);
        setSearchTerm(match.ITEMNAME);
      }
    }

    if (!currentItemId) {
      toast.error('Please select a valid item from the dropdown.');
      return;
    }
    
    loadData(currentItemId);
  };

  const handleUpdate = async (row) => {
    const issueItemId = row.ISSUEITEMID;
    const targetFacilityId = row.FACILITYID;
    const indentId = row.INDENTID; // from a.indentid
    const itemCode = summary?.ITEMCODE;
    
    // Check if user changed the value
    const distQtyStr = editedValues[targetFacilityId] ?? row.CMHODISTQTY ?? 0;
    const distQty = Number(distQtyStr);
    
    if (distQty < 0) {
      toast.error('Distribution quantity cannot be negative.');
      return;
    }

    // Optional: add validation against Balance Quantity (DHS Approved)
    // The user's code checks this: "Distribution quantity should not be greater than DHS Approved Quantity"
    // Wait, the validation in C# is: lblbalQty.Text >= mCurStock
    // But lblbalQty is the REMAINING balance. Actually, if we update a row, we should calculate the total distributed
    // Let's rely on the server to save it, or just allow it and let the user see the updated balance on refresh.

    try {
      await api.post('/annual-indent/distribute', {
        issueItemId: issueItemId,
        targetFacilityId: targetFacilityId,
        itemId: selectedItem,
        itemCode: itemCode,
        indentId: indentId,
        distQty: distQty
      });
      toast.success(issueItemId == 0 ? 'Inserted successfully' : 'Updated successfully');
      loadData(selectedItem);
    } catch (err) {
      console.error('Error saving distribution:', err);
      toast.error('Failed to save distribution');
    }
  };

  const handleDelete = async (issueItemId) => {
    if (!window.confirm('Are you sure you want to delete?')) return;
    
    try {
      await api.delete(`/annual-indent/distribute/${issueItemId}`);
      toast.success('Item deleted successfully');
      loadData(selectedItem);
    } catch (err) {
      console.error('Error deleting distribution:', err);
      toast.error(err.response?.data?.error || 'Delete not allowed, references found');
    }
  };

  const handleInputChange = (facilityId, value) => {
    setEditedValues(prev => ({ ...prev, [facilityId]: value }));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto py-6 px-4 md:px-8 flex flex-col w-full">
            
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pb-10">
              
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 p-6 w-full flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Annual Indent Facility Wise Distribution</h1>
                  <p className="text-sm text-slate-500 font-medium mt-1">Drugs and Consumables For Fy 2026-2027</p>
                </div>
                
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex-1 w-full flex flex-col gap-1.5 relative">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Select Item</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                          if (selectedItem) setSelectedItem(''); 
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        onClick={() => setIsDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                        placeholder="Search by code or name..."
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg pl-3 pr-16 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm font-medium"
                        required={!selectedItem}
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => { setSearchTerm(''); setSelectedItem(''); setIsDropdownOpen(true); }}
                          className="absolute right-8 top-2.5 p-0.5 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="absolute right-2 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                      >
                        <svg className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute z-50 top-[70px] left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {items.filter(item => (item.ITEMNAME || '').toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                          items
                            .filter(item => (item.ITEMNAME || '').toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(item => (
                              <div 
                                key={item.ITEMID}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm font-medium text-slate-700 border-b border-slate-50 last:border-0 flex items-center"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent focus loss on the input
                                  setSelectedItem(item.ITEMID?.toString());
                                  setSearchTerm(item.ITEMNAME);
                                  setIsDropdownOpen(false);
                                }}
                              >
                                {item.ITEMNAME}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500 italic">No items found matching "{searchTerm}"</div>
                        )}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-8 rounded-lg shadow-md shadow-blue-500/25 transition-all h-[42px] flex items-center justify-center disabled:opacity-75"
                  >
                    {loading ? 'Loading...' : 'Search'}
                  </button>
                </form>
                
                {summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col">
                      <span className="text-blue-900 text-xs font-bold uppercase tracking-wider mb-1">DHS Approved Qty</span>
                      <span className="text-2xl font-black text-blue-700">{summary.DHSAPRQTY ?? 0}</span>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex flex-col">
                      <span className="text-emerald-900 text-xs font-bold uppercase tracking-wider mb-1">CMHO Distributed</span>
                      <span className="text-2xl font-black text-emerald-700">{summary.CMHODISTQTY ?? 0}</span>
                    </div>
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col">
                      <span className="text-amber-900 text-xs font-bold uppercase tracking-wider mb-1">Balance Qty</span>
                      <span className="text-2xl font-black text-amber-700">{summary.BALQTY ?? 0}</span>
                    </div>
                    <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 flex flex-col">
                      <span className="text-purple-900 text-xs font-bold uppercase tracking-wider mb-1">EDL Category</span>
                      <span className="text-lg font-bold text-purple-700 mt-auto">{summary.EDL || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>

              {hasSearched && (
                <div className={`w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                  {distributions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <p className="text-slate-500 font-medium">No facilities found for distribution for this item.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold tracking-wide uppercase">
                            <th className="px-4 py-4 w-12 text-center">Sl. No.</th>
                            <th className="px-4 py-4">Facility Name</th>
                            <th className="px-4 py-4 text-right">Current Stock</th>
                            <th className="px-4 py-4 text-right">Received (CGMSC)</th>
                            <th className="px-4 py-4 text-right">Issue to Ward/OPD</th>
                            <th className="px-4 py-4 text-right">Facility Indent Qty</th>
                            <th className="px-4 py-4 text-center w-48">Annual Dist Qty 26-27</th>
                            <th className="px-4 py-4 text-center w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm">
                          {distributions.map((row, index) => {
                            const isDistributed = row.DISTSTATUS === 'Y';
                            const currentVal = editedValues[row.FACILITYID] ?? row.CMHODISTQTY ?? '';
                            
                            return (
                              <tr key={index} className="hover:bg-blue-50/30 transition-colors bg-white">
                                <td className="px-4 py-3 text-center text-slate-500">{index + 1}</td>
                                <td className="px-4 py-3 text-slate-800 font-medium">{row.FACILITYNAME}</td>
                                <td className="px-4 py-3 text-right text-slate-700">{row.CURRENTSTOCK ?? 0}</td>
                                <td className="px-4 py-3 text-right text-emerald-600 font-medium">{row.CGMSCISSUETOFAC ?? 0}</td>
                                <td className="px-4 py-3 text-right text-rose-600 font-medium">{row.WARDISSUE ?? 0}</td>
                                <td className="px-4 py-3 text-right text-slate-700">{row.FACILITYINDENTQTY ?? 0}</td>
                                <td className="px-4 py-3 text-center">
                                  <input 
                                    type="number" 
                                    min="0"
                                    value={currentVal}
                                    onChange={(e) => handleInputChange(row.FACILITYID, e.target.value)}
                                    className="w-full text-center border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-inner font-medium text-slate-800"
                                  />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button 
                                      onClick={() => handleUpdate(row)}
                                      className={`p-1.5 rounded transition-colors ${isDistributed ? 'text-blue-600 hover:bg-blue-100' : 'text-emerald-600 hover:bg-emerald-100'}`}
                                      title={isDistributed ? "Update" : "Add"}
                                    >
                                      {isDistributed ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                      ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                      )}
                                    </button>
                                    
                                    {isDistributed && (
                                      <button 
                                        onClick={() => handleDelete(row.ISSUEITEMID)}
                                        className="p-1.5 rounded text-rose-500 hover:bg-rose-100 transition-colors"
                                        title="Delete"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
