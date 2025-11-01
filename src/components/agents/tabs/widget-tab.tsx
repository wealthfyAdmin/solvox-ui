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

  // ✅ Automatically switch between local & live environment
 const embedScript = useMemo(() => {
  // Always use production URL for external embeds
  const isLocalAdmin = hostUrl.includes("localhost") || hostUrl.includes("127.0.0.1")
  const origin = isLocalAdmin ? "http://localhost:3000" : "https://solvox-ui-464m.vercel.app"
  const agentId = agent?.name || "AGENT_ID"

  // When generating embed script, always use production host
  const scriptOrigin = "https://solvox-ui-464m.vercel.app"

  return `<!-- Start of Voice Agent Script -->
<script type="text/javascript">
document.addEventListener("DOMContentLoaded", function() {
  var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
  s1.async=true;
  s1.src='${scriptOrigin}/embed.js';
  s1.setAttribute('data-agent-id', '${agentId}');
  s1.charset='UTF-8';
  s1.crossOrigin='anonymous';
  s0.parentNode.insertBefore(s1,s0);
});
</script>
<!-- End of Voice Agent Script -->`
}, [agent?.name, hostUrl])


  const testUrl = useMemo(() => {
    if (!hostUrl || !agent?.name) return ""
    return `${hostUrl}/embed/test?agentId=${encodeURIComponent(agent.name)}`
  }, [agent?.name, hostUrl])

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

      {/* Embed Code Section */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <code className="text-xs">&lt;&gt;</code> Embed Code
          </h4>
          <Button size="sm" variant="outline" onClick={copyToClipboard}>
            Copy Code
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
