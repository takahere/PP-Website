'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'

// グラフの色
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

interface SheetRow {
  [key: string]: string | number | null
}

interface SheetChartProps {
  type: 'line' | 'bar' | 'pie' | 'area'
  data: SheetRow[]
  dataKeys: string[]
  xAxisKey: string
}

export function SheetChart({ type, data, dataKeys, xAxisKey }: SheetChartProps) {
  // ヘッダー行を除外（最初の行がテキストのみの場合）
  const chartData = data.filter((row, index) => {
    if (index === 0) {
      // 最初の行の値がすべて文字列ならヘッダーとして除外
      const values = Object.values(row)
      const allStrings = values.every((v) => typeof v === 'string')
      return !allStrings
    }
    return true
  })

  // 数値データに変換
  const processedData = chartData.map((row) => {
    const processed: Record<string, string | number> = {}
    Object.entries(row).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        processed[key] = 0
      } else if (typeof value === 'string') {
        const num = parseFloat(value.replace(/,/g, ''))
        processed[key] = isNaN(num) ? value : num
      } else {
        processed[key] = value
      }
    })
    return processed
  })

  if (processedData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        データがありません
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                typeof value === 'string' && value.length > 10
                  ? value.slice(-5)
                  : value
              }
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) =>
                typeof value === 'number' ? value.toLocaleString() : value
              }
            />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                typeof value === 'string' && value.length > 10
                  ? value.slice(0, 10) + '...'
                  : value
              }
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) =>
                typeof value === 'number' ? value.toLocaleString() : value
              }
            />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={COLORS[index % COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                typeof value === 'string' && value.length > 10
                  ? value.slice(-5)
                  : value
              }
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) =>
                typeof value === 'number' ? value.toLocaleString() : value
              }
            />
            <Legend />
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        )

      case 'pie':
        // 円グラフの場合、最初のデータキーを使用
        const pieKey = dataKeys[0]
        return (
          <PieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              dataKey={pieKey}
              nameKey={xAxisKey}
              label={({ name, percent }) =>
                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {processedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                typeof value === 'number' ? value.toLocaleString() : value
              }
            />
            <Legend />
          </PieChart>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

