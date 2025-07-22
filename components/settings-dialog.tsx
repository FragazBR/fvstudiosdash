'use client'

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import {
  Settings,
  Palette,
  Monitor,
  Moon,
  Sun,
  Volume2,
  Bell,
  Eye,
  Zap,
  Globe,
} from "lucide-react";

interface SettingsDialogProps {
  children: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const { theme, setTheme, themes } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState([75]);
  const [language, setLanguage] = useState("pt");
  const [autoSave, setAutoSave] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações
          </DialogTitle>
          <DialogDescription>
            Personalize sua experiência no dashboard
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="theme" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="theme" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              Tema
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="interface" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Interface
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[60vh] overflow-y-auto">
            {/* TEMA */}
            <TabsContent value="theme" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aparência</CardTitle>
                  <CardDescription>
                    Escolha entre tema claro, escuro ou automático
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4">
                    <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary">
                      <RadioGroupItem value="light" id="light" className="sr-only" />
                      <Sun className="mb-3 h-6 w-6" />
                      Claro
                    </Label>
                    <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary">
                      <RadioGroupItem value="dark" id="dark" className="sr-only" />
                      <Moon className="mb-3 h-6 w-6" />
                      Escuro
                    </Label>
                    <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary">
                      <RadioGroupItem value="system" id="system" className="sr-only" />
                      <Monitor className="mb-3 h-6 w-6" />
                      Sistema
                    </Label>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cores do Sistema</CardTitle>
                  <CardDescription>
                    Selecione a paleta de cores principal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: "Slate", color: "bg-slate-500", value: "slate" },
                      { name: "Verde", color: "bg-green-500", value: "green" },
                      { name: "Roxo", color: "bg-purple-500", value: "purple" },
                      { name: "Rosa", color: "bg-pink-500", value: "pink" },
                      { name: "Laranja", color: "bg-orange-500", value: "orange" },
                      { name: "Vermelho", color: "bg-red-500", value: "red" },
                      { name: "Cinza", color: "bg-gray-500", value: "gray" },
                      { name: "Amarelo", color: "bg-yellow-500", value: "yellow" },
                    ].map((color) => (
                      <Button
                        key={color.value}
                        variant="outline"
                        className="h-16 flex flex-col gap-1"
                      >
                        <div className={`w-6 h-6 rounded-full ${color.color}`} />
                        <span className="text-xs">{color.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTIFICAÇÕES */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Notificação</CardTitle>
                  <CardDescription>
                    Configure como você quer receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações Push</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações no navegador
                      </p>
                    </div>
                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                  </div>
                  
                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sons de Notificação</Label>
                      <p className="text-sm text-muted-foreground">
                        Tocar som quando receber notificações
                      </p>
                    </div>
                    <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                  </div>

                  <div className="space-y-2">
                    <Label>Volume das Notificações</Label>
                    <div className="flex items-center space-x-4">
                      <Volume2 className="h-4 w-4" />
                      <Slider
                        value={volume}
                        onValueChange={setVolume}
                        max={100}
                        step={1}
                        className="flex-1"
                        disabled={!soundEnabled}
                      />
                      <Badge variant="secondary">{volume[0]}%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* INTERFACE */}
            <TabsContent value="interface" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Interface</CardTitle>
                  <CardDescription>
                    Ajuste a aparência e comportamento da interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Modo Compacto</Label>
                      <p className="text-sm text-muted-foreground">
                        Reduz o espaçamento entre elementos
                      </p>
                    </div>
                    <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Idioma da Interface</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt">Português (Brasil)</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PERFORMANCE */}
            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Performance</CardTitle>
                  <CardDescription>
                    Otimize o desempenho do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-salvamento</Label>
                      <p className="text-sm text-muted-foreground">
                        Salva automaticamente suas alterações
                      </p>
                    </div>
                    <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Qualidade das Animações</Label>
                    <RadioGroup defaultValue="high">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="high" />
                        <Label htmlFor="high">Alta qualidade</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medium" id="medium" />
                        <Label htmlFor="medium">Qualidade média</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="low" />
                        <Label htmlFor="low">Sem animações</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SISTEMA */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Sistema</CardTitle>
                  <CardDescription>
                    Detalhes sobre sua conta e sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Versão</Label>
                      <p className="text-sm text-muted-foreground">v2.1.0</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Última Atualização</Label>
                      <p className="text-sm text-muted-foreground">19/07/2025</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Plano</Label>
                      <Badge>Pro</Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Armazenamento</Label>
                      <p className="text-sm text-muted-foreground">2.1GB / 10GB</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      Exportar Dados
                    </Button>
                    <Button variant="outline" className="w-full">
                      Limpar Cache
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
