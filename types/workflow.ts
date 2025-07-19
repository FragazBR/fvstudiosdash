// Mapeamento completo do workflow da agência
export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  skills: string[];
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  date: Date;
  completed: boolean;
}

export interface Budget {
  total: number;
  allocated: number;
  spent: number;
  remaining: number;
  breakdown: BudgetItem[];
}

export interface BudgetItem {
  category: string;
  amount: number;
  spent: number;
}

export interface Campaign {
  id: string;
  name: string;
  platform: string;
  budget: number;
  results: Record<string, number>;
}

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  tools: string[];
  duration: string;
  dependencies: string[];
  deliverables: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  client: Client;
  currentStage: string;
  stages: WorkflowStage[];
  timeline: Timeline;
  budget: Budget;
  team: TeamMember[];
  status: ProjectStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  deliverables: Deliverable[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  contact: ContactInfo;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  goals: string[];
  currentChallenges: string[];
  budget: number;
  timeline: string;
  previousCampaigns?: Campaign[];
  apiKeys: ApiKeys;
  assignedTeam: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  projects: string[];
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  revenue: number;
}

// Definição das 11 etapas do workflow
export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: 'atendimento',
    name: 'Atendimento',
    description: 'Primeiro contato, qualificação do lead e apresentação inicial',
    tools: ['CRM', 'Calendar', 'Video Call', 'Lead Qualification Form'],
    duration: '1-2 dias',
    dependencies: [],
    deliverables: ['Lead Qualification', 'Initial Meeting Notes', 'Proposal Request'],
    status: 'not_started'
  },
  {
    id: 'analise_diagnostico',
    name: 'Análise e Diagnóstico',
    description: 'Auditoria completa do cliente, análise de mercado e identificação de oportunidades',
    tools: ['Analytics Audit', 'Competitor Analysis', 'Market Research', 'SWOT Analysis'],
    duration: '3-5 dias',
    dependencies: ['atendimento'],
    deliverables: ['Diagnostic Report', 'Market Analysis', 'Opportunity Map', 'Recommendations'],
    status: 'not_started'
  },
  {
    id: 'planejamento_execucao',
    name: 'Planejamento de Execução',
    description: 'Criação da estratégia, definição de objetivos e cronograma detalhado',
    tools: ['Strategy Canvas', 'Timeline Builder', 'Budget Calculator', 'Goal Setting'],
    duration: '3-7 dias',
    dependencies: ['analise_diagnostico'],
    deliverables: ['Strategic Plan', 'Execution Timeline', 'Budget Proposal', 'KPI Definition'],
    status: 'not_started'
  },
  {
    id: 'desenvolvimento_processos',
    name: 'Desenvolvimento de Processos',
    description: 'Criação de workflows específicos baseados na análise do cliente',
    tools: ['Process Designer', 'Workflow Builder', 'Template Creator', 'Automation Setup'],
    duration: '2-4 dias',
    dependencies: ['planejamento_execucao'],
    deliverables: ['Custom Workflows', 'Process Documentation', 'Automation Rules', 'Templates'],
    status: 'not_started'
  },
  {
    id: 'agendamento_producoes',
    name: 'Agendamento de Produções',
    description: 'Planejamento e agendamento de todas as produções de conteúdo',
    tools: ['Production Calendar', 'Resource Scheduler', 'Team Coordination', 'Location Booking'],
    duration: '1-3 dias',
    dependencies: ['desenvolvimento_processos'],
    deliverables: ['Production Schedule', 'Resource Allocation', 'Team Assignments', 'Location Confirmations'],
    status: 'not_started'
  },
  {
    id: 'execucao_producoes',
    name: 'Execução das Produções',
    description: 'Realização das captações de conteúdo conforme cronograma',
    tools: ['Production Tracker', 'Asset Manager', 'Quality Control', 'Progress Monitor'],
    duration: '5-15 dias',
    dependencies: ['agendamento_producoes'],
    deliverables: ['Raw Content', 'Production Reports', 'Asset Library', 'Quality Checks'],
    status: 'not_started'
  },
  {
    id: 'criacao_conteudo',
    name: 'Criação e Edição',
    description: 'Edição e finalização de todos os materiais criados',
    tools: ['Video Editor', 'Graphic Designer', 'Content Writer', 'Asset Manager'],
    duration: '7-20 dias',
    dependencies: ['execucao_producoes'],
    deliverables: ['Edited Content', 'Graphics', 'Copy', 'Final Assets'],
    status: 'not_started'
  },
  {
    id: 'aprovacao',
    name: 'Aprovação',
    description: 'Processo de revisão e aprovação pelo cliente',
    tools: ['Review Platform', 'Feedback System', 'Version Control', 'Approval Workflow'],
    duration: '2-7 dias',
    dependencies: ['criacao_conteudo'],
    deliverables: ['Client Feedback', 'Approved Assets', 'Revision Notes', 'Final Approval'],
    status: 'not_started'
  },
  {
    id: 'ajustes_finais',
    name: 'Ajustes Finais',
    description: 'Implementação de feedbacks e finalização dos materiais',
    tools: ['Revision Tracker', 'Final Editor', 'Quality Assurance', 'Asset Finalizer'],
    duration: '1-3 dias',
    dependencies: ['aprovacao'],
    deliverables: ['Final Assets', 'Revision Documentation', 'Quality Report', 'Delivery Package'],
    status: 'not_started'
  },
  {
    id: 'trafego_gestao',
    name: 'Tráfego/Gestão de Campanhas',
    description: 'Implementação e gestão das campanhas de marketing',
    tools: ['Campaign Manager', 'Ad Platforms', 'Analytics', 'Optimization Tools'],
    duration: '30-90 dias',
    dependencies: ['ajustes_finais'],
    deliverables: ['Live Campaigns', 'Performance Data', 'Optimization Reports', 'A/B Tests'],
    status: 'not_started'
  },
  {
    id: 'relatorio_metricas',
    name: 'Relatórios e Métricas',
    description: 'Análise de resultados e relatórios de performance',
    tools: ['Analytics Dashboard', 'Report Generator', 'Data Visualization', 'Performance Tracker'],
    duration: '2-5 dias',
    dependencies: ['trafego_gestao'],
    deliverables: ['Performance Report', 'ROI Analysis', 'Insights Document', 'Next Steps Plan'],
    status: 'not_started'
  }
];

