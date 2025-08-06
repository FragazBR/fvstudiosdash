"use client";

import { useState, useEffect } from "react";
import { useUser } from '@/hooks/useUser';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Loader2, User, Mail, UserPlus, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

const supabase = supabaseBrowser();

export function NewClientModal({ isOpen, onClose, onClientCreated }: NewClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [creationMode, setCreationMode] = useState<'direct' | 'invite'>('invite');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    type: "client",
    status: "active",
    notes: "",
    website: "",
    address: "",
    password: "",
    createUserAccount: true, // Por padrão, criar conta de usuário
    // Campos financeiros
    contract_value: "",
    contract_duration: "",
    contract_start_date: "",
    payment_frequency: "monthly",
    contract_currency: "BRL"
  });

  const { user } = useUser();

  // Set default client type based on user role
  useEffect(() => {
    const setDefaultType = async () => {
      let currentUserRole = user?.role;
      
      // If useUser hook didn't return role, fetch it directly
      if (!currentUserRole) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            currentUserRole = profile?.role;
          }
        } catch (error) {
          console.warn('Could not fetch user role:', error);
        }
      }
      
      setUserRole(currentUserRole || '');
      
      if (currentUserRole === 'independent_producer') {
        setFormData(prev => ({ ...prev, type: "independent_client" }));
      } else {
        setFormData(prev => ({ ...prev, type: "client" }));
      }
    };
    
    setDefaultType();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.company.trim()) {
      toast.error("O nome da empresa é obrigatório.");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("O nome do responsável é obrigatório.");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("O email é obrigatório.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Por favor, insira um email válido.");
      return;
    }

    if (formData.createUserAccount && creationMode === 'direct' && !formData.password.trim()) {
      toast.error("A senha é obrigatória para criar conta com login.");
      return;
    }

    if (formData.createUserAccount && creationMode === 'direct' && formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      if (formData.createUserAccount) {
        // Criar cliente com conta de usuário
        await createClientWithAccount();
      } else {
        // Criar apenas registro de cliente (sem login)
        await createClientOnly();
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const createClientWithAccount = async () => {
    const clientData = {
      email: formData.email.trim().toLowerCase(),
      name: formData.name.trim(),
      role: 'agency_client',
      company: formData.company.trim() || null,
      phone: formData.phone.trim() || null,
      position: formData.position.trim() || null,
      website: formData.website.trim() || null,
      address: formData.address.trim() || null,
      notes: formData.notes.trim() || null,
      // Campos financeiros
      contract_value: formData.contract_value.trim() || null,
      contract_duration: formData.contract_duration.trim() || null,
      contract_start_date: formData.contract_start_date || null,
      payment_frequency: formData.payment_frequency,
      contract_currency: formData.contract_currency
    };

    if (creationMode === 'direct') {
      clientData.password = formData.password;
      
      const response = await fetch('/api/admin/clients/create-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || 'Erro ao criar cliente');
        return;
      }

      toast.success(`Cliente ${formData.name} criado com sucesso! Pode fazer login agora.`);
    } else {
      // Enviar convite
      const response = await fetch('/api/admin/clients/create-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...clientData,
          welcome_message: `Olá ${formData.name}! Você foi convidado para acessar o portal do cliente da nossa agência. Clique no link para criar sua senha e acessar.`
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || 'Erro ao enviar convite');
        return;
      }

      toast.success(`Convite enviado para ${formData.email}!`);
    }

    resetForm();
    onClientCreated();
    onClose();
  };

  const createClientOnly = async () => {
    // Lógica original para criar apenas na tabela clients/contacts (sem login)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast.error("Você precisa estar logado para criar um cliente.");
      return;
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, agency_id, role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile) {
      toast.error("Perfil de usuário não encontrado.");
      return;
    }

    const clientData = {
      // SCHEMA PADRONIZADO DA WORKSTATION
      company: formData.company.trim() || null,
      contact_name: formData.name.trim(), // Usar contact_name em vez de name
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || null,
      status: 'active', // Usar enum user_status
      agency_id: userProfile.agency_id,
      created_by: userProfile.id,
      // Campos financeiros padronizados
      contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
      contract_duration: formData.contract_duration ? parseInt(formData.contract_duration) : null,
      contract_start_date: formData.contract_start_date || null,
      payment_frequency: formData.payment_frequency,
      contract_currency: formData.contract_currency
    };

    const { data: client, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (error) {
      toast.error(`Não foi possível criar o cliente: ${error.message}`);
      return;
    }

    toast.success(`Cliente ${formData.name} criado com sucesso (sem login)!`);
    
    resetForm();
    onClientCreated();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      position: "",
      type: userRole === 'independent_producer' ? "independent_client" : "client",
      status: "active",
      notes: "",
      website: "",
      address: "",
      password: "",
      createUserAccount: true,
      // Campos financeiros
      contract_value: "",
      contract_duration: "",
      contract_start_date: "",
      payment_frequency: "monthly",
      contract_currency: "BRL"
    });
    setCreationMode('invite');
  };

  const handleChange = (field: string, value: string) => {
    console.log(`Field changed: ${field} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Nova Conta / Cliente
          </DialogTitle>
          <DialogDescription>
            Adicione um novo cliente com contrato financeiro. Será automaticamente integrado ao sistema de <strong>Contas</strong> para gestão de redes sociais, campanhas e relatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Opção de criar conta de usuário */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Criar conta de usuário</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Permitir que o cliente faça login no sistema
              </p>
            </div>
            <Switch
              checked={formData.createUserAccount}
              onCheckedChange={(checked) => 
                setFormData({...formData, createUserAccount: checked})
              }
            />
          </div>

          {/* Modo de criação da conta (se habilitado) */}
          {formData.createUserAccount && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                {creationMode === 'direct' ? (
                  <UserPlus className="h-4 w-4 text-blue-500" />
                ) : (
                  <Mail className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium">
                  {creationMode === 'direct' ? 'Criar com senha agora' : 'Enviar convite por email'}
                </span>
              </div>
              <Switch
                checked={creationMode === 'invite'}
                onCheckedChange={(checked) => 
                  setCreationMode(checked ? 'invite' : 'direct')
                }
              />
            </div>
          )}

          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Ex: Restaurante Drummond"
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="name">Responsável *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Ricardo D'Aquino"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contato@restaurantedrummond.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="Ex: CEO, Gerente de Marketing"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://empresa.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Classificação */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipo de Cliente</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userRole === 'independent_producer' ? (
                    <>
                      <SelectItem value="independent_client">Cliente</SelectItem>
                      <SelectItem value="independent_lead">Lead</SelectItem>
                      <SelectItem value="independent_prospect">Prospect</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Rua, número, bairro, cidade - Estado"
              disabled={loading}
            />
          </div>

          {/* Campo de senha (apenas se criar conta direta) */}
          {formData.createUserAccount && creationMode === 'direct' && (
            <div>
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Informações Financeiras */}
          <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
              💰 Informações do Contrato
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contract_value">Valor do Contrato (R$)</Label>
                <Input
                  id="contract_value"
                  type="number"
                  step="0.01"
                  value={formData.contract_value}
                  onChange={(e) => handleChange('contract_value', e.target.value)}
                  placeholder="Ex: 5000.00"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="contract_duration">Duração (meses)</Label>
                <Input
                  id="contract_duration"
                  type="number"
                  min="1"
                  value={formData.contract_duration}
                  onChange={(e) => handleChange('contract_duration', e.target.value)}
                  placeholder="Ex: 12"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contract_start_date">Data de Início</Label>
                <Input
                  id="contract_start_date"
                  type="date"
                  value={formData.contract_start_date}
                  onChange={(e) => handleChange('contract_start_date', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="payment_frequency">Frequência de Pagamento</Label>
                <Select
                  value={formData.payment_frequency}
                  onValueChange={(value) => handleChange('payment_frequency', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                    <SelectItem value="one-time">Pagamento Único</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contract_currency">Moeda</Label>
                <Select
                  value={formData.contract_currency}
                  onValueChange={(value) => handleChange('contract_currency', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (R$)</SelectItem>
                    <SelectItem value="USD">Dólar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Informações adicionais sobre o cliente..."
              rows={3}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.company.trim() || !formData.name.trim() || !formData.email.trim() || 
                (formData.createUserAccount && creationMode === 'direct' && !formData.password.trim())}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  {formData.createUserAccount ? (
                    creationMode === 'direct' ? (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Criar Cliente + Conta
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar Convite
                      </>
                    )
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Criar Cliente
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}