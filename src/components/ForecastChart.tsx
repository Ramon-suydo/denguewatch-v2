import { Area, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { colors } from "../theme/palette.js";
import { formatDate } from "../lib/dates";
export interface ForecastPoint { date: string; observed?: number | null; estimate: number | null; band80: number[] | null; band95: number[] | null }
export function ForecastChart({ data }: { data: ForecastPoint[] }) {
  const estimates = data.filter(point => point.estimate !== null);
  return <><p className="chart-takeaway">{estimates.length ? `Cached estimates range from ${Math.min(...estimates.map(point => point.estimate!)).toLocaleString("en-PH")} to ${Math.max(...estimates.map(point => point.estimate!)).toLocaleString("en-PH")} weekly cases across the displayed forecast dates.` : "No forecast estimates are available for the displayed dates."}</p><div className="history-chart">
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <ComposedChart data={data} accessibilityLayer margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} stroke={colors.neutral[200]} strokeDasharray="4 4" />
        <XAxis dataKey="date" minTickGap={60} tick={{ fill: colors.neutral[600] }} tickFormatter={date => formatDate(String(date))} />
        <YAxis allowDecimals={false} width={55} tick={{ fill: colors.neutral[600] }} />
        <Tooltip labelFormatter={date => formatDate(String(date))} />
        <Area dataKey="band95" name="95% interval" type="linear" stroke={colors.neutral[500]} fill={colors.neutral[200]} fillOpacity={.7} isAnimationActive={false} />
        <Area dataKey="band80" name="80% interval" type="linear" stroke={colors.navy[600]} fill={colors.navy[100]} fillOpacity={.8} isAnimationActive={false} />
        <Line dataKey="observed" name="Observed cases" stroke={colors.neutral[600]} dot={false} isAnimationActive={false} />
        <Line dataKey="estimate" name="Estimate" stroke={colors.navy[600]} strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  </div></>;
}
