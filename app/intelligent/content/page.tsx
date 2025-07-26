'use client'

// ==================================================
// FVStudios Dashboard - Geração Inteligente de Conteúdo
// Sistema de IA para criação automática de posts, anúncios e textos
// ==================================================

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Sparkles,
  Wand2,
  FileText,
  Image,
  Video,
  Mic,
  Brain,
  Zap,
  Copy,
  Download,
  Share2,
  RefreshCw,
  Plus,
  Eye,
  Heart,
  MessageCircle,
  Send,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Settings,
  Lightbulb,
  Palette,
  Type,
  Layout
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces
interface ContentTemplate {
  id: string
  name: string
  type: 'post' | 'ad' | 'story' | 'email' | 'blog'
  platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'email' | 'blog'
  category: string
  description: string
  prompt_template: string
  variables: string[]
  usage_count: number
  success_rate: number
}

interface GeneratedContent {
  id: string
  template_id: string
  content_type: 'text' | 'caption' | 'headline' | 'description'
  generated_text: string
  platform: string
  target_audience: string
  tone: string
  length: 'short' | 'medium' | 'long'
  keywords: string[]
  generated_at: Date
  performance_prediction: number
  status: 'draft' | 'approved' | 'published'
}

interface ContentMetrics {
  total_generated: number
  approved_content: number
  published_content: number
  avg_engagement_prediction: number
  time_saved_hours: number
  most_used_template: string
}

// ==================================================
// COMPONENTES
// ==================================================

