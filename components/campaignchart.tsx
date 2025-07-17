"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts"

const data = [
  {
    date: "Jul 01",
    facebook: 450,
    google: 390
  },
  {
    date: "Jul 02",
    facebook: 700,
    google: 620
  },
  {
    date: "Jul 03",
    facebook: 500,
    google: 460
  },
  {
    date: "Jul 04",
    facebook: 800,
    google: 720
  },
  {
    date: "Jul 05",
    facebook: 750,
    google: 680
  }
]

export function CampaignChart() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Campanhas Facebook vs Google</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="facebook"
              stroke="#3b82f6"
              name="Facebook Ads"
            />
            <Line
              type="monotone"
              dataKey="google"
              stroke="#10b981"
              name="Google Ads"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
