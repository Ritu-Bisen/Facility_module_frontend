import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import {
  ChartBarIcon,
  ArrowPathIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

export default function AamFacilityPerformanceMonitoringPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const initialDistrict = String(
    user?.districtId ||
    user?.districtid ||
    sessionStorage.getItem('districtid') ||
    sessionStorage.getItem('districtId') ||
    localStorage.getItem('districtId') ||
    localStorage.getItem('districtid') ||
    '2194'
  ).trim();

  const [districtVal, setDistrictVal] = useState(initialDistrict);
  const [districtInput, setDistrictInput] = useState(initialDistrict);

  // Sync district ID to both sessionStorage and localStorage in parent window
  useEffect(() => {
    if (districtVal) {
      try {
        sessionStorage.setItem('districtid', String(districtVal).trim());
        sessionStorage.setItem('districtId', String(districtVal).trim());
        localStorage.setItem('districtid', String(districtVal).trim());
        localStorage.setItem('districtId', String(districtVal).trim());
      } catch (e) {}
    }
  }, [districtVal]);

  // Fetch district ID from backend if facilityId is available and not set
  useEffect(() => {
    if (user?.facilityId) {
      api.get(`/facility/district/${user.facilityId}`)
        .then((res) => {
          if (res.data?.success && res.data?.districtId) {
            const fetchedDist = String(res.data.districtId).trim();
            if (fetchedDist) {
              setDistrictVal(fetchedDist);
              setDistrictInput(fetchedDist);
              try {
                sessionStorage.setItem('districtid', fetchedDist);
                sessionStorage.setItem('districtId', fetchedDist);
                localStorage.setItem('districtid', fetchedDist);
                localStorage.setItem('districtId', fetchedDist);
              } catch (e) {}
            }
          }
        })
        .catch(() => {});
    }
  }, [user?.facilityId]);

  const handleApplyDistrict = () => {
    const val = String(districtInput).trim();
    if (val) {
      setDistrictVal(val);
      try {
        sessionStorage.setItem('districtid', val);
        sessionStorage.setItem('districtId', val);
        localStorage.setItem('districtid', val);
        localStorage.setItem('districtId', val);
      } catch (e) {}
      setLoading(true);
      setIframeKey((prev) => prev + 1);
    }
  };

  // Listen for OAC_LOADED message from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'OAC_LOADED' || event.data === 'OAC_ERROR') {
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 7000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [iframeKey]);

  const handleRefresh = () => {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const srcDocHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="referrer" content="no-referrer">

<script>
  function handleScriptError() {
    console.warn('[OAC] Direct script load failed, retrying with no-referrer...');
    var s = document.createElement('script');
    s.src = "https://cgmscanalyticspro-cgmscee-t1-bo.analytics.ocp.oraclecloud.com/public/dv/v1/embedding/standalone/embedding.js?t=" + Date.now();
    s.type = "application/javascript";
    s.referrerPolicy = "no-referrer";
    s.onload = function() {
      console.log('[OAC] embedding.js loaded on retry');
      if (typeof fetchAndSetToken === 'function') fetchAndSetToken();
    };
    s.onerror = function(e) {
      console.error('[OAC] Failed to load embedding.js', e);
      try { window.parent.postMessage("OAC_ERROR", "*"); } catch(err) {}
    };
    document.head.appendChild(s);
  }
</script>

<script
  src="https://cgmscanalyticspro-cgmscee-t1-bo.analytics.ocp.oraclecloud.com/public/dv/v1/embedding/standalone/embedding.js"
  type="application/javascript"
  referrerpolicy="no-referrer"
  onerror="handleScriptError()">
</script>

<script>
var token = "";
var tokenFetchStarted = false;

function fetchAndSetToken() {
  if (tokenFetchStarted) return;
  tokenFetchStarted = true;

  fetch("https://kcthepe5e6xwemxr36bzoz4xgq.apigateway.ap-mumbai-1.oci.customer-oci.com/oac/auth_token")
  .then(function(response) {
      if (!response.ok) {
          throw new Error("HTTP Error : " + response.status);
      }
      return response.json();
  })
  .then(function(data) {
      token = data.access_token;

      function waitForRequire(callback) {
        var req = window.requirejs || window.require;
        if (typeof req !== "undefined") {
          callback(req);
        } else {
          setTimeout(function() { waitForRequire(callback); }, 150);
        }
      }

      waitForRequire(function(req) {
        req([
            "knockout",
            "ojs/ojcore",
            "ojs/ojknockout",
            "ojs/ojcomposite",
            "jet-composites/oracle-dv/loader",
            "obitech-application/application"
        ],
        function(ko, oj, ok1, ok2, ok3, application) {
            application.setSecurityConfig("token", {
                tokenAuthFunction: function() {
                    return token;
                }
            });

            if (!window.bindingsApplied) {
                function DashboardVM() {
                    var self = this;
                    self.projectPath = ko.observable(
                        "/@Catalog/users/sm.cgmsc@gmail.com/AAM Monitoring "
                    );

                    var districtidVal = "${districtVal}".trim() || "0";
                    try {
                        var s = (window.parent ? window.parent.sessionStorage.getItem("districtid") : "") ||
                                sessionStorage.getItem("districtid") ||
                                (window.parent ? window.parent.localStorage.getItem("districtid") : "") ||
                                localStorage.getItem("districtid") ||
                                "";
                        if (s && s !== "0" && s !== "null" && s !== "undefined") {
                          districtidVal = String(s).trim();
                        }
                    } catch(e) {}

                    if (!districtidVal || districtidVal === "0") {
                      districtidVal = "${districtVal}".trim() || "0";
                    }

                    try {
                      sessionStorage.setItem("districtid", districtidVal);
                    } catch(e) {}

                    console.log("[OAC Embedding] Applying PARAM_DISTRICTID:", districtidVal);

                    self.parameters = ko.observable({
                        "p1n": "PARAM_DISTRICTID",
                        "p1v": districtidVal
                    });
                }

                try {
                  ko.applyBindings(new DashboardVM());
                  window.bindingsApplied = true;
                  setTimeout(function () {
                      try { window.parent.postMessage("OAC_LOADED", "*"); } catch(e) {}
                  }, 2500);
                } catch(bindErr) {
                  console.error('[OAC] Binding error:', bindErr);
                }
            }
        });
      });
  })
  .catch(function(error) {
      console.error("Token Fetch Error :", error);
      try { window.parent.postMessage("OAC_LOADED", "*"); } catch(e) {}
  });
}

if (typeof require !== 'undefined' || window.require) {
  fetchAndSetToken();
} else {
  setTimeout(fetchAndSetToken, 300);
}

setInterval(function() {
  tokenFetchStarted = false;
  fetchAndSetToken();
}, 45 * 60 * 1000);
</script>
</head>

<body style="margin:0;padding:0;overflow:hidden;background-color:#ffffff;">
<div style="width:100%;height:100vh;">
<oracle-dv
    project-path="[[projectPath]]"
    active-page="insight"
    active-tab-id="snapshot!canvas!2"
    parameters="[[parameters]]"
    project-options='{"bShowFilterBar":false}'>
</oracle-dv>
</div>
</body>
</html>`;
  }, [districtVal]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900">
            <div className="w-full mx-auto space-y-4">
              {/* Heading Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 md:p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                    <ChartBarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                      AAM Facility Performance Monitoring
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Facility Performance and Analytics Dashboard
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-600 shadow-xs">
                    <BuildingOffice2Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>District ID:</span>
                    <input
                      type="text"
                      value={districtInput}
                      onChange={(e) => setDistrictInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyDistrict(); }}
                      className="w-20 px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                      placeholder="District ID"
                      title="Enter District ID to filter dashboard parameter"
                    />
                    <button
                      onClick={handleApplyDistrict}
                      className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition text-xs shadow-xs"
                      title="Apply District ID to dashboard parameter"
                    >
                      Apply
                    </button>
                  </div>

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

              {/* Oracle Dashboard Section */}
              <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden" style={{ minHeight: 'calc(100vh - 210px)' }}>
                {loading && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                      Loading AAM Performance Dashboard...
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Connecting to Oracle Analytics Cloud (District: {districtVal})
                    </p>
                  </div>
                )}

                <iframe
                  key={`${iframeKey}-${districtVal}`}
                  title="AAM Facility Performance Monitoring Dashboard"
                  srcDoc={srcDocHtml}
                  className="w-full h-full border-0 oac_embedding_iframe"
                  style={{
                    width: '100%',
                    height: 'calc(100vh - 210px)',
                    minHeight: '650px',
                    border: 'none',
                    display: 'block'
                  }}
                />
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
