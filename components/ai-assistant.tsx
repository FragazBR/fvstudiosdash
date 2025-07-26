'use client'

// ==================================================
// FVStudios Dashboard - Assistente IA Inteligente
// Sistema de assistente virtual para otimização de recursos e produtividade
// ==================================================

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Brain,
  MessageCircle,
  Send,
  User,
  Bot,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Users,
  Clock,
  Target,
  Zap,
  Star,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BarChart3,
  Settings,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces
interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    suggestions?: string[]
    actions?: ChatAction[]
    confidence?: number
    sources?: string[]
  }
}

interface ChatAction {
  id: string
  label: string
  type: 'navigation' | 'create' | 'update' | 'analyze'
  onClick: () => void
  icon?: React.ReactNode
}

interface AssistantCapability {
  id: string
  name: string
  description: string
  category: 'productivity' | 'analysis' | 'automation' | 'optimization'
  examples: string[]
  icon: React.ReactNode
}

interface SmartSuggestion {
  id: string
  type: 'task' | 'optimization' | 'insight' | 'action'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  estimated_impact: string
  action: () => void
}

// ==================================================
// INTELIGÊNCIA DO ASSISTENTE
// ==================================================

class AIEngine {
  static capabilities: AssistantCapability[] = [
    {
      id: 'resource-optimization',
      name: 'Otimização de Recursos',
      description: 'Analiso sua equipe e projetos para sugerir melhor alocação de recursos',
      category: 'optimization',
      examples: [
        'Como posso otimizar a distribuição de tarefas?',
        'Qual membro da equipe está sobrecarregado?',
        'Sugestões para equilibrar a carga de trabalho'
      ],
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'deadline-prediction',
      name: 'Predição de Prazos',
      description: 'Utilizo IA para prever riscos de atraso e sugerir ações preventivas',
      category: 'analysis',
      examples: [
        'Este projeto vai atrasar?',
        'Quais tarefas precisam de atenção urgente?',
        'Como acelerar este projeto?'
      ],
      icon: <Clock className="h-5 w-5" />
    },
    {
      id: 'productivity-insights',
      name: 'Insights de Produtividade',
      description: 'Analiso padrões de trabalho e sugiro melhorias na produtividade',
      category: 'analysis',
      examples: [
        'Quais são meus horários mais produtivos?',
        'Como posso melhorar minha eficiência?',
        'Análise do meu desempenho mensal'
      ],
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      id: 'task-automation',
      name: 'Automação de Tarefas',
      description: 'Identifico tarefas repetitivas e crio automações personalizadas',
      category: 'automation',
      examples: [
        'Que tarefas posso automatizar?',
        'Criar template para projetos similares',
        'Configurar automação de relatórios'
      ],
      icon: <Zap className="h-5 w-5" />
    },
    {
      id: 'project-planning',
      name: 'Planejamento Inteligente',
      description: 'Ajudo a criar cronogramas otimizados e distribuir tarefas estrategicamente',
      category: 'productivity',
      examples: [
        'Como estruturar este novo projeto?',
        'Qual a melhor sequência de tarefas?',
        'Estimativa de tempo para conclusão'
      ],
      icon: <Target className="h-5 w-5" />
    },
    {
      id: 'performance-analysis',
      name: 'Análise de Performance',
      description: 'Monitoro KPIs e forneço insights acionáveis sobre performance',
      category: 'analysis',
      examples: [
        'Como está minha performance este mês?',
        'Comparativo com período anterior',
        'Métricas de qualidade dos projetos'
      ],
      icon: <BarChart3 className="h-5 w-5" />
    }
  ]

