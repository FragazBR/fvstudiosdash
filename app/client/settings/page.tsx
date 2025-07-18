"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

export default function ClientSettingsPage() {
  const [themeColor, setThemeColor] = useState("#4f46e5");
  const [tab, setTab] = useState("theme");

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Configurações do Cliente</h1>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="theme">Tema</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>
        <TabsContent value="theme">
          <div className="space-y-4 mt-4">
            <label className="block text-sm font-medium">Cor principal do tema</label>
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
            <Button variant="default">Salvar cor</Button>
          </div>
        </TabsContent>
        <TabsContent value="services">
          <div className="space-y-4 mt-4">
            {/* Aqui você pode listar serviços customizáveis, switches, checkboxes, etc. */}
            <p className="text-sm text-gray-500">Em breve: customização de serviços disponíveis para o cliente.</p>
          </div>
        </TabsContent>
        <TabsContent value="branding">
          <div className="space-y-4 mt-4">
            {/* Upload de logo, escolha de fontes, etc. */}
            <p className="text-sm text-gray-500">Em breve: upload de logo, escolha de fontes, etc.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
