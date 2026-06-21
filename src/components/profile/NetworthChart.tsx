"use client";
import { useEffect, useRef } from "react";
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { NetworthPoint } from "@/types/trading";

/** Account net-worth over time, rendered as a smooth area chart. */
export function NetworthChart({ points }: { points: NetworthPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: { background: { color: "transparent" }, textColor: "#8b8f9a", fontFamily: "var(--font-sans)" },
      grid: { vertLines: { visible: false }, horzLines: { color: "rgba(38,40,47,0.4)" } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true },
      crosshair: { mode: 0 },
      autoSize: true,
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#16c784",
      topColor: "rgba(22,199,132,0.35)",
      bottomColor: "rgba(22,199,132,0.0)",
      lineWidth: 2,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || points.length === 0) return;
    seriesRef.current.setData(
      points.map((p) => ({ time: p.time as UTCTimestamp, value: p.valueUsd })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  return <div ref={containerRef} className="h-full w-full" />;
}
