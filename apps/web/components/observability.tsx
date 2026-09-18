"use client";

import { useEffect } from "react";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { track as vercelTrack } from "@vercel/analytics";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { setAnalyticsProvider, type AnalyticsEvent } from "@codeformattools/analytics";

function cleanUrl(value: string): string {
  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split("?")[0]?.split("#")[0] ?? value;
  }
}

function cleanAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: cleanUrl(event.url) };
}

function cleanSpeedEvent<T extends { url: string }>(event: T): T {
  return { ...event, url: cleanUrl(event.url) };
}

function eventProperties(event: AnalyticsEvent): Record<string, string | number | boolean | null | undefined> {
  if (event.name === "related_tool_click") return { from: event.from, to: event.to };
  if (event.name === "tool_error") return { tool: event.tool, action: event.action, code: event.code, inputSize: event.inputSize };
  if (event.name === "tool_start") return { tool: event.tool, action: event.action, inputSize: event.inputSize };
  return { tool: event.tool, action: event.action, success: event.success, inputSize: event.inputSize, durationMs: event.durationMs };
}

export function Observability() {
  useEffect(() => {
    setAnalyticsProvider({ track: event => vercelTrack(event.name, eventProperties(event)) });
  }, []);
  return <>
    <Analytics beforeSend={cleanAnalyticsEvent} />
    <SpeedInsights beforeSend={cleanSpeedEvent} />
  </>;
}
