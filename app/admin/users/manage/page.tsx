"use client";

import React, { useState, useEffect } from 'react';
import { PermissionGuard } from "@/components/permission-guard";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Shared/Topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  Building2, 
  User, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  MoreHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { toast } from 'sonner';

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
  plan_name?: string;
  subscription_status?: string;
}

function UserManagementContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [agencies, setAgencies] = useState<Array<{id: string, name: string}>>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const router = useRouter();
  const supabase = supabaseBrowser();

  useEffect(() => {
    loadUsers();
    loadAgencies();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, agencyFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users/list');
      const data = await response.json();
      
      if (response.ok) {
        // Buscar informações de planos para cada usuário
        const usersWithPlans = await Promise.all(
          data.users.map(async (user: User) => {
            if (user.agency_id) {
              const { data: subscription } = await supabase
                .from('user_subscriptions')
                .select(`
                  status,
                  plan_limits!inner(plan_name)
                `)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();
              
              return {
                ...user,
                plan_name: subscription?.plan_limits?.plan_name || 'N/A',
                subscription_status: subscription?.status || 'none'
              };
            }
            return user;
          })
        );
        
        setUsers(usersWithPlans);
      } else {
        toast.error('Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const loadAgencies = async () => {
    const { data } = await supabase
      .from('agencies')
      .select('id, name')
      .order('name');
    
    if (data) setAgencies(data);
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.company && user.company.toLowerCase().includes(term)) ||
        (user.agency_name && user.agency_name.toLowerCase().includes(term))
      );
    }

    // Filtro por role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filtro por agência
    if (agencyFilter !== 'all') {
      filtered = filtered.filter(user => user.agency_id === agencyFilter);
    }

    setFilteredUsers(filtered);
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

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Usuário excluído com sucesso');
        loadUsers(); // Recarregar lista
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleSuspendUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja suspender o usuário "${userName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Usuário suspenso com sucesso');
        loadUsers(); // Recarregar lista
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao suspender usuário');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Erro ao suspender usuário');
    }
  };

  return (
    <div className="bg-[#fafafa] dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex pt-16">
        <Topbar
          name="Gerenciamento de Usuários"
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
                    Gerenciamento de Usuários
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Visualize e gerencie todos os usuários do sistema
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => router.push('/admin/users')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Usuário
                </Button>
              </div>
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
                        placeholder="Buscar por nome, email, empresa ou agência..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Filtro por Role */}
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Roles</SelectItem>
                      <SelectItem value="admin">Admin Global</SelectItem>
                      <SelectItem value="agency_owner">Dono da Agência</SelectItem>
                      <SelectItem value="agency_staff">Funcionário</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro por Agência */}
                  <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Agências</SelectItem>
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    {loading ? 'Carregando...' : `${filteredUsers.length} usuário(s) encontrado(s)`}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span>Total: {users.length}</span>
                    <span>Ativos: {users.filter(u => u.email_confirmed).length}</span>
                    <span>Pendentes: {users.filter(u => !u.email_confirmed).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Usuários */}
            <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727]">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Users className="w-5 h-5 mr-2" />
                  Usuários do Sistema
                </CardTitle>
                <CardDescription>
                  Lista completa de todos os usuários cadastrados
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Carregando usuários...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum usuário encontrado</p>
                    <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Agência</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Último login</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
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
                            {user.plan_name ? (
                              <Badge variant="secondary" className="capitalize">
                                {user.plan_name}
                              </Badge>
                            ) : (
                              '-'
                            )}
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
                                  <XCircle className="w-3 h-3 mr-1" />
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
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setViewDialogOpen(true);
                                }}
                                title="Ver detalhes"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              
                              {user.role !== 'admin' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSuspendUser(user.id, user.name)}
                                    title="Suspender usuário"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    title="Excluir usuário"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
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
                <DialogTitle>Detalhes do Usuário</DialogTitle>
                <DialogDescription>
                  Informações completas sobre o usuário selecionado
                </DialogDescription>
              </DialogHeader>
              
              {selectedUser && (
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nome</label>
                      <p className="text-gray-900 dark:text-white">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900 dark:text-white">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <div className="flex items-center">
                        {getRoleIcon(selectedUser.role)}
                        <span className="ml-2">{getRoleName(selectedUser.role)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge variant={selectedUser.email_confirmed ? "default" : "secondary"}>
                        {selectedUser.email_confirmed ? 'Ativo' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>

                  {/* Informações da Agência */}
                  {selectedUser.agency_name && (
                    <div>
                      <h4 className="font-medium mb-2">Informações da Agência</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Agência</label>
                          <p className="text-gray-900 dark:text-white">{selectedUser.agency_name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Plano</label>
                          <p className="text-gray-900 dark:text-white capitalize">
                            {selectedUser.plan_name || 'Não definido'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informações de Contato */}
                  <div>
                    <h4 className="font-medium mb-2">Contato</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Telefone</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.phone || 'Não informado'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Empresa</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.company || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Datas */}
                  <div>
                    <h4 className="font-medium mb-2">Histórico</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Criado em</label>
                        <p className="text-gray-900 dark:text-white">{formatDate(selectedUser.created_at)}</p>
                        {selectedUser.created_by_admin && (
                          <p className="text-xs text-blue-600">Criado via Admin</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Último login</label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedUser.last_sign_in_at ? formatDate(selectedUser.last_sign_in_at) : 'Nunca'}
                        </p>
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

export default function UserManagementPage() {
  return (
    <PermissionGuard allowedRoles={['admin']} showUnauthorized>
      <UserManagementContent />
    </PermissionGuard>
  );
}