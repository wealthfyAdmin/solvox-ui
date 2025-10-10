"use client"

import Button from "@/components/ui/button/Button"

export default function WidgetTab({ agentId }: { agentId: string }) {
  const embed = `<vapi-widget assistant-id="${agentId || "ASSISTANT_ID"}" public-key="PUBLIC_KEY"></vapi-widget>

<script src="https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js" async type="text/javascript"></script>`

  async function copy() {
    try {
      await navigator.clipboard.writeText(embed)
    } catch {}
  }

  return (
    <div className="space-y-3 rounded-xl border p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Widget</h3>
        <Button size="sm" variant="outline" onClick={copy}>
          Copy
        </Button>
      </div>
      <p className="text-xs text-muted-foreground dark:text-gray-300">
        Add this conversational widget to your website. Visitors can chat from any page.
      </p>
      <textarea
        readOnly
        value={embed}
        rows={8}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
      />
    </div>
  )
}
