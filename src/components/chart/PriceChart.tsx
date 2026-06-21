"use client";
import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/types/market";

export type ChartType = "candles" | "line";
export type PriceMode = "price" | "mcap";

/**
 * TradingView Lightweight Charts panel. Supports candle/line series and a
 * price/market-cap scale (market cap = value × circulating supply).
 *
 * The chart is created once; the price series is rebuilt only when the chart
 * type changes, and data flows through refs so polling never recreates it.
 */
export function PriceChart({
  candles,
  chartType,
  priceMode,
  supply,
}: {
  candles: Candle[];
  chartType: ChartType;
  priceMode: PriceMode;
  supply: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Create the chart + volume series once.
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

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    volumeSeriesRef.current = volumeSeries;
    return () => {
      chart.remove();
      chartRef.current = null;
      priceSeriesRef.current = null;
    };
  }, []);

  // (Re)create the price series whenever the chart type changes.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (priceSeriesRef.current) chart.removeSeries(priceSeriesRef.current);

    priceSeriesRef.current =
      chartType === "candles"
        ? chart.addSeries(CandlestickSeries, {
            upColor: "#16c784",
            downColor: "#ea4b5a",
            borderVisible: false,
            wickUpColor: "#16c784",
            wickDownColor: "#ea4b5a",
          })
        : chart.addSeries(LineSeries, { color: "#16c784", lineWidth: 2 });
  }, [chartType]);

  // Push data whenever candles / mode / supply / type change.
  useEffect(() => {
    const priceSeries = priceSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!priceSeries || !volumeSeries || candles.length === 0) return;

    const mult = priceMode === "mcap" && supply > 0 ? supply : 1;
    const last = candles[candles.length - 1].close * mult;
    const { precision, minMove } = formatFor(last);
    priceSeries.applyOptions({ priceFormat: { type: "price", precision, minMove } });

    if (chartType === "candles") {
      (priceSeries as ISeriesApi<"Candlestick">).setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open * mult,
          high: c.high * mult,
          low: c.low * mult,
          close: c.close * mult,
        })),
      );
    } else {
      (priceSeries as ISeriesApi<"Line">).setData(
        candles.map((c) => ({ time: c.time as UTCTimestamp, value: c.close * mult })),
      );
    }

    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(22,199,132,0.4)" : "rgba(234,75,90,0.4)",
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles, chartType, priceMode, supply]);

  return <div ref={containerRef} className="h-full w-full" />;
}

/** Choose axis decimal precision (and tick size) based on value magnitude. */
function formatFor(value: number): { precision: number; minMove: number } {
  const v = Math.abs(value);
  let precision: number;
  if (v >= 1000) precision = 0;
  else if (v >= 1) precision = 2;
  else if (v >= 0.01) precision = 4;
  else if (v >= 0.0001) precision = 6;
  else if (v >= 0.000001) precision = 8;
  else precision = 10;
  return { precision, minMove: precision === 0 ? 1 : 1 / 10 ** precision };
}
