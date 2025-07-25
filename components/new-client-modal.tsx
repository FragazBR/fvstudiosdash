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
import { useToast } from "@/components/ui/use-toast";
import { Building2, Loader2, User } from "lucide-react";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

const supabase = supabaseBrowser();

export function NewClientModal({ isOpen, onClose, onClientCreated }: NewClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
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
    
    console.log('Form submitted with data:', formData);
    
    if (!formData.name.trim()) {
      alert("O nome é obrigatório.");
      return;
    }

    if (!formData.email.trim()) {
      alert("O email é obrigatório.");
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Por favor, insira um email válido.");
      return;
    }

    setLoading(true);
    console.log('Starting client creation process...');

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session);
      
      if (!session?.user) {
        alert("Você precisa estar logado para criar um cliente.");
        setLoading(false);
        return;
      }

      // Get user profile to get agency_id
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, agency_id, role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Error fetching user profile:', profileError);
        alert("Perfil de usuário não encontrado.");
        setLoading(false);
        return;
      }
      
      console.log('User profile:', userProfile);

      // Check if email already exists
      const { data: existingContact, error: existingError } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', formData.email.trim().toLowerCase());

      // Only show error if it's not "no rows found" error
      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing contact:', existingError);
        alert("Erro ao verificar email existente.");
        setLoading(false);
        return;
      }

      if (existingContact && existingContact.length > 0) {
        alert("Já existe um cliente com este email.");
        setLoading(false);
        return;
      }
      
      console.log('Email check passed, proceeding with creation...');

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

      console.log('Creating client with data:', clientData);

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert([clientData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cliente:', error);
        alert(`Não foi possível criar o cliente: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log('Client created successfully:', contact);

      // Create initial interaction (optional - don't fail if table doesn't exist)
      try {
        await supabase
          .from('contact_interactions')
          .insert({
            contact_id: contact.id,
            type: 'note',
            notes: `Cliente criado no sistema. Fonte: Manual`,
            outcome: 'completed',
            created_by: userProfile.id
          });
      } catch (interactionError) {
        console.warn('Could not create initial interaction:', interactionError);
        // Don't fail the whole process if interaction creation fails
      }

      alert(`Cliente ${formData.name} criado com sucesso!`);

      // Reset form
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
        address: ""
      });

      onClientCreated();
      onClose();

    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      alert("Ocorreu um erro inesperado. Tente novamente.");
      setLoading(false);
    }
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
              onClick={() => console.log('Submit button clicked!')}
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