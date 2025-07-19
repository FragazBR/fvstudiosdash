import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change: string
  changeText: string
  icon: React.ElementType
  trend: "up" | "down" | "neutral"
}

export function StatCard({ title, value, change, changeText, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="bg-white/95 dark:bg-[#171717]/80 border border-gray-200 dark:border-[#272727] backdrop-blur-xl hover:border-gray-300 dark:hover:border-[#64f481]/30 transition-colors duration-200 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-[#1f1f1f] flex items-center justify-center">
            <Icon className="h-6 w-6 text-gray-500 dark:text-[#6b7280]" />
          </div>
          <div
            className={cn(
              "flex items-center text-sm font-medium font-inter",
              trend === "up" && "text-[#64f481] dark:text-[#64f481]",
              trend === "down" && "text-red-400 dark:text-red-400",
              trend === "neutral" && "text-gray-500 dark:text-[#737373]",
            )}
          >
            {trend === "up" && <ArrowUpRight className="h-4 w-4 mr-1" />}
            {trend === "down" && <ArrowDownRight className="h-4 w-4 mr-1" />}
            {change}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-[#737373] font-inter">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1 font-inter">{value}</p>
          <p className="text-xs text-gray-500 dark:text-[#737373] mt-1 font-inter">{changeText}</p>
        </div>
      </CardContent>
    </Card>
  )
}
