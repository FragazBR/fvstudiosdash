'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Plus,
  Play,
  Pause,
  Download,
  Eye,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  BarChart3,
  FileSpreadsheet,
  FileImage,
  Trash2,
  Copy,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Zap
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ===============================================
// TIPOS E INTERFACES
// ===============================================

interface Report {
  id: string;
  name: string;
  description?: string;
  category: 'financial' | 'performance' | 'projects' | 'team' | 'clients' | 'marketing' | 'analytics' | 'compliance' | 'executive' | 'operational';
  status: 'draft' | 'scheduled' | 'generating' | 'completed' | 'failed' | 'cancelled';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  output_formats: ('pdf' | 'excel' | 'csv' | 'json' | 'html')[];
  next_run_at?: string;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
  template_id?: string;
  report_templates?: {
    name: string;
    category: string;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  usage_count: number;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
}

interface ReportExecution {
  id: string;
  status: 'generating' | 'completed' | 'failed' | 'cancelled';
  progress_percentage: number;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  error_message?: string;
  output_files?: any[];
  reports: {
    name: string;
    category: string;
  };
}

interface ReportStats {
  overview: {
    total_reports: number;
    active_reports: number;
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    average_execution_time_seconds: number;
    success_rate: number;
  };
  reports_by_category: Array<{ category: string; count: number }>;
  executions_by_day: Array<{ date: string; executions: number }>;
  format_usage: Array<{ format: string; count: number }>;
  performance_by_category: Array<{ category: string; avg_duration_seconds: number; executions_count: number }>;
  recent_reports: Report[];
  recent_executions: ReportExecution[];
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================

export default function AdvancedReportsDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [executions, setExecutions] = useState<ReportExecution[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Estados para modais
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

  // Estados para formulários
  const [reportForm, setReportForm] = useState({
    name: '',
    description: '',
    category: 'performance' as const,
    template_id: '',
    frequency: 'once' as const,
    output_formats: ['pdf'] as string[],
    data_config: {
      data_sources: ['projects'],
      query_config: {
        base_query: 'projects',
        metrics: ['name', 'status', 'budget_total', 'budget_spent'],
        grouping: [],
        filters: []
      }
    },
    filter_values: {},
    date_range: {
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      preset: 'last_30_days'
    },
    layout_settings: {
      orientation: 'portrait' as const,
      page_size: 'A4' as const,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      sections: []
    }
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'performance' as const,
    data_sources: ['projects'],
    query_config: {
      base_query: 'projects',
      metrics: ['name', 'status'],
      grouping: [],
      filters: []
    },
    layout_config: {},
    chart_config: {},
    styling_config: {},
    is_public: false
  });

  // Estados para filtros
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: ''
  });

