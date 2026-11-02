import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import {
  ArrowPathIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function AmmFacilityMonitoringPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [districtId, setDistrictId] = useState(() => {
    return (
      user?.districtId ||
      user?.districtid ||
      localStorage.getItem('districtId') ||
      localStorage.getItem('districtid') ||
      ''
    );
  });
  const [iframeKey, setIframeKey] = useState(0);

  // If districtId is not in user or localStorage, fetch from backend masfacilities table
  useEffect(() => {
    const fetchDistrictId = async () => {
      const activeFacId = user?.facilityId || localStorage.getItem('facilityId');
      if (!districtId && activeFacId) {
        try {
          const res = await api.get(`/facility/district/${activeFacId}`);
          if (res.data?.success && res.data.districtId) {
            const fetchedDistId = String(res.data.districtId);
            setDistrictId(fetchedDistId);
            localStorage.setItem('districtId', fetchedDistId);
            localStorage.setItem('districtid', fetchedDistId);

            // Also update localStorage user object if possible
            try {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const uObj = JSON.parse(storedUser);
                uObj.districtId = Number(fetchedDistId);
                uObj.districtid = Number(fetchedDistId);
                localStorage.setItem('user', JSON.stringify(uObj));
              }
            } catch (e) {
              // ignore
            }
          }
        } catch (err) {
          console.error('Failed to fetch district ID for facility:', err);
        }
      }
    };

    fetchDistrictId();
  }, [user?.facilityId, districtId]);

  // Listen for OAC_LOADED message from the iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'OAC_LOADED') {
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // Safety fallback timeout to hide spinner after 8s even if postMessage is blocked
    const timer = setTimeout(() => {
      setLoading(false);
    }, 8000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [iframeKey]);

  const handleRefresh = () => {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const districtidVal = String(districtId || '').trim();

  // Embedded Oracle DV HTML template
  const oracleDvHtml = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html lang="en" dir="ltr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AMM Facility Monitoring</title>
          <script src="https://cgmscanalytics-cgmscee-bo.analytics.ocp.oraclecloud.com/public/dv/v1/embedding/standalone/embedding.js" type="application/javascript"></script>
          <script>
            var token = "";
            function waitForRequire(callback) {
              if (typeof requirejs !== "undefined") {
                callback();
              } else {
                setTimeout(function() {
                  waitForRequire(callback);
                }, 50);
              }
            }

            function fetchAndSetToken() {
              fetch("https://kcthepe5e6xwemxr36bzoz4xgq.apigateway.ap-mumbai-1.oci.customer-oci.com/oac/auth_token")
                .then(function(response) { return response.json(); })
                .then(function(data) {
                  token = data.access_token;
                  waitForRequire(function() {
                    requirejs(["jquery", "knockout", "obitech-application/application", "ojs/ojcore", "ojs/ojknockout", "ojs/ojcomposite", "jet-composites/oracle-dv/loader"], 
                    function($, ko, application) {
                      application.setSecurityConfig("token", {
                        tokenAuthFunction: function() { return token; }
                      });
                      if (!window.bindingsApplied) {
                        function MyProject() {
                          var self = this;
                          self.projectPath = ko.observable("/@Catalog/users/sm.cgmsc@gmail.com/AAM Monitoring ");
                          self.parameters = ko.observable({
                            "p1n": "PARAM_DISTRICTID",
                            "p1v": "${districtidVal}"
                          });
                        }
                        ko.applyBindings(new MyProject());
                        window.bindingsApplied = true;
                        setTimeout(function() {
                          window.parent.postMessage("OAC_LOADED", "*");
                        }, 2500);
                      }
                    });
                  });
                })
                .catch(function(err) {
                  console.error("Token fetch error:", err);
                  setTimeout(function() {
                    window.parent.postMessage("OAC_LOADED", "*");
                  }, 2000);
                });
            }
            fetchAndSetToken();
            setInterval(fetchAndSetToken, 45 * 60 * 1000);
          </script>
      </head>
      <body style="margin:0; padding:0; overflow:hidden; background-color: #f8fafc;">
          <div style="width: 100%; height: 100vh;">
            <oracle-dv 
              project-path="[[projectPath]]" 
              active-page="insight" 
              active-tab-id="snapshot!canvas!1"
              parameters="[[parameters]]"
              project-options='{"bShowFilterBar":false}'>
            </oracle-dv>
          </div>
      </body>
      </html>
    `;
  }, [districtidVal]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Top Banner / Breadcrumb Header */}
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between shadow-sm z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                <ChartBarIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  AMM Facility Monitoring
                  <span className="px-2 py-0.5 text-[11px] font-bold tracking-wider rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    CMHO DASHBOARD
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Oracle Analytics Cloud &bull; AAM Monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {districtidVal ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-600">
                  <BuildingOffice2Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>District ID:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {districtidVal}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800">
                  <span>Fetching District ID...</span>
                </div>
              )}

              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-600 transition-colors shadow-sm focus:outline-none"
                title="Reload Dashboard"
              >
                <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Reload</span>
              </button>
            </div>
          </div>

          {/* Main Dashboard Canvas */}
          <main className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-slate-900">
            {loading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm transition-opacity">
                <div className="relative">
                  <svg
                    className="animate-spin w-12 h-12 text-emerald-600 dark:text-emerald-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                </div>
                <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Loading AMM Facility Monitoring Dashboard...
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Connecting to Oracle Analytics Cloud and applying district filter (ID: {districtidVal || '...'})
                </p>
              </div>
            )}

            <iframe
              key={iframeKey}
              title="AMM Facility Monitoring Dashboard"
              srcDoc={oracleDvHtml}
              className="w-full h-full border-0"
              style={{ minHeight: 'calc(100vh - 120px)' }}
            />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
