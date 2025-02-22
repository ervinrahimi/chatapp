import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

// Sample data for the chart
const data = [
  { name: "Jan", total: 4000 },
  { name: "Feb", total: 2800 },
  { name: "Mar", total: 4200 },
  { name: "Apr", total: 5800 },
  { name: "May", total: 2500 },
  { name: "Jun", total: 3000 },
  { name: "Jul", total: 2000 },
  { name: "Aug", total: 5500 },
  { name: "Sep", total: 1800 },
  { name: "Oct", total: 3200 },
  { name: "Nov", total: 3800 },
  { name: "Dec", total: 4800 },
]

const ChartCard = () => {
  return (
    <div className="col-span-4">
      <div className="h-full space-y-4 rounded-xl border bg-card p-6 text-card-foreground shadow">
        <div className="flex flex-col space-y-2">
          {/* Title of the chart */}
          <h3 className="text-xl font-semibold">Overview</h3>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              {/* X-axis configuration */}
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              {/* Y-axis configuration */}
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              {/* Bar configuration */}
              <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default ChartCard
