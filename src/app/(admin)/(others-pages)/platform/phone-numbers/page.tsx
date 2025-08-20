"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React, { useState } from "react";



const phoneNumbers: string[] = [
  "+91 98765 43210",
  "+91 99887 66554",
  "+91 91234 56789",
  "+91 94567 12345",
  "+91 98123 45678",
  "+91 97654 32109",
  "+91 98765 87654",
  "+91 91234 99887",
];

export default function PhoneNumbers() {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const totalPages = Math.ceil(phoneNumbers.length / rowsPerPage);
  const paginatedNumbers = phoneNumbers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div>
      <PageBreadcrumb pageTitle="Phone Numbers" />
      <div className="space-y-6">
        <ComponentCard title="All Phone Numbers">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Phone Number
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedNumbers.map((number) => (
                  <tr
                    key={number}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      {number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-6 space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-sm disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded-md text-sm ${
                  currentPage === i + 1
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
