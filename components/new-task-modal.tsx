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
import { Calendar, Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  client?: {
    name: string;
    company?: string;
  };
}

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  preSelectedClientId?: string;
}

const supabase = supabaseBrowser();

export function NewTaskModal({ isOpen, onClose, onTaskCreated, preSelectedClientId }: NewTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    priority: "medium",
    status: "todo",
    due_date: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      // Get user profile to filter by agency
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Usuário não autenticado');
        return;
      }

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single();

      if (!userProfile?.agency_id) {
        console.error('Perfil de usuário não encontrado');
        return;
      }

      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          clients:client_id (
            id,
            contact_name,
            company
          )
        `)
        .eq('agency_id', userProfile.agency_id)
        .order('name');

      // If preSelectedClientId is provided, filter projects for that client
      if (preSelectedClientId) {
        query = query.eq('client_id', preSelectedClientId);
      }

      const { data: projectsData, error } = await query;

      if (error) {
        console.error('Erro ao buscar projetos:', error);
        return;
      }

      const transformedProjects: Project[] = (projectsData || []).map(project => ({
        id: project.id,
        name: project.name,
        client: {
          name: project.clients?.contact_name || '',
          company: project.clients?.company
        }
      }));

      setProjects(transformedProjects);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título da tarefa é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.project_id) {
      toast({
        title: "Erro",
        description: "Selecione um projeto para a tarefa.",
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
          description: "Você precisa estar logado para criar uma tarefa.",
          variant: "destructive",
        });
        return;
      }

      // Get user profile to get agency_id
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, agency_id')
        .eq('id', session.user.id)
        .single();

      if (!userProfile) {
        toast({
          title: "Erro",
          description: "Perfil de usuário não encontrado.",
          variant: "destructive",
        });
        return;
      }

      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        project_id: formData.project_id,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assigned_to: userProfile.id,
        agency_id: userProfile.agency_id,
        created_by: userProfile.id,
      };

      const { error } = await supabase
        .from('tasks')
        .insert([taskData]);

      if (error) {
        console.error('Erro ao criar tarefa:', error);
        toast({
          title: "Erro ao criar tarefa",
          description: "Não foi possível criar a tarefa. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Tarefa criada com sucesso!",
        description: "A nova tarefa foi adicionada ao projeto.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        project_id: "",
        priority: "medium",
        status: "todo",
        due_date: "",
      });

      onTaskCreated();
      onClose();

    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Nova Tarefa
          </DialogTitle>
          <DialogDescription>
            Criar uma nova tarefa para um projeto existente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título da Tarefa *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: Criar layout da homepage"
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
              placeholder="Descreva os detalhes da tarefa..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="project">Projeto *</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => handleChange('project_id', value)}
              disabled={loading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <SelectItem value="no-projects" disabled>
                    {preSelectedClientId 
                      ? 'Nenhum projeto encontrado para este cliente'
                      : 'Nenhum projeto encontrado'
                    }
                  </SelectItem>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{project.name}</span>
                        {project.client && (
                          <span className="text-xs text-gray-500">
                            {project.client.company || project.client.name}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="todo">A fazer</SelectItem>
                  <SelectItem value="in_progress">Em progresso</SelectItem>
                  <SelectItem value="review">Em revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="due_date">Prazo de Entrega</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleChange('due_date', e.target.value)}
              disabled={loading}
              min={new Date().toISOString().split('T')[0]}
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
              disabled={loading || !formData.title.trim() || !formData.project_id}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Tarefa'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}