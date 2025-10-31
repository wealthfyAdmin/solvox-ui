"use client"

import { useMemo, useState, useEffect } from "react"
import Button from "@/components/ui/button/Button"
import type { AgentRecord } from "@/app/(admin)/(others-pages)/agent-setup/page"

export default function WidgetTab({ agent, disabled }: { agent: AgentRecord | null; disabled?: boolean }) {
  const [hostUrl, setHostUrl] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      setHostUrl(window.location.origin)
    }
  }, [])

  const embedScript = useMemo(() => {
    const origin = hostUrl || "https://your-domain.com"
    const agentId = agent?.name || "AGENT_ID"

return `<!-- Start of Voice Agent Script -->
<script type="text/javascript">
document.addEventListener("DOMContentLoaded", function() {
  var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
  s1.async=true;
  s1.src='${origin}/embed.js';
  s1.setAttribute('data-agent-id', '${agentId}');
  s1.charset='UTF-8';
  s1.crossOrigin='anonymous';
  s0.parentNode.insertBefore(s1,s0);
});
</script>
<!-- End of Voice Agent Script -->`

  }, [agent?.display_name, hostUrl])

  const testUrl = useMemo(() => {
    if (!hostUrl || !agent?.display_name) return ""
    return `${hostUrl}/embed/test?agentId=${encodeURIComponent(agent.name)}`
  }, [agent?.display_name, hostUrl])

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(embedScript)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Embed Script</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Add this script to any website to enable voice support widget
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => testUrl && window.open(testUrl, "_blank", "noopener,noreferrer")}
          disabled={!testUrl}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          ▶ Test Widget
        </Button>
      </div>

      {/* Widget Features */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Widget Features</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Floating Button</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Elegant microphone icon at bottom-right</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Slide-in Panel</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Smooth animation from right side</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Voice Conversation</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Real-time AI voice interaction</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Mobile Responsive</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Optimized for all screen sizes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code Section */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <code className="text-xs">&lt;&gt;</code> Embed Code
          </h4>
          <Button size="sm" variant="outline" onClick={copyToClipboard}>
            📋 Copy Code
          </Button>
        </div>
        <textarea
          readOnly
          value={embedScript}
          rows={8}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-xs font-mono"
        />
      </div>

      {/* Installation Instructions */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Installation Instructions</h4>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
              1
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Copy the embed script</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Click the "Copy Code" button above to copy the script to your clipboard
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Paste into your website</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Add the script before the closing{" "}
                <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">&lt;/body&gt;</code> tag in your
                HTML
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
              3
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Test it out</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Reload your website and the voice widget button should appear at the bottom right
              </p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  )
}
