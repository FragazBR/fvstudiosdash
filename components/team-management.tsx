"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Mail, 
  UserCheck, 
  UserX, 
  Crown, 
  Shield, 
  User, 
  Building,
  Trash2,
  Edit,
  MoreHorizontal,
  Send,
  UserPlus
} from "lucide-react";
import { useUser } from '@/hooks/useUser';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { Switch } from "@/components/ui/switch";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  company?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface Invitation {
  id: string;
  email: string;
  name?: string;
  role: string;
  status: string;
  invited_by: string;
  created_at: string;
  company?: string;
  phone?: string;
}

const ROLE_LABELS = {
  agency_manager: { label: 'Gerente', icon: Crown, color: 'bg-purple-100 text-purple-800' },
  agency_staff: { label: 'Colaborador', icon: Shield, color: 'bg-blue-100 text-blue-800' }
};

export function TeamManagement() {
  const { user } = useUser();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'agency_staff',
    company: '',
    phone: '',
    password: '',
    mode: 'direct' // 'direct' ou 'invite'
  });

  const canManageTeam = user?.can_manage_team || false;
  const canInviteCollaborators = user?.can_manage_team || false; // Use can_manage_team for invitations too

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Carregar membros da equipe
      const { data: members, error: membersError } = await supabaseBrowser()
        .from('user_profiles')
        .select('*')
        .in('role', ['agency_manager', 'agency_staff'])
        .eq('agency_id', user?.agency_id || user?.id) // Filtrar pela agência
        .order('created_at', { ascending: false });

      if (membersError) {
        console.error('Erro ao carregar membros:', membersError);
      } else {
        setTeamMembers(members || []);
      }

      // Carregar convites pendentes
      const { data: invites, error: invitesError } = await supabaseBrowser()
        .from('user_invitations')
        .select('*')
        .eq('invited_by', user?.id)
        .in('status', ['pending', 'sent'])
        .order('created_at', { ascending: false });

      if (invitesError) {
        console.error('Erro ao carregar convites:', invitesError);
      } else {
        setInvitations(invites || []);
      }

    } catch (error) {
      console.error('Erro ao carregar dados da equipe:', error);
      toast.error('Erro ao carregar dados da equipe');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canInviteCollaborators) {
      toast.error('Você não tem permissão para convidar colaboradores');
      return;
    }

    try {
      if (inviteForm.mode === 'direct') {
        // Cadastro direto com senha
        const { data, error } = await supabaseBrowser().rpc('create_user_with_profile', {
          p_email: inviteForm.email,
          p_password: inviteForm.password,
          p_name: inviteForm.name,
          p_role: inviteForm.role,
          p_agency_id: user?.agency_id || user?.id,
          p_company: inviteForm.company,
          p_phone: inviteForm.phone
        });

        if (error) {
          console.error('Erro ao criar usuário:', error);
          toast.error('Erro ao criar usuário: ' + error.message);
          return;
        }

        // Check if the function returned an error in the data
        if (data && !data.success) {
          console.error('Erro na função create_user_with_profile:', data.error);
          toast.error('Erro ao criar usuário: ' + data.error);
          return;
        }

        toast.success(`Colaborador ${inviteForm.name} criado com sucesso!`);
      } else {
        // Sistema de convite por email
        const { data, error } = await supabaseBrowser().rpc('create_user_invitation', {
          p_email: inviteForm.email,
          p_name: inviteForm.name,
          p_role: inviteForm.role,
          p_agency_id: user?.agency_id || user?.id,
          p_company: inviteForm.company,
          p_phone: inviteForm.phone,
          p_welcome_message: `Você foi convidado para fazer parte da equipe da ${user?.company || 'nossa agência'}!`
        });

        if (error) {
          console.error('Erro ao criar convite:', error);
          toast.error('Erro ao enviar convite: ' + error.message);
          return;
        }

        toast.success(`Convite enviado para ${inviteForm.email}!`);
      }

      setInviteForm({ name: '', email: '', role: 'agency_staff', company: '', phone: '', password: '', mode: 'direct' });
      setInviteDialogOpen(false);
      loadTeamData(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      toast.error('Erro ao processar solicitação');
    }
  };

  const handleDeleteInvitation = async (inviteId: string) => {
    try {
      const { error } = await supabaseBrowser()
        .from('user_invitations')
        .delete()
        .eq('id', inviteId);

      if (error) {
        console.error('Erro ao deletar convite:', error);
        toast.error('Erro ao cancelar convite');
        return;
      }

      toast.success('Convite cancelado');
      loadTeamData();

    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      toast.error('Erro ao cancelar convite');
    }
  };

  const getRoleInfo = (role: string) => {
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS] || { 
      label: role, 
      icon: User, 
      color: 'bg-gray-100 text-gray-800' 
    };
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestão de Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Membros</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Convites Pendentes</p>
                <p className="text-2xl font-bold">{invitations.length}</p>
              </div>
              <Mail className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Colaboradores Ativos</p>
                <p className="text-2xl font-bold">
                  {teamMembers.filter(m => m.last_sign_in_at).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de membros da equipe */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membros da Equipe
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie os colaboradores da sua agência
            </p>
          </div>
          
          {canInviteCollaborators && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Convidar Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {inviteForm.mode === 'direct' ? 'Criar Colaborador' : 'Enviar Convite'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  {/* Toggle para modo de criação */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {inviteForm.mode === 'direct' ? (
                        <UserPlus className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Mail className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm font-medium">
                        {inviteForm.mode === 'direct' ? 'Criar usuário direto' : 'Enviar convite por email'}
                      </span>
                    </div>
                    <Switch
                      checked={inviteForm.mode === 'invite'}
                      onCheckedChange={(checked) => 
                        setInviteForm({...inviteForm, mode: checked ? 'invite' : 'direct'})
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Cargo</Label>
                    <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agency_manager">Gerente</SelectItem>
                        <SelectItem value="agency_staff">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campo senha só aparece no modo direto */}
                  {inviteForm.mode === 'direct' && (
                    <div>
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={inviteForm.password}
                        onChange={(e) => setInviteForm({...inviteForm, password: e.target.value})}
                        placeholder="Senha para acesso"
                        required
                        minLength={6}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="company">Empresa (opcional)</Label>
                    <Input
                      id="company"
                      value={inviteForm.company}
                      onChange={(e) => setInviteForm({...inviteForm, company: e.target.value})}
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <Input
                      id="phone"
                      value={inviteForm.phone}
                      onChange={(e) => setInviteForm({...inviteForm, phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    {inviteForm.mode === 'direct' ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Criar Colaborador
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Convite
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>

        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum membro ainda</h3>
              <p className="text-sm text-gray-600 mb-4">
                Comece convidando colaboradores para sua equipe
              </p>
              {canInviteCollaborators && (
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Convidar Primeiro Colaborador
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Membro desde</TableHead>
                  {canManageTeam && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => {
                  const roleInfo = getRoleInfo(member.role);
                  const RoleIcon = roleInfo.icon;
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {member.name?.charAt(0) || member.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name || 'Sem nome'}</p>
                            <p className="text-sm text-gray-600">{member.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleInfo.color}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={member.last_sign_in_at ? "default" : "secondary"}>
                          {member.last_sign_in_at ? 'Ativo' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      {canManageTeam && (
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Convites pendentes */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Convites Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invite) => {
                const roleInfo = getRoleInfo(invite.role);
                const RoleIcon = roleInfo.icon;
                
                return (
                  <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {invite.name?.charAt(0) || invite.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{invite.name || invite.email}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={roleInfo.color} variant="secondary">
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {roleInfo.label}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Enviado em {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteInvitation(invite.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}