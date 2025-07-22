"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, CheckSquare, FileText, Users, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "projects" | "people">("tasks")
  const [searchQuery, setSearchQuery] = useState("")
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close on escape key
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey)
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Mock search results
  const searchResults = {
    tasks: [
      {
        id: 1,
        title: "Create Wireframes - User Profile Page",
        project: "Figma Design System",
        icon: "briefcase",
      },
      {
        id: 2,
        title: "Account Dashboard Wireframe",
        project: "Figma Design System",
        icon: "pen",
      },
      {
        id: 3,
        title: "Implement Dark Mode - Mobile Application",
        project: "Figma Design System",
        icon: "moon",
      },
      {
        id: 4,
        title: "Create Wireframes - User Profile Page",
        project: "Figma Design System",
        icon: "pen",
      },
    ],
    projects: [
      {
        id: 1,
        title: "Figma Design System",
        status: "in-progress",
      },
      {
        id: 2,
        title: "Keep React",
        status: "planning",
      },
      {
        id: 3,
        title: "StaticMania",
        status: "completed",
      },
    ],
    people: [
      {
        id: 1,
        name: "Alex Morgan",
        role: "UI Designer",
        avatar: "/avatars/alex-morgan.png",
      },
      {
        id: 2,
        name: "Jessica Chen",
        role: "Frontend Developer",
        avatar: "/avatars/jessica-chen.png",
      },
      {
        id: 3,
        name: "Ryan Park",
        role: "Project Manager",
        avatar: "/avatars/ryan-park.png",
      },
    ],
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div ref={modalRef} className="w-full max-w-2xl rounded-xl bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727] shadow-2xl md:p-3 max-h-[400px] md:max-h-[600px] overflow-y-auto" aria-modal="true" role="dialog">
        {/* Search input */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search here..."
              className="pl-10 pr-4 py-2 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-[#272727]">
          <div className="flex flex-wrap gap-3 px-4">
            <TabButton
              active={activeTab === "tasks"}
              onClick={() => setActiveTab("tasks")}
              icon={<CheckSquare className="h-4 w-4 mr-2" />}
            >
              Tasks
            </TabButton>
            <TabButton
              active={activeTab === "projects"}
              onClick={() => setActiveTab("projects")}
              icon={<FileText className="h-4 w-4 mr-2" />}
            >
              Projects
            </TabButton>
            <TabButton
              active={activeTab === "people"}
              onClick={() => setActiveTab("people")}
              icon={<Users className="h-4 w-4 mr-2" />}
            >
              People
            </TabButton>
          </div>
        </div>

        {/* Results */}
        <div className=" p-2">
          {activeTab === "tasks" && (
            <div className="space-y-2">
              {searchResults.tasks.map((task) => (
                <div
                  key={`task-${task.id}`}
                  className="flex items-center rounded-md p-3 hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 cursor-pointer"
                >
                  {task.icon === "briefcase" && (
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                      <span className="text-lg">💼</span>
                    </div>
                  )}
                  {task.icon === "pen" && (
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      <span className="text-lg">✏️</span>
                    </div>
                  )}
                  {task.icon === "moon" && (
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 text-purple-700">
                      <span className="text-lg">🌙</span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{task.title}</div>
                    <div className="mt-1 flex items-center">
                      <span className="inline-flex items-center rounded-full bg-slate-50 dark:bg-slate-900/20 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-400">
                        <span className="mr-1 text-xs">🎨</span> {task.project}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-2">
              {searchResults.projects.map((project) => (
                <div
                  key={`project-${project.id}`}
                  className="flex items-center rounded-md p-3 hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 cursor-pointer"
                >
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{project.title}</div>
                    <div className="mt-1">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-1 text-xs font-medium",
                          project.status === "planning" && "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400",
                          project.status === "in-progress" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
                          project.status === "completed" && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
                        )}
                      >
                        {project.status === "in-progress"
                          ? "In Progress"
                          : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "people" && (
            <div className="space-y-2">
              {searchResults.people.map((person) => (
                <div
                  key={`person-${person.id}`}
                  className="flex items-center rounded-md p-3 hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 cursor-pointer"
                >
                  <div className="mr-3 h-10 w-10 overflow-hidden rounded-full">
                    <img
                      src={person.avatar || "/placeholder.svg"}
                      alt={person.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{person.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{person.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap gap-2 items-center justify-between border-t border-gray-200 dark:border-[#272727] p-4">
          <Button variant="outline" size="sm" onClick={onClose} className="flex items-center">
            <X className="mr-2 h-4 w-4" />
            Return
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center text-blue-600 dark:text-blue-400">
            To View All Results
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  icon?: React.ReactNode
}

function TabButton({ active, onClick, children, icon }: TabButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center px-4 py-3 text-sm font-medium border-b-2 -mb-px",
        active
          ? "border-slate-600 dark:border-[#64f481] text-slate-600 dark:text-[#64f481]"
          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-[#272727]",
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  )
}
