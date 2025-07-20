'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCheck, Mail, Lock, Eye, EyeOff, Shield, Building2, Users, User } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { toast } from 'sonner';

interface InvitationInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  company?: string;
  agency_name?: string;
  invited_by_name: string;
  welcome_message?: string;
  expires_at: string;
}

export default function AcceptInvitationPage() {
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const supabase = supabaseBrowser();

  useEffect(() => {
    if (!token) {
      setError('Token de convite não encontrado');
      setLoading(false);
      return;
    }
    
    loadInvitationInfo();
  }, [token]);

  const loadInvitationInfo = async () => {
    try {
      const { data: invitation } = await supabase
        .from('user_invitations')
        .select(`
          id,
          email,
          name,
          role,
          company,
          welcome_message,
          expires_at,
          agencies!agency_id (name),
          invited_by:user_profiles!invited_by (name)
        `)
        .eq('id', token)
        .eq('status', 'pending')
        .single();

      if (!invitation) {
        setError('Convite não encontrado ou já foi usado');
        setLoading(false);
        return;
      }

      // Verificar se expirou
      if (new Date(invitation.expires_at) < new Date()) {
        setError('Este convite expirou');
        setLoading(false);
        return;
      }

      setInvitationInfo({
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        company: invitation.company,
        agency_name: invitation.agencies?.name,
        invited_by_name: invitation.invited_by?.name,
        welcome_message: invitation.welcome_message,
        expires_at: invitation.expires_at
      });

    } catch (error: any) {
      console.error('Error loading invitation:', error);
      setError('Erro ao carregar informações do convite');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setAccepting(true);
    setError('');

    try {
      const { data, error } = await supabase.rpc('accept_user_invitation', {
        p_invitation_id: token,
        p_password: password
      });

      if (error) throw error;

      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (result.error) {
        setError(result.error);
        return;
      }

      toast.success('Conta criada com sucesso! Você pode fazer login agora.');
      
      // Redirecionar para login
      router.push('/login?message=account-created&email=' + encodeURIComponent(invitationInfo?.email || ''));

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError('Erro ao criar conta: ' + error.message);
    } finally {
      setAccepting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-5 h-5 text-red-600" />;
      case 'agency_owner': return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'agency_staff': return <Users className="w-5 h-5 text-green-600" />;
      case 'client': return <User className="w-5 h-5 text-gray-600" />;
      default: return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleName = (role: string) => {
    const roles = {
      admin: 'Administrador Global',
      agency_owner: 'Proprietário da Agência',
      agency_staff: 'Funcionário da Agência',
      client: 'Cliente'
    };
    return roles[role as keyof typeof roles] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Carregando convite...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitationInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Convite Inválido</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Ir para Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <UserCheck className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Bem-vindo!</h1>
          <p className="text-gray-600 mt-2">Você foi convidado para fazer parte da nossa plataforma</p>
        </div>

        {invitationInfo && (
          <div className="space-y-6">
            {/* Informações do Convite */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Convite</CardTitle>
                <CardDescription>
                  Detalhes sobre o seu acesso à plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{invitationInfo.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    {getRoleIcon(invitationInfo.role)}
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Função</p>
                      <p className="font-medium">{getRoleName(invitationInfo.role)}</p>
                    </div>
                  </div>

                  {invitationInfo.agency_name && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Agência</p>
                        <p className="font-medium">{invitationInfo.agency_name}</p>
                      </div>
                    </div>
                  )}

                  {invitationInfo.company && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Empresa</p>
                        <p className="font-medium">{invitationInfo.company}</p>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Convidado por:</strong> {invitationInfo.invited_by_name}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Convite expira em: {new Date(invitationInfo.expires_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {invitationInfo.welcome_message && (
                  <Alert>
                    <AlertDescription>
                      <strong>Mensagem de boas-vindas:</strong><br />
                      {invitationInfo.welcome_message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Formulário de Criação de Senha */}
            <Card>
              <CardHeader>
                <CardTitle>Criar Senha</CardTitle>
                <CardDescription>
                  Defina uma senha segura para acessar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAcceptInvitation} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="password">Nova senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite a senha novamente"
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={accepting || password.length < 6 || password !== confirmPassword}
                      className="w-full"
                    >
                      {accepting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Criando conta...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Aceitar Convite e Criar Conta
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Informações sobre Segurança */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center text-blue-800">
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Segurança e Privacidade</h3>
                  <p className="text-sm">
                    Sua conta será criada de forma segura. Após aceitar este convite, 
                    você poderá fazer login normalmente com seu email e senha.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
