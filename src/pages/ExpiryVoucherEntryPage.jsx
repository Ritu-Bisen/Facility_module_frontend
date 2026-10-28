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
  CheckIcon, 
  XMarkIcon, 
  ArrowPathIcon,
  CalendarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function ExpiryVoucherEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawIssueId = searchParams.get('IssueID') || searchParams.get('issueId') || '0';
  const mode = searchParams.get('Mode') || '';

  // Header State
  const [headerInfo, setHeaderInfo] = useState({
    issueId: rawIssueId === '0' && mode === 'Create' ? '0' : rawIssueId,
    issueNo: 'Auto generated',
    issueDate: '',
    issueType: 'EX',
    issueTypeDesc: 'Expired',
    status: 'IN',
    remarks: ''
  });

  const [isEditingHeader, setIsEditingHeader] = useState(rawIssueId === '0' || mode === 'Create');
  const [headerDate, setHeaderDate] = useState('');
  const [headerError, setHeaderError] = useState('');
  const [submittingHeader, setSubmittingHeader] = useState(false);

  // Items State
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [remarksMap, setRemarksMap] = useState({});

  // Bottom Buttons State
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const isCompleted = headerInfo.status === 'C';

  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = `${dd}-${mm}-${yyyy}`;
    setHeaderDate(todayStr);

    loadInitialData(todayStr);
  }, [rawIssueId]);

  const loadInitialData = async (todayStr) => {
    setPageLoading(true);
    try {
      if (rawIssueId && rawIssueId !== '0') {
        await fetchHeaderAndItems(rawIssueId);
      } else {
        setHeaderInfo({
          issueId: '0',
          issueNo: 'Auto generated',
          issueDate: todayStr,
          issueType: 'EX',
          issueTypeDesc: 'Expired',
          status: 'IN',
          remarks: ''
        });
        setIsEditingHeader(true);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchHeaderAndItems = async (issId) => {
    try {
      const resHeader = await api.get('/expiry-voucher/header', {
        params: { issueId: issId }
      });
      if (resHeader.data && resHeader.data.success) {
        const info = resHeader.data.data;
        setHeaderInfo(info);
        setHeaderDate(info.issueDate || '');
        setIsEditingHeader(false);

        await fetchItems(info.issueId);
      }
    } catch (err) {
      console.error('Error fetching header:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch voucher details');
    }
  };

  const fetchItems = async (issId) => {
    if (!issId || issId === '0') return;
    setItemsLoading(true);
    try {
      const res = await api.get('/expiry-voucher/items', {
        params: { issueId: issId }
      });
      if (res.data && res.data.success) {
        const list = res.data.data || [];
        setItems(list);
        const initialRemarks = {};
        list.forEach((item) => {
          initialRemarks[item.issueItemId] = item.remarks || '';
        });
        setRemarksMap(initialRemarks);
      }
    } catch (err) {
      console.error('Error fetching expired items:', err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleSaveHeader = async () => {
    setHeaderError('');
    if (!headerDate.trim()) {
      const msg = 'Reference Date is required.';
      setHeaderError(msg);
      toast.error(msg);
      return;
    }

    setSubmittingHeader(true);
    try {
      const res = await api.post('/expiry-voucher/save-header', {
        issueId: headerInfo.issueId || '0',
        issueDate: headerDate.trim()
      });

      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Saved successfully');
        const newId = res.data.data?.issueId;
        const newNo = res.data.data?.issueNo;

        setHeaderInfo((prev) => ({
          ...prev,
          issueId: newId,
          issueNo: newNo || prev.issueNo,
          issueDate: headerDate.trim()
        }));
        setIsEditingHeader(false);

        // Fetch populated expired items
        await fetchItems(newId);

        // Update URL query params if new voucher
        if (headerInfo.issueId === '0' || !headerInfo.issueId) {
          navigate(`/expiry-voucher/entry?IssueID=${encodeURIComponent(newId)}&Mode=Edit`, {
            replace: true
          });
        }
      }
    } catch (err) {
      console.error('Error saving header:', err);
      const msg = err.response?.data?.message || 'Failed to save header';
      setHeaderError(msg);
      toast.error(msg);
    } finally {
      setSubmittingHeader(false);
    }
  };

  const handleCancelHeader = () => {
    if (headerInfo.issueId !== '0') {
      setHeaderDate(headerInfo.issueDate || '');
      setIsEditingHeader(false);
      setHeaderError('');
    }
  };

  const handleRemarkChange = (issueItemId, value) => {
    setRemarksMap((prev) => ({
      ...prev,
      [issueItemId]: value
    }));
  };

  const handleComplete = async () => {
    if (!headerInfo.issueId || headerInfo.issueId === '0') {
      toast.error('Please save the Reference Date first.');
      return;
    }
    if (!window.confirm('Do you want to confirm the Expiry of the item?')) return;

    setCompleting(true);
    try {
      const res = await api.post('/expiry-voucher/complete', {
        issueId: headerInfo.issueId,
        remarksMap
      });
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Voucher completed successfully');
        setHeaderInfo((prev) => ({ ...prev, status: 'C' }));
        setTimeout(() => {
          navigate('/expiry-voucher');
        }, 800);
      }
    } catch (err) {
      console.error('Error completing voucher:', err);
      toast.error(err.response?.data?.message || 'Failed to complete voucher');
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!headerInfo.issueId || headerInfo.issueId === '0') return;
    if (!window.confirm('Do you want to delete this expired voucher?')) return;

    setDeleting(true);
    try {
      const res = await api.delete(`/expiry-voucher/${headerInfo.issueId}`);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Deleted successfully');
        navigate('/expiry-voucher');
      }
    } catch (err) {
      console.error('Error deleting voucher:', err);
      toast.error(err.response?.data?.message || 'References found and cannot be deleted.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f4f7f6]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-4">

              {/* Title Bar in Theme Blue */}
              <div className="bg-[#1e40af] py-2.5 px-4 rounded text-center shadow-xs">
                <h1 className="text-sm md:text-base font-bold text-white tracking-wide">
                  Expired
                </h1>
              </div>

              {/* Back Button Link (Matching Legacy Top-Right Navigation) */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => navigate('/expiry-voucher')}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded border border-blue-200 transition-colors shadow-2xs"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  <span>Back to Expire Items List</span>
                </button>

                {isCompleted && (
                  <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded border border-blue-300">
                    Status: Complete
                  </span>
                )}
              </div>

              {/* Header Box (pnlHeader2 / pnlEdit / pnlView) */}
              <div className="bg-white rounded-md border border-gray-300 shadow-xs p-4">
                {headerError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-300 rounded text-red-700 text-xs flex items-center space-x-2">
                    <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{headerError}</span>
                  </div>
                )}

                {isEditingHeader ? (
                  /* Edit Header Form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center max-w-3xl mx-auto text-xs">
                      {/* Issue Type */}
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-gray-700 w-24">Issue Type:</label>
                        <select
                          disabled
                          value="EX"
                          className="px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 text-gray-700 font-bold"
                        >
                          <option value="EX">Expired</option>
                        </select>
                      </div>

                      {/* Reference No */}
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-gray-700 w-28">Reference No:</label>
                        <span className="font-bold text-gray-900">
                          {headerInfo.issueNo || 'Auto generated'}
                        </span>
                      </div>

                      {/* Reference Date */}
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-gray-700 w-28">Reference Date:</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={headerDate}
                            onChange={(e) => {
                              setHeaderDate(e.target.value);
                              if (headerError) setHeaderError('');
                            }}
                            placeholder="DD-MM-YYYY"
                            className="w-28 px-2 py-1 text-xs border border-blue-600 rounded bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleSaveHeader}
                        disabled={submittingHeader}
                        className="inline-flex items-center px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition-colors focus:outline-none disabled:opacity-50"
                      >
                        {submittingHeader && (
                          <ArrowPathIcon className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        )}
                        <span>{submittingHeader ? 'Saving...' : 'Save'}</span>
                      </button>

                      {headerInfo.issueId !== '0' && (
                        <button
                          onClick={handleCancelHeader}
                          disabled={submittingHeader}
                          className="px-5 py-1.5 bg-gray-500 hover:bg-gray-600 text-white font-bold text-xs rounded shadow-xs transition-colors focus:outline-none disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* View Header Panel */
                  <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div>
                        <span className="text-gray-600">Issue Type: </span>
                        <span className="font-bold text-gray-900">Expired</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reference No: </span>
                        <span className="font-bold text-blue-900">{headerInfo.issueNo}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reference Date: </span>
                        <span className="font-bold text-gray-900">{headerInfo.issueDate || headerDate}</span>
                      </div>
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => setIsEditingHeader(true)}
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors focus:outline-none"
                        title="Edit Reference Date"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Tabs Section */}
              <div className={`bg-white rounded-md border border-gray-300 shadow-xs overflow-hidden ${
                headerInfo.issueId === '0' || isEditingHeader ? 'opacity-60 pointer-events-none' : ''
              }`}>
                {/* Tab Header */}
                <div className="flex border-b border-gray-300 bg-gray-100 px-3 pt-2">
                  <div className="px-4 py-1.5 text-xs font-bold rounded-t bg-white text-blue-900 border border-blue-600 border-b-white -mb-px">
                    Expired Items
                  </div>
                </div>

                {/* Tab Content: Expired Items Grid (gvItemLst) */}
                <div className="p-3 space-y-4">
                  <div className="overflow-x-auto relative min-h-[140px]">
                    {/* Loading circle overlay */}
                    {itemsLoading && (
                      <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[0.5px] flex flex-col items-center justify-center gap-2">
                        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="text-xs font-semibold text-blue-900 bg-white/90 px-3 py-1 rounded shadow-xs border border-blue-200">
                          Loading expired items...
                        </span>
                      </div>
                    )}

                    <table className="w-full text-xs text-left border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-[#1e40af] text-white">
                          <th className="py-2 px-2 text-center font-bold border border-blue-900 w-12">
                            Sl. No.
                          </th>
                          <th className="py-2 px-3 text-center font-bold border border-blue-900">
                            Item code &amp; description
                          </th>
                          <th className="py-2 px-3 text-center font-bold border border-blue-900 w-32">
                            Batch No.
                          </th>
                          <th className="py-2 px-2 text-center font-bold border border-blue-900 w-28">
                            Mfg date
                          </th>
                          <th className="py-2 px-2 text-center font-bold border border-blue-900 w-28">
                            Exp Date
                          </th>
                          <th className="py-2 px-3 text-center font-bold border border-blue-900 w-28">
                            Expired Qty
                          </th>
                          <th className="py-2 px-3 text-center font-bold border border-blue-900 w-64">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-gray-500">
                              {itemsLoading ? 'Loading items...' : 'No expired items found for the selected date.'}
                            </td>
                          </tr>
                        ) : (
                          items.map((item, idx) => (
                            <tr key={`${item.issueItemId}_${item.inwNo}`} className="hover:bg-blue-50/30">
                              <td className="py-2 px-2 text-center font-semibold text-gray-700 border border-gray-300">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 border border-gray-300">
                                <div className="font-bold text-gray-900">
                                  {item.itemCode} - {item.itemName}
                                </div>
                                {item.strength && (
                                  <div className="text-[10px] text-gray-600 mt-0.5">
                                    Strength: <b>{item.strength}</b>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-gray-800 border border-gray-300">
                                {item.batchNo}
                              </td>
                              <td className="py-2 px-2 text-center text-gray-700 border border-gray-300">
                                {item.mfgDate}
                              </td>
                              <td className="py-2 px-2 text-center text-gray-700 border border-gray-300">
                                {item.expDate}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-gray-900 border border-gray-300">
                                {item.expiredQty}
                              </td>
                              <td className="py-2 px-3 border border-gray-300">
                                <input
                                  type="text"
                                  value={remarksMap[item.issueItemId] !== undefined ? remarksMap[item.issueItemId] : (item.remarks || '')}
                                  onChange={(e) => handleRemarkChange(item.issueItemId, e.target.value)}
                                  disabled={isCompleted}
                                  placeholder="Enter remarks..."
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-gray-100"
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Action Buttons: Complete & Delete */}
                  {!isCompleted && items.length > 0 && (
                    <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-200">
                      <button
                        onClick={handleComplete}
                        disabled={completing || deleting}
                        className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition-colors focus:outline-none disabled:opacity-50"
                      >
                        {completing && (
                          <ArrowPathIcon className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        )}
                        <span>{completing ? 'Completing...' : 'Complete'}</span>
                      </button>

                      <button
                        onClick={handleDelete}
                        disabled={completing || deleting}
                        className="inline-flex items-center px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded shadow-xs transition-colors focus:outline-none disabled:opacity-50"
                      >
                        {deleting && (
                          <ArrowPathIcon className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        )}
                        <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                      </button>
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
