import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Solxox AI | Billing and Usage",
  description: "Manage Billing and Usage",
};

export default function BillingUsage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Billing and Usage" />

      <div className="min-h-screen space-y-8">
        {/* Billing Section */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 dark:from-white/[0.03] dark:to-white/[0.02] shadow-sm hover:shadow-md transition px-5 py-7 xl:px-10 xl:py-12">
          <h3 className="mb-6 font-semibold text-gray-900 text-2xl dark:text-white/90">
            Billing Information
          </h3>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Card Display */}
            <div className="rounded-xl bg-gradient-to-tr from-brand-500 to-brand-600 p-5 w-full sm:w-auto text-white shadow-md">
              <p className="text-sm opacity-80">Payment Method</p>
              <p className="mt-1 font-semibold text-lg tracking-wider">
                **** **** **** 4242
              </p>
              <p className="text-xs opacity-70">Exp: 08/26</p>
            </div>
            {/* Update Button */}
            <button className="rounded-lg bg-brand-500 px-5 py-2 text-white font-medium hover:bg-brand-600 shadow-md transition">
              Update Payment Method
            </button>
          </div>
        </div>

        {/* Usage Section */}
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 dark:from-white/[0.03] dark:to-white/[0.02] shadow-sm hover:shadow-md transition px-5 py-7 xl:px-10 xl:py-12">
          <h3 className="mb-6 font-semibold text-gray-900 text-2xl dark:text-white/90">
            Usage Summary
          </h3>

          <div className="space-y-8">
            {/* Current Plan */}
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="font-semibold text-gray-900 text-lg dark:text-white">
                Pro Plan – ₹999 / month
              </p>
            </div>

            {/* API Calls Usage */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="text-sm text-gray-500">API Calls</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  7,200 / 10,000
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-500 to-brand-400 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: "72%" }}
                ></div>
              </div>
            </div>

            {/* Storage Usage */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="text-sm text-gray-500">Storage</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  4.5 GB / 10 GB
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: "45%" }}
                ></div>
              </div>
            </div>

            {/* Next Billing Date */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">Next Billing Date</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                01 September 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
