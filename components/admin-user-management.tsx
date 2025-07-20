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
import { UserPlus, Users, Mail, Clock, Copy, Trash2, Shield, Building2, User } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { toast } from 'sonner';

interface Agency {
  id: string;
  name: string;
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
}

export default function AdminUserManagementPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const supabase = supabaseBrowser();

  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    name: '',
    role: 'client',
    agency_id: '',
    company: '',
    phone: '',
    welcome_message: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar agências
      const { data: agenciesData } = await supabase
        .from('agencies')
        .select('id, name')
        .order('name');
      
      if (agenciesData) setAgencies(agenciesData);

      // Carregar convites pendentes
      const { data: invitationsData } = await supabase.rpc('get_pending_invitations');
      if (invitationsData) setPendingInvitations(invitationsData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('create_user_invitation', {
        p_email: formData.email,
        p_name: formData.name,
        p_role: formData.role,
        p_agency_id: formData.agency_id || null,
        p_company: formData.company || null,
        p_phone: formData.phone || null,
        p_welcome_message: formData.welcome_message || null
      });

      if (error) throw error;

      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Convite criado com sucesso!');
      
      // Copiar link do convite para clipboard
      if (result.invitation_url) {
        await navigator.clipboard.writeText(result.invitation_url);
        toast.info('Link do convite copiado para a área de transferência');
      }

      // Reset form and close dialog
      setFormData({
        email: '',
        name: '',
        role: 'client',
        agency_id: '',
        company: '',
        phone: '',
        welcome_message: ''
      });
      setDialogOpen(false);
      loadData(); // Reload data

    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast.error('Erro ao criar convite: ' + error.message);
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600">Crie e gerencie usuários do sistema via convites</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuário</DialogTitle>
              <DialogDescription>
                O usuário receberá um email com link para criar sua conta.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateInvitation} className="space-y-4">
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
                <div>
                  <Label htmlFor="agency">Agência</Label>
                  <Select 
                    value={formData.agency_id} 
                    onValueChange={(value) => setFormData({...formData, agency_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma agência" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Criando...' : 'Criar Convite'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Convites Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Convites Pendentes ({pendingInvitations.length})
          </CardTitle>
          <CardDescription>
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

      {/* Como Funciona */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Como Funciona o Sistema de Convites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🔗 1. Criar Convite</h4>
              <p className="text-sm text-gray-600">
                Preencha os dados do usuário e clique em "Criar Convite". 
                Um link único será gerado e copiado para sua área de transferência.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">📧 2. Enviar Link</h4>
              <p className="text-sm text-gray-600">
                Envie o link do convite para o usuário por email, WhatsApp ou outro meio.
                O link expira em 7 dias.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">✅ 3. Aceitar Convite</h4>
              <p className="text-sm text-gray-600">
                O usuário clica no link, define sua senha e sua conta é criada automaticamente 
                no Supabase Auth.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🚀 4. Acesso Liberado</h4>
              <p className="text-sm text-gray-600">
                O usuário já pode fazer login normalmente com email/senha.
                Suas permissões são definidas pelo role escolhido.
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Vantagens deste Sistema</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ <strong>Sem acesso ao Supabase necessário</strong> - Tudo pelo dashboard</li>
              <li>✅ <strong>Seguro</strong> - Links únicos com expiração</li>
              <li>✅ <strong>Auditoria completa</strong> - Logs de todas as ações</li>
              <li>✅ <strong>Automático</strong> - Usuário é criado no Supabase Auth automaticamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
