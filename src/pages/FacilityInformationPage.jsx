import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function FacilityInformationPage() {
  const [formData, setFormData] = useState({
    header1: '', header2: '', header3: '',
    footer1: '', footer2: '', footer3: '',
    drMobile: '', drName: '', email: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFacilityInfo();
  }, []);

  const fetchFacilityInfo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/facility-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.HEADER1 !== undefined) {
        setFormData({
          header1: response.data.HEADER1 || '',
          header2: response.data.HEADER2 || '',
          header3: response.data.HEADER3 || '',
          footer1: response.data.FOOTER1 || '',
          footer2: response.data.FOOTER2 || '',
          footer3: response.data.FOOTER3 || '',
          drMobile: response.data.DRMOBILE || '',
          drName: response.data.DRNAME || '',
          email: response.data.EMAIL || ''
        });
      }
    } catch (error) {
      console.error('Error fetching facility info:', error);
      toast.error('Failed to load facility info');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${import.meta.env.VITE_API_URL}/facility-info`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Health Facility Information Saved Successfully.');
      fetchFacilityInfo();
    } catch (error) {
      console.error('Error saving facility info:', error);
      toast.error(error.response?.data?.message || 'Failed to save information');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <>
            <div className="max-w-5xl mx-auto space-y-6">
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-slate-800">Facility Information (Header Footer Master)</h1>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">कृपया Header Footer English में बनाये !</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          एंट्री किये गए ईमेल आई डी एवं स्टोर इंचार्ज / फार्मासिस्ट के मोबाइल नंबर पर आटोमेटिक अलर्ट / सूचना सॉफ्टवेयर द्वारा भेजे जायेंगे | 
                          जैसे वेयरहाउस से वितरण , तय समय में प्राप्ति दर्ज न होने पर , सी. जी. एम. एस. सी के प्रधान कार्यालय से दवा बैच के होल्ड होने पर उपयोग /वितरण नहीं करने बाबत आदि
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-1/3 text-right">
                        <label className="font-bold text-slate-800 text-sm block">Header Line 1</label>
                        <span className="text-slate-500 text-xs">(Word Max Length 100)</span>
                      </div>
                      <div className="w-2/3">
                        <textarea name="header1" value={formData.header1} onChange={handleChange} maxLength="100" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-16 transition-all" required></textarea>
                        <p className="text-xs text-slate-500 mt-1">e.g CHIEF MEDICAL AND HEALTH OFFICER/Block Medical Officer/civil Surgeon</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-1/3 text-right">
                        <label className="font-bold text-slate-800 text-sm block">Footer Line 1</label>
                        <span className="text-slate-500 text-xs">(Word Max Length 100)</span>
                      </div>
                      <div className="w-2/3">
                        <textarea name="footer1" value={formData.footer1} onChange={handleChange} maxLength="100" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-16 transition-all" required></textarea>
                        <p className="text-xs text-slate-500 mt-1">e.g. STORE INCHARGE/Store Keeper/Pharmacist</p>
                      </div>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-1/3 text-right">
                        <label className="font-bold text-slate-800 text-sm block">Header Line 2</label>
                        <span className="text-slate-500 text-xs">(Word Max Length 100)</span>
                      </div>
                      <div className="w-2/3">
                        <textarea name="header2" value={formData.header2} onChange={handleChange} maxLength="100" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-16 transition-all" required></textarea>
                        <p className="text-xs text-slate-500 mt-1">e.g. NEAR DISTRICT HOSPITAL DHAMTARI/NEAR DISTRICT HOSPITAL DHAMTARI</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-1/3 text-right">
                        <label className="font-bold text-slate-800 text-sm block">Footer Line 2</label>
                        <span className="text-slate-500 text-xs">(Word Max Length 100)</span>
                      </div>
                      <div className="w-2/3">
                        <textarea name="footer2" value={formData.footer2} onChange={handleChange} maxLength="100" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-16 transition-all" required></textarea>
                        <p className="text-xs text-slate-500 mt-1">e.g. Incharge/Pharmacist Name</p>
                      </div>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-1/3 text-right">
                        <label className="font-bold text-slate-800 text-sm block">Header Line 3</label>
                        <span className="text-slate-500 text-xs">(Word Max Length 200)</span>
                      </div>
                      <div className="w-2/3">
                        <textarea name="header3" value={formData.header3} onChange={handleChange} maxLength="200" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-16 transition-all" required></textarea>
                        <p className="text-xs text-slate-500 mt-1">e.g Chhattisgarh etc</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-1/3 text-right">
                        <label className="font-bold text-slate-800 text-sm block">Footer Line 3</label>
                      </div>
                      <div className="w-2/3">
                        <input type="text" name="footer3" value={formData.footer3} onChange={handleChange} maxLength="10" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
                        <p className="text-xs text-slate-500 mt-1">e.g. Incharge/Pharmacist Mobile No.</p>
                      </div>
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-1/3 text-right">
                        <label className="font-bold text-slate-800 text-sm">Mobile No</label>
                      </div>
                      <div className="w-2/3 flex items-center gap-2">
                        <input type="text" name="drMobile" value={formData.drMobile} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
                        <span className="text-xs text-slate-500 whitespace-nowrap">eg CMO/CS/BMO/AMO/IC.AMO</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-1/3 text-right">
                        <label className="font-bold text-slate-800 text-sm">eMail Id</label>
                      </div>
                      <div className="w-2/3">
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
                      </div>
                    </div>
                  </div>

                  {/* Row 5 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-1/3 text-right">
                        <label className="font-bold text-slate-800 text-sm">Name</label>
                      </div>
                      <div className="w-2/3">
                        <input type="text" name="drName" value={formData.drName} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" required />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2">
                      {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Preview Section */}
              <div className="flex justify-center pb-8 mt-8">
                <fieldset className="border-2 border-slate-200 p-8 rounded-xl max-w-xl w-full bg-slate-50 shadow-sm relative group hover:border-blue-300 transition-colors">
                  <legend className="text-slate-600 font-semibold px-4 text-sm bg-slate-50 tracking-wide uppercase">Facility Header Footer Preview</legend>
                  <div className="text-center text-sm space-y-1.5 text-slate-800">
                    <p className="font-semibold">{formData.header1 || '\u00A0'}</p>
                    <p>{formData.header2 || '\u00A0'}</p>
                    <p>{formData.header3 || '\u00A0'}</p>
                    <p className="font-medium mt-4">{formData.drName || '\u00A0'}</p>
                    <p className="text-slate-600">{formData.drMobile || '\u00A0'}</p>
                  </div>
                  <div className="flex flex-col items-end mt-10">
                    <div className="text-center space-y-1.5 text-sm text-slate-800">
                      <p className="font-semibold">{formData.footer1 || '\u00A0'}</p>
                      <p>{formData.footer2 || '\u00A0'}</p>
                      <p className="text-slate-600">{formData.footer3 || '\u00A0'}</p>
                    </div>
                  </div>
                </fieldset>
              </div>

            </div>
          </>
  
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
