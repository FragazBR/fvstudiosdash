'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Users, Mail, Clock, Copy, Trash2, Shield, Building2, User, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { toast } from 'sonner';
import Sidebar from './sidebar';
import Topbar from './Shared/Topbar';

interface Agency {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  plan_name: string;
  monthly_price: number;
  annual_price: number;
  max_clients: number;
  max_projects: number;
  features: string[];
}

interface PendingInvitation {
  id: string;
  email: string;
  name: string;
  role: string;
  company: string;
  agency_name: string;
  invited_by_name: string;
  expires_at: string;
  created_at: string;
}

interface CreateUserForm {
  email: string;
  name: string;
  role: string;
  agency_id: string;
  company: string;
  phone: string;
  welcome_message: string;
  password: string;
  creation_method: 'invite' | 'direct';
  send_welcome_email: boolean;
  create_new_agency: boolean;
  new_agency_name?: string;
  plan_id?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  agency_id?: string;
  agency_name?: string;
  company?: string;
  phone?: string;
  email_confirmed: boolean;
  created_at: string;
  last_sign_in_at?: string;
  created_by_admin: boolean;
}

export default function AdminUserManagementPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // users, invitations
  const [showPassword, setShowPassword] = useState(false);
  const supabase = supabaseBrowser();

  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    name: '',
    role: 'client',
    agency_id: '',
    company: '',
    phone: '',
    welcome_message: '',
    password: '',
    creation_method: 'invite',
    send_welcome_email: true,
    create_new_agency: false,
    new_agency_name: '',
    plan_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAgencies(),
        loadPlans(),
        loadInvitations(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadAgencies = async () => {
    const { data: agenciesData } = await supabase
      .from('agencies')
      .select('id, name')
      .order('name');
    
    if (agenciesData) setAgencies(agenciesData);
  };

  const loadPlans = async () => {
    const { data: plansData } = await supabase
      .from('plan_limits')
      .select('id, plan_name, monthly_price, annual_price, max_clients, max_projects, features')
      .order('monthly_price');
    
    if (plansData) setPlans(plansData);
  };

  const loadInvitations = async () => {
    const { data: invitationsData } = await supabase.rpc('get_pending_invitations');
    if (invitationsData) setPendingInvitations(invitationsData);
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/list');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.creation_method === 'direct') {
        await handleCreateDirectly();
      } else {
        await handleCreateInvitation();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirectly = async () => {
    const response = await fetch('/api/admin/users/create-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        agency_id: formData.agency_id || null,
        company: formData.company || null,
        phone: formData.phone || null,
        send_welcome_email: formData.send_welcome_email,
        create_new_agency: formData.create_new_agency,
        new_agency_name: formData.new_agency_name || null,
        plan_id: formData.plan_id || null
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error);
    }

    toast.success('Usuário criado com sucesso!');
    resetForm();
    setDialogOpen(false);
    loadData();
  };

  const handleCreateInvitation = async () => {
    const response = await fetch('/api/admin/users/create-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        name: formData.name,
        role: formData.role,
        agency_id: formData.agency_id || null,
        company: formData.company || null,
        phone: formData.phone || null,
        welcome_message: formData.welcome_message || null,
        create_new_agency: formData.create_new_agency,
        new_agency_name: formData.new_agency_name || null,
        plan_id: formData.plan_id || null
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error);
    }

    toast.success(data.message || 'Convite criado com sucesso!');
    
    // Copiar link do convite para clipboard
    if (data.invitation_url) {
      await navigator.clipboard.writeText(data.invitation_url);
      toast.info('Link do convite copiado para a área de transferência');
    }

    resetForm();
    setDialogOpen(false);
    loadData();
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'client',
      agency_id: '',
      company: '',
      phone: '',
      welcome_message: '',
      password: '',
      creation_method: 'invite',
      send_welcome_email: true,
      create_new_agency: false,
      new_agency_name: '',
      plan_id: ''
    });
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return;

    try {
      const { data, error } = await supabase.rpc('cancel_invitation', {
        p_invitation_id: invitationId
      });

      if (error) throw error;

      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Convite cancelado com sucesso');
      loadData(); // Reload data

    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast.error('Erro ao cancelar convite');
    }
  };

  const copyInvitationLink = (invitationId: string) => {
    const link = `${window.location.origin}/accept-invitation?token=${invitationId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-600" />;
      case 'agency_owner': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'agency_staff': return <Users className="w-4 h-4 text-green-600" />;
      case 'client': return <User className="w-4 h-4 text-gray-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleName = (role: string) => {
    const roles = {
      admin: 'Admin Global',
      agency_owner: 'Dono da Agência',
      agency_staff: 'Funcionário',
      client: 'Cliente'
    };
    return roles[role as keyof typeof roles] || role;
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

  const getExpirationStatus = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursLeft < 0) return { status: 'expired', text: 'Expirado', color: 'destructive' };
    if (hoursLeft < 24) return { status: 'expiring', text: `Expira em ${hoursLeft}h`, color: 'destructive' };
    return { status: 'active', text: `${Math.ceil(hoursLeft / 24)} dias`, color: 'secondary' };
  };

  return (
    <div className="bg-[#fafafa] dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex pt-16">
        <Topbar
          name="Gestão de Usuários"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="p-3 lg:p-6 w-full">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Usuários</h1>
                <p className="text-gray-600 dark:text-gray-400">Crie e gerencie usuários do sistema via convites</p>
              </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {formData.creation_method === 'direct' ? 'Criar Usuário Diretamente' : 'Convidar Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {formData.creation_method === 'direct' 
                  ? 'O usuário será criado imediatamente com a senha definida.'
                  : 'O usuário receberá um link para criar sua conta e definir a senha.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Método de Criação */}
              <div className="space-y-2">
                <Label>Método de Criação</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="invite"
                      name="creation_method"
                      checked={formData.creation_method === 'invite'}
                      onChange={() => setFormData({...formData, creation_method: 'invite'})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="invite" className="text-sm font-normal">
                      📧 Enviar Convite
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="direct"
                      name="creation_method"
                      checked={formData.creation_method === 'direct'}
                      onChange={() => setFormData({...formData, creation_method: 'direct'})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="direct" className="text-sm font-normal">
                      🚀 Criar Diretamente
                    </Label>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="usuario@exemplo.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nome do usuário"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Tipo de usuário</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({...formData, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin Global</SelectItem>
                    <SelectItem value="agency_owner">Dono da Agência</SelectItem>
                    <SelectItem value="agency_staff">Funcionário da Agência</SelectItem>
                    <SelectItem value="client">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role !== 'admin' && (
                <div className="space-y-3">
                  <Label>Agência</Label>
                  
                  {/* Seletor de agência existente */}
                  <div>
                    <Select 
                      value={formData.agency_id} 
                      onValueChange={(value) => {
                        if (value === 'create_new') {
                          setFormData({...formData, agency_id: '', create_new_agency: true})
                        } else {
                          setFormData({...formData, agency_id: value, create_new_agency: false})
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          agencies.length === 0 
                            ? "Nenhuma agência encontrada - Criar nova?" 
                            : "Selecione uma agência"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies.length === 0 && (
                          <div className="px-2 py-3 text-sm text-gray-500 text-center">
                            <Building2 className="h-4 w-4 mx-auto mb-2 opacity-50" />
                            Nenhuma agência cadastrada
                          </div>
                        )}
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                              {agency.name}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="create_new" className="text-blue-600 font-medium border-t">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">➕</span>
                            Criar Nova Agência
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {agencies.length === 0 && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center">
                        <Building2 className="h-3 w-3 mr-1" />
                        Sistema limpo - Clique em "Criar Nova Agência" para começar
                      </p>
                    )}
                  </div>

                  {/* Campo para nova agência */}
                  {formData.create_new_agency && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Label htmlFor="new_agency_name" className="text-blue-900 dark:text-blue-100">
                        Nome da Nova Agência *
                      </Label>
                      <Input
                        id="new_agency_name"
                        value={formData.new_agency_name || ''}
                        onChange={(e) => setFormData({...formData, new_agency_name: e.target.value})}
                        placeholder="Ex: Marketing Digital LTDA"
                        className="mt-1"
                        required
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        A agência será criada automaticamente junto com o usuário
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Seleção de Plano */}
              {(formData.role === 'agency_owner' || formData.role === 'client') && (
                <div>
                  <Label htmlFor="plan">Plano de Assinatura *</Label>
                  <Select 
                    value={formData.plan_id || ''} 
                    onValueChange={(value) => setFormData({...formData, plan_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <span className="font-medium capitalize">{plan.plan_name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                até {plan.max_clients} clientes, {plan.max_projects} projetos
                              </span>
                            </div>
                            <div className="text-right ml-4">
                              {plan.monthly_price > 0 ? (
                                <>
                                  <div className="text-sm font-semibold">
                                    R$ {plan.monthly_price.toFixed(2)}/mês
                                  </div>
                                  {plan.annual_price > 0 && (
                                    <div className="text-xs text-green-600">
                                      R$ {plan.annual_price.toFixed(2)}/ano
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm font-semibold text-green-600">Gratuito</span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.plan_id && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                      {(() => {
                        const selectedPlan = plans.find(p => p.id === formData.plan_id);
                        if (!selectedPlan) return null;
                        
                        return (
                          <div>
                            <p className="font-medium mb-1">Recursos inclusos:</p>
                            <ul className="text-gray-600 dark:text-gray-400">
                              <li>• {selectedPlan.max_clients} clientes</li>
                              <li>• {selectedPlan.max_projects} projetos</li>
                              {selectedPlan.features && selectedPlan.features.length > 0 && (
                                selectedPlan.features.slice(0, 3).map((feature, idx) => (
                                  <li key={idx}>• {feature.replace(/_/g, ' ')}</li>
                                ))
                              )}
                            </ul>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="company">Empresa (opcional)</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="Nome da empresa"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* Campo de senha para criação direta */}
              {formData.creation_method === 'direct' && (
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    A senha deve ter pelo menos 6 caracteres
                  </p>
                </div>
              )}

              {/* Mensagem de boas-vindas apenas para convites */}
              {formData.creation_method === 'invite' && (
                <div>
                  <Label htmlFor="welcome_message">Mensagem de boas-vindas (opcional)</Label>
                  <Textarea
                    id="welcome_message"
                    value={formData.welcome_message}
                    onChange={(e) => setFormData({...formData, welcome_message: e.target.value})}
                    placeholder="Mensagem personalizada para o novo usuário..."
                    rows={3}
                  />
                </div>
              )}

              {/* Opção de enviar email de boas-vindas para criação direta */}
              {formData.creation_method === 'direct' && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send_welcome_email"
                    checked={formData.send_welcome_email}
                    onCheckedChange={(checked) => setFormData({...formData, send_welcome_email: checked})}
                  />
                  <Label htmlFor="send_welcome_email" className="text-sm">
                    Enviar email de boas-vindas
                  </Label>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Processando...' : (
                    formData.creation_method === 'direct' ? 'Criar Usuário' : 'Criar Convite'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false);
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

            {/* Tabs para Usuários e Convites */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Usuários ({users.length})
                </TabsTrigger>
                <TabsTrigger value="invitations" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Convites ({pendingInvitations.length})
                </TabsTrigger>
              </TabsList>

              {/* Aba de Usuários */}
              <TabsContent value="users">
                <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727]">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900 dark:text-white">
                      <Users className="w-5 h-5 mr-2" />
                      Usuários do Sistema ({users.length})
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Todos os usuários criados no sistema
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {users.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum usuário encontrado</p>
                        <p className="text-sm mt-2">Use o botão "Criar Usuário" para adicionar novos usuários</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Agência</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead>Último login</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                  {user.company && (
                                    <div className="text-xs text-gray-400">{user.company}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {getRoleIcon(user.role)}
                                  <span className="ml-2">{getRoleName(user.role)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {user.agency_name || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.email_confirmed ? "default" : "secondary"}>
                                  {user.email_confirmed ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Ativo
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Pendente
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {formatDate(user.created_at)}
                                  {user.created_by_admin && (
                                    <div className="text-xs text-blue-600">
                                      Via Admin
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {user.last_sign_in_at ? (
                                  <div className="text-sm">
                                    {formatDate(user.last_sign_in_at)}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">Nunca</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba de Convites */}
              <TabsContent value="invitations">
                <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727]">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900 dark:text-white">
                      <Mail className="w-5 h-5 mr-2" />
                      Convites Pendentes ({pendingInvitations.length})
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Usuários que foram convidados mas ainda não aceitaram o convite
                    </CardDescription>
                  </CardHeader>
        
              <CardContent>
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum convite pendente</p>
              <p className="text-sm mt-2">Use o botão "Criar Usuário" para convidar novos usuários</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Agência</TableHead>
                  <TableHead>Convidado por</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => {
                  const expiration = getExpirationStatus(invitation.expires_at);
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invitation.name}</div>
                          <div className="text-sm text-gray-500">{invitation.email}</div>
                          {invitation.company && (
                            <div className="text-xs text-gray-400">{invitation.company}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getRoleIcon(invitation.role)}
                          <span className="ml-2">{getRoleName(invitation.role)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {invitation.agency_name || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {invitation.invited_by_name}
                          <div className="text-xs text-gray-400">
                            {formatDate(invitation.created_at)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={expiration.color as any}>
                          <Clock className="w-3 h-3 mr-1" />
                          {expiration.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyInvitationLink(invitation.id)}
                            title="Copiar link do convite"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            title="Cancelar convite"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Como Funciona */}
            <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727]">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">ℹ️ Como Funciona o Sistema de Convites</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">🔗 1. Criar Convite</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Preencha os dados do usuário e clique em "Criar Convite". 
                Um link único será gerado e copiado para sua área de transferência.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">📧 2. Enviar Link</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Envie o link do convite para o usuário por email, WhatsApp ou outro meio.
                O link expira em 7 dias.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">✅ 3. Aceitar Convite</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O usuário clica no link, define sua senha e sua conta é criada automaticamente 
                no Supabase Auth.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">🚀 4. Acesso Liberado</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O usuário já pode fazer login normalmente com email/senha.
                Suas permissões são definidas pelo role escolhido.
              </p>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">💡 Vantagens deste Sistema</h4>
            <ul className="text-sm text-slate-800 dark:text-slate-200 space-y-1">
              <li>✅ <strong>Sem acesso ao Supabase necessário</strong> - Tudo pelo dashboard</li>
              <li>✅ <strong>Seguro</strong> - Links únicos com expiração</li>
              <li>✅ <strong>Auditoria completa</strong> - Logs de todas as ações</li>
              <li>✅ <strong>Automático</strong> - Usuário é criado no Supabase Auth automaticamente</li>
            </ul>
          </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
