"use client"

import { useState, useEffect } from "react"
import SimpleCalendarView from "./simple-calendar-view"

interface CalendarWrapperProps {
  view: "month" | "week" | "day"
  filterProject: string | null
  filterAssignee: string | null
}

export default function CalendarWrapper(props: CalendarWrapperProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="">
        <div className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 rounded-lg transition-all duration-200">
          <div className="flex items-center justify-center h-[500px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-[#64f481]"></div>
          </div>
        </div>
      </div>
    )
  }

  return <SimpleCalendarView {...props} />
}