// Ferramentas necessárias por categoria
export const TOOLS_BY_CATEGORY = {
  crm: ['Lead Management', 'Client Database', 'Contact History', 'Pipeline Tracking'],
  analytics: ['Google Analytics', 'Social Media Analytics', 'Campaign Tracking', 'ROI Calculator'],
  project_management: ['Task Management', 'Timeline View', 'Resource Allocation', 'Progress Tracking'],
  content_creation: ['Design Tools', 'Video Editor', 'Content Calendar', 'Asset Library'],
  approval: ['Review System', 'Feedback Collection', 'Version Control', 'Approval Workflow'],
  campaign_management: ['Ad Platforms Integration', 'Campaign Dashboard', 'Performance Monitor', 'Optimization Tools'],
  reporting: ['Report Builder', 'Data Visualization', 'Automated Reports', 'Custom Dashboards']
};

// Estados dos projetos
export type ProjectStatus = 
  | 'discovery' 
  | 'planning' 
  | 'production' 
  | 'approval' 
  | 'campaign' 
  | 'reporting' 
  | 'completed' 
  | 'on_hold';

// Tipos de entregáveis
export interface Deliverable {
  id: string;
  name: string;
  type: 'document' | 'asset' | 'campaign' | 'report';
  status: 'pending' | 'in_progress' | 'review' | 'approved' | 'delivered';
  assignedTo: string;
  dueDate: Date;
  dependencies: string[];
}