  static async processMessage(message: string, userData: any): Promise<ChatMessage> {
    // Simular processamento de IA com análise contextual
    await new Promise(resolve => setTimeout(resolve, 1500))

    const messageId = `ai-${Date.now()}`
    const lowerMessage = message.toLowerCase()

    // Análise inteligente da mensagem
    let response = ''
    let suggestions: string[] = []
    let actions: ChatAction[] = []
    let confidence = 85

    if (lowerMessage.includes('produtividade') || lowerMessage.includes('eficiência')) {
      response = `Baseado na análise dos seus dados, identificei algumas oportunidades de melhoria na produtividade:

🎯 **Insights Principais:**
• Você é mais produtivo entre 9h-11h e 14h-16h
• Tarefas de desenvolvimento levam em média 20% mais tempo que o estimado
• Existe um gargalo em tarefas de revisão que pode ser otimizado

📊 **Recomendações:**
1. Agende tarefas complexas nos seus horários de pico
2. Implemente pair programming para reduzir tempo de revisão
3. Use templates para tarefas repetitivas (economia de 30% do tempo)

Gostaria que eu crie um plano de otimização personalizado para você?`

      suggestions = [
        'Criar plano de otimização personalizado',
        'Analisar horários mais produtivos',
        'Configurar automações'
      ]

      actions = [
        {
          id: 'create-plan',
          label: 'Criar Plano de Otimização',
          type: 'create',
          onClick: () => toast.info('Criando plano personalizado...'),
          icon: <Target className="h-4 w-4" />
        }
      ]
      confidence = 92

    } else if (lowerMessage.includes('projeto') && lowerMessage.includes('atraso')) {
      response = `Analisei seus projetos ativos e identifiquei riscos de atraso:

⚠️ **Projetos em Risco:**
• **Projeto Dashboard FV**: 73% de chance de atraso (5-7 dias)
• **App Mobile**: 45% de chance de atraso (2-3 dias)

🔍 **Principais Fatores:**
• Dependências não resolvidas
• Sobrecarga do desenvolvedor principal
• Escopo expandido sem ajuste de prazo

💡 **Soluções Imediatas:**
1. Realocar 2 tarefas críticas do Dashboard para outros membros
2. Negociar extensão de 1 semana com o cliente
3. Implementar daily standups para acompanhamento

Quer que eu prepare um relatório detalhado com plano de ação?`

      suggestions = [
        'Gerar relatório de riscos',
        'Sugerir realocação de tarefas',
        'Criar plano de contingência'
      ]

      actions = [
        {
          id: 'risk-report',
          label: 'Gerar Relatório de Riscos',
          type: 'analyze',
          onClick: () => toast.info('Gerando relatório detalhado...'),
          icon: <AlertTriangle className="h-4 w-4" />
        }
      ]
      confidence = 88

    } else if (lowerMessage.includes('equipe') || lowerMessage.includes('recursos')) {
      response = `Análise da distribuição de recursos da sua equipe:

👥 **Status Atual:**
• **João Silva**: 120% capacidade (sobrecarregado)
• **Maria Santos**: 85% capacidade (bem balanceada)
• **Pedro Costa**: 60% capacidade (disponível)

📈 **Recomendações de Balanceamento:**
1. Transferir 2 tarefas de UI do João para o Pedro
2. Maria pode assumir mais 1 projeto de média complexidade
3. Contratar freelancer para design se demanda aumentar

🎯 **Impacto Esperado:**
• Redução de 30% no stress da equipe
• Aumento de 15% na velocidade de entrega
• Melhor distribuição de conhecimento

Gostaria que eu configure alertas automáticos de sobrecarga?`

      suggestions = [
        'Configurar alertas de sobrecarga',
        'Sugerir redistribuição específica',
        'Analisar histórico de performance'
      ]

      actions = [
        {
          id: 'balance-team',
          label: 'Redistribuir Tarefas',
          type: 'update',
          onClick: () => toast.info('Abrindo ferramenta de redistribuição...'),
          icon: <Users className="h-4 w-4" />
        }
      ]
      confidence = 90

    } else if (lowerMessage.includes('automação') || lowerMessage.includes('automatizar')) {
      response = `Identifiquei várias oportunidades de automação nos seus processos:

🤖 **Automações Recomendadas:**

**1. Criação de Projetos (Alta Prioridade)**
• Templates inteligentes baseados no tipo de cliente
• Auto-preenchimento de tarefas padrão
• Estimativas automáticas baseadas em histórico

**2. Relatórios e Notificações**
• Relatórios semanais automáticos para clientes
• Alertas de deadline 3 dias antes do vencimento
• Notificações de gargalos em tempo real

**3. Gestão de Tarefas**
• Auto-atribuição baseada em especialidade
• Movimentação automática de status
• Lembretes inteligentes personalizados

💰 **Economia Estimada:** 12 horas/semana
⚡ **Redução de Erros:** 70%

Quer que eu configure essas automações passo a passo?`

      suggestions = [
        'Configurar templates inteligentes',
        'Ativar alertas automáticos',
        'Implementar auto-atribuição'
      ]

      actions = [
        {
          id: 'setup-automation',
          label: 'Configurar Automações',
          type: 'create',
          onClick: () => toast.info('Iniciando assistente de automação...'),
          icon: <Zap className="h-4 w-4" />
        }
      ]
      confidence = 94

    } else if (lowerMessage.includes('campanha') || lowerMessage.includes('marketing')) {
      response = `Analisando suas campanhas de marketing digital...

📊 **Status das Campanhas:**
• **Facebook Ads**: 8 campanhas ativas, ROAS 4.2x
• **Google Ads**: 5 campanhas ativas, ROAS 3.8x  
• **Instagram**: 12 campanhas, CTR 2.1%

🎯 **Insights e Recomendações:**
• Campanha "Black Friday Stories" com melhor performance (ROAS 6.8x)
• Budget de Google Ads pode ser realocado para Instagram
• Horário 18h-22h tem 45% mais conversões

💡 **Ações Sugeridas:**
1. Aumentar orçamento das Stories em 30%
2. Pausar campanhas com ROAS < 2.0
3. Criar mais criativos para público 25-35 anos
4. Implementar remarketing baseado em comportamento

Gostaria que eu otimize automaticamente suas campanhas?`

      suggestions = [
        'Otimizar campanhas automaticamente',
        'Criar novos criativos com IA',
        'Analisar público-alvo',
        'Configurar remarketing inteligente'
      ]

      actions = [
        {
          id: 'optimize-campaigns',
          label: 'Otimizar Campanhas',
          type: 'update',
          onClick: () => toast.info('Otimizando campanhas com IA...'),
          icon: <TrendingUp className="h-4 w-4" />
        }
      ]
      confidence = 91

    } else if (lowerMessage.includes('relatório') || lowerMessage.includes('report')) {
      response = `Preparando relatório inteligente personalizado...

📈 **Relatório de Performance - Última Semana:**

**Métricas Principais:**
• Receita Total: R$ 28.456 (+15% vs. semana anterior)
• Conversões: 142 (+23%)
• ROAS Médio: 4.6x (+8%)
• CTR Médio: 2.3% (+12%)

**Top 3 Campanhas:**
1. **Instagram Stories Premium** - ROAS 6.8x - R$ 8.200
2. **Google Search Brand** - ROAS 5.2x - R$ 6.100  
3. **Facebook Lookalike** - ROAS 4.9x - R$ 4.800

**Insights da IA:**
• Público feminino 25-35 anos convertendo 40% melhor
• Criativos com vídeo têm 60% mais engajamento
• Horário 19h-21h é o pico de conversões

**Recomendações para Próxima Semana:**
• Ampliar target feminino 25-35 anos (+R$ 2.000 budget)
• Produzir 3 novos vídeos criativos
• Concentrar 70% do budget no horário 18h-22h

Quer que eu gere o relatório completo em PDF e envie por email?`

      suggestions = [
        'Gerar relatório PDF completo',
        'Enviar relatório por email',
        'Comparar com mês anterior',
        'Criar apresentação para cliente'
      ]

      actions = [
        {
          id: 'generate-report',
          label: 'Gerar Relatório PDF',
          type: 'create',
          onClick: () => toast.info('Gerando relatório detalhado...'),
          icon: <BarChart3 className="h-4 w-4" />
        }
      ]
      confidence = 96

    } else if (lowerMessage.includes('conteúdo') || lowerMessage.includes('post') || lowerMessage.includes('criativo')) {
      response = `Criando conteúdo personalizado com IA...

🎨 **Criativos Gerados para suas Campanhas:**

**Post Instagram - Promoção Black Friday:**
"🔥 ÚLTIMAS HORAS! 
Não perca a maior promoção do ano!

✅ ATÉ 70% OFF em todos os produtos
✅ FRETE GRÁTIS para todo Brasil  
✅ 12x SEM JUROS no cartão

⏰ Termina hoje às 23:59h!
👆 Link na bio para aproveitar!

#BlackFriday #Promoção #UltimasHoras"

**Copy para Google Ads:**
"Black Friday Imperdível! Até 70% OFF + Frete Grátis. Últimas Horas - Aproveite Já!"

**Hashtags Sugeridas:**
#blackfriday #promoção #desconto #fretegrátis #ofertas #brasil #loja #venda #oportunidade

**Melhores Horários para Postar:**
• Instagram: 19:30 (baseado no seu público)
• Facebook: 20:00  
• LinkedIn: 08:30

Quer que eu crie variações desses criativos ou gere imagens no Canva?`

      suggestions = [
        'Criar mais variações do texto',
        'Gerar imagens no Canva',
        'Adaptar para outras plataformas',
        'Programar posts automaticamente'
      ]

      actions = [
        {
          id: 'create-variations',
          label: 'Criar Variações',
          type: 'create',
          onClick: () => toast.info('Gerando variações criativas...'),
          icon: <Sparkles className="h-4 w-4" />
        },
        {
          id: 'generate-images',
          label: 'Gerar Imagens',
          type: 'create',
          onClick: () => toast.info('Abrindo Canva Studio...'),
          icon: <Target className="h-4 w-4" />
        }
      ]
      confidence = 93

    } else {
      response = `Olá! Sou seu assistente IA completo da FVStudios 🤖

**Posso ajudar você com:**
• 📊 **Marketing Digital**: Análise de campanhas, otimização de ROAS, criação de criativos
• 🎯 **Gestão de Projetos**: Predição de prazos, otimização de recursos, automação
• 📈 **Analytics**: Relatórios inteligentes, insights preditivos, métricas avançadas  
• 🤖 **Automação**: Workflows personalizados, templates inteligentes, processos otimizados
• 🎨 **Criação de Conteúdo**: Posts, anúncios, relatórios, designs com IA
• 💡 **Insights**: Recomendações personalizadas, análise preditiva, otimização contínua

**Como posso ajudar você hoje?**`

      suggestions = [
        'Analisar performance das campanhas',
        'Criar conteúdo para redes sociais', 
        'Gerar relatório inteligente',
        'Otimizar alocação da equipe',
        'Configurar automações',
        'Prever riscos de projetos'
      ]
      confidence = 100
    }

    return {
      id: messageId,
      type: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: {
        suggestions,
        actions,
        confidence,
        sources: ['Análise de dados históricos', 'Algoritmos de ML', 'Métricas de performance']
      }
    }
  }

