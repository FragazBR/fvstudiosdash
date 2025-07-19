'use client'

import { useState, useEffect } from "react";
import { X, Palette, Monitor, Moon, Sun, Layout, BarChart3, Zap, Bell, Volume2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";

interface AdvancedSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedSettingsPanel({ isOpen, onClose }: AdvancedSettingsPanelProps) {
  const { theme, setTheme } = useTheme();
  
  // Estados das configurações
  const [activeSection, setActiveSection] = useState("theme");
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState([75]);
  const [dashboardLayout, setDashboardLayout] = useState("vertical");
  const [sidebar, setSidebar] = useState("classic");
  const [contentWidth, setContentWidth] = useState("wide");
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [showTeam, setShowTeam] = useState(true);

  // Fechar painel com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sections = [
    { id: "theme", label: "Theme Style", icon: Palette },
    { id: "layout", label: "Layout", icon: Layout },
    { id: "performance", label: "Performance", icon: Zap },
    { id: "notifications", label: "Notifications", icon: Bell }
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[800px] bg-white dark:bg-[#171717] backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-out border-l border-gray-200 dark:border-[#272727] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#272727] bg-white dark:bg-[#171717]">
          <div className="flex items-center gap-3">
            <Settings2 className="h-6 w-6 text-slate-600 dark:text-[#64f481]" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 font-inter">Template Customizer</h2>
              <p className="text-sm text-gray-500 dark:text-[#737373] font-inter">Customize and preview in real time</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-600 dark:text-[#737373] hover:bg-slate-100 dark:hover:bg-[#272727]/60">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex h-full">
          {/* Sidebar Navigation */}
          <div className="w-48 border-r border-gray-200 dark:border-[#272727] bg-gray-50 dark:bg-[#171717] p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 border border-transparent font-inter ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300 dark:bg-[#64f481]/10 dark:text-[#64f481] dark:border-[#64f481]/20 shadow-sm font-medium'
                        : 'text-gray-600 dark:text-[#737373] hover:bg-slate-50 dark:hover:bg-[#272727]/70 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 transition-colors" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Theme Section */}
            {activeSection === "theme" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100 font-inter">
                    <Palette className="h-5 w-5 text-[#64f481] dark:text-[#64f481]" />
                    Color Scheme
                  </h3>
                  <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4">
                    <Label htmlFor="light-theme" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 dark:border-[#1f1f1f]/50 p-4 cursor-pointer hover:border-slate-300 dark:hover:border-[#64f481]/50 transition-all duration-200 [&:has([data-state=checked])]:border-slate-400 [&:has([data-state=checked])]:bg-slate-50 dark:[&:has([data-state=checked])]:border-[#64f481] dark:[&:has([data-state=checked])]:bg-[#64f481]/10 font-inter">
                      <RadioGroupItem value="light" id="light-theme" className="sr-only" />
                      <div className="w-16 h-12 bg-[#fafafa] border border-[#e5e5e5] rounded mb-2 flex items-center justify-center shadow-sm">
                        <Sun className="h-6 w-6 text-slate-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 font-inter dark:text-gray-100">Light</span>
                    </Label>
                    
                    <Label htmlFor="dark-theme" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 dark:border-[#1f1f1f]/50 p-4 cursor-pointer hover:border-[#64f481]/30 dark:hover:border-[#64f481]/50 transition-all duration-200 [&:has([data-state=checked])]:border-[#64f481] [&:has([data-state=checked])]:bg-[#64f481]/5 dark:[&:has([data-state=checked])]:bg-[#64f481]/10 font-inter">
                      <RadioGroupItem value="dark" id="dark-theme" className="sr-only" />
                      <div className="w-16 h-12 bg-[#121212] border border-[#272727] rounded mb-2 flex items-center justify-center shadow-sm">
                        <Moon className="h-6 w-6 text-[#6b7280]" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 font-inter dark:text-gray-100">Dark</span>
                    </Label>
                    
                    <Label htmlFor="system-theme" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 dark:border-[#1f1f1f]/50 p-4 cursor-pointer hover:border-[#64f481]/30 dark:hover:border-[#64f481]/50 transition-all duration-200 [&:has([data-state=checked])]:border-[#64f481] [&:has([data-state=checked])]:bg-[#64f481]/5 dark:[&:has([data-state=checked])]:bg-[#64f481]/10 font-inter">
                      <RadioGroupItem value="system" id="system-theme" className="sr-only" />
                      <div className="w-16 h-12 bg-gradient-to-br from-[#fafafa] via-gray-100 to-[#121212] border border-gray-300 dark:border-[#272727] rounded mb-2 flex items-center justify-center shadow-sm">
                        <Monitor className="h-6 w-6 text-slate-600 dark:text-[#737373]" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 font-inter dark:text-gray-100">System</span>
                    </Label>
                  </RadioGroup>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <BarChart3 className="h-5 w-5 text-[#64f481] dark:text-[#64f481]" />
                    Skins
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-600/50 p-4 cursor-pointer">
                      <div className="w-16 h-12 border border-[#e5e5e5] dark:border-[#272727] rounded mb-2 bg-white dark:bg-[#171717] shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 p-1">
                          <div className="w-full h-2 bg-gray-100 dark:bg-[#1f1f1f] mb-1"></div>
                          <div className="w-3/4 h-1 bg-gray-200 dark:bg-[#2a2a2a] mb-1"></div>
                          <div className="w-1/2 h-1 bg-gray-200 dark:bg-[#2a2a2a]"></div>
                        </div>
                        <div className="absolute top-1 right-1 w-2 h-2 bg-[#64f481] rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 font-inter dark:text-gray-100">Default</span>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 dark:border-slate-700/50 p-4 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-all duration-200">
                      <div className="w-16 h-12 border border-[#e5e5e5] dark:border-[#272727] rounded mb-2 bg-white dark:bg-[#171717] shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 border border-gray-300 dark:border-[#3a3a3a] m-1 rounded"></div>
                        <div className="absolute inset-0 p-2">
                          <div className="w-full h-1 bg-gray-100 dark:bg-[#1f1f1f] mb-1"></div>
                          <div className="w-2/3 h-1 bg-gray-200 dark:bg-[#2a2a2a]"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 font-inter dark:text-gray-100">Bordered</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100 font-inter">
                    <Palette className="h-5 w-5 text-[#64f481] dark:text-[#64f481]" />
                    Theme Color
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: "Slate", color: "bg-slate-600", selected: true },
                      { name: "Emerald", color: "bg-[#64f481]" },
                      { name: "Blue", color: "bg-blue-500" },
                      { name: "Purple", color: "bg-purple-500" },
                      { name: "Orange", color: "bg-orange-500" },
                      { name: "Red", color: "bg-red-500" },
                      { name: "Pink", color: "bg-pink-500" },
                      { name: "Teal", color: "bg-teal-500" }
                    ].map((colorOption) => (
                      <button
                        key={colorOption.name}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 font-inter ${
                          colorOption.selected ? 'border-slate-600 bg-slate-50 dark:bg-[#64f481]/10 dark:border-[#64f481]/50' : 'border-gray-200 dark:border-[#1f1f1f]/50 hover:border-slate-300 dark:hover:border-[#64f481]/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${colorOption.color} shadow-sm`} />
                        <span className="text-xs font-medium text-gray-900 font-inter dark:text-gray-100">{colorOption.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Layout Section */}
            {activeSection === "layout" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Layout className="h-5 w-5 text-[#64f481] dark:text-[#64f481]" />
                    Layout
                  </h3>
                  <RadioGroup value={dashboardLayout} onValueChange={setDashboardLayout} className="grid grid-cols-4 gap-4">
                    <Label htmlFor="vertical" className="flex flex-col items-center justify-center rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-600/50 p-4 cursor-pointer">
                      <RadioGroupItem value="vertical" id="vertical" className="sr-only" />
                      <div className="w-16 h-12 border border-[#e5e5e5] dark:border-[#272727] rounded mb-2 flex shadow-sm bg-[#fafafa] dark:bg-[#121212]">
                        <div className="w-4 h-full bg-white dark:bg-[#171717] border-r border-[#e5e5e5] dark:border-[#272727] rounded-l"></div>
                        <div className="flex-1 bg-[#fafafa] dark:bg-[#121212] p-1 flex flex-col gap-1">
                          <div className="w-full h-1 bg-gray-300 dark:bg-[#2a2a2a] rounded"></div>
                          <div className="w-3/4 h-1 bg-gray-300 dark:bg-[#2a2a2a] rounded"></div>
                          <div className="w-1/2 h-1 bg-gray-300 dark:bg-[#2a2a2a] rounded"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 font-inter dark:text-gray-100">Vertical</span>
                    </Label>
                    
                    <Label htmlFor="horizontal" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 dark:border-slate-700/50 p-4 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-all duration-200">
                      <RadioGroupItem value="horizontal" id="horizontal" className="sr-only" />
                      <div className="w-16 h-12 border border-[#e5e5e5] dark:border-[#272727] rounded mb-2 flex flex-col shadow-sm bg-[#fafafa] dark:bg-[#121212]">
                        <div className="w-full h-3 bg-white dark:bg-[#171717] border-b border-[#e5e5e5] dark:border-[#272727] rounded-t"></div>
                        <div className="flex-1 bg-[#fafafa] dark:bg-[#121212] p-1 flex flex-col gap-1">
                          <div className="w-full h-1 bg-gray-300 dark:bg-[#2a2a2a] rounded"></div>
                          <div className="w-3/4 h-1 bg-gray-300 dark:bg-[#2a2a2a] rounded"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 font-inter dark:text-gray-100">Horizontal</span>
                    </Label>

                    <Label htmlFor="semibox" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-blue-300 transition-colors">
                      <RadioGroupItem value="semibox" id="semibox" className="sr-only" />
                      <div className="w-16 h-12 border border-[#e5e5e5] dark:border-[#272727] rounded mb-2 flex shadow-sm bg-[#fafafa] dark:bg-[#121212] relative">
                        <div className="w-3 h-full bg-gray-300 dark:bg-[#2a2a2a] rounded-l"></div>
                        <div className="flex-1 bg-[#fafafa] dark:bg-[#121212] p-1 flex flex-col gap-1">
                          <div className="w-full h-1 bg-gray-300 dark:bg-[#2a2a2a] rounded"></div>
                          <div className="w-2/3 h-1 bg-gray-300 dark:bg-[#2a2a2a] rounded"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium">SemiBox</span>
                    </Label>

                    <Label htmlFor="compact" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-blue-300 transition-colors">
                      <RadioGroupItem value="compact" id="compact" className="sr-only" />
                      <div className="w-16 h-12 border border-[#e5e5e5] dark:border-[#272727] rounded mb-2 flex shadow-sm bg-[#fafafa] dark:bg-[#121212]">
                        <div className="w-2 h-full bg-gray-400 dark:bg-[#3a3a3a] rounded-l"></div>
                        <div className="flex-1 bg-[#fafafa] dark:bg-[#121212] p-1 flex flex-col gap-1">
                          <div className="w-full h-1 bg-gray-300 dark:bg-[#2a2a2a] rounded"></div>
                          <div className="w-full h-1 bg-gray-300 dark:bg-[#2a2a2a] rounded"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium">Compact</span>
                    </Label>
                  </RadioGroup>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Layout className="h-5 w-5 text-[#64f481] dark:text-[#64f481]" />
                    Sidebar
                  </h3>
                  <RadioGroup value={sidebar} onValueChange={setSidebar} className="grid grid-cols-4 gap-4">
                    <Label htmlFor="classic" className="flex flex-col items-center justify-center rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-600/50 p-4 cursor-pointer">
                      <RadioGroupItem value="classic" id="classic" className="sr-only" />
                      <div className="w-16 h-12 border border-[#e5e5e5] dark:border-[#272727] rounded mb-2 flex shadow-sm bg-[#fafafa] dark:bg-[#121212]">
                        <div className="w-5 h-full bg-white dark:bg-[#171717] border-r border-[#e5e5e5] dark:border-[#272727] flex flex-col gap-1 p-1 rounded-l">
                          <div className="w-full h-1 bg-gray-600 dark:bg-[#6b7280] rounded"></div>
                          <div className="w-full h-1 bg-gray-600 dark:bg-[#6b7280] rounded"></div>
                          <div className="w-full h-1 bg-gradient-to-r from-slate-400 to-slate-600 dark:bg-[#64f481] rounded"></div>
                        </div>
                        <div className="flex-1 bg-[#fafafa] dark:bg-[#121212]"></div>
                      </div>
                      <span className="text-sm font-medium">Classic</span>
                    </Label>
                    
                    <Label htmlFor="draggable" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 dark:border-slate-700/50 p-4 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-colors">
                      <RadioGroupItem value="draggable" id="draggable" className="sr-only" />
                      <div className="w-16 h-12 border border-[#e5e5e5] dark:border-[#272727] rounded mb-2 flex shadow-sm bg-[#fafafa] dark:bg-[#121212]">
                        <div className="w-5 h-full bg-gradient-to-b from-white to-gray-100 dark:from-[#171717] dark:to-[#1a1a1a] border-r border-[#e5e5e5] dark:border-[#272727] flex flex-col gap-1 p-1 rounded-l">
                          <div className="w-full h-1 bg-gray-600 dark:bg-[#6b7280] rounded"></div>
                          <div className="w-2/3 h-1 bg-gray-600 dark:bg-[#6b7280] rounded"></div>
                          <div className="w-full h-1 bg-gray-600 dark:bg-[#6b7280] rounded"></div>
                        </div>
                        <div className="flex-1 bg-[#fafafa] dark:bg-[#121212]"></div>
                      </div>
                      <span className="text-sm font-medium">Draggable</span>
                    </Label>

                    <Label htmlFor="two-column" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 dark:border-slate-700/50 p-4 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-colors">
                      <RadioGroupItem value="two-column" id="two-column" className="sr-only" />
                      <div className="w-16 h-12 border border-[#e5e5e5] dark:border-[#272727] rounded mb-2 flex shadow-sm bg-[#fafafa] dark:bg-[#121212]">
                        <div className="w-3 h-full bg-white dark:bg-[#171717] border-r border-[#e5e5e5] dark:border-[#272727] rounded-l"></div>
                        <div className="w-3 h-full bg-gray-50 dark:bg-[#1a1a1a] border-r border-[#e5e5e5] dark:border-[#272727]"></div>
                        <div className="flex-1 bg-[#fafafa] dark:bg-[#121212]"></div>
                      </div>
                      <span className="text-sm font-medium">Two Column</span>
                    </Label>

                    <Label htmlFor="compact-sidebar" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-blue-300 transition-colors">
                      <RadioGroupItem value="compact" id="compact-sidebar" className="sr-only" />
                      <div className="w-16 h-12 border rounded mb-2 flex shadow-sm bg-white">
                        <div className="w-3 h-full bg-gray-300 flex flex-col gap-1 p-0.5 rounded-l">
                          <div className="w-full h-1 bg-gray-500 rounded"></div>
                          <div className="w-full h-1 bg-gray-500 rounded"></div>
                        </div>
                        <div className="flex-1 bg-gray-50"></div>
                      </div>
                      <span className="text-sm font-medium">Compact</span>
                    </Label>
                  </RadioGroup>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-purple-600" />
                    Content Width
                  </h3>
                  <RadioGroup value={contentWidth} onValueChange={setContentWidth} className="grid grid-cols-2 gap-4">
                    <Label htmlFor="wide" className="flex flex-col items-center justify-center rounded-lg border-2 border-blue-500 bg-blue-50 p-4 cursor-pointer">
                      <RadioGroupItem value="wide" id="wide" className="sr-only" />
                      <div className="w-16 h-12 border rounded mb-2 bg-gray-100 shadow-sm"></div>
                      <span className="text-sm font-medium">Wide</span>
                    </Label>
                    
                    <Label htmlFor="boxed" className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-blue-300 transition-colors">
                      <RadioGroupItem value="boxed" id="boxed" className="sr-only" />
                      <div className="w-16 h-12 border rounded mb-2 flex justify-center items-center bg-gray-50 shadow-sm">
                        <div className="w-10 h-8 bg-gray-200 rounded shadow-sm"></div>
                      </div>
                      <span className="text-sm font-medium">Boxed</span>
                    </Label>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-slate-400 dark:bg-slate-500 rounded"></div>
                      </div>
                      <div>
                        <Label className="font-medium text-gray-900 font-inter dark:text-gray-100">Menu Hidden</Label>
                        <p className="text-sm text-gray-500 dark:text-[#737373]">Hide navigation menu</p>
                      </div>
                    </div>
                    <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full"></div>
                      </div>
                      <div>
                        <Label className="font-medium text-gray-900 font-inter dark:text-gray-100">Show Search Bar</Label>
                        <p className="text-sm text-gray-500 dark:text-[#737373]">Display search functionality</p>
                      </div>
                    </div>
                    <Switch checked={showSearchBar} onCheckedChange={setShowSearchBar} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full"></div>
                      </div>
                      <div>
                        <Label className="font-medium text-gray-900 font-inter dark:text-gray-100">Show Team</Label>
                        <p className="text-sm text-gray-500 dark:text-[#737373]">Display team information</p>
                      </div>
                    </div>
                    <Switch checked={showTeam} onCheckedChange={setShowTeam} />
                  </div>
                </div>
              </div>
            )}

            {/* Performance Section */}
            {activeSection === "performance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Performance Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium text-gray-900 font-inter dark:text-gray-100">Enable Animations</Label>
                        <p className="text-sm text-gray-500 dark:text-[#737373]">Smooth transitions and effects</p>
                      </div>
                      <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium text-gray-900 font-inter dark:text-gray-100">Compact Mode</Label>
                        <p className="text-sm text-gray-500 dark:text-[#737373]">Reduce spacing and padding</p>
                      </div>
                      <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Chart Performance</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">Animation Quality</Label>
                      <Select defaultValue="high">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Quality</SelectItem>
                          <SelectItem value="medium">Medium Quality</SelectItem>
                          <SelectItem value="low">Low Quality</SelectItem>
                          <SelectItem value="none">No Animations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">Data Refresh Rate</Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 seconds</SelectItem>
                          <SelectItem value="15">15 seconds</SelectItem>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">1 minute</SelectItem>
                          <SelectItem value="300">5 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium text-gray-900 font-inter dark:text-gray-100">Push Notifications</Label>
                        <p className="text-sm text-gray-500 dark:text-[#737373]">Browser notifications</p>
                      </div>
                      <Switch checked={notifications} onCheckedChange={setNotifications} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium text-gray-900 font-inter dark:text-gray-100">Sound Effects</Label>
                        <p className="text-sm text-gray-500 dark:text-[#737373]">Play sounds for notifications</p>
                      </div>
                      <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-gray-900 font-inter dark:text-gray-100">Volume Level</Label>
                        <Badge variant="secondary">{volume[0]}%</Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Volume2 className="h-4 w-4 text-slate-400" />
                        <Slider
                          value={volume}
                          onValueChange={setVolume}
                          max={100}
                          step={1}
                          className="flex-1"
                          disabled={!soundEnabled}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-900 dark:text-gray-100">Daily Reports</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-900 dark:text-gray-100">Weekly Summary</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-900 dark:text-gray-100">Monthly Analytics</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-gray-900 dark:text-gray-100">Security Alerts</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-[#272727] p-4 bg-gray-50 dark:bg-[#171717] flex flex-col gap-3">
          <div className="flex justify-between">
            <Button variant="outline" size="sm" className="border-gray-300 dark:border-[#272727] text-gray-700 dark:text-[#737373] hover:bg-slate-100 dark:hover:bg-[#272727]">
              Reset to Default
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="border-gray-300 dark:border-[#272727] text-gray-700 dark:text-[#737373] hover:bg-slate-100 dark:hover:bg-[#272727]">
                Cancel
              </Button>
              <Button size="sm" className="bg-slate-600 hover:bg-slate-700 text-white dark:bg-[#64f481] dark:hover:bg-[#64f481]/90 dark:text-black">
                Apply Changes
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-[#272727]">
            <Button size="sm" className="flex-1 bg-slate-800 hover:bg-slate-900 text-white dark:bg-[#272727] dark:hover:bg-[#333333]">
              Buy Now
            </Button>
            <Button variant="outline" size="sm" className="flex-1 border-gray-300 dark:border-[#272727] text-gray-700 dark:text-[#737373] hover:bg-slate-100 dark:hover:bg-[#272727]">
              Our Portfolio
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
