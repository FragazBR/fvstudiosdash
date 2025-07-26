"use client";

import { useState, useEffect } from "react";
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
import { FolderKanban, Loader2, Building2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

const supabase = supabaseBrowser();

export function NewProjectModal({ isOpen, onClose, onProjectCreated }: NewProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_id: "",
    status: "planning",
    priority: "medium",
    budget_total: "",
    start_date: "",
    end_date: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const { data: clientsData, error } = await supabase
        .from('contacts')
        .select('id, name, company, email')
        .eq('type', 'client')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        return;
      }

      const transformedClients: Client[] = (clientsData || []).map(client => ({
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email
      }));

      setClients(transformedClients);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do projeto é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.client_id) {
      toast({
        title: "Erro",
        description: "Selecione um cliente para o projeto.",
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
          description: "Você precisa estar logado para criar um projeto.",
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

      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        client_id: formData.client_id,
        status: formData.status,
        priority: formData.priority,
        budget_total: formData.budget_total ? parseFloat(formData.budget_total) : null,
        budget_spent: 0,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        agency_id: userProfile.agency_id,
        created_by: userProfile.id,
      };

      const { error } = await supabase
        .from('projects')
        .insert([projectData]);

      if (error) {
        console.error('Erro ao criar projeto:', error);
        toast({
          title: "Erro ao criar projeto",
          description: "Não foi possível criar o projeto. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Projeto criado com sucesso!",
        description: "O novo projeto foi adicionado à sua carteira.",
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        client_id: "",
        status: "planning",
        priority: "medium",
        budget_total: "",
        start_date: "",
        end_date: "",
      });

      onProjectCreated();
      onClose();

    } catch (error) {
      console.error('Erro ao criar projeto:', error);
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
            <FolderKanban className="h-5 w-5 text-blue-600" />
            Novo Projeto
          </DialogTitle>
          <DialogDescription>
            Crie um novo projeto para um cliente existente. Defina o escopo, orçamento e prazos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações Básicas */}
          <div>
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Website Corporativo, Campanha de Marketing"
              disabled={loading}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descreva o escopo e objetivos do projeto..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="client">Cliente *</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => handleChange('client_id', value)}
              disabled={loading || loadingClients}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingClients ? "Carregando clientes..." : "Selecione um cliente"} />
              </SelectTrigger>
              <SelectContent>
                {loadingClients ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : clients.length === 0 ? (
                  <SelectItem value="no-clients" disabled>
                    Nenhum cliente encontrado
                  </SelectItem>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">{client.name}</span>
                          {client.company && (
                            <span className="text-xs text-gray-500">{client.company}</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {clients.length === 0 && !loadingClients && (
              <p className="text-xs text-gray-500 mt-1">
                Nenhum cliente encontrado. <button type="button" className="text-blue-600 underline">Criar um cliente primeiro</button>
              </p>
            )}
          </div>

          {/* Status e Prioridade */}
          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="planning">Planejamento</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange('priority', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orçamento */}
          <div>
            <Label htmlFor="budget_total">Orçamento Total</Label>
            <Input
              id="budget_total"
              type="number"
              min="0"
              step="0.01"
              value={formData.budget_total}
              onChange={(e) => handleChange('budget_total', e.target.value)}
              placeholder="0.00"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Valor em reais (R$)</p>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="end_date">Data de Entrega</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                disabled={loading}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
              />
            </div>
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
              disabled={loading || !formData.name.trim() || !formData.client_id}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Criar Projeto
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}