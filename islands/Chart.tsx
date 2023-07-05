// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  Chart as ChartJS,
  type ChartConfiguration,
  type ChartType,
  type DefaultDataPoint,
} from "chart.js";
import { type MutableRef, useEffect, useRef } from "preact/hooks";
import type { JSX } from "preact";

type ChartOptions<
  Type extends ChartType,
  Data = DefaultDataPoint<Type>,
  Label = unknown,
> = ChartConfiguration<Type, Data, Label>;

type ChartProps<
  Type extends ChartType,
  Data = DefaultDataPoint<Type>,
  Label = unknown,
> = ChartOptions<Type, Data, Label> & {
  canvas?: JSX.HTMLAttributes<HTMLCanvasElement>;
  container?: JSX.HTMLAttributes<HTMLDivElement>;
};

function useChart<
  Type extends ChartType,
  Data = DefaultDataPoint<Type>,
  Label = unknown,
>(options: ChartOptions<Type, Data, Label>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS<Type, Data, Label> | null>(null);

  useEffect(() => {
    if (canvasRef.current === null) {
      throw new Error("canvas is null");
    }
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    chartRef.current = new ChartJS(canvasRef.current, { ...options });

    return () => {
      chartRef.current?.destroy();
    };
  }, [options]);

  return { canvasRef, chartRef, containerRef };
}

function useResizeObserver<T extends HTMLElement | null>(
  ref: MutableRef<T>,
  callback: ResizeObserverCallback,
) {
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(callback);
    observer.observe(ref.current as HTMLElement);

    return () => {
      observer.disconnect();
    };
  }, [ref]);
}

export default function Chart<
  Type extends ChartType,
>(
  { canvas, container, ...options }: ChartProps<Type>,
) {
  const { canvasRef, chartRef, containerRef } = useChart(options);

  useResizeObserver(containerRef, (entries) => {
    if (!Array.isArray(entries)) return;
    const entry = entries?.[0];
    if (!entry) return;

    chartRef.current?.resize(entry.contentRect.width, entry.contentRect.height);
  });

  useEffect(() => {
    chartRef.current?.render();
  }, []);

  return (
    <div
      {...container}
      ref={containerRef}
    >
      <canvas
        {...canvas}
        ref={canvasRef}
      />
    </div>
  );
}
