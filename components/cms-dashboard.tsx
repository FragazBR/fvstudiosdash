"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Tag,
  Folder,
  BarChart3,
  Globe,
  Lock,
  Settings,
  Archive,
  Clock,
  CheckCircle,
  XCircle,
  Heart,
  Share2,
  TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

// Types
interface ContentType {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_system: boolean;
  is_hierarchical: boolean;
  has_categories: boolean;
  has_tags: boolean;
  has_comments: boolean;
  has_seo: boolean;
  has_featured_image: boolean;
  field_schema: any[];
  created_at: string;
}

interface Content {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  custom_fields: any;
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived' | 'deleted';
  visibility: 'public' | 'private' | 'password';
  published_at: string;
  scheduled_at: string;
  featured_image_url: string;
  view_count: number;
  like_count: number;
  share_count: number;
  version: number;
  created_at: string;
  updated_at: string;
  cms_content_types: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  cms_content_categories: Array<{
    cms_categories: {
      id: string;
      name: string;
      slug: string;
      color: string;
    };
  }>;
  cms_content_tags: Array<{
    cms_tags: {
      id: string;
      name: string;
      slug: string;
      color: string;
    };
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  parent_id: string;
  cms_content_types: {
    name: string;
  };
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  usage_count: number;
}

interface CMSStats {
  overview: {
    total_contents: number;
    published_contents: number;
    draft_contents: number;
    total_categories: number;
    total_tags: number;
    total_views: number;
    recent_contents: number;
  };
  by_type: Array<{
    type: string;
    count: number;
  }>;
  by_status: Record<string, number>;
  recent_contents: Content[];
  popular_contents: Content[];
  daily_activity: Array<{
    date: string;
    created: number;
    published: number;
  }>;
}

export default function CMSDashboard() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stats, setStats] = useState<CMSStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Estados para modais
  const [showNewContentType, setShowNewContentType] = useState(false);
  const [showNewContent, setShowNewContent] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Estados para formulários
  const [newContentType, setNewContentType] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'FileText',
    is_hierarchical: false,
    has_categories: true,
    has_tags: true,
    has_comments: false,
    has_seo: true,
    has_featured_image: true
  });

  const [newContent, setNewContent] = useState({
    content_type_id: '',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft' as const,
    visibility: 'public' as const,
    featured_image_url: '',
    categories: [] as string[],
    tags: [] as string[]
  });

  const [newCategory, setNewCategory] = useState({
    content_type_id: '',
    name: '',
    slug: '',
    description: '',
    color: '#01b86c',
    icon: 'Folder'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar tipos de conteúdo
      const contentTypesResponse = await fetch('/api/cms/content-types');
      if (contentTypesResponse.ok) {
        const contentTypesData = await contentTypesResponse.json();
        setContentTypes(contentTypesData.data || []);
      }

      // Carregar conteúdos
      const contentsResponse = await fetch('/api/cms/contents?limit=50');
      if (contentsResponse.ok) {
        const contentsData = await contentsResponse.json();
        setContents(contentsData.data || []);
      }

      // Carregar categorias
      const categoriesResponse = await fetch('/api/cms/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.data || []);
      }

      // Carregar tags
      const tagsResponse = await fetch('/api/cms/tags');
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setTags(tagsData.data || []);
      }

      // Carregar estatísticas
      const statsResponse = await fetch('/api/cms/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do CMS');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContentType = async () => {
    if (!newContentType.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const response = await fetch('/api/cms/content-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newContentType)
      });

      if (response.ok) {
        toast.success('Tipo de conteúdo criado com sucesso!');
        setShowNewContentType(false);
        setNewContentType({
          name: '',
          slug: '',
          description: '',
          icon: 'FileText',
          is_hierarchical: false,
          has_categories: true,
          has_tags: true,
          has_comments: false,
          has_seo: true,
          has_featured_image: true
        });
        await loadDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar tipo de conteúdo');
      }
    } catch (error) {
      console.error('Erro ao criar tipo de conteúdo:', error);
      toast.error('Erro ao criar tipo de conteúdo');
    }
  };

  const handleCreateContent = async () => {
    if (!newContent.content_type_id || !newContent.title) {
      toast.error('Tipo de conteúdo e título são obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/cms/contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newContent)
      });

      if (response.ok) {
        toast.success('Conteúdo criado com sucesso!');
        setShowNewContent(false);
        setNewContent({
          content_type_id: '',
          title: '',
          slug: '',
          excerpt: '',
          content: '',
          status: 'draft',
          visibility: 'public',
          featured_image_url: '',
          categories: [],
          tags: []
        });
        await loadDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar conteúdo');
      }
    } catch (error) {
      console.error('Erro ao criar conteúdo:', error);
      toast.error('Erro ao criar conteúdo');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.content_type_id || !newCategory.name) {
      toast.error('Tipo de conteúdo e nome são obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/cms/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCategory)
      });

      if (response.ok) {
        toast.success('Categoria criada com sucesso!');
        setShowNewCategory(false);
        setNewCategory({
          content_type_id: '',
          name: '',
          slug: '',
          description: '',
          color: '#01b86c',
          icon: 'Folder'
        });
        await loadDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar categoria');
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'review': return 'outline';
      case 'scheduled': return 'outline';
      case 'archived': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return CheckCircle;
      case 'draft': return Edit;
      case 'review': return Clock;
      case 'scheduled': return Calendar;
      case 'archived': return Archive;
      default: return XCircle;
    }
  };

  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedContentType || content.cms_content_types.id === selectedContentType;
    const matchesStatus = !selectedStatus || content.status === selectedStatus;
    const matchesCategory = !selectedCategory || 
      content.cms_content_categories.some(cc => cc.cms_categories.id === selectedCategory);
    
    return matchesSearch && matchesType && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#01b86c]"></div>
      </div>
    );
  }

  const chartColors = ['#01b86c', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Sistema de Gestão de Conteúdo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie conteúdos, tipos, categorias e tags de forma centralizada
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="contents">Conteúdos</TabsTrigger>
          <TabsTrigger value="types">Tipos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Conteúdos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview.total_contents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.overview.published_contents || 0} publicados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorias</CardTitle>
                <Folder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview.total_categories || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {contentTypes.length} tipos de conteúdo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tags</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview.total_tags || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Sistema de marcação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview.total_views || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Todas as visualizações
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdos por Tipo</CardTitle>
                <CardDescription>Distribuição dos conteúdos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.by_type || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(stats?.by_type || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Diária</CardTitle>
                <CardDescription>Conteúdos criados e publicados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats?.daily_activity || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="created" stroke="#01b86c" name="Criados" />
                    <Line type="monotone" dataKey="published" stroke="#3b82f6" name="Publicados" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Content */}
          <Card>
            <CardHeader>
              <CardTitle>Conteúdos Recentes</CardTitle>
              <CardDescription>Últimos conteúdos criados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recent_contents.slice(0, 5).map((content) => (
                  <div key={content.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{content.title}</h4>
                      <p className="text-sm text-gray-500">
                        {content.cms_content_types.name} • {new Date(content.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeColor(content.status)}>
                      {content.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contents Tab */}
        <TabsContent value="contents" className="space-y-6">
          {/* Filtros e Ações */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-1 flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar conteúdos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="review">Revisão</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={showNewContent} onOpenChange={setShowNewContent}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Conteúdo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Conteúdo</DialogTitle>
                  <DialogDescription>
                    Crie um novo conteúdo para o seu CMS
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="content-type">Tipo de Conteúdo</Label>
                      <Select 
                        value={newContent.content_type_id} 
                        onValueChange={(value) => setNewContent(prev => ({ ...prev, content_type_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {contentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={newContent.status} 
                        onValueChange={(value: any) => setNewContent(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="review">Revisão</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={newContent.title}
                      onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Digite o título do conteúdo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      value={newContent.slug}
                      onChange={(e) => setNewContent(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="slug-do-conteudo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Resumo</Label>
                    <Textarea
                      id="excerpt"
                      value={newContent.excerpt}
                      onChange={(e) => setNewContent(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Breve descrição do conteúdo"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      value={newContent.content}
                      onChange={(e) => setNewContent(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Corpo do conteúdo"
                      rows={6}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewContent(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateContent}>
                    Criar Conteúdo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Conteúdos */}
          <div className="space-y-4">
            {filteredContents.map((content) => {
              const StatusIcon = getStatusIcon(content.status);
              return (
                <Card key={content.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{content.title}</h3>
                          <Badge variant={getStatusBadgeColor(content.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {content.status}
                          </Badge>
                          {content.visibility === 'private' && (
                            <Badge variant="secondary">
                              <Lock className="h-3 w-3 mr-1" />
                              Privado
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {content.excerpt || 'Sem resumo disponível'}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {content.cms_content_types.name}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(content.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {content.view_count} visualizações
                          </span>
                          <span className="flex items-center">
                            <Heart className="h-4 w-4 mr-1" />
                            {content.like_count}
                          </span>
                          <span className="flex items-center">
                            <Share2 className="h-4 w-4 mr-1" />
                            {content.share_count}
                          </span>
                        </div>
                        
                        {/* Categorias e Tags */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {content.cms_content_categories.map((cc) => (
                            <Badge 
                              key={cc.cms_categories.id} 
                              variant="outline"
                              style={{ borderColor: cc.cms_categories.color }}
                            >
                              <Folder className="h-3 w-3 mr-1" />
                              {cc.cms_categories.name}
                            </Badge>
                          ))}
                          {content.cms_content_tags.map((ct) => (
                            <Badge 
                              key={ct.cms_tags.id} 
                              variant="secondary"
                              style={{ backgroundColor: ct.cms_tags.color + '20', color: ct.cms_tags.color }}
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {ct.cms_tags.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredContents.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum conteúdo encontrado</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Tente ajustar os filtros ou crie um novo conteúdo
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Content Types Tab */}
        <TabsContent value="types" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Tipos de Conteúdo</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Configure os tipos de conteúdo disponíveis
              </p>
            </div>
            
            <Dialog open={showNewContentType} onOpenChange={setShowNewContentType}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Tipo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Tipo de Conteúdo</DialogTitle>
                  <DialogDescription>
                    Configure um novo tipo de conteúdo para o CMS
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="type-name">Nome</Label>
                    <Input
                      id="type-name"
                      value={newContentType.name}
                      onChange={(e) => setNewContentType(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Artigo, Produto, Serviço"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type-slug">Slug</Label>
                    <Input
                      id="type-slug"
                      value={newContentType.slug}
                      onChange={(e) => setNewContentType(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="Ex: artigo, produto, servico"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type-description">Descrição</Label>
                    <Textarea
                      id="type-description"
                      value={newContentType.description}
                      onChange={(e) => setNewContentType(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o tipo de conteúdo"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewContentType(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateContentType}>
                    Criar Tipo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentTypes.map((type) => (
              <Card key={type.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      {type.name}
                    </CardTitle>
                    {type.is_system && (
                      <Badge variant="secondary">Sistema</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {type.description || 'Sem descrição'}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Hierárquico:</span>
                      <Badge variant={type.is_hierarchical ? 'default' : 'secondary'}>
                        {type.is_hierarchical ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Categorias:</span>
                      <Badge variant={type.has_categories ? 'default' : 'secondary'}>
                        {type.has_categories ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tags:</span>
                      <Badge variant={type.has_tags ? 'default' : 'secondary'}>
                        {type.has_tags ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SEO:</span>
                      <Badge variant={type.has_seo ? 'default' : 'secondary'}>
                        {type.has_seo ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!type.is_system && (
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Categorias</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Organize seu conteúdo com categorias
              </p>
            </div>
            
            <Dialog open={showNewCategory} onOpenChange={setShowNewCategory}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Categoria</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova categoria para organizar conteúdos
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="category-type">Tipo de Conteúdo</Label>
                    <Select 
                      value={newCategory.content_type_id} 
                      onValueChange={(value) => setNewCategory(prev => ({ ...prev, content_type_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {contentTypes.filter(type => type.has_categories).map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category-name">Nome</Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome da categoria"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category-description">Descrição</Label>
                    <Textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição da categoria"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category-color">Cor</Label>
                    <Input
                      id="category-color"
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewCategory(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateCategory}>
                    Criar Categoria
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="font-semibold">{category.name}</h3>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {category.description || 'Sem descrição'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {category.cms_content_types.name}
                    </Badge>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Tags</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Sistema de marcação para conteúdos
              </p>
            </div>
            
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tag
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tags.map((tag) => (
              <Card key={tag.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {tag.usage_count} usos
                    </span>
                  </div>
                  
                  {tag.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {tag.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdos Mais Populares</CardTitle>
                <CardDescription>Por número de visualizações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.popular_contents.map((content, index) => (
                    <div key={content.id} className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-[#01b86c] text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{content.title}</h4>
                        <p className="text-sm text-gray-500">
                          {content.view_count} visualizações
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status dos Conteúdos</CardTitle>
                <CardDescription>Distribuição por status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(stats?.by_status || {}).map(([status, count]) => ({ status, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#01b86c" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}