  static generateSmartSuggestions(userData: any): SmartSuggestion[] {
    return [
      {
        id: 'optimize-schedule',
        type: 'optimization',
        title: 'Otimizar Cronograma',
        description: 'Identifiquei sobreposições que podem ser ajustadas para melhor fluxo',
        priority: 'high',
        estimated_impact: '20% mais eficiência',
        action: () => toast.info('Abrindo otimizador de cronograma...')
      },
      {
        id: 'automate-reports',
        type: 'automation',
        title: 'Automatizar Relatórios',
        description: 'Configurar envio automático de reports semanais para clientes',
        priority: 'medium',
        estimated_impact: '5h economizadas/semana',
        action: () => toast.info('Configurando automação de relatórios...')
      },
      {
        id: 'balance-workload',
        type: 'insight',
        title: 'Equilibrar Carga de Trabalho',
        description: '2 membros estão sobrecarregados, 1 tem capacidade disponível',
        priority: 'high',
        estimated_impact: '30% redução de stress',
        action: () => toast.info('Abrindo balanceador de equipe...')
      }
    ]
  }
}

// ==================================================
// HOOKS
// ==================================================

function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const { user } = useUser()

  useEffect(() => {
    // Mensagem de boas-vindas
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'assistant',
      content: `Olá, ${user?.name || 'usuário'}! 👋

Sou seu assistente IA especializado em otimização de projetos. Estou aqui para ajudar você a:

• 📊 Analisar performance e identificar gargalos
• 🎯 Otimizar recursos e distribuição de tarefas  
• ⚡ Automatizar processos repetitivos
• 🔮 Prever riscos e sugerir soluções proativas

**Como posso ajudar você hoje?**`,
      timestamp: new Date(),
      metadata: {
        suggestions: [
          'Analisar minha produtividade',
          'Verificar riscos de projetos',
          'Otimizar alocação da equipe'
        ]
      }
    }

    setMessages([welcomeMessage])

    // Gerar sugestões inteligentes
    if (user) {
      const smartSuggestions = AIAssistant.generateSmartSuggestions(user)
      setSuggestions(smartSuggestions)
    }
  }, [user])

  const sendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      const aiResponse = await AIEngine.processMessage(content, user)
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      toast.error('Erro ao processar sua mensagem. Tente novamente.')
    } finally {
      setIsTyping(false)
    }
  }

  const applySuggestion = (suggestion: string) => {
    sendMessage(suggestion)
  }

  return {
    messages,
    isTyping,
    suggestions,
    sendMessage,
    applySuggestion
  }
}

