"use client";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Light</span>
      <Switch
        checked={theme === "dark"}
        onCheckedChange={checked => setTheme(checked ? "dark" : "light")}
        aria-label="Alternar tema"
      />
      <span className="text-sm">Dark</span>
    </div>
  );
}