// Interface para informações de integração de APIs
export interface ApiKeys {
  google?: {
    accessToken?: string;
    refreshToken?: string;
    accountId?: string;
    enabled: boolean;
  };
  meta?: {
    accessToken?: string;
    accountId?: string;
    adAccountId?: string;
    enabled: boolean;
  };
  tiktok?: {
    accessToken?: string;
    refreshToken?: string;
    advertiserIds?: string[];
    enabled: boolean;
  };
}

// Interface para mensagens do sistema social interno
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'voice';
  timestamp: Date;
  read: boolean;
  conversationId: string;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: Date;
  type: 'direct' | 'group' | 'project';
  projectId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'video' | 'audio';
  size: number;
}

// Interface para IA Agents
export interface AIAgent {
  id: string;
  name: string;
  type: 'workflow' | 'content' | 'analytics' | 'support';
  workflowStage?: string;
  description: string;
  capabilities: string[];
  isActive: boolean;
}

// Interface para notificações
export interface Notification {
  id: string;
  type: 'task' | 'deadline' | 'approval' | 'message' | 'system';
  title: string;
  message: string;
  userId: string;
  projectId?: string;
  read: boolean;
  timestamp: Date;
  actionRequired: boolean;
  actionUrl?: string;
}

// Interface para contratos de clientes
export interface ClientContract {
  id: string;
  clientId: string;
  clientName: string;
  contractType: 'monthly' | 'project' | 'retainer' | 'performance';
  monthlyValue: number;
  totalContractValue: number;
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  contractDuration: number; // em meses
  remainingMonths: number;
  status: 'active' | 'expired' | 'suspended' | 'pending_renewal';
  paymentStatus: 'up_to_date' | 'overdue' | 'pending';
  services: string[];
  performanceMetrics?: {
    roiTarget: number;
    currentRoi: number;
    conversionTarget: number;
    currentConversion: number;
  };
  billingHistory: BillingRecord[];
  nextBillingDate: Date;
  autoRenewal: boolean;
  notes?: string;
}

export interface BillingRecord {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  invoiceNumber: string;
  paymentMethod?: string;
  dueDate: Date;
}

// Interface para métricas da agência
export interface AgencyMetrics {
  financial: {
    monthlyRevenue: number;
    yearlyRevenue: number;
    recurringRevenue: number; // MRR
    averageContractValue: number;
    churnRate: number; // taxa de cancelamento
    growthRate: number; // taxa de crescimento mensal
    profitMargin: number;
    totalOutstanding: number; // valores em aberto
  };
  clients: {
    totalActive: number;
    newThisMonth: number;
    churnedThisMonth: number;
    averageLifetime: number; // em meses
    satisfactionScore: number;
    contractsExpiring: number; // próximos 30 dias
  };
  performance: {
    projectsCompleted: number;
    averageProjectDuration: number;
    teamUtilization: number;
    clientRetentionRate: number;
    onTimeDelivery: number; // %
    budgetAccuracy: number; // %
  };
  forecast: {
    nextMonthRevenue: number;
    quarterProjection: number;
    yearProjection: number;
    renewalsPipeline: number;
    riskAmount: number; // contratos em risco
  };
}

