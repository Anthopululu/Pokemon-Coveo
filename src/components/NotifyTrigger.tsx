"use client";

import { useRef } from "react";
import { buildNotifyTrigger } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

export default function NotifyTrigger() {
  const controller = useRef(buildNotifyTrigger(getSearchEngine())).current;
  const { state } = useCoveoController(controller);

  if (state.notifications.length === 0) return null;

  return (
    <div className="mb-4">
      {state.notifications.map((notification, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 bg-dex-accent-subtle border border-dex-accent/20 rounded-lg text-sm text-dex-text-secondary"
        >
          <svg className="w-4 h-4 text-dex-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{notification}</span>
        </div>
      ))}
    </div>
  );
}
