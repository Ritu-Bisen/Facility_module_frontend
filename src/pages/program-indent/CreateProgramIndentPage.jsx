import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import api from '../../api/axios';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  FolderPlusIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function CreateProgramIndentPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // If present, edit mode

  // Header State
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('');
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  
  const [headerData, setHeaderData] = useState({
    indentId: 0,
    indentNo: 'AUTO GENERATED',
    indentDate: new Date().toLocaleDateString('en-GB'),
    status: 'I',
    programId: 0,
    programName: '',
    exists: false
  });

  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [headerLoading, setHeaderLoading] = useState(false);

  // Items State (Row-based)
  const [programItems, setProgramItems] = useState([]);
  const [rowQuantities, setRowQuantities] = useState({}); // { [itemId]: qty }
  const [savedItemsMap, setSavedItemsMap] = useState({}); // { [itemId]: anualIndentId }
  const [itemsLoading, setItemsLoading] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1. Initial Load: Programs & Financial Years
  useEffect(() => {
    const initData = async () => {
      try {
        const [fyRes, progRes] = await Promise.all([
          api.get('/program-indent/fin-years'),
          api.get('/program-indent/programs')
        ]);

        if (fyRes.data && fyRes.data.success) {
          const list = fyRes.data.data || [];
          setFinYears(list);
          const current = list.find(y => y.isCurrent) || list[0];
          if (current) setSelectedFinYear(String(current.accYrSetId));
        }

        if (progRes.data && progRes.data.success) {
          setPrograms(progRes.data.data || []);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };
    initData();
  }, []);

  // 2. Fetch Items list for selected program
  useEffect(() => {
    const fetchProgramItems = async () => {
      if (!selectedProgram) {
        setProgramItems([]);
        return;
      }
      setItemsLoading(true);
      try {
        const res = await api.get(`/program-indent/items-dropdown?programId=${selectedProgram}`);
        if (res.data && res.data.success) {
          setProgramItems(res.data.data || []);
        } else {
          setProgramItems([]);
        }
      } catch (err) {
        console.error('Error fetching items for selected program:', err);
        setProgramItems([]);
      } finally {
        setItemsLoading(false);
      }
    };
    fetchProgramItems();
  }, [selectedProgram]);

  // 3. Load Header & Saved Items if Editing existing indent or after generation
  useEffect(() => {
    if (id && Number(id) > 0) {
      fetchHeader(Number(id));
      fetchSavedItems(Number(id));
    }
  }, [id]);

  const fetchHeader = async (indentId) => {
    setHeaderLoading(true);
    try {
      const res = await api.get(`/program-indent/header?indentId=${indentId}`);
      if (res.data && res.data.success) {
        const h = res.data.data;
        setHeaderData(h);
        if (h.programId) setSelectedProgram(String(h.programId));
      }
    } catch (err) {
      console.error('Error fetching header:', err);
    } finally {
      setHeaderLoading(false);
    }
  };

  const fetchSavedItems = async (indentId) => {
    if (!indentId) return;
    try {
      const res = await api.get(`/program-indent/items?indentId=${indentId}`);
      if (res.data && res.data.success) {
        const savedList = res.data.data || [];
        const qtyMap = {};
        const savedMap = {};
        savedList.forEach(item => {
          if (item.itemId) {
            qtyMap[item.itemId] = String(item.qty);
            savedMap[item.itemId] = item.anualIndentId;
          }
        });
        setRowQuantities(qtyMap);
        setSavedItemsMap(savedMap);
      }
    } catch (err) {
      console.error('Error fetching saved items:', err);
    }
  };

  // Header Action: Generate Header
  const handleGenerateHeader = async () => {
    if (!selectedProgram) {
      setMessage({ type: 'error', text: 'Please select a Program before generating the indent.' });
      return;
    }

    setHeaderLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/program-indent/generate-header', {
        finYearId: selectedFinYear,
        programId: selectedProgram
      });

      if (res.data && res.data.success) {
        const createdHeader = res.data.data;
        setHeaderData(createdHeader);
        setIsHeaderEditing(false);
        setMessage({ type: 'success', text: 'Indent header generated successfully! Program items loaded below.' });
        fetchSavedItems(createdHeader.indentId);
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Failed to generate header.' });
      }
    } catch (err) {
      console.error('Generate header error:', err);
      setMessage({ type: 'error', text: 'Error generating header.' });
    } finally {
      setHeaderLoading(false);
    }
  };

  // Header Action: Save Header Updates
  const handleSaveHeader = async () => {
    if (!selectedProgram) {
      setMessage({ type: 'error', text: 'Please select a Program.' });
      return;
    }

    setHeaderLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put('/program-indent/update-header', {
        indentId: headerData.indentId,
        programId: selectedProgram,
        finYearId: selectedFinYear
      });

      if (res.data && res.data.success) {
        setIsHeaderEditing(false);
        setMessage({ type: 'success', text: 'Indent header updated successfully!' });
        fetchHeader(headerData.indentId);
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Failed to update header.' });
      }
    } catch (err) {
      console.error('Update header error:', err);
      setMessage({ type: 'error', text: 'Error updating header.' });
    } finally {
      setHeaderLoading(false);
    }
  };

  // Header Action: Delete Indent Header & Items
  const handleDeleteHeader = async () => {
    if (!window.confirm('Are you sure you want to delete this complete indent? All items will be removed.')) {
      return;
    }

    setHeaderLoading(true);
    try {
      const res = await api.delete(`/program-indent/header/${headerData.indentId}`);
      if (res.data && res.data.success) {
        navigate('/program-indent/list');
      } else {
        alert(res.data?.message || 'Failed to delete indent');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting indent');
    } finally {
      setHeaderLoading(false);
    }
  };

  // Quantity Change Handler
  const handleQtyChange = (itemId, val) => {
    setRowQuantities(prev => ({
      ...prev,
      [itemId]: val
    }));
  };

  // Delete Single Saved Item Row
  const handleDeleteSavedRow = async (itemId) => {
    const anualIndentId = savedItemsMap[itemId];
    if (!anualIndentId) return;
    if (!window.confirm('Are you sure you want to remove this saved item?')) return;

    setSavingItems(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.delete(`/program-indent/item/${anualIndentId}`);
      if (res.data && res.data.success) {
        setMessage({ type: 'success', text: 'Item removed successfully!' });
        setRowQuantities(prev => {
          const copy = { ...prev };
          delete copy[itemId];
          return copy;
        });
        fetchSavedItems(headerData.indentId);
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Failed to delete item.' });
      }
    } catch (err) {
      console.error('Delete item error:', err);
      setMessage({ type: 'error', text: 'Error deleting item.' });
    } finally {
      setSavingItems(false);
    }
  };

  // Save Single Row Item
  const handleSaveSingleRow = async (itemId) => {
    const rawVal = rowQuantities[itemId];
    if (rawVal === undefined || rawVal === '' || Number(rawVal) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity greater than 0 before saving this item.' });
      return;
    }
    const qty = Number(rawVal);

    setSavingItems(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/program-indent/save-item', {
        finYearId: selectedFinYear,
        indentId: headerData.indentId,
        itemId: itemId,
        qty: qty
      });

      if (res.data && res.data.success) {
        setMessage({ type: 'success', text: 'Item quantity saved successfully!' });
        fetchSavedItems(headerData.indentId);
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Failed to save item.' });
      }
    } catch (err) {
      console.error('Save item error:', err);
      setMessage({ type: 'error', text: 'Error saving item.' });
    } finally {
      setSavingItems(false);
    }
  };

  // Finalize Action: Complete / Freeze Indent
  const handleFreezeIndent = async () => {
    // Check if any saved items exist with quantity > 0
    const savedKeys = Object.keys(savedItemsMap);
    if (savedKeys.length === 0) {
      setMessage({ type: 'error', text: 'Cannot freeze indent without entering item quantity. Please enter and save quantity for at least one item first.' });
      return;
    }

    if (!window.confirm('Are you sure you want to finalize & complete this Program Indent? Once completed, modifications will be locked.')) {
      return;
    }

    setHeaderLoading(true);
    try {
      const res = await api.post('/program-indent/freeze', { indentId: headerData.indentId });
      if (res.data && res.data.success) {
        setMessage({ type: 'success', text: 'Program Indent finalized and completed successfully!' });
        fetchHeader(headerData.indentId);
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Failed to complete indent.' });
      }
    } catch (err) {
      console.error('Freeze error:', err);
      setMessage({ type: 'error', text: 'Error completing indent.' });
    } finally {
      setHeaderLoading(false);
    }
  };

  const isCompleted = headerData.status === 'Completed' || headerData.status === 'C';
  const isIncomplete = !isCompleted;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* Top Banner / Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate('/program-indent/list')}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-900 hover:text-blue-700 bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Back to Program Indent List</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">Status:</span>
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                      <ClockIcon className="w-4 h-4 text-red-600" />
                      Incomplete
                    </span>
                  )}
                </div>
              </div>

              {/* Notification Message */}
              {message.text && (
                <div className={`p-4 rounded-xl text-sm flex items-center gap-3 border shadow-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className="font-medium">{message.text}</span>
                </div>
              )}

              {/* Header Details Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderPlusIcon className="w-5 h-5 text-blue-200" />
                    <h2 className="text-lg font-bold">Program Indent Header Details</h2>
                  </div>
                  {headerData.exists && (
                    <span className="text-xs bg-blue-800/80 px-3 py-1 rounded-md text-blue-100 font-mono">
                      Indent ID: {headerData.indentId}
                    </span>
                  )}
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-12 items-end gap-4">
                  {/* Financial Year */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Financial Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedFinYear}
                      onChange={(e) => setSelectedFinYear(e.target.value)}
                      disabled={headerData.exists && !isHeaderEditing}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-700"
                    >
                      {finYears.map(fy => (
                        <option key={fy.accYrSetId} value={fy.accYrSetId}>
                          {fy.accYear} {fy.isCurrent ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Indent Number */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Indent Number
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={headerData.indentNo}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 font-semibold text-blue-900 outline-none"
                    />
                  </div>

                  {/* Indent Date */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Indent Date
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={headerData.indentDate}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800 outline-none"
                    />
                  </div>

                  {/* Program Selection */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Program <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      disabled={headerData.exists && !isHeaderEditing}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-700"
                    >
                      <option value="">-- Select Program --</option>
                      {programs.map(p => (
                        <option key={p.programId} value={p.programId}>
                          {p.programName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="md:col-span-3 flex items-center justify-end gap-2 pb-0.5">
                    {!headerData.exists ? (
                      <button
                        onClick={handleGenerateHeader}
                        disabled={headerLoading}
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <FolderPlusIcon className="w-5 h-5" />
                        <span>{headerLoading ? 'Generating...' : 'Generate Header'}</span>
                      </button>
                    ) : isCompleted ? (
                      <span className="text-xs text-gray-500 italic">Indent completed & locked.</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2 w-full">
                        {isHeaderEditing ? (
                          <>
                            <button
                              onClick={handleSaveHeader}
                              disabled={headerLoading}
                              className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-2 rounded-lg text-sm transition-colors shadow-sm"
                            >
                              <DocumentCheckIcon className="w-4 h-4" />
                              <span>Save Header</span>
                            </button>
                            <button
                              onClick={() => setIsHeaderEditing(false)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-3 py-2 rounded-lg text-sm transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setIsHeaderEditing(true)}
                              className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-2 rounded-lg text-sm transition-colors shadow-sm"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                              <span>Edit Header</span>
                            </button>
                            <button
                              onClick={handleDeleteHeader}
                              disabled={headerLoading}
                              className="inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-2 rounded-lg text-sm transition-colors shadow-sm"
                            >
                              <TrashIcon className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Program Items Table - Displayed directly as Rows (No Dropdown) */}
              {headerData.exists && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Program Item Details</h2>
                      <p className="text-blue-200 text-xs mt-0.5">Enter quantity and click Save for each item line</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                      <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3 text-center w-12">#</th>
                          <th className="px-4 py-3">Item Code</th>
                          <th className="px-4 py-3">Item Name</th>
                          <th className="px-4 py-3">Strength</th>
                          <th className="px-4 py-3">Unit</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3 text-center w-36">Quantity *</th>
                          {isIncomplete && <th className="px-4 py-3 text-center w-28">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {itemsLoading ? (
                          <tr>
                            <td colSpan={isIncomplete ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                              Loading program items...
                            </td>
                          </tr>
                        ) : programItems.length === 0 ? (
                          <tr>
                            <td colSpan={isIncomplete ? 8 : 7} className="px-4 py-8 text-center text-gray-500 font-medium">
                              No items found for the selected program.
                            </td>
                          </tr>
                        ) : (
                          programItems.map((item, index) => {
                            const isSaved = !!savedItemsMap[item.itemId];

                            return (
                              <tr key={item.itemId} className={`hover:bg-blue-50/50 transition-colors ${isSaved ? 'bg-emerald-50/30' : ''}`}>
                                <td className="px-4 py-3 text-center text-gray-500 font-medium">{index + 1}</td>
                                <td className="px-4 py-3 font-mono font-semibold text-blue-900">{item.itemCode}</td>
                                <td className="px-4 py-3 text-gray-900 font-medium">{item.itemName}</td>
                                <td className="px-4 py-3 text-gray-600">{item.strength || '-'}</td>
                                <td className="px-4 py-3 text-gray-600">{item.unit || '-'}</td>
                                <td className="px-4 py-3 text-gray-600 text-xs font-semibold">{item.categoryName || item.mCategory || '-'}</td>
                                <td className="px-4 py-3 text-center">
                                  {isIncomplete ? (
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder="Qty"
                                      value={rowQuantities[item.itemId] !== undefined ? rowQuantities[item.itemId] : ''}
                                      onChange={(e) => handleQtyChange(item.itemId, e.target.value)}
                                      className="w-28 border border-gray-300 rounded-md px-3 py-1.5 text-center font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                  ) : (
                                    <span className="font-bold text-gray-900">{rowQuantities[item.itemId] || 0}</span>
                                  )}
                                </td>
                                {isIncomplete && (
                                  <td className="px-4 py-3 text-center">
                                    {isSaved ? (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => handleSaveSingleRow(item.itemId)}
                                          disabled={savingItems}
                                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm"
                                          title="Update Quantity"
                                        >
                                          Update
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSavedRow(item.itemId)}
                                          disabled={savingItems}
                                          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm"
                                          title="Delete Saved Item"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleSaveSingleRow(item.itemId)}
                                        disabled={savingItems}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm"
                                        title="Save Item Quantity"
                                      >
                                        Save
                                      </button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Finalize Button Footer */}
                  {isIncomplete && programItems.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end">
                      <button
                        onClick={handleFreezeIndent}
                        disabled={headerLoading}
                        className="inline-flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <DocumentCheckIcon className="w-5 h-5" />
                        <span>Freeze / Complete Indent</span>
                      </button>
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

