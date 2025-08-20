"use client"
import React, { useState } from "react"
import { Modal } from "../ui/modal"
import { useToast } from "../ui/toast"

export default function OutboundCallButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("+91")
  const [loading, setLoading] = useState(false)

  const { showToast, ToastContainer } = useToast()

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    // Ensure it always starts with +91
    if (!value.startsWith("+91")) {
      value = "+91" + value.replace(/\D/g, "")
    } else {
      // Strip non-numeric characters except + at the start
      value = "+91" + value.slice(3).replace(/\D/g, "")
    }

    setPhoneNumber(value)
  }

  const handleMakeCall = async () => {
    if (phoneNumber.trim() === "+91" || phoneNumber.trim().length < 8) {
      showToast("Please enter a valid phone number", "error")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/outbond-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          assistantName: "outbound-caller",
        }),
      })

      const data = await response.json()

      if (data.success) {
        showToast(
          `Call initiated to ${data.phoneNumber} using agent`,
          "success"
        )
        setIsModalOpen(false)
      } else {
        showToast("Failed to initiate call", "error")
      }
    } catch (err) {
      showToast("Something went wrong while making the call", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Main trigger button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.518 4.553a1 1 0 01-.272 1.058l-1.163 1.163a16.978 16.978 0 006.364 6.364l1.163-1.163a1 1 0 011.058-.272l4.553 1.518a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.82 21 3 14.18 3 6V5z"
          />
        </svg>
        <span className="text-white font-medium">Make Call</span>
      </button>

      {/* Reusable Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          Outbound Call
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Enter the phone number you want to call.
        </p>

        {/* Phone Input */}
        <div className="space-y-1">
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>
          <input
            id="phone"
            type="text"
            value={phoneNumber}
            onChange={handlePhoneChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="+91XXXXXXXXXX"
          />
        </div>

        {/* Call Button */}
        <button
          onClick={handleMakeCall}
          disabled={loading}
          className="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 shadow-md transition disabled:opacity-50"
        >
          {loading ? "Calling..." : "Call"}
        </button>
      </Modal>

      {/* Toast container */}
      <ToastContainer />
    </div>
  )
}
