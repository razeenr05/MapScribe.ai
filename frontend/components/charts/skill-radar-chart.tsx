"use client"

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

interface SkillRadarChartProps {
  data: {
    subject: string
    value: number
    fullMark: number
  }[]
}

export function SkillRadarChart({ data }: SkillRadarChartProps) {
  // Visually "lift" the polygon off the center so even low values
  // don't collapse into a straight line in the middle of the chart.
  // We keep the true value for tooltips, but use a displayValue with
  // a small offset for nicer aesthetics.
  const chartData = data.map((d) => ({
    ...d,
    originalValue: d.value,
    displayValue: 0.5 + (d.value / 5) * 4.5, // maps 0→0.5, 5→5
    baseline: 0.5,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
        <PolarGrid
          stroke="var(--border)"
          strokeOpacity={0.8}
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "var(--foreground)", fontSize: 11 }}
          tickLine={{ stroke: "var(--border)" }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 5]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          axisLine={{ stroke: "var(--border)" }}
          tickCount={6}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--popover-foreground)",
          }}
          formatter={(_value: number, _name: string, props: any) => {
            const original = props?.payload?.originalValue ?? _value
            return [`Level ${original}`, "Skill"]
          }}
        />
        {/* Baseline polygon so axis structure is always visible */}
        <Radar
          name="Baseline"
          dataKey="baseline"
          stroke="transparent"
          fill="var(--muted)"
          fillOpacity={0.15}
          strokeWidth={0}
          isAnimationActive={false}
        />
        <Radar
          name="Skill Level"
          dataKey="displayValue"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.5}
          strokeWidth={2}
          dot={{ r: 4, fill: "var(--chart-1)" }}
          isAnimationActive={true}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}