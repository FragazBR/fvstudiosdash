"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client } from "@/types/workflow";

// Mock data para demonstração
const mockClients: Client[] = [
  {
    id: "client-1",
    name: "TechCorp Solutions",
    contact: {
      name: "João Silva",
      email: "joao@techcorp.com",
      phone: "(11) 99999-9999",
      company: "TechCorp Solutions",
      position: "Marketing Manager"
    },
    industry: "Tecnologia",
    size: "medium",
    goals: ["Aumentar Brand Awareness", "Gerar Leads Qualificados", "Aumentar Vendas Online"],
    currentChallenges: ["Baixo engajamento nas redes sociais", "Falta de conteúdo consistente"],
    budget: 50000,
    timeline: "3 meses",
    previousCampaigns: [
      { id: "1", name: "Black Friday 2023", platform: "Facebook Ads", budget: 10000, results: { clicks: 15000, conversions: 230 } }
    ]
  },
  {
    id: "client-2",
    name: "StartupX Inc",
    contact: {
      name: "Maria Garcia",
      email: "maria@startupx.com",
      phone: "(11) 88888-8888",
      company: "StartupX Inc",
      position: "CEO"
    },
    industry: "Fintech",
    size: "small",
    goals: ["Validação de Mercado", "Aquisição de Primeiros Clientes"],
    currentChallenges: ["Orçamento limitado", "Brand desconhecida"],
    budget: 15000,
    timeline: "2 meses"
  },
  {
    id: "client-3",
    name: "RetailPro",
    contact: {
      name: "Carlos Oliveira",
      email: "carlos@retailpro.com",
      phone: "(11) 77777-7777",
      company: "RetailPro",
      position: "Marketing Director"
    },
    industry: "E-commerce",
    size: "large",
    goals: ["Expansão Nacional", "Aumento do Ticket Médio"],
    currentChallenges: ["Competição acirrada", "Sazonalidade"],
    budget: 100000,
    timeline: "6 meses",
    previousCampaigns: [
      { id: "2", name: "Summer Sale 2023", platform: "Google Ads", budget: 25000, results: { impressions: 500000, conversions: 850 } },
      { id: "3", name: "Instagram Branding", platform: "Instagram", budget: 15000, results: { reach: 200000, engagement: 12000 } }
    ]
  }
];

interface ClientFormData {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  position: string;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  goals: string;
  challenges: string;
  budget: string;
  timeline: string;
}

export function ClientManager() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    position: "",
    industry: "",
    size: "medium",
    goals: "",
    challenges: "",
    budget: "",
    timeline: ""
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contact.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = selectedIndustry === "all" || client.industry === selectedIndustry;
    const matchesSize = selectedSize === "all" || client.size === selectedSize;
    
    return matchesSearch && matchesIndustry && matchesSize;
  });

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'small':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'medium':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'large':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'enterprise':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'small': return 'Pequena';
      case 'medium': return 'Média';
      case 'large': return 'Grande';
      case 'enterprise': return 'Enterprise';
      default: return size;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: formData.name,
      contact: {
        name: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        company: formData.name,
        position: formData.position
      },
      industry: formData.industry,
      size: formData.size,
      goals: formData.goals.split(',').map(g => g.trim()).filter(Boolean),
      currentChallenges: formData.challenges.split(',').map(c => c.trim()).filter(Boolean),
      budget: parseInt(formData.budget) || 0,
      timeline: formData.timeline
    };

    setClients([...clients, newClient]);
    setIsNewClientModalOpen(false);
    setFormData({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      position: "",
      industry: "",
      size: "medium",
      goals: "",
      challenges: "",
      budget: "",
      timeline: ""
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestão de Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie todos os seus clientes e seus projetos
          </p>
        </div>
        
        <Dialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-[#64f481] dark:hover:bg-[#4ade80] dark:text-black">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactName">Nome do Contato</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Setor</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="size">Porte da Empresa</Label>
                  <Select value={formData.size} onValueChange={(value: any) => setFormData({ ...formData, size: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequena</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budget">Orçamento (R$)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input
                    id="timeline"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    placeholder="ex: 3 meses"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="goals">Objetivos (separados por vírgula)</Label>
                <Textarea
                  id="goals"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  placeholder="ex: Aumentar vendas, Melhorar brand awareness"
                  required
                />
              </div>

              <div>
                <Label htmlFor="challenges">Desafios Atuais (separados por vírgula)</Label>
                <Textarea
                  id="challenges"
                  value={formData.challenges}
                  onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                  placeholder="ex: Baixo engajamento, Falta de conteúdo"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsNewClientModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Cadastrar Cliente
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Setores</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Fintech">Fintech</SelectItem>
                <SelectItem value="E-commerce">E-commerce</SelectItem>
                <SelectItem value="Saúde">Saúde</SelectItem>
                <SelectItem value="Educação">Educação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Porte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Portes</SelectItem>
                <SelectItem value="small">Pequena</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Client Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727] hover:border-gray-300 dark:hover:border-[#64f481]/30 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      <Building2 className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                      {client.name}
                    </CardTitle>
                    <CardDescription>{client.industry}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs", getSizeColor(client.size))} variant="secondary">
                  {getSizeLabel(client.size)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {client.timeline}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Contact */}
              <div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <Users className="h-4 w-4 mr-2" />
                  Contato Principal
                </div>
                <div className="ml-6">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{client.contact.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">{client.contact.position}</p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mt-1">
                    <Mail className="h-3 w-3 mr-1" />
                    {client.contact.email}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
                    <Phone className="h-3 w-3 mr-1" />
                    {client.contact.phone}
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Orçamento
                </div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  R$ {client.budget.toLocaleString()}
                </div>
              </div>

              {/* Goals */}
              <div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <Target className="h-4 w-4 mr-2" />
                  Objetivos
                </div>
                <div className="flex flex-wrap gap-1 ml-6">
                  {client.goals.slice(0, 2).map((goal, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {goal}
                    </Badge>
                  ))}
                  {client.goals.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{client.goals.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Previous Campaigns */}
              {client.previousCampaigns && client.previousCampaigns.length > 0 && (
                <div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Campanhas Anteriores
                  </div>
                  <div className="ml-6">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {client.previousCampaigns.length} campanha{client.previousCampaigns.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Última: {client.previousCampaigns[0].name}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalhes
                </Button>
                <Button size="sm" className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-[#64f481] dark:hover:bg-[#4ade80] dark:text-black">
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Projeto
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-[#1f1f1f] rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhum cliente encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tente ajustar seus filtros ou cadastrar um novo cliente
            </p>
            <Button onClick={() => setIsNewClientModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Cliente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
