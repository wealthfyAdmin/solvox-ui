"use client"
import React, { useState } from "react"
import { Modal } from "../ui/modal"
import { useToast } from "../ui/toast"

interface OutboundCallButtonProps {
  name: string
  open?: boolean
  onClose?: () => void
}

export default function OutboundCallButton({
  name,
  open,
  onClose,
}: OutboundCallButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(open || false)
  const [phoneNumber, setPhoneNumber] = useState("+91")
  const [loading, setLoading] = useState(false)
  const { showToast, ToastContainer } = useToast()

  // Sync external open/close props
  React.useEffect(() => {
    if (typeof open === "boolean") setIsModalOpen(open)
  }, [open])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    if (!value.startsWith("+91")) {
      value = "+91" + value.replace(/\D/g, "")
    } else {
      value = "+91" + value.slice(3).replace(/\D/g, "")
    }
    setPhoneNumber(value)
  }
  console.log(name)

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
          assistantName: name || "default-agent",
        }),
      })

      const data = await response.json()
      if (data.success) {
        showToast(`Call initiated to ${data.phoneNumber} using ${name}`, "success")
        setIsModalOpen(false)
        onClose?.()
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
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          onClose?.()
        }}
        className="max-w-md p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
          Outbound Call
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Call using <span className="font-semibold">{name}</span>
        </p>

        <div className="space-y-1">
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Phone Number
          </label>
          <input
            id="phone"
            type="text"
            value={phoneNumber}
            onChange={handlePhoneChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="+91XXXXXXXXXX"
          />
        </div>

        <button
          onClick={handleMakeCall}
          disabled={loading}
          className="mt-6 w-full bg-blue-600 dark:bg-blue-700 text-white py-2.5 rounded-lg 
                 hover:bg-blue-700 dark:hover:bg-blue-800 shadow-md transition disabled:opacity-50"
        >
          {loading ? "Calling..." : "Call"}
        </button>
      </Modal>

      <ToastContainer />
    </>
  )
}
