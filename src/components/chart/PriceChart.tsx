"use client";
import { useEffect, useRef } from "react";
import {
  createChart,
  createSeriesMarkers,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle, TradeSide } from "@/types/market";
import { formatChartUsd } from "@/lib/utils";

export type ChartType = "candles" | "line";
export type PriceMode = "price" | "mcap";

/** A user's own trade to mark on the chart (unix-seconds time). */
export interface TradeMarker {
  time: number;
  side: TradeSide;
}

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
  markers = [],
  resetKey,
}: {
  candles: Candle[];
  chartType: ChartType;
  priceMode: PriceMode;
  supply: number;
  /** The current user's buy/sell trades for this token. */
  markers?: TradeMarker[];
  /** Changes when the token/interval changes; only then do we re-fit the view
   *  (so live price updates don't reset the user's zoom/pan). */
  resetKey: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const fittedKeyRef = useRef<string | null>(null);

  // Create the chart + volume series once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { color: "transparent" },
        textColor: "#94a3b8",
        fontFamily: "var(--font-sans)",
        fontSize: 13,
      },
      // Group thousands + compact millions on the price axis & crosshair.
      localization: { priceFormatter: formatChartUsd },
      grid: {
        vertLines: { color: "rgba(30,41,59,0.5)" },
        horzLines: { color: "rgba(30,41,59,0.5)" },
      },
      rightPriceScale: { borderColor: "#1e293b" },
      timeScale: { borderColor: "#1e293b", timeVisible: true, secondsVisible: false },
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
            upColor: "#14f195",
            downColor: "#f44134",
            borderVisible: false,
            wickUpColor: "#14f195",
            wickDownColor: "#f44134",
          })
        : chart.addSeries(LineSeries, { color: "#14f195", lineWidth: 2 });

    // Markers attach to a series, so (re)create the plugin with it.
    markersRef.current = createSeriesMarkers(priceSeriesRef.current, []);
  }, [chartType]);

  // Draw the user's buy/sell markers (recreated with the series above).
  useEffect(() => {
    if (!markersRef.current) return;
    const data: SeriesMarker<Time>[] = markers
      .map((m) => ({
        time: m.time as UTCTimestamp,
        position: m.side === "buy" ? ("belowBar" as const) : ("aboveBar" as const),
        color: m.side === "buy" ? "#14f195" : "#f44134",
        shape: m.side === "buy" ? ("arrowUp" as const) : ("arrowDown" as const),
        text: m.side === "buy" ? "B" : "S",
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));
    markersRef.current.setMarkers(data);
  }, [markers, chartType]);

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
        color: c.close >= c.open ? "rgba(20,241,149,0.35)" : "rgba(244,65,52,0.35)",
      })),
    );

    // Only fit the view the first time we see this token/interval — live price
    // updates must not reset the user's manual zoom/pan.
    if (fittedKeyRef.current !== resetKey) {
      chartRef.current?.timeScale().fitContent();
      fittedKeyRef.current = resetKey;
    }
  }, [candles, chartType, priceMode, supply, resetKey]);

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
