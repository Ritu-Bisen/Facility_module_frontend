import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getFinYears, 
  getTendersList, 
  createTender, 
  updateTender, 
  deleteTender 
} from '../../api/contractApi';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// ... (skip lines logic if needed, but I'll replace the full layout block instead)

const TenderEntryPage = () => {
  const navigate = useNavigate();
  
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('');
  
  const [tenders, setTenders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit/Add State
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editFormData, setEditFormData] = useState({
    tenderNo: '',
    tenderDetails: '',
    tenderDate: '',
    accyrsetid: '',
    termCondition: '',
    type: 'T'
  });

  useEffect(() => {
    fetchFinYears();
  }, []);

  useEffect(() => {
    if (selectedFinYear) {
      fetchTenders();
    } else {
      setTenders([]);
    }
  }, [selectedFinYear]);

  const fetchFinYears = async () => {
    try {
      const data = await getFinYears();
      setFinYears(data);
      if (data.length > 0) {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        
        let currentFinYearStr;
        if (month >= 4) {
          currentFinYearStr = `${year}-${year + 1}`;
        } else {
          currentFinYearStr = `${year - 1}-${year}`;
        }
        
        const currentYearObj = data.find(fy => fy.name === currentFinYearStr);
        if (currentYearObj) {
          setSelectedFinYear(currentYearObj.id.toString());
        } else {
          setSelectedFinYear(data[0].id.toString());
        }
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching fin years', err);
      setIsLoading(false);
    }
  };

  const fetchTenders = async () => {
    setIsLoading(true);
    try {
      const data = await getTendersList(selectedFinYear);
      setTenders(data);
    } catch (err) {
      console.error('Error fetching tenders list', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditFormData({
      tenderNo: '',
      tenderDetails: '',
      tenderDate: '',
      accyrsetid: selectedFinYear,
      termCondition: '',
      type: 'T'
    });
  };

  const handleEdit = (tender) => {
    setIsAdding(false);
    setEditingId(tender.id);
    setEditFormData({
      tenderNo: tender.tenderNo || '',
      tenderDetails: tender.tenderDetails || '',
      tenderDate: tender.tenderDate ? tender.tenderDate.substring(0, 10) : '',
      accyrsetid: tender.accyrsetid || selectedFinYear,
      termCondition: tender.termCondition || '',
      type: tender.type || 'T'
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      if (!editFormData.tenderNo || !editFormData.tenderDetails || !editFormData.tenderDate) {
        alert('Please fill out all required fields.');
        return;
      }

      if (isAdding) {
        await createTender(editFormData);
      } else {
        await updateTender(editingId, editFormData);
      }
      
      setIsAdding(false);
      setEditingId(null);
      fetchTenders();
    } catch (err) {
      console.error('Error saving tender', err);
      alert('Failed to save tender');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tender?')) {
      try {
        await deleteTender(id);
        fetchTenders();
      } catch (err) {
        console.error('Error deleting tender', err);
        alert('Failed to delete tender');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4">
            <div className="w-full flex flex-col min-h-full shadow-sm border border-slate-200/60 rounded-xl overflow-hidden">
            
            {/* Header Section */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Tender/Quotation Entry</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Manage local purchase tenders and quotations</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700">Fin Year:</label>
                  <select 
                    className="w-40 border-slate-200 shadow-sm rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all py-1.5"
                    value={selectedFinYear}
                    onChange={(e) => setSelectedFinYear(e.target.value)}
                  >
                    {finYears.map(fy => (
                      <option key={fy.id} value={fy.id}>{fy.name}</option>
                    ))}
                  </select>
                </div>

                {!isAdding && !editingId && (
                  <button 
                    onClick={handleAddNew}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm hover:shadow active:scale-95"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add new
                  </button>
                )}
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-white flex-1 flex flex-col overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

              {/* Grid */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0f172a] text-slate-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-2 py-3 font-semibold w-12 text-center tracking-wide text-[11px] uppercase">Sl.No</th>
                      <th className="px-2 py-3 font-semibold tracking-wide text-[11px] uppercase">Tender/Quotation No</th>
                      <th className="px-2 py-3 font-semibold tracking-wide text-[11px] uppercase w-28">Type</th>
                      <th className="px-2 py-3 font-semibold tracking-wide text-[11px] uppercase">Tender/Quotation Details</th>
                      <th className="px-2 py-3 font-semibold tracking-wide text-[11px] uppercase w-36">Tender Date</th>
                      <th className="px-2 py-3 font-semibold tracking-wide text-[11px] uppercase w-28">Fin Year</th>
                      <th className="px-2 py-3 font-semibold tracking-wide text-[11px] uppercase w-1/4">Terms and Condition</th>
                      <th className="px-2 py-3 font-semibold text-center w-28 tracking-wide text-[11px] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    
                    {isLoading ? (
                      <tr>
                        <td colSpan="7" className="px-2 py-12 text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </td>
                      </tr>
                    ) : tenders.length === 0 && !isAdding ? (
                      <tr>
                        <td colSpan="7" className="px-2 py-12 text-center">
                          <div className="text-slate-400 mb-2">
                            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-slate-500 font-medium">No Tenders/Quotations found for the selected Financial Year.</p>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {/* Add Row (Moved to Top) */}
                        {isAdding && (
                          <tr className="bg-blue-50/30">
                            <td className="px-2 py-2 text-center text-slate-400 font-medium">-</td>
                            <td className="px-2 py-2">
                              <input type="text" name="tenderNo" value={editFormData.tenderNo} onChange={handleInputChange} autoComplete="off" className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="Tender No" />
                            </td>
                            <td className="px-2 py-2">
                              <select name="type" value={editFormData.type} onChange={handleInputChange} className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                <option value="T">Tender</option>
                                <option value="Q">Quotation</option>
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <input type="text" name="tenderDetails" value={editFormData.tenderDetails} onChange={handleInputChange} autoComplete="off" className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="Details" />
                            </td>
                            <td className="px-2 py-2">
                              <input type="date" name="tenderDate" value={editFormData.tenderDate} onChange={handleInputChange} className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                            </td>
                            <td className="px-2 py-2">
                              <select name="accyrsetid" value={editFormData.accyrsetid} onChange={handleInputChange} className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                {finYears.map(fy => <option key={fy.id} value={fy.id}>{fy.name}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <input type="text" name="termCondition" value={editFormData.termCondition} onChange={handleInputChange} autoComplete="off" className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" placeholder="Terms" />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={handleSave} className="flex items-center gap-1 text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded shadow-sm transition-colors active:scale-95 text-[11px] font-semibold" title="Save">
                                  <CheckIcon className="w-3.5 h-3.5 stroke-2" /> Save
                                </button>
                                <button onClick={handleCancel} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded shadow-sm transition-colors active:scale-95 text-[11px] font-semibold" title="Cancel">
                                  <XMarkIcon className="w-3.5 h-3.5 stroke-2" /> Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        
                        {tenders.map((tender, index) => {
                        const isEditing = editingId === tender.id;
                        
                        return (
                          <tr key={tender.id} className="hover:bg-blue-50/40 transition-colors group">
                            <td className="px-2 py-2.5 text-center font-medium text-slate-400">{index + 1}</td>
                            
                            {isEditing ? (
                              <>
                                <td className="px-2 py-2"><input type="text" name="tenderNo" value={editFormData.tenderNo} onChange={handleInputChange} autoComplete="off" className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" /></td>
                                <td className="px-2 py-2">
                                  <select name="type" value={editFormData.type} onChange={handleInputChange} className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                    <option value="T">Tender</option>
                                    <option value="Q">Quotation</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2"><input type="text" name="tenderDetails" value={editFormData.tenderDetails} onChange={handleInputChange} autoComplete="off" className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" /></td>
                                <td className="px-2 py-2"><input type="date" name="tenderDate" value={editFormData.tenderDate} onChange={handleInputChange} className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" /></td>
                                <td className="px-2 py-2">
                                  <select name="accyrsetid" value={editFormData.accyrsetid} onChange={handleInputChange} className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm">
                                    {finYears.map(fy => <option key={fy.id} value={fy.id}>{fy.name}</option>)}
                                  </select>
                                </td>
                                <td className="px-2 py-2"><input type="text" name="termCondition" value={editFormData.termCondition} onChange={handleInputChange} autoComplete="off" className="w-full text-xs border-slate-300 rounded-md py-1.5 px-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" /></td>
                                <td className="px-2 py-2 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button onClick={handleSave} className="text-white bg-blue-600 hover:bg-blue-700 p-1 rounded shadow-sm transition-colors active:scale-95" title="Update">
                                      <CheckIcon className="w-4 h-4 stroke-2" />
                                    </button>
                                    <button onClick={handleCancel} className="text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 p-1 rounded shadow-sm transition-colors active:scale-95" title="Cancel">
                                      <XMarkIcon className="w-4 h-4 stroke-2" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-2 py-2.5 font-semibold text-slate-700">{tender.tenderNo}</td>
                                <td className="px-2 py-2.5 text-center">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${tender.type === 'T' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                    {tender.type === 'T' ? 'Tender' : 'Quotation'}
                                  </span>
                                </td>
                                <td className="px-2 py-2.5">{tender.tenderDetails}</td>
                                <td className="px-2 py-2.5">{tender.tenderDate}</td>
                                <td className="px-2 py-2.5">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800">
                                    {tender.accyear}
                                  </span>
                                </td>
                                <td className="px-2 py-2.5">{tender.termCondition}</td>
                                <td className="px-2 py-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(tender)} className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors" title="Edit">
                                      <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(tender.id)} className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Delete">
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
    </div>
  );
};

export default TenderEntryPage;
