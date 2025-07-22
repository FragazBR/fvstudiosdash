// Sistema de Departamentos e Especializações para Agências
export interface Department {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  specializations: Specialization[];
}

export interface Specialization {
  id: string;
  name: string;
  description: string;
  department_id: string;
  skills: string[];
  workflow_stages: string[]; // Etapas do workflow que esta especialização atua
}

// Definição dos departamentos principais de uma agência de marketing
export const AGENCY_DEPARTMENTS: Department[] = [
  {
    id: 'atendimento',
    name: 'Atendimento & Relacionamento',
    description: 'Gestão de relacionamento com clientes e primeiros contatos',
    color: 'bg-blue-500',
    icon: 'Users',
    specializations: [
      {
        id: 'account_manager',
        name: 'Gerente de Contas',
        description: 'Responsável por manter relacionamento e satisfação dos clientes',
        department_id: 'atendimento',
        skills: ['CRM', 'Negociação', 'Apresentação', 'Relatórios'],
        workflow_stages: ['atendimento', 'aprovacao', 'relatorio_metricas']
      },
      {
        id: 'customer_success',
        name: 'Customer Success',
        description: 'Focado no sucesso e retenção de clientes',
        department_id: 'atendimento',
        skills: ['Análise de Dados', 'Feedback', 'Onboarding', 'Retenção'],
        workflow_stages: ['atendimento', 'relatorio_metricas']
      },
      {
        id: 'sdr',
        name: 'SDR/BDR',
        description: 'Sales Development Representative - Prospecção e qualificação',
        department_id: 'atendimento',
        skills: ['Prospecção', 'Cold Email', 'LinkedIn', 'Qualificação de Leads'],
        workflow_stages: ['atendimento', 'analise_diagnostico']
      }
    ]
  },
  {
    id: 'estrategia',
    name: 'Estratégia & Planejamento',
    description: 'Definição de estratégias, análises e planejamento de campanhas',
    color: 'bg-purple-500',
    icon: 'Target',
    specializations: [
      {
        id: 'strategist',
        name: 'Estrategista Digital',
        description: 'Desenvolve estratégias de marketing digital e planejamento',
        department_id: 'estrategia',
        skills: ['Análise de Mercado', 'Personas', 'Jornada do Cliente', 'KPIs'],
        workflow_stages: ['analise_diagnostico', 'planejamento_execucao']
      },
      {
        id: 'data_analyst',
        name: 'Analista de Dados',
        description: 'Análise de performance, métricas e relatórios estratégicos',
        department_id: 'estrategia',
        skills: ['Google Analytics', 'Excel', 'Data Studio', 'SQL'],
        workflow_stages: ['analise_diagnostico', 'relatorio_metricas']
      },
      {
        id: 'market_researcher',
        name: 'Pesquisador de Mercado',
        description: 'Pesquisa de mercado, concorrência e oportunidades',
        department_id: 'estrategia',
        skills: ['Pesquisa', 'Análise Competitiva', 'Tendências', 'Insights'],
        workflow_stages: ['analise_diagnostico', 'planejamento_execucao']
      }
    ]
  },
  {
    id: 'criativo',
    name: 'Criativo & Conteúdo',
    description: 'Criação de conteúdos visuais, textos e materiais criativos',
    color: 'bg-pink-500',
    icon: 'Palette',
    specializations: [
      {
        id: 'designer',
        name: 'Designer Gráfico',
        description: 'Criação de peças gráficas, identidade visual e materiais promocionais',
        department_id: 'criativo',
        skills: ['Photoshop', 'Illustrator', 'Figma', 'Identidade Visual'],
        workflow_stages: ['criacao_conteudo', 'ajustes_finais']
      },
      {
        id: 'video_maker',
        name: 'Video Maker',
        description: 'Produção e edição de vídeos para campanhas e redes sociais',
        department_id: 'criativo',
        skills: ['After Effects', 'Premiere', 'Motion Graphics', 'Roteiro'],
        workflow_stages: ['execucao_producoes', 'criacao_conteudo', 'ajustes_finais']
      },
      {
        id: 'copywriter',
        name: 'Copywriter',
        description: 'Criação de textos persuasivos e conteúdo escrito',
        department_id: 'criativo',
        skills: ['Copywriting', 'Storytelling', 'SEO', 'Headlines'],
        workflow_stages: ['criacao_conteudo', 'ajustes_finais']
      },
      {
        id: 'content_creator',
        name: 'Criador de Conteúdo',
        description: 'Produção de conteúdo para redes sociais e blog',
        department_id: 'criativo',
        skills: ['Instagram', 'TikTok', 'LinkedIn', 'Trends'],
        workflow_stages: ['agendamento_producoes', 'execucao_producoes', 'criacao_conteudo']
      }
    ]
  },
  {
    id: 'performance',
    name: 'Performance & Tráfego',
    description: 'Gestão de tráfego pago, otimização e performance de campanhas',
    color: 'bg-green-500',
    icon: 'TrendingUp',
    specializations: [
      {
        id: 'traffic_manager',
        name: 'Gestor de Tráfego',
        description: 'Gestão e otimização de campanhas de tráfego pago',
        department_id: 'performance',
        skills: ['Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'Analytics'],
        workflow_stages: ['trafego_gestao', 'relatorio_metricas']
      },
      {
        id: 'performance_analyst',
        name: 'Analista de Performance',
        description: 'Análise e otimização de performance de campanhas',
        department_id: 'performance',
        skills: ['ROI', 'CPA', 'ROAS', 'Otimização'],
        workflow_stages: ['trafego_gestao', 'relatorio_metricas']
      },
      {
        id: 'media_buyer',
        name: 'Media Buyer',
        description: 'Compra de mídia e negociação com veículos',
        department_id: 'performance',
        skills: ['Negociação', 'Mídia Programática', 'Budget', 'Planejamento de Mídia'],
        workflow_stages: ['planejamento_execucao', 'trafego_gestao']
      }
    ]
  },
  {
    id: 'desenvolvimento',
    name: 'Desenvolvimento & Tecnologia',
    description: 'Desenvolvimento web, tecnologia e integrações',
    color: 'bg-indigo-500',
    icon: 'Code',
    specializations: [
      {
        id: 'web_developer',
        name: 'Desenvolvedor Web',
        description: 'Desenvolvimento de websites, landing pages e sistemas',
        department_id: 'desenvolvimento',
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'WordPress'],
        workflow_stages: ['desenvolvimento_processos', 'criacao_conteudo', 'ajustes_finais']
      },
      {
        id: 'technical_analyst',
        name: 'Analista Técnico',
        description: 'Análise técnica, integrações e configurações',
        department_id: 'desenvolvimento',
        skills: ['APIs', 'GTM', 'Pixels', 'Integrações'],
        workflow_stages: ['desenvolvimento_processos', 'trafego_gestao']
      },
      {
        id: 'seo_specialist',
        name: 'Especialista em SEO',
        description: 'Otimização para mecanismos de busca e SEO técnico',
        department_id: 'desenvolvimento',
        skills: ['SEO', 'Search Console', 'Keywords', 'Link Building'],
        workflow_stages: ['desenvolvimento_processos', 'trafego_gestao', 'relatorio_metricas']
      }
    ]
  },
  {
    id: 'operacoes',
    name: 'Operações & Processos',
    description: 'Gestão operacional, processos internos e qualidade',
    color: 'bg-orange-500',
    icon: 'Settings',
    specializations: [
      {
        id: 'project_manager',
        name: 'Gerente de Projetos',
        description: 'Gestão de projetos, cronogramas e qualidade de entregas',
        department_id: 'operacoes',
        skills: ['Project Management', 'Scrum', 'Timeline', 'Quality Assurance'],
        workflow_stages: ['desenvolvimento_processos', 'agendamento_producoes', 'aprovacao']
      },
      {
        id: 'quality_assurance',
        name: 'Quality Assurance',
        description: 'Controle de qualidade e revisão de entregas',
        department_id: 'operacoes',
        skills: ['Revisão', 'Testes', 'Controle de Qualidade', 'Padrões'],
        workflow_stages: ['aprovacao', 'ajustes_finais']
      },
      {
        id: 'operations_coordinator',
        name: 'Coordenador de Operações',
        description: 'Coordenação operacional e otimização de processos',
        department_id: 'operacoes',
        skills: ['Processos', 'Coordenação', 'Otimização', 'Workflows'],
        workflow_stages: ['desenvolvimento_processos', 'agendamento_producoes']
      }
    ]
  }
];