// ==================================================
// COMPONENTES
// ==================================================

function MessageBubble({ message, onApplySuggestion }: { 
  message: ChatMessage
  onApplySuggestion: (suggestion: string) => void 
}) {
  const isUser = message.type === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-[#01b86c] text-white' 
          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block p-3 rounded-lg ${
          isUser 
            ? 'bg-[#01b86c] text-white rounded-br-sm' 
            : 'bg-gray-100 dark:bg-[#1e1e1e]/80 text-gray-900 dark:text-gray-100 rounded-bl-sm'
        }`}>
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
          
          {message.metadata?.confidence && !isUser && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Brain className="h-3 w-3" />
                Confiança: {message.metadata.confidence}%
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {message.timestamp.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>

        {/* Sugestões rápidas */}
        {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.metadata.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onApplySuggestion(suggestion)}
                className="text-xs h-7 hover:text-[#01b86c] hover:border-[#01b86c]/40"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {/* Ações disponíveis */}
        {message.metadata?.actions && message.metadata.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.metadata.actions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                onClick={action.onClick}
                className="bg-[#01b86c] hover:bg-[#01b86c]/90 text-white text-xs h-7 px-3"
              >
                {action.icon}
                <span className="ml-1">{action.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="inline-block p-3 bg-gray-100 dark:bg-[#1e1e1e]/80 rounded-lg rounded-bl-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SmartSuggestionCard({ suggestion }: { suggestion: SmartSuggestion }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="h-4 w-4" />
      case 'automation': return <Zap className="h-4 w-4" />
      case 'insight': return <Lightbulb className="h-4 w-4" />
      case 'action': return <Target className="h-4 w-4" />
      default: return <Sparkles className="h-4 w-4" />
    }
  }

  return (
    <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md hover:scale-105 hover:border-[#01b86c]/40 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            {getTypeIcon(suggestion.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {suggestion.title}
              </h4>
              <Badge className={`text-xs ${getPriorityColor(suggestion.priority)}`}>
                {suggestion.priority === 'high' ? 'Alta' :
                 suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {suggestion.description}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#01b86c] font-medium">
                {suggestion.estimated_impact}
              </span>
              <Button
                size="sm"
                onClick={suggestion.action}
                className="bg-[#01b86c] hover:bg-[#01b86c]/90 text-white text-xs h-7 px-3"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function AIAssistant() {
  const { messages, isTyping, suggestions, sendMessage, applySuggestion } = useAIChat()
  const [inputMessage, setInputMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim())
      setInputMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="space-y-6">
      {/* Sugestões Inteligentes */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Sugestões Inteligentes
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                {suggestions.length} insights
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((suggestion) => (
                <SmartSuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Assistente IA
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Online
              </Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:text-[#01b86c] hover:border-[#01b86c]/40"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`space-y-4 ${isExpanded ? 'h-[600px]' : 'h-[400px]'} flex flex-col`}>
            {/* Mensagens */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageBubble 
                    key={message.id} 
                    message={message} 
                    onApplySuggestion={applySuggestion}
                  />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Faça uma pergunta sobre produtividade, projetos ou otimização..."
                className="min-h-[44px] max-h-[120px] resize-none"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-[#01b86c] hover:bg-[#01b86c]/90 text-white px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacidades do Assistente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Capacidades do Assistente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AIEngine.capabilities.map((capability) => (
              <div
                key={capability.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#01b86c]/40 transition-colors cursor-pointer"
                onClick={() => applySuggestion(capability.examples[0])}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    {capability.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {capability.name}
                  </h4>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {capability.description}
                </p>
                
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Exemplos:
                  </div>
                  {capability.examples.slice(0, 2).map((example, index) => (
                    <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                      • {example}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}