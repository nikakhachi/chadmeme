"use client";
import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/types/market";

/**
 * TradingView Lightweight Charts candlestick + volume chart.
 *
 * The chart instance is created once; data updates flow through refs so we
 * never tear down/recreate the chart on each poll (avoids flicker).
 */
export function PriceChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Create the chart once on mount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { color: "transparent" },
        textColor: "#8b8f9a",
        fontFamily: "var(--font-sans)",
      },
      grid: {
        vertLines: { color: "rgba(38,40,47,0.4)" },
        horzLines: { color: "rgba(38,40,47,0.4)" },
      },
      rightPriceScale: { borderColor: "#26282f" },
      timeScale: { borderColor: "#26282f", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 0 },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#16c784",
      downColor: "#ea4b5a",
      borderVisible: false,
      wickUpColor: "#16c784",
      wickDownColor: "#ea4b5a",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    // Pin volume to the bottom 20% of the pane.
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Push new data whenever candles change.
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
    if (candles.length === 0) return;

    // Memecoin prices are often well below $0.01, so the default 2-decimal
    // axis would collapse them to "0.00". Pick a precision from the price
    // magnitude so tiny prices show their significant digits.
    const { precision, minMove } = priceFormatFor(candles[candles.length - 1].close);
    candleSeriesRef.current.applyOptions({
      priceFormat: { type: "price", precision, minMove },
    });

    candleSeriesRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    volumeSeriesRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(22,199,132,0.4)" : "rgba(234,75,90,0.4)",
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} className="h-full w-full" />;
}

/** Choose axis decimal precision (and tick size) based on price magnitude. */
function priceFormatFor(price: number): { precision: number; minMove: number } {
  const p = Math.abs(price);
  let precision: number;
  if (p >= 1) precision = 2;
  else if (p >= 0.01) precision = 4;
  else if (p >= 0.0001) precision = 6;
  else if (p >= 0.000001) precision = 8;
  else precision = 10;
  return { precision, minMove: 1 / 10 ** precision };
}