// Função para buscar departamento por ID
export const getDepartmentById = (id: string): Department | undefined => {
  return AGENCY_DEPARTMENTS.find(dept => dept.id === id);
};

// Função para buscar especialização por ID
export const getSpecializationById = (id: string): Specialization | undefined => {
  for (const department of AGENCY_DEPARTMENTS) {
    const specialization = department.specializations.find(spec => spec.id === id);
    if (specialization) return specialization;
  }
  return undefined;
};

// Função para buscar especializações por etapa do workflow
export const getSpecializationsByWorkflowStage = (stageId: string): Specialization[] => {
  const specializations: Specialization[] = [];
  
  for (const department of AGENCY_DEPARTMENTS) {
    for (const specialization of department.specializations) {
      if (specialization.workflow_stages.includes(stageId)) {
        specializations.push(specialization);
      }
    }
  }
  
  return specializations;
};

// Função para buscar todas as especializações
export const getAllSpecializations = (): Specialization[] => {
  const specializations: Specialization[] = [];
  
  for (const department of AGENCY_DEPARTMENTS) {
    specializations.push(...department.specializations);
  }
  
  return specializations;
};

// Interface para perfil de usuário estendido com departamento
export interface UserProfileWithDepartment {
  id: string;
  name: string;
  email: string;
  role: string;
  agency_id?: string;
  department_id?: string;
  specialization_id?: string;
  skills?: string[];
  avatar_url?: string;
}

// Tipos para filtros de tarefas
export type TaskFilter = {
  department?: string;
  specialization?: string;
  workflow_stage?: string;
  assignee?: string;
};

// Enum para níveis de permissão departamental
export enum DepartmentPermission {
  VIEW_OWN = 'view_own',           // Ver apenas suas próprias tarefas
  VIEW_DEPARTMENT = 'view_dept',   // Ver tarefas do departamento
  VIEW_ALL = 'view_all',          // Ver todas as tarefas (agency_owner)
  MANAGE_DEPARTMENT = 'manage_dept', // Gerenciar departamento
  MANAGE_ALL = 'manage_all'        // Gerenciar tudo (agency_owner)
}

// Interface para permissões departamentais
export interface DepartmentUserPermissions {
  user_id: string;
  department_id?: string;
  specialization_id?: string;
  permissions: DepartmentPermission[];
  can_assign_tasks: boolean;
  can_view_team_metrics: boolean;
  can_manage_team: boolean;
}