import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import axios from '../../api/axios';
import * as XLSX from 'xlsx';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

export default function DaoItemWiseAiPage() {
  const [finYears, setFinYears] = useState([]);
  const [selectedFinYear, setSelectedFinYear] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');

  const [itemList, setItemList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDropdowns() {
      setDropdownLoading(true);
      try {
        const [fyRes, catRes] = await Promise.all([
          axios.get('/annual-indent/upload-forward/fin-years'),
          axios.get('/annual-indent/categories')
        ]);

        if (fyRes.data?.success && Array.isArray(fyRes.data.data)) {
          setFinYears(fyRes.data.data);
          if (fyRes.data.data.length > 0) {
            const defaultFy = fyRes.data.data.find(fy => fy.isCurrent) || fyRes.data.data[0];
            setSelectedFinYear(String(defaultFy.accYrSetId));
          }
        }

        if (catRes.data?.success && Array.isArray(catRes.data.data)) {
          setCategories(catRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load dropdowns:', err);
      } finally {
        setDropdownLoading(false);
      }
    }

    loadDropdowns();
  }, []);

  const handleShow = async () => {
    if (!selectedFinYear) return;
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const res = await axios.get('/annual-indent/dao/item-wise-ai', {
        params: {
          finYearId: selectedFinYear,
          categoryId: selectedCategory
        }
      });
      if (res.data?.success) {
        setItemList(res.data.data || []);
      } else {
        setItemList([]);
      }
    } catch (err) {
      console.error('Failed to fetch item wise AI details:', err);
      setError('Failed to fetch item wise AI details. Please try again.');
      setItemList([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return itemList;
    const q = searchQuery.toLowerCase();
    return itemList.filter(item =>
      (item.itemCode || '').toLowerCase().includes(q) ||
      (item.itemName || '').toLowerCase().includes(q) ||
      (item.categoryName || '').toLowerCase().includes(q) ||
      (item.strength || '').toLowerCase().includes(q)
    );
  }, [itemList, searchQuery]);

  const exportToExcel = () => {
    if (filteredItems.length === 0) return;

    const dataToExport = filteredItems.map((r, index) => ({
      'SL No': index + 1,
      'Category': r.categoryName || '',
      'Item Code': r.itemCode || '',
      'Item Name': r.itemName || '',
      'Strength': r.strength || '',
      'Facility Indent Qty': Number(r.facilityIndentQty || 0),
      'DAO Approved Qty': Number(r.daoApprovedQty || 0)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DrugWiseAIReport');

    // Auto-fit column width
    const colWidths = [
      { wch: 8 },
      { wch: 30 },
      { wch: 15 },
      { wch: 40 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 }
    ];
    worksheet['!cols'] = colWidths;

    const selectedFyObj = finYears.find(f => String(f.accYrSetId) === String(selectedFinYear));
    const fyLabel = selectedFyObj ? selectedFyObj.accYear.replace(/[^a-zA-Z0-9]/g, '') : '2425';
    XLSX.writeFile(workbook, `DrugListAI${fyLabel}.xlsx`);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0b1329] overflow-hidden font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
            
            {/* Header Title Card matching Sidebar dark navy style */}
            <div className="bg-[#0f172a] text-white p-5 rounded-2xl shadow-lg border border-slate-800 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                    <TableCellsIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                      Ayush Annual Indent Details
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                      Item-wise consolidated AYUSH facility indent and DAO approved quantities
                    </p>
                  </div>
                </div>

                {hasSearched && filteredItems.length > 0 && (
                  <button
                    onClick={exportToExcel}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Download Excel File
                  </button>
                )}
              </div>
            </div>

            {/* Filter Section Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1 items-end">
                  {/* Financial Year */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Financial Year
                    </label>
                    <select
                      value={selectedFinYear}
                      onChange={(e) => setSelectedFinYear(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                      {finYears.map((fy) => (
                        <option key={fy.accYrSetId} value={fy.accYrSetId}>
                          {fy.accYear} {fy.isCurrent ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Select Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      disabled={dropdownLoading}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                      <option value="0">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.subcatId || c.categoryId} value={c.subcatId || c.categoryId}>
                          {c.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Show Button inline */}
                  <div>
                    <button
                      type="button"
                      onClick={handleShow}
                      disabled={loading || dropdownLoading}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-blue-500/20 transition-all disabled:opacity-50 h-[42px]"
                    >
                      {loading ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          Please Wait...
                        </>
                      ) : (
                        'Show'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Results Table Section */}
            {hasSearched && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 flex flex-col">
                {/* Search & Stats Bar */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Total Items:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {filteredItems.length}
                    </span>
                  </div>

                  <div className="relative max-w-xs w-full">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search code, name, category..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-340px)] min-h-[300px]">
                  <table className="w-full text-left text-sm text-slate-700 border-collapse">
                    <thead className="bg-[#0f172a] text-white text-xs font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="py-3.5 px-4 text-center w-14 bg-[#0f172a]">SL No</th>
                        <th className="py-3.5 px-4 bg-[#0f172a]">Category</th>
                        <th className="py-3.5 px-4 bg-[#0f172a]">Item Code</th>
                        <th className="py-3.5 px-4 bg-[#0f172a]">Item Name</th>
                        <th className="py-3.5 px-4 bg-[#0f172a]">Strength</th>
                        <th className="py-3.5 px-4 text-center bg-[#0f172a]">Facility Indent Qty</th>
                        <th className="py-3.5 px-4 text-center bg-[#0f172a]">DAO Approved Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-slate-500">
                            <ArrowPathIcon className="w-7 h-7 animate-spin mx-auto mb-2 text-blue-600" />
                            Please Wait...
                          </td>
                        </tr>
                      ) : filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-slate-400 font-medium">
                            No records found for the selected Financial Year and Category.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item, idx) => (
                          <tr
                            key={item.itemId || idx}
                            className="hover:bg-blue-50/40 transition-colors odd:bg-white even:bg-slate-50/50"
                          >
                            <td className="py-3 px-4 text-center font-medium text-slate-500 text-xs">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4 text-slate-700 text-xs font-medium">
                              {item.categoryName}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-blue-700 text-xs">
                              {item.itemCode}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 text-sm">
                              {item.itemName}
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-xs">
                              {item.strength}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800 text-sm">
                              {Number(item.facilityIndentQty || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-emerald-700 text-sm">
                              {Number(item.daoApprovedQty || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
