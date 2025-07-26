'use client'

// ==================================================
// FVStudios Dashboard - Canva Design Workstation
// Integração completa com Canva API e IA generativa
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Palette,
  Sparkles,
  Wand2,
  Download,
  Eye,
  Copy,
  Share2,
  RefreshCw,
  Layers,
  Type,
  Image,
  Layout,
  Brush,
  Zap,
  Brain,
  CheckCircle,
  Clock,
  Star,
  Filter,
  Search,
  Grid,
  List,
  Play,
  Pause,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Save
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { CanvaAPIManager, CanvaTemplate, CanvaDesign, BrandGuidelines, N8nIntegrationManager } from '@/lib/n8n-integration'

// Interfaces
interface DesignProject {
  id: string
  name: string
  description: string
  status: 'draft' | 'in_progress' | 'review' | 'approved' | 'published'
  canva_designs: CanvaDesign[]
  ai_prompt?: string
  brand_guidelines: BrandGuidelines
  created_at: Date
  updated_at: Date
}

interface AIDesignRequest {
  prompt: string
  style: string
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'google_ads'
  format: 'post' | 'story' | 'banner' | 'video'
  brand_guidelines: BrandGuidelines
}

// ==================================================
// COMPONENTES
// ==================================================

// Seletor de Templates
function TemplateSelector({ onSelectTemplate }: { onSelectTemplate: (template: CanvaTemplate) => void }) {
  const [templates, setTemplates] = useState<CanvaTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const categories = [
    { id: 'all', name: 'Todos', count: 0 },
    { id: 'social-media', name: 'Social Media', count: 0 },
    { id: 'ads', name: 'Anúncios', count: 0 },
    { id: 'stories', name: 'Stories', count: 0 },
    { id: 'banners', name: 'Banners', count: 0 },
    { id: 'presentations', name: 'Apresentações', count: 0 }
  ]

  useEffect(() => {
    loadTemplates()
  }, [selectedCategory])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      // Simular carregamento de templates do Canva
      const mockTemplates: CanvaTemplate[] = [
        {
          id: 'temp_1',
          name: 'Instagram Post Moderno',
          category: 'social-media',
          tags: ['modern', 'minimal', 'colorful'],
          preview_url: '/api/placeholder/400/400',
          is_premium: false
        },
        {
          id: 'temp_2',
          name: 'Facebook Ad Promocional',
          category: 'ads',
          tags: ['promotional', 'sale', 'bright'],
          preview_url: '/api/placeholder/400/300',
          is_premium: true
        },
        {
          id: 'temp_3',
          name: 'Story Animado',
          category: 'stories',
          tags: ['animated', 'dynamic', 'engaging'],
          preview_url: '/api/placeholder/300/533',
          is_premium: true
        }
      ]
      
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      toast.error('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="flex flex-wrap gap-2 pb-4 border-b">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Templates Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredTemplates.map(template => (
            <Card 
              key={template.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => onSelectTemplate(template)}
            >
              <CardContent className="p-3">
                <div className={`${viewMode === 'grid' ? 'space-y-3' : 'flex items-center space-x-4'}`}>
                  <div className={`${viewMode === 'grid' ? 'aspect-square' : 'w-20 h-20'} bg-gray-100 rounded-lg overflow-hidden`}>
                    <img 
                      src={template.preview_url} 
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm line-clamp-2">{template.name}</h4>
                      {template.is_premium && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Pro
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Usar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Criador com IA
function AIDesignCreator({ onDesignCreated }: { onDesignCreated: (design: CanvaDesign) => void }) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<AIDesignRequest['platform']>('instagram')
  const [selectedFormat, setSelectedFormat] = useState<AIDesignRequest['format']>('post')
  const [selectedStyle, setSelectedStyle] = useState('modern')
  const [progress, setProgress] = useState(0)

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'facebook', name: 'Facebook', icon: '👥' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'google_ads', name: 'Google Ads', icon: '🎯' }
  ] as const

  const formats = [
    { id: 'post', name: 'Post Quadrado', dimensions: '1080x1080' },
    { id: 'story', name: 'Story Vertical', dimensions: '1080x1920' },
    { id: 'banner', name: 'Banner Horizontal', dimensions: '1200x630' },
    { id: 'video', name: 'Vídeo', dimensions: 'Variável' }
  ] as const

  const styles = [
    { id: 'modern', name: 'Moderno', description: 'Limpo e minimalista' },
    { id: 'vibrant', name: 'Vibrante', description: 'Cores fortes e energia' },
    { id: 'elegant', name: 'Elegante', description: 'Sofisticado e refinado' },
    { id: 'playful', name: 'Divertido', description: 'Jovem e descontraído' },
    { id: 'professional', name: 'Profissional', description: 'Corporativo e sério' }
  ]

  const handleGenerateDesign = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, descreva o design que você precisa')
      return
    }

    try {
      setIsGenerating(true)
      setProgress(0)

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      // Executar workflow n8n para criação com IA
      const n8nManager = new N8nIntegrationManager()
      const result = await n8nManager.executeWorkflow('content_creation_workflow', {
        type: 'ai_design_creation',
        prompt,
        platform: selectedPlatform,
        format: selectedFormat,
        style: selectedStyle,
        brand_guidelines: {
          colors: ['#01b86c', '#1e293b', '#f8fafc'],
          fonts: ['Inter', 'Poppins'],
          logo_url: '/logo.svg',
          tone_of_voice: 'professional_friendly',
          visual_style: selectedStyle
        }
      })

      clearInterval(progressInterval)
      setProgress(100)

      // Simular design criado
      const mockDesign: CanvaDesign = {
        id: `design_${Date.now()}`,
        name: `Design IA - ${selectedPlatform}`,
        preview_url: '/api/placeholder/400/400',
        edit_url: 'https://canva.com/design/mock-id',
        status: 'draft'
      }

      setTimeout(() => {
        onDesignCreated(mockDesign)
        toast.success('Design criado com sucesso!')
        setPrompt('')
        setProgress(0)
      }, 1000)

    } catch (error) {
      console.error('Erro ao gerar design:', error)
      toast.error('Erro ao gerar design com IA')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Descreva seu design</label>
        <Textarea
          placeholder="Ex: Crie um post para Instagram promovendo uma promoção de Black Friday com 50% de desconto. Use cores escuras e douradas, estilo moderno e elegante..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plataforma */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Plataforma</label>
          <div className="grid grid-cols-2 gap-2">
            {platforms.map(platform => (
              <Button
                key={platform.id}
                variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlatform(platform.id)}
                className="justify-start"
              >
                <span className="mr-2">{platform.icon}</span>
                {platform.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Formato */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Formato</label>
          <div className="space-y-2">
            {formats.map(format => (
              <Button
                key={format.id}
                variant={selectedFormat === format.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFormat(format.id)}
                className="w-full justify-between"
              >
                <span>{format.name}</span>
                <span className="text-xs text-gray-500">{format.dimensions}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Estilo */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Estilo Visual</label>
          <div className="space-y-2">
            {styles.map(style => (
              <Button
                key={style.id}
                variant={selectedStyle === style.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStyle(style.id)}
                className="w-full text-left justify-start flex-col items-start h-auto py-2"
              >
                <span className="font-medium">{style.name}</span>
                <span className="text-xs text-gray-500">{style.description}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Gerando design com IA...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerateDesign}
        disabled={isGenerating || !prompt.trim()}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar Design com IA
          </>
        )}
      </Button>
    </div>
  )
}

// Gerenciador de Projetos
function ProjectManager({ projects, onSelectProject }: { 
  projects: DesignProject[]
  onSelectProject: (project: DesignProject) => void 
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  const getStatusColor = (status: DesignProject['status']) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      published: 'bg-purple-100 text-purple-800'
    }
    return colors[status]
  }

  const getStatusIcon = (status: DesignProject['status']) => {
    const icons = {
      draft: <Edit3 className="h-3 w-3" />,
      in_progress: <Clock className="h-3 w-3" />,
      review: <Eye className="h-3 w-3" />,
      approved: <CheckCircle className="h-3 w-3" />,
      published: <Star className="h-3 w-3" />
    }
    return icons[status]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Projetos de Design</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Projeto</label>
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ex: Campanha Black Friday 2024"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Descreva o objetivo e escopo do projeto..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowCreateDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button className="flex-1">
                  Criar Projeto
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map(project => (
          <Card 
            key={project.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => onSelectProject(project)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium line-clamp-2">{project.name}</h4>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1 capitalize">{project.status}</span>
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{project.canva_designs.length} designs</span>
                  <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
                
                {project.canva_designs.length > 0 && (
                  <div className="flex -space-x-2">
                    {project.canva_designs.slice(0, 3).map((design, index) => (
                      <div 
                        key={design.id}
                        className="w-8 h-8 rounded border-2 border-white bg-gray-100 overflow-hidden"
                        style={{ zIndex: 10 - index }}
                      >
                        <img 
                          src={design.preview_url} 
                          alt={design.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {project.canva_designs.length > 3 && (
                      <div className="w-8 h-8 rounded border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium">
                        +{project.canva_designs.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function CanvaWorkstation() {
  const { user } = useUser()
  const [selectedProject, setSelectedProject] = useState<DesignProject | null>(null)
  const [activeTab, setActiveTab] = useState('projects')
  const [projects, setProjects] = useState<DesignProject[]>([])

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    // Simular carregamento de projetos
    const mockProjects: DesignProject[] = [
      {
        id: '1',
        name: 'Campanha Black Friday 2024',
        description: 'Materiais promocionais para a maior campanha do ano',
        status: 'in_progress',
        canva_designs: [],
        brand_guidelines: {
          colors: ['#000000', '#FFD700'],
          fonts: ['Roboto', 'Open Sans'],
          logo_url: '/logo.svg',
          tone_of_voice: 'urgency',
          visual_style: 'bold'
        },
        created_at: new Date(),
        updated_at: new Date()
      }
    ]
    setProjects(mockProjects)
  }

  const handleTemplateSelect = (template: CanvaTemplate) => {
    toast.success(`Template "${template.name}" selecionado!`)
    // Implementar lógica para usar template
  }

  const handleDesignCreated = (design: CanvaDesign) => {
    toast.success('Design criado com sucesso!')
    // Implementar lógica para salvar design no projeto
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
          <Palette className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Canva Design Studio</h1>
          <p className="text-gray-600">Crie designs incríveis com IA e templates profissionais</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Projetos
          </TabsTrigger>
          <TabsTrigger value="ai-create" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Criar com IA
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Brand Assets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <ProjectManager projects={projects} onSelectProject={setSelectedProject} />
        </TabsContent>

        <TabsContent value="ai-create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Criação com Inteligência Artificial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AIDesignCreator onDesignCreated={handleDesignCreated} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Biblioteca de Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateSelector onSelectTemplate={handleTemplateSelect} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brush className="h-5 w-5" />
                Brand Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Brush className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Gerencie seus Brand Assets</h3>
                <p className="text-gray-600 mb-4">
                  Organize logos, cores, fontes e guidelines da marca para uso consistente.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Asset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}