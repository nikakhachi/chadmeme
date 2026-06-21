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
import { formatChartUsd } from "@/lib/utils";

/** Account net-worth over time, rendered as a smooth area chart. */
export function NetworthChart({ points }: { points: NetworthPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: { background: { color: "transparent" }, textColor: "#94a3b8", fontFamily: "var(--font-sans)", fontSize: 13 },
      localization: { priceFormatter: formatChartUsd },
      grid: { vertLines: { visible: false }, horzLines: { color: "rgba(30,41,59,0.5)" } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true },
      crosshair: { mode: 0 },
      autoSize: true,
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#14f195",
      topColor: "rgba(20,241,149,0.30)",
      bottomColor: "rgba(20,241,149,0.0)",
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
    // Lightweight Charts needs strictly-ascending, unique timestamps. Dedupe by
    // time (keeping the latest value) and sort, so colliding snapshots / the
    // appended live point can't break the series.
    const byTime = new Map<number, number>();
    for (const p of points) byTime.set(p.time, p.valueUsd);
    const data = [...byTime.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([time, value]) => ({ time: time as UTCTimestamp, value }));

    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  return <div ref={containerRef} className="h-full w-full" />;
}
