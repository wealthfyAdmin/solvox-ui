"use client"

import { useMemo, useState, useEffect } from "react"
import Button from "@/components/ui/button/Button"
import type { AgentRecord } from "@/app/(admin)/(others-pages)/agent-setup/page"

function sanitize<T extends object>(obj: T) {
  return JSON.parse(JSON.stringify(obj))
}

export default function WidgetTab({ agent }: { agent: AgentRecord | null }) {
  const [hostUrl, setHostUrl] = useState("https://your-app.example.com")

  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      setHostUrl((prev) => (prev.includes("your-app.example.com") ? window.location.origin : prev))
    }
  }, [])

  const embed = useMemo(() => {
    const origin = hostUrl.replace(/\/$/, "")
    const assistantId = agent?.id || "ASSISTANT_ID"
    const orgId = agent?.orgId

    const qp = new URLSearchParams()
    qp.set("assistantId", assistantId)
    if (orgId) qp.set("orgId", orgId)

    // Minimal snippet: create a floating launcher that opens /widget in a new tab
    return ` Solvox AI Widget 
<div id="solvox-widget-root"></div>
<script>
(function() {
  var ROOT_ID = "solvox-widget-root";
  var d = document;
  var root = d.getElementById(ROOT_ID);
  if (!root) {
    root = d.createElement("div");
    root.id = ROOT_ID;
    d.body.appendChild(root);
  }

  var url = "${origin}/widget?${qp.toString()}";

  var b = d.createElement("button");
  b.type = "button";
  b.setAttribute("aria-label", "Open AI Assistant");
  b.style.position = "fixed";
  b.style.bottom = "16px";
  b.style.right = "16px";
  b.style.zIndex = "2147483001";
  b.style.width = "56px";
  b.style.height = "56px";
  b.style.borderRadius = "50%";
  b.style.border = "none";
  b.style.cursor = "pointer";
  b.style.background = "#2563eb";
  b.style.color = "#fff";
  b.style.boxShadow = "0 10px 25px rgba(0,0,0,0.25)";
  b.style.display = "flex";
  b.style.alignItems = "center";
  b.style.justifyContent = "center";
  b.style.fontSize = "20px";
  b.style.lineHeight = "1";
  b.innerHTML = "💬";

  b.addEventListener("click", function() {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {}
  });

  root.appendChild(b);
})();
</script>`
  }, [agent?.id, agent?.orgId, hostUrl])

  const previewUrl = useMemo(() => {
    try {
      const origin = hostUrl.replace(/\/$/, "")
      const qp = new URLSearchParams()
      const assistantId = agent?.id || "ASSISTANT_ID"
      qp.set("assistantId", assistantId)
      if (agent?.orgId) qp.set("orgId", agent.orgId)
      return `${origin}/embed?${qp.toString()}`
    } catch {
      return ""
    }
  }, [agent?.id, agent?.orgId, hostUrl])

  async function copy() {
    try {
      await navigator.clipboard.writeText(embed)
    } catch {}
  }

  return (
    <div className="space-y-3 rounded-xl border p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Widget</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => previewUrl && window.open(previewUrl, "_blank", "noopener,noreferrer")}
          >
            Preview Widget
          </Button>
          <Button size="sm" variant="outline" onClick={copy}>
            Copy Snippet
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs text-muted-foreground dark:text-gray-300">Widget Host URL</label>
        <input
          value={hostUrl}
          onChange={(e) => setHostUrl(e.target.value)}
          placeholder="https://your-app.example.com"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-muted-foreground dark:text-gray-300">
          The floating launcher opens a new tab at {"{host}/widget"} with the assistantId, ensuring the widget always
          reflects live agent changes.
        </p>
      </div>

      <p className="text-xs text-muted-foreground dark:text-gray-300">
        Paste this snippet into any website to show a floating launcher. Clicking it opens a full-page chatbot where you
        can implement text and voice for the selected agent.
      </p>

      <textarea
        readOnly
        value={embed}
        rows={12}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
      />
    </div>
  )
}
