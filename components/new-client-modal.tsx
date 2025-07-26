"use client";

import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
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
import { useToast } from "@/components/ui/use-toast";
import { Building2, Loader2, User } from "lucide-react";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function NewClientModal({ isOpen, onClose, onClientCreated }: NewClientModalProps) {
  const [loading, setLoading] = useState(false);
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
    address: ""
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Erro",
        description: "O email é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar um cliente.",
          variant: "destructive",
        });
        return;
      }

      // Get user profile to get agency_id
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, agency_id')
        .eq('email', session.user.email)
        .single();

      if (!userProfile) {
        toast({
          title: "Erro",
          description: "Perfil de usuário não encontrado.",
          variant: "destructive",
        });
        return;
      }

      // Check if email already exists
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', formData.email.trim())
        .single();

      if (existingContact) {
        toast({
          title: "Erro",
          description: "Já existe um cliente com este email.",
          variant: "destructive",
        });
        return;
      }

      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        position: formData.position.trim() || null,
        type: formData.type,
        status: formData.status,
        notes: formData.notes.trim() || null,
        website: formData.website.trim() || null,
        address: formData.address.trim() || null,
        agency_id: userProfile.agency_id,
        created_by: userProfile.id,
        source: 'Manual',
        tags: [],
        social_media: {},
        custom_fields: {}
      };

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert([clientData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cliente:', error);
        toast({
          title: "Erro ao criar cliente",
          description: "Não foi possível criar o cliente. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Create initial interaction
      await supabase
        .from('contact_interactions')
        .insert({
          contact_id: contact.id,
          type: 'note',
          notes: `Cliente criado no sistema. Fonte: Manual`,
          outcome: 'completed',
          created_by: userProfile.id
        });

      toast({
        title: "Cliente criado com sucesso!",
        description: `${formData.name} foi adicionado à sua lista de clientes.`,
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        position: "",
        type: "client",
        status: "active",
        notes: "",
        website: "",
        address: ""
      });

      onClientCreated();
      onClose();

    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
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
            Adicione um novo cliente à sua carteira. Preencha as informações básicas para começar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: João Silva"
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="joao@empresa.com"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Ex: TechCorp Ltda"
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
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
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
              disabled={loading || !formData.name.trim() || !formData.email.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Criar Cliente
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}