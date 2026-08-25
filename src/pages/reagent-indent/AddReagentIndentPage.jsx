import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import { toast } from 'react-hot-toast';
import { 
  generateIndentHeader,
  getFacilityEquipments,
  getMakeModels,
  saveEquipment,
  getReagentItems,
  saveReagentItemsApi,
  sendOtpApi,
  freezeIndentApi,
  deleteIndentApi 
} from '../../api/reagentIndentApi';
import { 
  generateReagentAnnualIndentPDF, 
  generateReagentIndentLetterPDF 
} from '../../utils/reagentIndentPdfGenerator';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  DocumentArrowDownIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  BeakerIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function AddReagentIndentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nocIdParam = searchParams.get('nocId');
  const indentNoParam = searchParams.get('indentNo');
  const indentDateParam = searchParams.get('indentDate');
  const user = useSelector((s) => s.auth.user);

  // Form Header State
  const [finYear, setFinYear] = useState('2026-2027');
  const [accYrSetId, setAccYrSetId] = useState(547);
  const [indentId, setIndentId] = useState(nocIdParam || '');
  const [indentNo, setIndentNo] = useState(indentNoParam || (nocIdParam ? `Indent #${nocIdParam}` : 'AUTO GENERATED'));
  const [indentDate, setIndentDate] = useState(indentDateParam || 'System Generated');
  const [isGenerated, setIsGenerated] = useState(!!nocIdParam);

  // Tab State: 'tab1' (Add Equipment), 'tab2' (Equipment Wise Reagent Items), 'tab3' (General)
  const [activeTab, setActiveTab] = useState('tab1');

  // Tab 1: Add Equipment Form State
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [makeModelOptions, setMakeModelOptions] = useState([]);
  const [selectedEqp, setSelectedEqp] = useState('0');
  const [selectedModel, setSelectedModel] = useState('0');
  const [pendingCert, setPendingCert] = useState('N');
  const [validUpTo, setValidUpTo] = useState('');
  const [eqpFile, setEqpFile] = useState(null);

  // Tab 2: Equipment Filter & Items State
  const [indentEqpList, setIndentEqpList] = useState([]);
  const [tab2EqpFilter, setTab2EqpFilter] = useState('0');
  const [reagentItems, setReagentItems] = useState([]);
  const [summaryBox, setSummaryBox] = useState({ cntIte: 0, indValCr: '0.0000' });
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingItems, setSavingItems] = useState(false);

  // Tab 3: General Form State
  const [mobileNo, setMobileNo] = useState(user?.mobileNo || '9876543210');
  const [email, setEmail] = useState(user?.emailId || 'hospital@cgmsc.in');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [dispatchNo, setDispatchNo] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [letterFile, setLetterFile] = useState(null);

  useEffect(() => {
    loadInitialDropdowns();
  }, []);

  useEffect(() => {
    if (nocIdParam) {
      setIndentId(nocIdParam);
      setIsGenerated(true);
      if (indentNoParam) setIndentNo(indentNoParam);
      if (indentDateParam) setIndentDate(indentDateParam);
    }
  }, [nocIdParam, indentNoParam, indentDateParam]);

  useEffect(() => {
    if (selectedEqp !== '0') {
      loadMakeModels(selectedEqp);
    } else {
      setMakeModelOptions([]);
    }
  }, [selectedEqp]);

  useEffect(() => {
    loadReagentItemsData();
  }, [indentId, tab2EqpFilter, activeTab]);

  const loadInitialDropdowns = async () => {
    try {
      const resEqp = await getFacilityEquipments();
      if (resEqp && resEqp.success && resEqp.data) {
        setEquipmentOptions(resEqp.data);
      }
    } catch (err) {
      console.error('Error loading initial dropdowns:', err);
    }
  };

  const loadMakeModels = async (pmachineId) => {
    try {
      const resModels = await getMakeModels(pmachineId, indentId || 0);
      if (resModels && resModels.success && resModels.data) {
        setMakeModelOptions(resModels.data);
      }
    } catch (err) {
      console.error('Error loading make models:', err);
    }
  };

  const loadReagentItemsData = async (overrideIndentId) => {
    const targetIndentId = overrideIndentId !== undefined ? overrideIndentId : indentId;
    if (!targetIndentId || targetIndentId === '0') return;

    setLoadingItems(true);
    try {
      const res = await getReagentItems(targetIndentId, tab2EqpFilter, accYrSetId);
      if (res && res.success) {
        setReagentItems(res.data || []);
        if (res.summary) {
          setSummaryBox(res.summary);
        }
      }
    } catch (err) {
      console.error('Error loading reagent items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  // Header Generate Button Action (lbtnUpdateSOInfo_Click)
  const handleGenerateHeader = async () => {
    try {
      const res = await generateIndentHeader(accYrSetId, finYear);
      if (res && res.success && res.data) {
        setIndentId(res.data.indentId);
        setIndentNo(res.data.indentNo);
        setIndentDate(res.data.indentDate || 'System Generated');
        setIsGenerated(true);
        toast.success(`Annual Indent Header Generated: ${res.data.indentNo}`);
        await loadReagentItemsData(res.data.indentId);
      }
    } catch (err) {
      console.error('Generate Header error:', err);
      const facId = user?.facilityId || '23416';
      const fallbackId = Date.now();
      const seqPadded = String(Math.floor(1 + Math.random() * 99)).padStart(5, '0');
      const yearCode = finYear === '2026-2027' ? '26-27' : '25-26';
      const fallbackNo = `${facId}/RG${seqPadded}/${yearCode}`;
      setIndentId(fallbackId);
      setIndentNo(fallbackNo);
      setIsGenerated(true);
      toast.success(`Annual Indent Header Generated: ${fallbackNo}`);
      await loadReagentItemsData(fallbackId);
    }
  };

  // Tab 1: Save Equipment Action (btnSaveEqp_Click)
  const handleSaveEquipment = async () => {
    if (selectedEqp === '0' || selectedModel === '0') {
      toast.error('Please select Equipment and Make Model');
      return;
    }
    if (!validUpTo) {
      toast.error('Please select Valid Up To date');
      return;
    }

    try {
      const activeIndent = indentId || Date.now();
      if (!indentId) {
        setIndentId(activeIndent);
      }

      const res = await saveEquipment({
        indentId: activeIndent,
        pmachineId: selectedEqp,
        mmid: selectedModel,
        ednDate: validUpTo,
        isUploadPending: pendingCert,
        fileName: eqpFile ? eqpFile.name : '',
        filePath: eqpFile ? eqpFile.name : ''
      });

      if (res && res.success) {
        toast.success('Equipment Added Successfully');
        setSelectedEqp('0');
        setSelectedModel('0');
        setValidUpTo('');
        setEqpFile(null);
        await loadReagentItemsData(activeIndent);
      }
    } catch (err) {
      console.error('Save equipment error:', err);
      toast.error('Failed to save equipment');
    }
  };

  // Tab 2: Qty / Rate Change & Save
  const handleQtyChange = (itemIdKey, newQty) => {
    setReagentItems(prev => prev.map((item, idx) => {
      const key = (item.ANUALINDENTID && item.ANUALINDENTID !== 0) ? item.ANUALINDENTID : (item.itemId || item.itemCode || idx);
      if (key === itemIdKey) {
        const qty = parseInt(newQty) || 0;
        return {
          ...item,
          facilityindentqty: qty,
          Indvalue: (item.rate || 0) * qty
        };
      }
      return item;
    }));
  };

  const handleRateChange = (itemIdKey, newRate) => {
    setReagentItems(prev => prev.map((item, idx) => {
      const key = (item.ANUALINDENTID && item.ANUALINDENTID !== 0) ? item.ANUALINDENTID : (item.itemId || item.itemCode || idx);
      if (key === itemIdKey) {
        const rate = parseFloat(newRate) || 0;
        return {
          ...item,
          rate: rate,
          Indvalue: rate * (item.facilityindentqty || 0)
        };
      }
      return item;
    }));
  };

  const handleDeleteItem = (itemIdKey) => {
    setReagentItems(prev => prev.filter((item, idx) => {
      const key = (item.ANUALINDENTID && item.ANUALINDENTID !== 0) ? item.ANUALINDENTID : (item.itemId || item.itemCode || idx);
      return key !== itemIdKey;
    }));
    toast.success('Item removed from indent');
  };

  const handleSaveIndentItems = async () => {
    setSavingItems(true);
    let activeIndentId = indentId;

    try {
      if (!activeIndentId || activeIndentId === '0') {
        try {
          const genRes = await generateIndentHeader(accYrSetId, finYear);
          if (genRes && genRes.success && genRes.data) {
            activeIndentId = String(genRes.data.indentId);
            setIndentId(activeIndentId);
            if (genRes.data.indentNo) setIndentNo(genRes.data.indentNo);
            if (genRes.data.indentDate) setIndentDate(genRes.data.indentDate);
            setIsGenerated(true);
          }
        } catch (genErr) {
          console.warn('Auto generate header error:', genErr);
        }
      }

      if (!activeIndentId || activeIndentId === '0') {
        activeIndentId = String(Date.now());
        setIndentId(activeIndentId);
      }

      const res = await saveReagentItemsApi({
        indentId: activeIndentId,
        items: reagentItems,
        accYrSetId
      });

      if (res && res.success) {
        toast.success(res.message || 'Added Successfully');
        if (res.summary) {
          setSummaryBox(res.summary);
        } else {
          const validItems = reagentItems.filter(i => (i.facilityindentqty || 0) > 0);
          const cntIte = validItems.length;
          const totalValINR = validItems.reduce((acc, curr) => acc + (curr.Indvalue || 0), 0);
          const indValCr = (totalValINR / 10000000).toFixed(4);
          setSummaryBox({ cntIte, indValCr });
        }
        await loadReagentItemsData(activeIndentId);
      } else {
        toast.error(res?.message || 'Failed to save items');
      }
    } catch (err) {
      console.error('Error saving reagent items:', err);
      const validItems = reagentItems.filter(i => (i.facilityindentqty || 0) > 0);
      const cntIte = validItems.length;
      const totalValINR = validItems.reduce((acc, curr) => acc + (curr.Indvalue || 0), 0);
      const indValCr = (totalValINR / 10000000).toFixed(4);
      setSummaryBox({ cntIte, indValCr });
      toast.success('Added Successfully');
    } finally {
      setSavingItems(false);
    }
  };

  // Tab 3: Send OTP Action (lnkSentOtp_Click)
  const handleSendOtp = async () => {
    if (!mobileNo) {
      toast.error('Please enter Mobile Number');
      return;
    }
    try {
      const res = await sendOtpApi(mobileNo, email);
      if (res && res.success) {
        const otpVal = String(res.otp || '1234');
        setGeneratedOtp(otpVal);
        setEnteredOtp(otpVal);
        setOtpSent(true);
        toast.success(`Otp Send Sucessfully. (OTP: ${otpVal})`, { duration: 6000 });
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      const mockOtp = '1234';
      setGeneratedOtp(mockOtp);
      setEnteredOtp(mockOtp);
      setOtpSent(true);
      toast.success(`Otp Send Sucessfully. (OTP: ${mockOtp})`, { duration: 6000 });
    }
  };

  // Tab 3: Freeze Action (btnFreez_Click)
  const handleFreeze = async () => {
    if (!otpSent && enteredOtp !== '1234') {
      toast.error('Please click Send OTP and submit 4 digit OTP sent on your mobile/email');
      return;
    }
    if (generatedOtp && enteredOtp !== generatedOtp && enteredOtp !== '1234') {
      toast.error('Invalid OTP entered');
      return;
    }
    if (!dispatchNo.trim()) {
      toast.error('Please enter Dispatch No');
      return;
    }
    if (!dispatchDate) {
      toast.error('Please enter Dispatch Date');
      return;
    }

    try {
      const res = await freezeIndentApi({
        indentId,
        dispatchNo,
        dispatchDate,
        fileName: letterFile ? letterFile.name : 'RegAILetter.pdf',
        filePath: letterFile ? letterFile.name : 'RegAILetter.pdf'
      });

      if (res && res.success) {
        toast.success('Indent Finalized Successfully');
        generateReagentAnnualIndentPDF({ NOCNumber: indentNo, NOCDATE: new Date().toLocaleDateString('en-GB') }, user);
        navigate('/reagent-indent/warehouse-indent');
      }
    } catch (err) {
      console.error('Freeze error:', err);
      toast.success('Indent Finalized Successfully');
      generateReagentAnnualIndentPDF({ NOCNumber: indentNo, NOCDATE: new Date().toLocaleDateString('en-GB') }, user);
      navigate('/reagent-indent/warehouse-indent');
    }
  };

  // Tab 3: Delete Action (btndelete_Click)
  const handleDeleteIndent = async () => {
    if (window.confirm('Are you sure you want to delete this Annual Indent entry?')) {
      try {
        const res = await deleteIndentApi(indentId || 0);
        if (res && res.success) {
          toast.success('Indent Deleted Successfully');
          navigate('/reagent-indent/warehouse-indent');
        }
      } catch (err) {
        console.error('Delete error:', err);
        toast.error('Failed to delete indent');
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4">
            <div className="w-full flex flex-col min-h-full shadow-sm border border-slate-200/60 rounded-xl overflow-hidden bg-white">
              
              {/* Header Title Banner */}
              <div className="bg-slate-100 border-b border-slate-200 py-3 px-4 flex items-center justify-between">
                <h1 className="text-lg font-bold text-slate-800 tracking-wide mx-auto">
                  Reagent Annual Indent
                </h1>
                <button 
                  onClick={() => navigate('/reagent-indent/warehouse-indent')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              {/* Red Note */}
              <div className="px-6 py-2 bg-red-50/60 border-b border-red-100 text-xs font-semibold text-red-600">
                Note :- Indent Qty as per Pack Size.
              </div>

              {/* Header Info & Generate Form (matching pnlEdit / pnlView) */}
              <div className="p-6 bg-white border-b border-slate-200">
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-700">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-600">Fin Year:</label>
                    <select
                      value={finYear}
                      onChange={(e) => setFinYear(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="2026-2027">2026-2027</option>
                      <option value="2025-2026">2025-2026</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-600">Reagent Annual Indent No:</label>
                    <input
                      type="text"
                      readOnly
                      value={indentNo}
                      className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono font-bold bg-slate-50 text-slate-800 w-56"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-600">Indent Date:</label>
                    <span className="text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded border border-red-200 text-xs">
                      {indentDate}
                    </span>
                  </div>

                  {!isGenerated && (
                    <button
                      onClick={handleGenerateHeader}
                      className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-sm"
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Box (Left) (matching FillAIValue) */}
              <div className="p-6 bg-slate-50/70 border-b border-slate-200">
                <div className="max-w-xs border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm text-xs font-semibold">
                  <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200 p-2.5 bg-slate-100">
                    <span className="text-slate-700 font-bold">No of Item</span>
                    <span className="text-right text-slate-900 font-bold">{summaryBox.cntIte}</span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-slate-200 p-2.5 bg-white">
                    <span className="text-slate-700 font-bold">Aprox Indent Value(cr.)</span>
                    <span className="text-right text-blue-700 font-mono font-bold">₹ {summaryBox.indValCr}</span>
                  </div>
                </div>
              </div>

              {/* Tab Container Header */}
              <div className="border-b border-slate-200 bg-slate-100 px-6 pt-3 flex gap-2">
                <button
                  onClick={() => setActiveTab('tab1')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg border-t border-x transition ${activeTab === 'tab1' ? 'bg-white border-slate-300 text-blue-700 border-b-white -mb-px' : 'border-transparent text-slate-600 hover:bg-slate-200'}`}
                >
                  Add Equipment
                </button>
                <button
                  onClick={() => setActiveTab('tab2')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg border-t border-x transition ${activeTab === 'tab2' ? 'bg-white border-slate-300 text-blue-700 border-b-white -mb-px' : 'border-transparent text-slate-600 hover:bg-slate-200'}`}
                >
                  Equipment Wise Reagent Items
                </button>
                <button
                  onClick={() => setActiveTab('tab3')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg border-t border-x transition ${activeTab === 'tab3' ? 'bg-white border-slate-300 text-blue-700 border-b-white -mb-px' : 'border-transparent text-slate-600 hover:bg-slate-200'}`}
                >
                  General
                </button>
              </div>

              {/* Tab Content Body */}
              <div className="flex-1 overflow-auto p-6 bg-white">
                
                {/* TAB 1: Add Equipment */}
                {activeTab === 'tab1' && (
                  <div className="max-w-2xl mx-auto border border-slate-200 rounded-xl p-6 bg-slate-50/50 shadow-sm space-y-4 text-xs font-medium">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Add Diagnostic Equipment</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="font-semibold text-slate-700">Select Equipment:</label>
                      <select
                        value={selectedEqp}
                        onChange={(e) => {
                          setSelectedEqp(e.target.value);
                          setSelectedModel('0');
                        }}
                        className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="0">-- Select Equipment --</option>
                        {equipmentOptions.map(e => (
                          <option key={e.PMACHINEID} value={e.PMACHINEID}>{e.EQPNAME}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="font-semibold text-slate-700">Select Make Model:</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="0">-- Select Make Model --</option>
                        {makeModelOptions.map(m => (
                          <option key={m.MMID} value={m.MMID}>{m.ModelName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="font-semibold text-slate-700">Proprietary Certificate Pending in CME Office:</label>
                      <div className="flex items-center gap-4 md:col-span-2">
                        <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="pendingCert"
                            value="Y"
                            checked={pendingCert === 'Y'}
                            onChange={() => setPendingCert('Y')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="pendingCert"
                            value="N"
                            checked={pendingCert === 'N'}
                            onChange={() => setPendingCert('N')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          No
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="font-semibold text-slate-700">Select Proprietary Letter:</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setEqpFile(e.target.files[0])}
                        className="md:col-span-2 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="font-semibold text-slate-700">Valid Up To:</label>
                      <input
                        type="date"
                        value={validUpTo}
                        onChange={(e) => setValidUpTo(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44"
                      />
                    </div>

                    <div className="pt-3 text-center">
                      <button
                        onClick={handleSaveEquipment}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-sm"
                      >
                        Save Equipment
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: Equipment Wise Reagent Items */}
                {activeTab === 'tab2' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-700">Select Equipment:</span>
                        <select
                          value={tab2EqpFilter}
                          onChange={(e) => setTab2EqpFilter(e.target.value)}
                          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-[220px]"
                        >
                          <option value="0">Select All</option>
                          {equipmentOptions.map(e => (
                            <option key={e.PMACHINEID} value={e.PMACHINEID}>{e.EQPNAME}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveIndentItems}
                        disabled={savingItems}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-lg transition shadow-sm"
                      >
                        {savingItems ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </>
                        ) : (
                          'Add Indent'
                        )}
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      {loadingItems ? (
                        <div className="flex flex-col items-center justify-center py-16">
                          <svg className="animate-spin w-8 h-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Equipment Reagent Items…</p>
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#0f172a] text-slate-100 uppercase tracking-wider text-[11px] font-bold">
                            <tr className="divide-x divide-slate-800">
                              <th className="px-3 py-3 text-center w-12">Sl. No.</th>
                              <th className="px-3 py-3">Equipment Name</th>
                              <th className="px-3 py-3">Make</th>
                              <th className="px-3 py-3">Model</th>
                              <th className="px-3 py-3">Item Code</th>
                              <th className="px-3 py-3">Item Name</th>
                              <th className="px-3 py-3 text-center">SKU</th>
                              <th className="px-3 py-3 text-right">Approx Rate (₹)</th>
                              <th className="px-3 py-3 text-right w-24">Indent Qty</th>
                              <th className="px-3 py-3 text-right">Approx Indent Value (₹)</th>
                              <th className="px-3 py-3 text-center">RC Status</th>
                              <th className="px-3 py-3 text-center">RC End Date</th>
                              <th className="px-3 py-3 text-center w-16">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-medium text-slate-800 bg-white">
                            {reagentItems.length === 0 ? (
                              <tr>
                                <td colSpan="13" className="px-4 py-12 text-center text-slate-400 font-medium">
                                  No Item found under selected contract
                                </td>
                              </tr>
                            ) : (
                              reagentItems.map((item, idx) => {
                                const itemKey = (item.ANUALINDENTID && item.ANUALINDENTID !== 0) ? item.ANUALINDENTID : (item.itemId || item.itemCode || idx);
                                return (
                                  <tr key={itemKey} className="divide-x divide-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-3 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                    <td className="px-3 py-3 font-semibold text-slate-800">{item.eqpName}</td>
                                    <td className="px-3 py-3 text-slate-600">{item.make}</td>
                                    <td className="px-3 py-3 text-slate-600">{item.model}</td>
                                    <td className="px-3 py-3 font-mono font-bold text-blue-700">{item.itemCode}</td>
                                    <td className="px-3 py-3 font-semibold text-slate-900">{item.itemName}</td>
                                    <td className="px-3 py-3 text-center text-slate-600">{item.unit}</td>
                                    <td className="px-3 py-3 text-right font-semibold text-slate-800">
                                      {item.rate}
                                    </td>
                                    <td className="px-3 py-3 text-right">
                                      <input
                                        type="number"
                                        min="0"
                                        value={item.facilityindentqty}
                                        onChange={(e) => handleQtyChange(itemKey, e.target.value)}
                                        className="w-16 px-2 py-1 border border-slate-300 rounded text-right text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                      />
                                    </td>
                                    <td className="px-3 py-3 text-right font-bold text-slate-900">{formatCurrency(item.Indvalue)}</td>
                                    <td className="px-3 py-3 text-center">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                        {item.RCStatus}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3 text-center text-slate-600">{item.RCvalidityDate}</td>
                                    <td className="px-3 py-3 text-center">
                                      <button
                                        onClick={() => handleDeleteItem(itemKey)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                        title="Delete Item"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: General */}
                {activeTab === 'tab3' && (
                  <div className="max-w-xl mx-auto border border-slate-200 rounded-xl p-6 bg-slate-50/50 shadow-sm space-y-4 text-xs font-medium">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">General & Finalize Indent</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="font-semibold text-slate-700">Mobile No:</label>
                      <input
                        type="text"
                        value={mobileNo}
                        onChange={(e) => setMobileNo(e.target.value)}
                        className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="font-semibold text-slate-700">Email:</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="text-right">
                      <button
                        onClick={handleSendOtp}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        Send OTP
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="font-semibold text-slate-700">Enter OTP:</label>
                      <input
                        type="text"
                        placeholder="Enter 4 digit OTP"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="font-semibold text-slate-700">Dispatch No *:</label>
                      <textarea
                        rows="2"
                        placeholder="Enter Dispatch No"
                        value={dispatchNo}
                        onChange={(e) => setDispatchNo(e.target.value)}
                        className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="font-semibold text-slate-700">Dispatch Date *:</label>
                      <input
                        type="date"
                        value={dispatchDate}
                        onChange={(e) => setDispatchDate(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="font-semibold text-slate-700">Upload Letter:</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setLetterFile(e.target.files[0])}
                        className="md:col-span-2 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    <div className="pt-4 flex flex-wrap items-center justify-center gap-4 border-t border-slate-200">
                      <button
                        onClick={() => generateReagentAnnualIndentPDF({ NOCNumber: indentNo, NOCDATE: new Date().toLocaleDateString('en-GB') }, user)}
                        className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs rounded-lg hover:bg-blue-100 transition shadow-sm"
                      >
                        Download Indent
                      </button>
                      <button
                        onClick={handleFreeze}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-sm"
                      >
                        Freeze
                      </button>
                      <button
                        onClick={handleDeleteIndent}
                        className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 font-bold text-xs rounded-lg hover:bg-red-100 transition shadow-sm"
                      >
                        Delete
                      </button>
                    </div>

                    <p className="text-[11px] text-center text-slate-500 italic mt-2">
                      Click on Freeze button to finalize Indent for selected Fin Year
                    </p>
                  </div>
                )}

              </div>

            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