// Content Generation Form
function ContentGenerationForm({ 
  templates, 
  onGenerate 
}: { 
  templates: ContentTemplate[]
  onGenerate: (params: any) => void 
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null)
  const [formData, setFormData] = useState({
    topic: '',
    audience: '',
    tone: 'professional',
    platform: 'instagram',
    length: 'medium',
    keywords: '',
    includeHashtags: true,
    includeEmojis: true,
    callToAction: true
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const platforms = [
    { value: 'instagram', label: 'Instagram', icon: '📷' },
    { value: 'facebook', label: 'Facebook', icon: '📘' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'blog', label: 'Blog', icon: '📝' }
  ]

  const tones = [
    'professional', 'casual', 'friendly', 'formal', 'humorous', 
    'inspirational', 'urgent', 'educational', 'promotional', 'conversational'
  ]

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast.error('Por favor, insira um tópico')
      return
    }

    setIsGenerating(true)
    
    try {
      await onGenerate({
        ...formData,
        template: selectedTemplate,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
      })
    } catch (error) {
      toast.error('Erro ao gerar conteúdo')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Gerador de Conteúdo IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div>
          <Label htmlFor="template">Template (Opcional)</Label>
          <Select onValueChange={(value) => {
            const template = templates.find(t => t.id === value)
            setSelectedTemplate(template || null)
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um template ou crie do zero" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <span>{template.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {template.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplate && (
            <p className="text-sm text-gray-600 mt-1">
              {selectedTemplate.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Platform */}
          <div>
            <Label htmlFor="platform">Plataforma</Label>
            <Select value={formData.platform} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, platform: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platforms.map(platform => (
                  <SelectItem key={platform.value} value={platform.value}>
                    <div className="flex items-center gap-2">
                      <span>{platform.icon}</span>
                      {platform.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tone */}
          <div>
            <Label htmlFor="tone">Tom</Label>
            <Select value={formData.tone} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, tone: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones.map(tone => (
                  <SelectItem key={tone} value={tone}>
                    <span className="capitalize">{tone}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Topic */}
        <div>
          <Label htmlFor="topic">Tópico/Produto *</Label>
          <Input
            id="topic"
            placeholder="Ex: Lançamento do novo produto X, Dicas de marketing digital..."
            value={formData.topic}
            onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
          />
        </div>

        {/* Target Audience */}
        <div>
          <Label htmlFor="audience">Público-alvo</Label>
          <Input
            id="audience"
            placeholder="Ex: Empresários entre 25-40 anos, Jovens interessados em tecnologia..."
            value={formData.audience}
            onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
          />
        </div>

        {/* Keywords */}
        <div>
          <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
          <Input
            id="keywords"
            placeholder="Ex: marketing digital, redes sociais, vendas online"
            value={formData.keywords}
            onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Length */}
          <div>
            <Label>Tamanho</Label>
            <Select value={formData.length} onValueChange={(value: any) => 
              setFormData(prev => ({ ...prev, length: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Curto (até 100 chars)</SelectItem>
                <SelectItem value="medium">Médio (100-300 chars)</SelectItem>
                <SelectItem value="long">Longo (300+ chars)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hashtags"
                checked={formData.includeHashtags}
                onChange={(e) => setFormData(prev => ({ ...prev, includeHashtags: e.target.checked }))}
              />
              <Label htmlFor="hashtags" className="text-sm">Hashtags</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="emojis"
                checked={formData.includeEmojis}
                onChange={(e) => setFormData(prev => ({ ...prev, includeEmojis: e.target.checked }))}
              />
              <Label htmlFor="emojis" className="text-sm">Emojis</Label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="cta"
              checked={formData.callToAction}
              onChange={(e) => setFormData(prev => ({ ...prev, callToAction: e.target.checked }))}
            />
            <Label htmlFor="cta" className="text-sm">Call to Action</Label>
          </div>
        </div>

        <Button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Gerando conteúdo...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Conteúdo IA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Generated Content Display
function GeneratedContentDisplay({ 
  contents, 
  onApprove, 
  onRegenerate, 
  onCopy 
}: {
  contents: GeneratedContent[]
  onApprove: (contentId: string) => void
  onRegenerate: (contentId: string) => void
  onCopy: (content: string) => void
}) {
  const getPlatformIcon = (platform: string) => {
    const icons = {
      instagram: '📷',
      facebook: '📘',
      linkedin: '💼',
      tiktok: '🎵',
      email: '📧',
      blog: '📝'
    }
    return icons[platform as keyof typeof icons] || '📊'
  }

  const getPerformancePredictionColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
      published: 'bg-blue-100 text-blue-800'
    }
    return colors[status as keyof typeof colors]
  }

  return (
    <div className="space-y-4">
      {contents.map(content => (
        <Card key={content.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {getPlatformIcon(content.platform)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(content.status)}>
                      {content.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {content.content_type}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {content.platform}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {content.target_audience} • Tom: {content.tone}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded text-xs font-medium ${getPerformancePredictionColor(content.performance_prediction)}`}>
                  📈 {content.performance_prediction}% performance
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {content.generated_text}
              </div>
            </div>

            {content.keywords.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">Palavras-chave utilizadas:</div>
                <div className="flex flex-wrap gap-1">
                  {content.keywords.map(keyword => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Gerado em: {new Date(content.generated_at).toLocaleString()}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onCopy(content.generated_text)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onRegenerate(content.id)}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerar
                </Button>
                
                {content.status === 'draft' && (
                  <Button 
                    size="sm"
                    onClick={() => onApprove(content.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Target className="h-3 w-3 mr-1" />
                    Aprovar
                  </Button>
                )}
                
                <Button size="sm" variant="outline">
                  <Share2 className="h-3 w-3 mr-1" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Content Metrics Dashboard
function ContentMetricsDashboard({ metrics }: { metrics: ContentMetrics }) {
  const metricsData = [
    {
      title: 'Conteúdo Gerado',
      value: metrics.total_generated,
      subtitle: 'Este mês',
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Taxa de Aprovação',
      value: `${Math.round((metrics.approved_content / metrics.total_generated) * 100)}%`,
      subtitle: `${metrics.approved_content} aprovados`,
      icon: <Target className="h-5 w-5" />,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Conteúdo Publicado',
      value: metrics.published_content,
      subtitle: 'Nos canais',
      icon: <Send className="h-5 w-5" />,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      title: 'Tempo Economizado',
      value: `${metrics.time_saved_hours}h`,
      subtitle: 'Este mês',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
                {metric.subtitle && (
                  <p className="text-sm text-gray-500 mt-1">{metric.subtitle}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${metric.bg}`}>
                <div className={metric.color}>
                  {metric.icon}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export default function IntelligentContentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<ContentTemplate[]>([])
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([])
  const [metrics, setMetrics] = useState<ContentMetrics>({
    total_generated: 0,
    approved_content: 0,
    published_content: 0,
    avg_engagement_prediction: 0,
    time_saved_hours: 0,
    most_used_template: ''
  })
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      loadContentData()
    }
  }, [user])

  const loadContentData = async () => {
    try {
      setLoading(true)

      // Mock data - em produção viria do banco e integração com OpenAI/Claude
      const mockTemplates: ContentTemplate[] = [
        {
          id: '1',
          name: 'Post Promocional Instagram',
          type: 'post',
          platform: 'instagram',
          category: 'marketing',
          description: 'Template para posts promocionais no Instagram com foco em vendas',
          prompt_template: 'Crie um post promocional para {produto} direcionado para {publico} com tom {tom}',
          variables: ['produto', 'publico', 'tom'],
          usage_count: 45,
          success_rate: 87
        },
        {
          id: '2',
          name: 'Anúncio Facebook Ads',
          type: 'ad',
          platform: 'facebook',
          category: 'advertising',
          description: 'Template otimizado para anúncios pagos no Facebook',
          prompt_template: 'Crie um anúncio para {produto} com CTA forte para {acao}',  
          variables: ['produto', 'acao'],
          usage_count: 67,
          success_rate: 91
        }
      ]

      const mockGeneratedContents: GeneratedContent[] = [
        {
          id: '1',
          template_id: '1',
          content_type: 'caption',
          generated_text: `🚀 Revolucione seu marketing digital com nossa nova plataforma! 

✨ Mais de 10.000 empresas já transformaram suas vendas
📈 Aumento médio de 300% no ROI
🎯 Automação inteligente que trabalha 24/7

Não perca tempo com estratégias ultrapassadas! 

👉 Clique no link da bio e comece sua transformação HOJE!

#MarketingDigital #Vendas #Automacao #Resultados #Empreendedorismo`,
          platform: 'instagram',
          target_audience: 'Empresários e empreendedores 25-45 anos',
          tone: 'promotional',
          length: 'medium',
          keywords: ['marketing digital', 'vendas', 'automação', 'ROI'],
          generated_at: new Date(),
          performance_prediction: 84,
          status: 'draft'
        },
        {
          id: '2',
          template_id: '2',
          content_type: 'headline',
          generated_text: `Pare de Perder Clientes! 
          
Descubra como nossa IA pode aumentar suas vendas em 300% em apenas 30 dias.

✅ Sem conhecimento técnico necessário
✅ Suporte 24/7 em português  
✅ Garantia de 30 dias ou seu dinheiro de volta

Mais de 5.000 empresas já estão vendendo mais. E você?

👆 QUERO COMEÇAR AGORA`,
          platform: 'facebook',
          target_audience: 'Pequenos e médios empresários',
          tone: 'urgent',
          length: 'long',
          keywords: ['vendas', 'IA', 'garantia', 'suporte'],
          generated_at: new Date(),
          performance_prediction: 92,
          status: 'approved'
        }
      ]

      const mockMetrics: ContentMetrics = {
        total_generated: 127,
        approved_content: 89,
        published_content: 67,
        avg_engagement_prediction: 78,
        time_saved_hours: 24,
        most_used_template: 'Post Promocional Instagram'
      }

      setTemplates(mockTemplates)
      setGeneratedContents(mockGeneratedContents)
      setMetrics(mockMetrics)

    } catch (error) {
      console.error('Erro ao carregar dados de conteúdo:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateContent = async (params: any) => {
    try {
      // Aqui seria feita a integração real com OpenAI, Claude ou outra IA
      console.log('Gerando conteúdo com parâmetros:', params)
      
      // Simular geração de conteúdo
      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        template_id: params.template?.id || '',
        content_type: 'caption',
        generated_text: `Conteúdo gerado por IA sobre: ${params.topic}\n\nPúblico: ${params.audience}\nTom: ${params.tone}\nPlataforma: ${params.platform}`,
        platform: params.platform,
        target_audience: params.audience || 'Público geral',
        tone: params.tone,
        length: params.length,
        keywords: params.keywords || [],
        generated_at: new Date(),
        performance_prediction: Math.floor(Math.random() * 40) + 60, // 60-100
        status: 'draft'
      }

      setGeneratedContents(prev => [newContent, ...prev])
      toast.success('Conteúdo gerado com sucesso!')

    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error)
      toast.error('Erro ao gerar conteúdo')
    }
  }

  const handleApproveContent = (contentId: string) => {
    setGeneratedContents(prev => 
      prev.map(content => 
        content.id === contentId 
          ? { ...content, status: 'approved' as const }
          : content
      )
    )
    toast.success('Conteúdo aprovado!')
  }

  const handleRegenerateContent = (contentId: string) => {
    const content = generatedContents.find(c => c.id === contentId)
    if (content) {
      toast.success('Regenerando conteúdo...')
      // Aqui seria feita nova chamada para a IA
    }
  }

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Conteúdo copiado para a área de transferência!')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-[#121212] min-h-screen">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
          <Topbar 
            name="Geração de Conteúdo"
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-64" />
                <div className="grid grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="h-96 bg-gray-200 rounded" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name="Geração Inteligente de Conteúdo"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Geração de Conteúdo IA</h1>
                  <p className="text-gray-600">Cria posts, anúncios e textos personalizados automaticamente</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar IA
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Template Personalizado</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Funcionalidade em desenvolvimento...
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Metrics */}
            <ContentMetricsDashboard metrics={metrics} />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Generation Form */}
              <div>
                <ContentGenerationForm 
                  templates={templates}
                  onGenerate={handleGenerateContent}
                />
              </div>

              {/* Generated Content */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Conteúdo Gerado
                      </div>
                      <Badge variant="secondary">
                        {generatedContents.length} itens
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {generatedContents.length === 0 ? (
                      <div className="text-center py-8">
                        <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          Nenhum conteúdo gerado ainda. Use o formulário ao lado para começar!
                        </p>
                      </div>
                    ) : (
                      <GeneratedContentDisplay
                        contents={generatedContents}
                        onApprove={handleApproveContent}
                        onRegenerate={handleRegenerateContent}
                        onCopy={handleCopyContent}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}