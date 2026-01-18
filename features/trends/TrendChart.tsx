"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TextEntry, TrendPoint } from "./types";
import { buildDuplicateDateLabels } from "./utils";

type TrendSparklineProps = {
  points: TrendPoint[];
  compact?: boolean;
  ariaLabel?: string;
};

export const COMPACT_CHART_DIMENSIONS = {
  height: 160,
} as const;

export const COMPACT_WIDTH_PER_POINT = 120;

export const COMPACT_CHART_MARGINS = {
  top: 16,
  right: 20,
  bottom: 34,
  left: 28,
} as const;

const FULL_CHART_DIMENSIONS = {
  height: 240,
} as const;

const FULL_WIDTH_PER_POINT = 140;

const FULL_CHART_MARGINS = {
  top: 20,
  right: 24,
  bottom: 36,
  left: 32,
} as const;

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(220 70% 50%)",
  },
} satisfies ChartConfig;

export const TrendSparkline = ({
  points,
  compact = false,
  ariaLabel,
}: TrendSparklineProps) => {
  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-12 text-xs text-muted-foreground border border-dashed border-border rounded-lg"
        role="img"
        aria-label={ariaLabel ?? "No trend data available"}
      >
        No data yet
      </div>
    );
  }

  const renderPoints = points;
  const dateLabels = buildDuplicateDateLabels(renderPoints.map((point) => point.date));
  const chartData = renderPoints.map((point, index) => ({
    index,
    dateLabel: dateLabels[index],
    value: point.value,
    valueLabel: point.valueRaw ?? String(point.value),
  }));

  const isDense = renderPoints.length > (compact ? 10 : 14);
  const dimensions = compact ? COMPACT_CHART_DIMENSIONS : FULL_CHART_DIMENSIONS;
  const widthPerPoint = compact ? COMPACT_WIDTH_PER_POINT : FULL_WIDTH_PER_POINT;
  const margins = compact ? COMPACT_CHART_MARGINS : FULL_CHART_MARGINS;
  const spacingCount = Math.max(1, renderPoints.length - 1);
  const chartWidth =
    spacingCount * widthPerPoint + margins.left + margins.right;
  const tickIndexes = renderPoints.map((_, index) => index);
  const yValues = renderPoints
    .map((point) => point.value)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  const yTicks = Array.from(new Set(yValues));
  const yMin = yTicks[0] ?? 0;
  const yMax = yTicks[yTicks.length - 1] ?? 0;

  return (
    <div
      className="overflow-x-auto max-w-full"
      role="img"
      aria-label={ariaLabel ?? "Trend chart"}
    >
      <ChartContainer
        config={chartConfig}
        className="aspect-auto"
        style={{
          width: chartWidth,
          minWidth: chartWidth,
          height: dimensions.height,
          minHeight: dimensions.height,
        }}
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={margins}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <YAxis
            type="number"
            domain={[yMin, yMax]}
            ticks={yTicks}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            fontSize={9}
          />
          <XAxis
            dataKey="index"
            type="number"
            ticks={tickIndexes}
            tickFormatter={(value) => chartData[Number(value)]?.dateLabel ?? ""}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            fontSize={9}
            interval={0}
            minTickGap={0}
          />
          <ChartTooltip
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value, _name, item) => {
                  const payload = item?.payload as { valueLabel?: string } | undefined;
                  return payload?.valueLabel ?? value;
                }}
                labelFormatter={(value) => chartData[Number(value)]?.dateLabel ?? ""}
              />
            }
          />
          <Line
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={
              isDense
                ? false
                : {
                  fill: "var(--color-value)",
                  r: 4,
                  strokeWidth: 2,
                  stroke: "hsl(var(--background))",
                }
            }
            activeDot={{
              r: isDense ? 4 : 6,
              strokeWidth: isDense ? 1 : 2,
            }}
          >
            <LabelList
              dataKey="valueLabel"
              position="top"
              offset={6}
              className="fill-foreground"
              fontSize={10}
              fontWeight={600}
            />
          </Line>
        </LineChart>
      </ChartContainer>
    </div>
  );
};

type TrendTextResultsProps = {
  entries: TextEntry[];
  compact?: boolean;
  limit?: number;
  showHeading?: boolean;
};

export const TrendTextResults = ({
  entries,
  compact = false,
  limit,
  showHeading = true,
}: TrendTextResultsProps) => {
  const visibleEntries = limit ? entries.slice(0, limit) : entries;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {showHeading && (
        <h3 className="text-sm font-semibold text-foreground">Text results</h3>
      )}
      <div className={compact ? "space-y-1" : "space-y-2"}>
        {visibleEntries.map((entry) => (
          <div
            key={`${entry.reportId}-${entry.date}-${entry.value}`}
            className={`flex items-center justify-between rounded-md border border-border ${compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
              }`}
          >
            <span className="text-foreground">{entry.value}</span>
            <span className="text-muted-foreground">
              {formatDate(entry.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
