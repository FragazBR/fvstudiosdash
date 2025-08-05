"use client";

import React, { useState, useEffect } from 'react';
import { PermissionGuard } from "@/components/permission-guard";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Shared/Topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { toast } from 'sonner';

interface Agency {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  website?: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  total_users?: number;
  total_clients?: number;
  active_subscriptions?: number;
  owner_name?: string;
}

interface CreateAgencyForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  website: string;
  description: string;
}

function AgencyManagementContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState<CreateAgencyForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
    description: ''
  });
  
  const router = useRouter();
  const supabase = supabaseBrowser();

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    filterAgencies();
  }, [agencies, searchTerm, statusFilter]);

  const loadAgencies = async () => {
    try {
      setLoading(true);
      
      // Buscar agências com informações adicionais
      const { data: agenciesData, error } = await supabase
        .from('agencies')
        .select(`
          *,
          created_by_user:auth.users!agencies_created_by_fkey(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading agencies:', error);
        toast.error('Erro ao carregar agências');
        return;
      }

      // Buscar estatísticas para cada agência
      const agenciesWithStats = await Promise.all(
        (agenciesData || []).map(async (agency) => {
          // Contar usuários da agência
          const { count: userCount } = await supabase
            .from('user_agency_permissions')
            .select('id', { count: 'exact' })
            .eq('agency_id', agency.id);

          // Contar clientes da agência
          const { count: clientCount } = await supabase
            .from('user_agency_permissions')
            .select('id', { count: 'exact' })
            .eq('agency_id', agency.id)
            .eq('role', 'client');

          // Contar assinaturas ativas
          const { count: subscriptionCount } = await supabase
            .from('user_subscriptions')
            .select('id', { count: 'exact' })
            .eq('agency_id', agency.id)
            .eq('status', 'active');

          // Buscar nome do owner
          const { data: ownerData } = await supabase
            .from('user_agency_permissions')
            .select(`
              auth.users!inner(
                raw_user_meta_data
              )
            `)
            .eq('agency_id', agency.id)
            .eq('role', 'agency_owner')
            .single();

          return {
            ...agency,
            total_users: userCount || 0,
            total_clients: clientCount || 0,
            active_subscriptions: subscriptionCount || 0,
            owner_name: ownerData?.auth?.users?.raw_user_meta_data?.name || 'N/A'
          };
        })
      );

      setAgencies(agenciesWithStats);
    } catch (error) {
      console.error('Error loading agencies:', error);
      toast.error('Erro ao carregar agências');
    } finally {
      setLoading(false);
    }
  };

  const filterAgencies = () => {
    let filtered = agencies;

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(agency => 
        agency.name.toLowerCase().includes(term) ||
        (agency.email && agency.email.toLowerCase().includes(term)) ||
        (agency.city && agency.city.toLowerCase().includes(term)) ||
        (agency.owner_name && agency.owner_name.toLowerCase().includes(term))
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(agency => agency.status === statusFilter);
    }

    setFilteredAgencies(filtered);
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const { data, error } = await supabase
        .from('agencies')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          website: formData.website,
          description: formData.description,
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Agência criada com sucesso!');
      setCreateDialogOpen(false);
      resetForm();
      loadAgencies(); // Recarregar lista
    } catch (error: any) {
      console.error('Error creating agency:', error);
      toast.error('Erro ao criar agência: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAgency = async (agencyId: string, agencyName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a agência "${agencyName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', agencyId);

      if (error) {
        throw error;
      }

      toast.success('Agência excluída com sucesso');
      loadAgencies(); // Recarregar lista
    } catch (error: any) {
      console.error('Error deleting agency:', error);
      toast.error('Erro ao excluir agência: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleStatusChange = async (agencyId: string, newStatus: string, agencyName: string) => {
    try {
      const { error } = await supabase
        .from('agencies')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', agencyId);

      if (error) {
        throw error;
      }

      toast.success(`Status da agência "${agencyName}" alterado para ${newStatus}`);
      loadAgencies(); // Recarregar lista
    } catch (error: any) {
      console.error('Error updating agency status:', error);
      toast.error('Erro ao alterar status: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      website: '',
      description: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativa', variant: 'default' as const, icon: CheckCircle },
      suspended: { label: 'Suspensa', variant: 'secondary' as const, icon: XCircle },
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="bg-[#fafafa] dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex pt-16">
        <Topbar
          name="Gerenciamento de Agências"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="p-3 lg:p-6 w-full">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin')}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Admin
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Gerenciamento de Agências
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Visualize e gerencie todas as agências do sistema
                  </p>
                </div>
              </div>
              
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Agência
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Agência</DialogTitle>
                    <DialogDescription>
                      Preencha as informações da nova agência
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCreateAgency} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="name">Nome da Agência *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Ex: Marketing Digital LTDA"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="contato@agencia.com"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          placeholder="Rua, Número, Bairro"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          placeholder="São Paulo"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({...formData, state: e.target.value})}
                          placeholder="SP"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="zip_code">CEP</Label>
                        <Input
                          id="zip_code"
                          value={formData.zip_code}
                          onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                          placeholder="00000-000"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData({...formData, website: e.target.value})}
                          placeholder="https://www.agencia.com"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Descrição da agência..."
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isCreating} className="flex-1">
                        {isCreating ? 'Criando...' : 'Criar Agência'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setCreateDialogOpen(false);
                          resetForm();
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filtros */}
            <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727]">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Busca */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por nome, email, cidade ou proprietário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Filtro por Status */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="suspended">Suspensas</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    {loading ? 'Carregando...' : `${filteredAgencies.length} agência(s) encontrada(s)`}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span>Total: {agencies.length}</span>
                    <span>Ativas: {agencies.filter(a => a.status === 'active').length}</span>
                    <span>Suspensas: {agencies.filter(a => a.status === 'suspended').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Agências */}
            <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727]">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Building2 className="w-5 h-5 mr-2" />
                  Agências do Sistema
                </CardTitle>
                <CardDescription>
                  Lista completa de todas as agências cadastradas
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Carregando agências...</p>
                  </div>
                ) : filteredAgencies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma agência encontrada</p>
                    <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agência</TableHead>
                        <TableHead>Proprietário</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Usuários</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criada em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAgencies.map((agency) => (
                        <TableRow key={agency.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{agency.name}</div>
                              {agency.email && (
                                <div className="text-sm text-gray-500">{agency.email}</div>
                              )}
                              {agency.website && (
                                <div className="text-xs text-blue-600">{agency.website}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2 text-gray-400" />
                              {agency.owner_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {agency.city && agency.state ? (
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                {agency.city}, {agency.state}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="font-medium">{agency.total_users}</span> usuários
                              </div>
                              <div className="text-xs text-gray-500">
                                {agency.total_clients} clientes
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(agency.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(agency.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAgency(agency);
                                  setViewDialogOpen(true);
                                }}
                                title="Ver detalhes"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              
                              <Select
                                value={agency.status}
                                onValueChange={(newStatus) => handleStatusChange(agency.id, newStatus, agency.name)}
                              >
                                <SelectTrigger className="w-20 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Ativa</SelectItem>
                                  <SelectItem value="suspended">Suspensa</SelectItem>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteAgency(agency.id, agency.name)}
                                title="Excluir agência"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dialog de Visualização */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalhes da Agência</DialogTitle>
                <DialogDescription>
                  Informações completas sobre a agência selecionada
                </DialogDescription>
              </DialogHeader>
              
              {selectedAgency && (
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nome</label>
                      <p className="text-gray-900 dark:text-white">{selectedAgency.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      {getStatusBadge(selectedAgency.status)}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900 dark:text-white">{selectedAgency.email || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Telefone</label>
                      <p className="text-gray-900 dark:text-white">{selectedAgency.phone || 'Não informado'}</p>
                    </div>
                  </div>

                  {/* Endereço */}
                  {(selectedAgency.address || selectedAgency.city) && (
                    <div>
                      <h4 className="font-medium mb-2">Endereço</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-500">Endereço</label>
                          <p className="text-gray-900 dark:text-white">{selectedAgency.address || 'Não informado'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Cidade</label>
                          <p className="text-gray-900 dark:text-white">{selectedAgency.city || 'Não informado'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Estado</label>
                          <p className="text-gray-900 dark:text-white">{selectedAgency.state || 'Não informado'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">CEP</label>
                          <p className="text-gray-900 dark:text-white">{selectedAgency.zip_code || 'Não informado'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Website</label>
                          <p className="text-gray-900 dark:text-white">{selectedAgency.website || 'Não informado'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estatísticas */}
                  <div>
                    <h4 className="font-medium mb-2">Estatísticas</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total de Usuários</label>
                        <p className="text-gray-900 dark:text-white text-lg font-semibold">{selectedAgency.total_users}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Clientes</label>
                        <p className="text-gray-900 dark:text-white text-lg font-semibold">{selectedAgency.total_clients}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Assinaturas Ativas</label>
                        <p className="text-gray-900 dark:text-white text-lg font-semibold">{selectedAgency.active_subscriptions}</p>
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  {selectedAgency.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Descrição</label>
                      <p className="text-gray-900 dark:text-white mt-1">{selectedAgency.description}</p>
                    </div>
                  )}

                  {/* Datas */}
                  <div>
                    <h4 className="font-medium mb-2">Histórico</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Criada em</label>
                        <p className="text-gray-900 dark:text-white">{formatDate(selectedAgency.created_at)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Última atualização</label>
                        <p className="text-gray-900 dark:text-white">{formatDate(selectedAgency.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

export default function AgencyManagementPage() {
  return (
    <PermissionGuard allowedRoles={['admin']} showUnauthorized>
      <AgencyManagementContent />
    </PermissionGuard>
  );
}