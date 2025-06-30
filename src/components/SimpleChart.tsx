
import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface SimpleLineChartProps {
  data: any[]
  xKey: string
  yKey: string
  color?: string
}

export function SimpleLineChart({ data, xKey, yKey, color = "#8884d8" }: SimpleLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={yKey} stroke={color} />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface SimplePieChartProps {
  data: Array<{ name: string; value: number; color: string }>
}

export function SimplePieChart({ data }: SimplePieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: { name: string; percent?: number }) => 
            `${name} ${percent ? Math.round(percent * 100) : 0}%`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
