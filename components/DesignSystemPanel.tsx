"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

const PRESETS = [
  { name: "Padrão", color: "#4f46e5", mode: "light" },
  { name: "Escuro", color: "#18181b", mode: "dark" },
  { name: "Corporativo", color: "#0d9488", mode: "light" },
  { name: "Minimalista", color: "#f1f5f9", mode: "light" },
];

export default function DesignSystemPanel() {
  const [themeColor, setThemeColor] = useState("#4f46e5");
  const [preset, setPreset] = useState(PRESETS[0]);
  const [font, setFont] = useState("Inter");
  // Adicione outros estados para espaçamento, bordas, etc.

  function applyPreset(preset: typeof PRESETS[0]) {
    setThemeColor(preset.color);
    // Aqui você pode também setar o modo (light/dark) globalmente
    setPreset(preset);
    // Exemplo: setTheme(preset.mode) se usar ThemeProvider
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h2 className="text-xl font-bold mb-4">Painel de Design System</h2>
      <Tabs defaultValue="theme" className="w-full">
        <TabsList>
          <TabsTrigger value="theme">Tema</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="font">Fonte</TabsTrigger>
        </TabsList>
        <TabsContent value="theme">
          <div className="space-y-4 mt-4">
            <label className="block text-sm font-medium">Cor principal</label>
            <Input
              type="color"
              value={themeColor}
              onChange={e => setThemeColor(e.target.value)}
              className="w-16 h-10 p-0 border-none bg-transparent"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm">Preview:</span>
              <div className="w-8 h-8 rounded-full border" style={{ background: themeColor }} />
            </div>
            <ThemeToggle />
            <Button variant="default">Salvar tema</Button>
          </div>
        </TabsContent>
        <TabsContent value="presets">
          <div className="space-y-4 mt-4">
            <label className="block text-sm font-medium">Presets rápidos</label>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map(p => (
                <Button
                  key={p.name}
                  variant={preset.name === p.name ? "default" : "outline"}
                  style={{ background: p.color, color: p.mode === "dark" ? "#fff" : "#222" }}
                  onClick={() => applyPreset(p)}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="font">
          <div className="space-y-4 mt-4">
            <label className="block text-sm font-medium">Fonte principal</label>
            <Input
              type="text"
              value={font}
              onChange={e => setFont(e.target.value)}
              placeholder="Ex: Inter, Roboto, Montserrat..."
            />
            <div className="flex items-center gap-2">
              <span className="text-sm">Preview:</span>
              <span style={{ fontFamily: font }}>Exemplo de texto</span>
            </div>
            <Button variant="default">Salvar fonte</Button>
          </div>
        </TabsContent>
      </Tabs>
      {/* Expansão futura: espaçamento, bordas, radius, etc. */}
    </div>
  );
}
