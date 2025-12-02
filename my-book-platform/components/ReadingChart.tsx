'use client'

interface ReadingChartProps {
  data: { month: string; count: number }[]
}

export default function ReadingChart({ data }: ReadingChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">📈 월별 독서량</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.month} className="flex items-center gap-3">
            <div className="w-16 text-sm text-gray-600">{item.month}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              >
                {item.count > 0 && (
                  <span className="text-white text-sm font-semibold">{item.count}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}