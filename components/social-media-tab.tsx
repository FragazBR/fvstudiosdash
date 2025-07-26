"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Target,
  PieChart,
  TrendingUp,
  Activity,
  Calendar,
  Settings,
  Search,
  Filter,
  MoreVertical,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Eye,
  ExternalLink,
  Play,
  Pause,
  DollarSign,
  Users as UsersIcon,
  MousePointerClick,
  BarChart3
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  type: 'lead' | 'client' | 'prospect' | 'independent_client' | 'independent_lead' | 'independent_prospect';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'google_ads' | 'meta_ads';
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  start_date: string;
  end_date?: string;
  client_id: string;
}

const PLATFORM_CONFIG = {
  instagram: { name: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
  facebook: { name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
  tiktok: { name: 'TikTok', icon: Play, color: 'bg-black' },
  google_ads: { name: 'Google Ads', icon: Target, color: 'bg-green-600' },
  meta_ads: { name: 'Meta Ads', icon: Target, color: 'bg-blue-500' }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    case 'draft': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Ativa';
    case 'paused': return 'Pausada';
    case 'completed': return 'Concluída';
    case 'draft': return 'Rascunho';
    default: return status;
  }
};

interface SocialMediaTabProps {
  contacts: Contact[];
  loading: boolean;
}

export function SocialMediaTab({ contacts, loading }: SocialMediaTabProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setCampaignLoading(true);
      // TODO: Implementar API real para campanhas
      // Por enquanto, dados mock para demonstração
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Campanha de Verão - Instagram',
          platform: 'instagram',
          status: 'active',
          budget: 5000,
          spent: 3200,
          impressions: 120000,
          clicks: 2400,
          conversions: 48,
          ctr: 2.0,
          cpc: 1.33,
          roas: 4.2,
          start_date: '2024-01-15',
          end_date: '2024-02-15',
          client_id: contacts[0]?.id || '1'
        },
        {
          id: '2',
          name: 'Promoção Black Friday - Facebook',
          platform: 'facebook',
          status: 'completed',
          budget: 8000,
          spent: 7800,
          impressions: 250000,
          clicks: 5000,
          conversions: 125,
          ctr: 2.5,
          cpc: 1.56,
          roas: 6.8,
          start_date: '2024-11-20',
          end_date: '2024-11-30',
          client_id: contacts[1]?.id || '2'
        },
        {
          id: '3',
          name: 'Leads B2B - LinkedIn',
          platform: 'linkedin',
          status: 'active',
          budget: 3000,
          spent: 1800,
          impressions: 45000,
          clicks: 900,
          conversions: 27,
          ctr: 2.0,
          cpc: 2.00,
          roas: 3.5,
          start_date: '2024-01-01',
          client_id: contacts[0]?.id || '1'
        }
      ];
      
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setCampaignLoading(false);
    }
  };

  const clientsWithCampaigns = contacts.filter(contact => 
    (contact.type === 'client' || contact.type === 'independent_client') &&
    contact.status === 'active'
  );

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = !selectedClient || campaign.client_id === selectedClient;
    const matchesPlatform = !selectedPlatform || campaign.platform === selectedPlatform;
    return matchesSearch && matchesClient && matchesPlatform;
  });

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
    totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
    totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
    avgCTR: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length : 0,
    avgCPC: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.cpc, 0) / campaigns.length : 0,
    avgROAS: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <MessageCircle className="h-7 w-7 text-purple-500" />
            Social Media
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie campanhas de redes sociais dos seus clientes
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar campanhas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={selectedClient || ''}
          onChange={(e) => setSelectedClient(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todos os clientes</option>
          {clientsWithCampaigns.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
        
        <select
          value={selectedPlatform || ''}
          onChange={(e) => setSelectedPlatform(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todas as plataformas</option>
          {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.name}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Campanhas Ativas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.activeCampaigns}/{stats.totalCampaigns}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Orçamento Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(stats.totalBudget)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CTR Médio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.avgCTR.toFixed(1)}%
                </p>
              </div>
              <MousePointerClick className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ROAS Médio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.avgROAS.toFixed(1)}x
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaignLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white/90 dark:bg-[#171717]/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCampaigns.map((campaign) => {
              const client = contacts.find(c => c.id === campaign.client_id);
              const platformConfig = PLATFORM_CONFIG[campaign.platform];
              const PlatformIcon = platformConfig.icon;
              
              return (
                <Card key={campaign.id} className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${platformConfig.color} text-white`}>
                          <PlatformIcon className="h-6 w-6" />
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {campaign.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {client?.name} • {platformConfig.name}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(campaign.start_date).toLocaleDateString('pt-BR')}
                              {campaign.end_date && ` - ${new Date(campaign.end_date).toLocaleDateString('pt-BR')}`}
                            </span>
                            <Badge className={getStatusColor(campaign.status)}>
                              {getStatusText(campaign.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Orçamento</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(campaign.budget)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Gasto</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(campaign.spent)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Impressões</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Intl.NumberFormat('pt-BR').format(campaign.impressions)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cliques</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Intl.NumberFormat('pt-BR').format(campaign.clicks)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">CTR</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {campaign.ctr.toFixed(1)}%
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">CPC</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(campaign.cpc)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ROAS</p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {campaign.roas.toFixed(1)}x
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir Plataforma
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {!campaignLoading && filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {campaigns.length === 0 ? 'Nenhuma campanha cadastrada ainda' : 'Nenhuma campanha encontrada'}
            </p>
            <Button>
              <Target className="h-4 w-4 mr-2" />
              Criar Nova Campanha
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}