// Interface para planejamento da agência
export interface AgencyPlanning {
  id: string;
  quarter: string;
  year: number;
  revenueGoal: number;
  clientGoal: number;
  teamGoal: number;
  initiatives: AgencyInitiative[];
  budgetAllocation: BudgetAllocation[];
  kpis: AgencyKPI[];
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface AgencyInitiative {
  id: string;
  name: string;
  description: string;
  category: 'growth' | 'efficiency' | 'quality' | 'team' | 'tech';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  budget: number;
  expectedRoi: number;
  startDate: Date;
  endDate: Date;
  responsible: string;
  progress: number; // 0-100
  metrics?: string[];
}

export interface BudgetAllocation {
  category: string;
  planned: number;
  actual: number;
  variance: number;
  percentage: number;
}

export interface AgencyKPI {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  category: 'financial' | 'client' | 'operational' | 'team';
}

// Interface para análise de rentabilidade por cliente
export interface ClientProfitability {
  clientId: string;
  clientName: string;
  monthlyRevenue: number;
  resourceCost: number; // custo da equipe alocada
  operationalCost: number; // custos operacionais
  grossProfit: number;
  grossMargin: number;
  lifetimeValue: number;
  acquisitionCost: number;
  profitabilityScore: number; // 1-10
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

// Interface para crescimento dos clientes
export interface ClientGrowthMetrics {
  clientName: string;
  contractStartDate: Date;
  contractDuration: number; // meses
  initialMetrics: {
    revenue: number; // receita mensal do cliente
    employees: number;
    marketShare: number; // percentual
    brandAwareness: number; // percentual
    digitalPresence: number; // score 0-100
    conversionRate: number; // percentual
    customerSatisfaction: number; // score 0-100
    websiteTraffic: number;
    socialFollowers: number;
  };
  currentMetrics: {
    revenue: number;
    employees: number;
    marketShare: number;
    brandAwareness: number;
    digitalPresence: number;
    conversionRate: number;
    customerSatisfaction: number;
    websiteTraffic: number;
    socialFollowers: number;
  };
  growthPercentages: {
    revenue: number;
    employees: number;
    marketShare: number;
    brandAwareness: number;
    digitalPresence: number;
    conversionRate: number;
    customerSatisfaction: number;
    websiteTraffic: number;
    socialFollowers: number;
  };
  overallGrowthScore: number; // 0-100
  growthTrend: 'accelerating' | 'steady' | 'declining' | 'stagnant';
  keyAchievements: string[];
  challengesFaced: string[];
  nextQuarterGoals: string[];
  agencyContribution: {
    services: string[];
    impactScore: number; // 0-100
    roiGenerated: number; // ROI que a agência gerou para o cliente
    campaignsDelivered: number;
    successRate: number; // percentual de campanhas bem-sucedidas
  };
  monthlyProgress: ClientMonthlyProgress[]; // histórico mensal
}

export interface ClientMonthlyProgress {
  month: string; // "2024-01", "2024-02", etc
  revenue: number;
  digitalPresence: number;
  conversionRate: number;
  customerSatisfaction: number;
  websiteTraffic: number;
  socialFollowers: number;
  campaignsActive: number;
  growthRate: number; // crescimento em relação ao mês anterior
}

// Interface para crescimento da própria agência
export interface AgencyGrowthMetrics {
  period: string; // "2024-Q1", "2024-Q2", etc
  startDate: Date;
  endDate: Date;
  initialMetrics: {
    monthlyRevenue: number;      // receita mensal da agência
    totalClients: number;        // número de clientes
    activeContracts: number;     // contratos ativos
    teamSize: number;            // tamanho da equipe
    averageContractValue: number; // valor médio dos contratos
    clientRetentionRate: number; // taxa de retenção (%)
    profitMargin: number;        // margem de lucro (%)
    operationalCosts: number;    // custos operacionais
  };
  currentMetrics: {
    monthlyRevenue: number;
    totalClients: number;
    activeContracts: number;
    teamSize: number;
    averageContractValue: number;
    clientRetentionRate: number;
    profitMargin: number;
    operationalCosts: number;
  };
  growthPercentages: {
    monthlyRevenue: number;
    totalClients: number;
    activeContracts: number;
    teamSize: number;
    averageContractValue: number;
    clientRetentionRate: number;
    profitMargin: number;
    operationalCosts: number;
  };
  overallGrowthScore: number; // 0-100
  growthTrend: 'accelerating' | 'steady' | 'declining' | 'stagnant';
  keyMilestones: string[];
  challengesOvercome: string[];
  strategicGoals: string[];
  quarterlyProgress: AgencyQuarterlyProgress[];
}

export interface AgencyQuarterlyProgress {
  quarter: string; // "2024-Q1", "2024-Q2", etc
  revenue: number;
  clients: number;
  contracts: number;
  teamSize: number;
  profitMargin: number;
  retentionRate: number;
  newClientsAcquired: number;
  contractsRenewed: number;
  averageContractValue: number;
  growthRate: number; // crescimento em relação ao trimestre anterior
}
