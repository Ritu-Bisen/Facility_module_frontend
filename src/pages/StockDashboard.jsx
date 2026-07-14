import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../hooks/useAuth';

export default function StockDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'OAC_LOADED') {
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const iframe1 = `
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Warehouse to Head Office QC Sample Transit Monitoring (Courier Lab)</title>
        <script src="https://cgmscanalytics-cgmscee-bo.analytics.ocp.oraclecloud.com/public/dv/v1/embedding/standalone/embedding.js" type="application/javascript"></script>
        <script>
          var token = "";
          function fetchAndSetToken() {
            fetch("https://kcthepe5e6xwemxr36bzoz4xgq.apigateway.ap-mumbai-1.oci.customer-oci.com/oac/auth_token")
              .then(response => response.json())
              .then(data => {
                token = data.access_token;
                requirejs(["jquery", "knockout", "obitech-application/application","ojs/ojcore", "ojs/ojknockout", "ojs/ojcomposite", "jet-composites/oracle-dv/loader"], 
                function($, ko, application) {
                  application.setSecurityConfig("token", {
                    tokenAuthFunction: function() { return token; }
                  });
                  if (!window.bindingsApplied) {
                    function MyProject() {
                      var self = this;
                      self.projectPath = ko.observable("/@Catalog/users/sm.cgmsc@gmail.com/QC_Batches");
                    }
                    ko.applyBindings(new MyProject());
                    window.bindingsApplied = true;
                    setTimeout(function() {
                      window.parent.postMessage("OAC_LOADED", "*");
                    }, 3000);
                  }
                });
              });
          }
          fetchAndSetToken();
          setInterval(fetchAndSetToken, 45 * 60 * 1000);
        </script>
    </head>
    <body style="margin:0;">
        <div style="width: 100%; height: 100vh;">
          <oracle-dv 
          project-path="[[projectPath]]" 
          active-page="insight" 
          active-tab-id="snapshot!canvas!4"
          project-options='{"bShowFilterBar":false}'>
          </oracle-dv>
        </div>
    </body>
    </html>
  `;

  const iframe2 = `
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QC Sample Tracking</title>
        <script src="https://cgmscanalytics-cgmscee-bo.analytics.ocp.oraclecloud.com/public/dv/v1/embedding/standalone/embedding.js" type="application/javascript"></script>
        <script>
          var token = "";
          function fetchAndSetToken() {
            fetch("https://kcthepe5e6xwemxr36bzoz4xgq.apigateway.ap-mumbai-1.oci.customer-oci.com/oac/auth_token")
              .then(response => response.json())
              .then(data => {
                token = data.access_token;
                requirejs(["jquery", "knockout", "obitech-application/application","ojs/ojcore", "ojs/ojknockout", "ojs/ojcomposite", "jet-composites/oracle-dv/loader"], 
                function($, ko, application) {
                  application.setSecurityConfig("token", {
                    tokenAuthFunction: function() { return token; }
                  });
                  if (!window.bindingsApplied) {
                    function MyProject() {
                      var self = this;
                      self.projectPath = ko.observable("/@Catalog/users/sm.cgmsc@gmail.com/QC_Sample_Tracking");
                      self.parameters = ko.observable({
                        "p1n": "PARAM_LABID",
                        "p1v": "${user?.facilityId || 'LAB001'}"
                      });
                    }
                    ko.applyBindings(new MyProject());
                    window.bindingsApplied = true;
                    setTimeout(function() {
                      window.parent.postMessage("OAC_LOADED", "*");
                    }, 3000);
                  }
                });
              });
          }
          fetchAndSetToken();
          setInterval(fetchAndSetToken, 45 * 60 * 1000);
        </script>
    </head>
    <body style="margin:0;">
        <div style="width: 100%; height: 100vh;">
          <oracle-dv 
          project-path="[[projectPath]]" 
          active-page="insight" 
          active-tab-id="snapshot!canvas!3"
          parameters="[[parameters]]"
          project-options='{"bShowFilterBar":false}'>
          </oracle-dv>
        </div>
    </body>
    </html>
  `;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4">
            
            {loading && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                <svg className="animate-spin w-10 h-10 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <div className="text-lg font-semibold text-gray-700">
                  Please wait while we load the data...
                </div>
              </div>
            )}

            <div className="space-y-4">
              <iframe
                className="w-full h-[100vh] border-0 rounded-lg shadow-sm"
                srcDoc={iframe1}
                title="QC Batches"
              />
              <iframe
                className="w-full h-[100vh] border-0 rounded-lg shadow-sm"
                srcDoc={iframe2}
                title="QC Sample Tracking"
              />
            </div>
            
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