  // ===============================================
  // EFEITOS E CARREGAMENTO DE DADOS
  // ===============================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadReports(),
        loadTemplates(),
        loadExecutions(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      
      const response = await fetch(`/api/reports?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/reports/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const loadExecutions = async () => {
    try {
      const response = await fetch('/api/reports/executions?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setExecutions(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar execuções:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/reports/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // ===============================================
  // MANIPULADORES DE EVENTOS
  // ===============================================

  const handleCreateReport = async () => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportForm)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowReportDialog(false);
        setReportForm({
          name: '',
          description: '',
          category: 'performance',
          template_id: '',
          frequency: 'once',
          output_formats: ['pdf'],
          data_config: {
            data_sources: ['projects'],
            query_config: {
              base_query: 'projects',
              metrics: ['name', 'status', 'budget_total', 'budget_spent'],
              grouping: [],
              filters: []
            }
          },
          filter_values: {},
          date_range: {
            start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            preset: 'last_30_days'
          },
          layout_settings: {
            orientation: 'portrait',
            page_size: 'A4',
            margins: { top: 20, right: 20, bottom: 20, left: 20 },
            sections: []
          }
        });
        await loadReports();
      } else {
        alert('Erro ao criar relatório: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      alert('Erro interno do servidor');
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Relatório sendo gerado! Você pode acompanhar o progresso na aba Execuções.');
        await loadExecutions();
      } else {
        alert('Erro ao gerar relatório: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro interno do servidor');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDeleteReportId(null);
        await loadReports();
      } else {
        alert('Erro ao deletar relatório');
      }
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      alert('Erro interno do servidor');
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/reports/files/${fileId}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'report';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erro ao baixar arquivo');
      }
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      alert('Erro interno do servidor');
    }
  };

  // ===============================================
  // COMPONENTES DE RENDERIZAÇÃO
  // ===============================================

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar },
      generating: { color: 'bg-yellow-100 text-yellow-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const CategoryBadge = ({ category }: { category: string }) => {
    const categoryColors = {
      financial: 'bg-green-100 text-green-800',
      performance: 'bg-blue-100 text-blue-800',
      projects: 'bg-purple-100 text-purple-800',
      team: 'bg-orange-100 text-orange-800',
      clients: 'bg-pink-100 text-pink-800',
      marketing: 'bg-red-100 text-red-800',
      analytics: 'bg-indigo-100 text-indigo-800',
      compliance: 'bg-yellow-100 text-yellow-800',
      executive: 'bg-gray-100 text-gray-800',
      operational: 'bg-teal-100 text-teal-800'
    };

    return (
      <Badge className={categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    );
  };

  const FormatIcons = ({ formats }: { formats: string[] }) => {
    const formatIcons = {
      pdf: FileText,
      excel: FileSpreadsheet,
      csv: FileSpreadsheet,
      json: FileText,
      html: FileImage
    };

    return (
      <div className="flex gap-1">
        {formats.map(format => {
          const Icon = formatIcons[format as keyof typeof formatIcons] || FileText;
          return (
            <div key={format} className="p-1 bg-gray-100 rounded" title={format.toUpperCase()}>
              <Icon className="w-3 h-3" />
            </div>
          );
        })}
      </div>
    );
  };

  // ===============================================
  // RENDERIZAÇÃO DAS ABAS
  // ===============================================

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Relatórios</p>
                <p className="text-2xl font-bold">{stats?.overview.total_reports || 0}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Relatórios Ativos</p>
                <p className="text-2xl font-bold">{stats?.overview.active_reports || 0}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{stats?.overview.success_rate || 0}%</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold">{Math.round(stats?.overview.average_execution_time_seconds || 0)}s</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Relatórios por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.reports_by_category || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ category, count, percent }) => 
                    `${category}: ${count} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {(stats?.reports_by_category || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execuções por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats?.executions_by_day || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="executions" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recent_reports.slice(0, 5).map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-gray-500">
                      Criado em {new Date(report.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CategoryBadge category={report.category} />
                  <StatusBadge status={report.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      {/* Cabeçalho com ações */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Input
            placeholder="Buscar relatórios..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-64"
          />
          <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="projects">Projetos</SelectItem>
              <SelectItem value="team">Equipe</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="completed">Completo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowReportDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      {/* Tabela de Relatórios */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Formatos</TableHead>
                <TableHead>Última Execução</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      {report.description && (
                        <p className="text-sm text-gray-500">{report.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={report.category} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status} />
                  </TableCell>
                  <TableCell>{report.frequency}</TableCell>
                  <TableCell>
                    <FormatIcons formats={report.output_formats} />
                  </TableCell>
                  <TableCell>
                    {report.last_run_at ? (
                      <div className="text-sm">
                        {new Date(report.last_run_at).toLocaleDateString('pt-BR')}
                        <br />
                        <span className="text-gray-500">
                          {new Date(report.last_run_at).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Nunca executado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleGenerateReport(report.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          Gerar Agora
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedReport(report)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteReportId(report.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderExecutionsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Execuções de Relatórios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Relatório</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Iniciado</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Arquivos</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{execution.reports.name}</p>
                      <CategoryBadge category={execution.reports.category} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={execution.status} />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={execution.progress_percentage} className="w-16" />
                      <span className="text-xs text-gray-500">{execution.progress_percentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(execution.started_at).toLocaleDateString('pt-BR')}
                      <br />
                      <span className="text-gray-500">
                        {new Date(execution.started_at).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {execution.duration_seconds ? 
                      `${execution.duration_seconds}s` : 
                      execution.status === 'generating' ? 'Em andamento' : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {execution.output_files?.length || 0} arquivo(s)
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {execution.output_files?.map((file: any) => (
                        <Button
                          key={file.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(file.id)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          {file.format.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Templates de Relatórios</h3>
        <Button onClick={() => setShowTemplateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{template.name}</CardTitle>
                {template.is_featured && <Badge variant="secondary">Destaque</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className="flex justify-between items-center text-sm">
                <CategoryBadge category={template.category} />
                <span className="text-gray-500">{template.usage_count} usos</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Usar Template
                </Button>
                <Button size="sm" variant="ghost">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Sistema de Relatórios Avançados</h1>
          <p className="text-gray-600">Crie, configure e gere relatórios customizáveis em múltiplos formatos</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="executions">Execuções</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {renderReportsTab()}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          {renderExecutionsTab()}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {renderTemplatesTab()}
        </TabsContent>
      </Tabs>

      {/* Dialog para Criar Relatório */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Relatório</DialogTitle>
            <DialogDescription>
              Configure um novo relatório personalizado
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Relatório</Label>
                <Input
                  id="name"
                  value={reportForm.name}
                  onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
                  placeholder="Ex: Relatório Mensal de Vendas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={reportForm.category} onValueChange={(value: any) => setReportForm({ ...reportForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financeiro</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="projects">Projetos</SelectItem>
                    <SelectItem value="team">Equipe</SelectItem>
                    <SelectItem value="clients">Clientes</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                placeholder="Descreva o propósito deste relatório..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência</Label>
                <Select value={reportForm.frequency} onValueChange={(value: any) => setReportForm({ ...reportForm, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Uma vez</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formatos de Export</Label>
                <div className="flex gap-2">
                  {['pdf', 'excel', 'csv'].map((format) => (
                    <div key={format} className="flex items-center space-x-2">
                      <Checkbox
                        id={format}
                        checked={reportForm.output_formats.includes(format)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setReportForm({
                              ...reportForm,
                              output_formats: [...reportForm.output_formats, format]
                            });
                          } else {
                            setReportForm({
                              ...reportForm,
                              output_formats: reportForm.output_formats.filter(f => f !== format)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={format} className="text-sm">
                        {format.toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateReport}>
              Criar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para Confirmação de Exclusão */}
      <AlertDialog open={!!deleteReportId} onOpenChange={() => setDeleteReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteReportId && handleDeleteReport(deleteReportId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}