"use client";
import React from "react";

interface PhoneCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCall: (number: string) => void;
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  isLoading?: boolean;
}

export default function PhoneCallModal({
  isOpen,
  onClose,
  onCall,
  phoneNumber,
  setPhoneNumber,
  isLoading = false
}: PhoneCallModalProps) {
  if (!isOpen) return null;

  const handleCall = () => {
    if (phoneNumber.trim()) {
      onCall(phoneNumber.trim());
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Blurred background overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50"
        onClick={handleOverlayClick}
      />

      {/* Modal dialog centered on screen */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-xl pointer-events-auto">
          {/* Header with close button */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Make a Phone Call</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Phone number input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border-2 border-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              autoFocus
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCall();
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">Enter the phone number you want to call</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCall}
              disabled={!phoneNumber.trim() || isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Calling...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Make Call
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
