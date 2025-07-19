"use client";

import React, { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Shield, 
  Building2, 
  User, 
  Crown, 
  Briefcase, 
  Star,
  UserPlus
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Shared/Topbar";

type UserRole = 'admin' | 'agency_owner' | 'agency_manager' | 'agency_employee' | 'independent_producer' | 'client' | 'freelancer' | 'influencer' | 'free';

interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: string | null;
  agency_id: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

const roleIcons = {
  admin: <Shield className="h-4 w-4" />,
  agency_owner: <Building2 className="h-4 w-4" />,
  agency_manager: <Crown className="h-4 w-4" />,
  agency_employee: <User className="h-4 w-4" />,
  independent_producer: <Briefcase className="h-4 w-4" />,
  client: <Users className="h-4 w-4" />,
  freelancer: <User className="h-4 w-4" />,
  influencer: <Star className="h-4 w-4" />,
  free: <User className="h-4 w-4" />
};

const roleLabels = {
  admin: 'Admin',
  agency_owner: 'Dono de Agência',
  agency_manager: 'Gerente de Agência',
  agency_employee: 'Funcionário de Agência',
  independent_producer: 'Produtor Independente',
  client: 'Cliente',
  freelancer: 'Freelancer',
  influencer: 'Influencer',
  free: 'Gratuito'
};

const roleColors = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  agency_owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  agency_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  agency_employee: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  independent_producer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  client: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  freelancer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  influencer: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  free: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300'
};

export default function UsersManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'free' as UserRole
  });
  const { toast } = useToast();
  const supabase = supabaseBrowser();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      setLoading(true);

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          name: formData.name,
          role: formData.role
        }
      });

      if (authError) throw authError;

      // Aguardar um pouco para o trigger criar o perfil
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar o perfil criado automaticamente
      if (authData.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: formData.role,
            name: formData.name
          })
          .eq('id', authData.user.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Usuário criado com sucesso!",
        description: `${formData.name} foi adicionado ao sistema.`,
      });

      // Resetar form e recarregar lista
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'free'
      });
      setShowCreateForm(false);
      loadUsers();

    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string | null) => {
    if (!role || !(role in roleIcons)) return <User className="h-4 w-4" />;
    return roleIcons[role as keyof typeof roleIcons];
  };

  const getRoleLabel = (role: string | null) => {
    if (!role || !(role in roleLabels)) return 'Não definido';
    return roleLabels[role as keyof typeof roleLabels];
  };

  const getRoleColor = (role: string | null) => {
    if (!role || !(role in roleColors)) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    return roleColors[role as keyof typeof roleColors];
  };

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-72">
        <Topbar
          name="Gerenciamento de Usuários"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Users className="h-8 w-8 text-blue-600 mr-3" />
                  Gerenciamento de Usuários
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Crie e gerencie todos os usuários do sistema
                </p>
              </div>
              
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>

            {/* Create User Form */}
            {showCreateForm && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Criar Novo Usuário</CardTitle>
                  <CardDescription>
                    Preencha os dados do novo usuário
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="usuario@exemplo.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Senha do usuário"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Nome completo do usuário"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Tipo de Usuário</Label>
                    <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({...formData, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">🛡️ Admin</SelectItem>
                        <SelectItem value="agency_owner">🏢 Dono de Agência</SelectItem>
                        <SelectItem value="agency_manager">👑 Gerente de Agência</SelectItem>
                        <SelectItem value="agency_employee">👤 Funcionário de Agência</SelectItem>
                        <SelectItem value="independent_producer">💼 Produtor Independente</SelectItem>
                        <SelectItem value="client">👥 Cliente</SelectItem>
                        <SelectItem value="freelancer">🎯 Freelancer</SelectItem>
                        <SelectItem value="influencer">⭐ Influencer</SelectItem>
                        <SelectItem value="free">🆓 Gratuito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      onClick={createUser}
                      disabled={loading || !formData.email || !formData.password || !formData.name}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? 'Criando...' : 'Criar Usuário'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>Usuários do Sistema ({users.length})</CardTitle>
                <CardDescription>
                  Lista de todos os usuários cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando usuários...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Nenhum usuário encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {user.name || user.email || 'Usuário'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email || 'Email não definido'}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getRoleColor(user.role)}>
                                {getRoleLabel(user.role)}
                              </Badge>
                              {user.agency_id && (
                                <Badge variant="outline">
                                  🏢 Vinculado à Agência
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Criado em:
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Data não disponível'}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                            ID: {user.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
