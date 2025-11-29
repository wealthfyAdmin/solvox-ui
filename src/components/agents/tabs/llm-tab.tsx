"use client";

import type React from "react";
import type { AgentRecord } from "@/app/(admin)/(others-pages)/agent-setup/page";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {children}
    </section>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{children}</p>;
}

const LLM_PROVIDERS = [
  { value: "google", label: "Google" },
];

const LLM_MODELS = {
  google: [
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  ],
};

export default function LLMTab({
  agent,
  onUpdate,
  disabled,
}: {
  agent: AgentRecord | null;
  onUpdate: (patch: Partial<AgentRecord>) => void;
  disabled?: boolean;
}) {
  // ✔ Correct provider read (from DB)
  const currentProvider = agent?.llm_provider || "google";

  // ✔ Correct model list
  const availableModels = LLM_MODELS[currentProvider as keyof typeof LLM_MODELS] || [];

  // ✔ Correct model default (first model from provider)
  const currentModel =
    agent?.llm_model ||
    (availableModels.length > 0 ? availableModels[0].value : "");

  return (
    <div className="space-y-6 dark:text-white">
      <Section title="Choose LLM model">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* PROVIDER SELECT */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Provider
            </label>

            <select
              disabled={disabled}
              value={currentProvider}
              onChange={(e) => {
                const provider = e.target.value;

                const defaultModel =
                  LLM_MODELS[provider as keyof typeof LLM_MODELS]?.[0]?.value || "";

                onUpdate({
                  llm_provider: provider, // Correct key
                  llm_model: defaultModel, // Reset model based on provider
                });
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LLM_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* MODEL SELECT */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Model
            </label>

            <select
              disabled={disabled}
              value={currentModel}
              onChange={(e) => onUpdate({ llm_model: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

        </div>
      </Section>

      {/* Knowledge Base */}
      {/* <Section title="Knowledge Base">
        <div className="space-y-3">
          <select
            disabled={disabled}
            value={agent?.document_id || ""}
            onChange={(e) => onUpdate({ document_id: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No knowledge base</option>
            <option value="kb_1">Company Knowledge Base</option>
            <option value="kb_2">Product Documentation</option>
            <option value="kb_3">FAQ Database</option>
          </select>

          <Help>Select a knowledge base for your agent.</Help>
        </div>
      </Section> */}
    </div>
  );
}
