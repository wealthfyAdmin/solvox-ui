"use client";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";


interface CallLog {
  id: string;
  caller: string;
  assistant: string;
  date: string;
  duration: string;
  status: "Completed" | "Missed" | "Ongoing";
}

const callLogs: CallLog[] = [
  {
    id: "1",
    caller: "Ravi Kumar",
    assistant: "Syndrome Support",
    date: "2025-08-09 14:32",
    duration: "5m 23s",
    status: "Completed",
  },
 
];


export default function CallLogs() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Call Logs" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className=" mx-auto">
          <h3 className="mb-6 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Recent Calls
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Caller</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Assistant</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Date & Time</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Duration</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {callLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{log.caller}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{log.assistant}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{log.date}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{log.duration}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.status === "Completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : log.status === "Missed"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
