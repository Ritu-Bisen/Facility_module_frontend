import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

export default function StockRegisterPage() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Default from date: 01-APR of current or previous year depending on current month
  const getDefaultFromDate = () => {
    const today = new Date();
    const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    return `${year}-04-01`;
  };
  
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/items/drugs');
      setItems(response.data || []);
    } catch (err) {
      console.error('Error fetching items:', err);
      toast.error('Failed to load items list');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    let currentItemId = selectedItem;
    
    // Auto-resolve item if user typed a valid code/name but didn't click the dropdown
    if (!currentItemId && searchTerm) {
      const match = items.find(item => 
        `${item.itemcode} - ${item.itemname}`.toLowerCase() === searchTerm.toLowerCase() || 
        item.itemcode.toLowerCase() === searchTerm.trim().toLowerCase()
      );
      if (match) {
        currentItemId = match.itemid.toString();
        setSelectedItem(currentItemId);
        setSearchTerm(`${match.itemcode} - ${match.itemname}`);
      }
    }

    if (!currentItemId) {
      toast.error('Please select a valid item from the dropdown.');
      // Fallback in case toast isn't configured at the root level
      if (typeof window !== 'undefined') window.alert('Please select a valid item from the dropdown.');
      return;
    }
    
    if (!fromDate) {
      toast.error('Please select a from date');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await api.get('/stock-register/data', {
        params: {
          itemId: currentItemId,
          fromDate: fromDate
        }
      });
      setData(response.data || []);
    } catch (err) {
      console.error('Error fetching stock register:', err);
      toast.error('Error loading stock register data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto py-6 px-4 md:px-8 flex flex-col w-full">
            
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pb-10">
              
              {/* Header & Filter Card */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 p-6 w-full flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Stock Register</h1>
                  <p className="text-sm text-slate-500 font-medium mt-1">View comprehensive item transaction history</p>
                </div>
                
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  
                  <div className="flex-1 w-full flex flex-col gap-1.5 relative">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Item</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                          // Clear selection if they start typing to force a new selection
                          if (selectedItem) setSelectedItem(''); 
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        onClick={() => setIsDropdownOpen(true)}
                        onBlur={() => {
                          // Delay hiding so clicks register
                          setTimeout(() => setIsDropdownOpen(false), 200);
                        }}
                        placeholder="Search by code or name..."
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg pl-3 pr-16 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm font-medium"
                        required={!selectedItem} // Force selection if empty
                      />
                      {/* Clear Button */}
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedItem('');
                            setIsDropdownOpen(true);
                          }}
                          className="absolute right-8 top-2.5 p-0.5 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
                          title="Clear selection"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      )}
                      {/* Dropdown Toggle Chevron */}
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="absolute right-2 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                      >
                        <svg className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                    </div>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute z-50 top-[70px] left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {items.filter(item => `${item.itemcode} ${item.itemname}`.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                          items
                            .filter(item => `${item.itemcode} ${item.itemname}`.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(item => (
                              <div 
                                key={item.itemid}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm font-medium text-slate-700 border-b border-slate-50 last:border-0"
                                onClick={() => {
                                  setSelectedItem(item.itemid.toString());
                                  setSearchTerm(`${item.itemcode} - ${item.itemname}`);
                                  setIsDropdownOpen(false);
                                }}
                              >
                                <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded mr-2 text-slate-500 border border-slate-200">{item.itemcode}</span>
                                {item.itemname}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500 italic">No items found matching "{searchTerm}"</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 md:max-w-[250px] w-full flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">From Date</label>
                    <input 
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm font-medium"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-8 rounded-lg shadow-md shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 h-[42px] flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      'Search'
                    )}
                  </button>

                </form>
              </div>

              {/* Data Table */}
              {hasSearched && (
                <div className={`w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                  {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-1">No transactions found</h3>
                      <p className="text-slate-500 text-sm max-w-sm">There is no stock movement data available for this item in the selected date range.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-sm font-semibold tracking-wide">
                            <th className="px-4 py-4 w-16 text-center border-r border-slate-200">S.No</th>
                            <th className="px-4 py-4 border-r border-slate-200">Opening</th>
                            <th className="px-4 py-4 border-r border-slate-200">Date</th>
                            <th className="px-4 py-4 border-r border-slate-200">Particular</th>
                            <th className="px-4 py-4 border-r border-slate-200">Voucher No</th>
                            <th className="px-4 py-4 border-r border-slate-200">ReceivedQTY</th>
                            <th className="px-4 py-4 border-r border-slate-200">ConsumptionQTY</th>
                            <th className="px-4 py-4">Closing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm">
                          {(() => {
                            let runningClosing = 0;
                            return data.map((row, index) => {
                              // Ensure uppercase keys since Oracle returns uppercase by default
                              const type1 = row.TYPE1 ?? row.type1;
                              const type = row.TYPE ?? row.type;
                              const trandate = row.TRANDATE ?? row.trandate;
                              const qty = Number(row.QTY ?? row.qty ?? 0);
                              const tranno = row.TRANNO ?? row.tranno;
                              
                              let opening = runningClosing;
                              let received = 0;
                              let consumption = 0;
                              let closing = 0;

                              if (type1 === 0 || type === 'OP') {
                                // Opening balance row
                                opening = qty;
                                closing = qty;
                              } else if (type1 === 1 || type === 'Receipt') {
                                // Receipt row
                                received = qty;
                                closing = opening + received;
                              } else {
                                // Issue row (Type1 = 2)
                                consumption = qty;
                                closing = opening - consumption;
                              }

                              runningClosing = closing;

                              return (
                                <tr key={index} className="hover:bg-slate-50 transition-colors bg-white">
                                  <td className="px-4 py-3 text-center text-slate-600 border-r border-slate-200">{index + 1}</td>
                                  <td className="px-4 py-3 text-slate-800 border-r border-slate-200">{opening}</td>
                                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap border-r border-slate-200">{trandate}</td>
                                  <td className="px-4 py-3 text-slate-700 border-r border-slate-200">{type}</td>
                                  <td className="px-4 py-3 text-slate-700 border-r border-slate-200">{tranno}</td>
                                  <td className="px-4 py-3 text-slate-800 border-r border-slate-200">{received}</td>
                                  <td className="px-4 py-3 text-slate-800 border-r border-slate-200">{consumption}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-800">{closing}</td>
                                </tr>
                              );
                            });
                          })()}
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
