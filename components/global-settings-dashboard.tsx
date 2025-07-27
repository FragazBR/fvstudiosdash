'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Settings,
  Save,
  RefreshCw,
  History,
  Template,
  Eye,
  EyeOff,
  Globe,
  Building,
  Search,
  Filter,
  Plus,
  Trash2,
  Copy,
  Upload,
  Download
} from 'lucide-react'

interface GlobalSetting {
  key: string
  value: any
  category: string
  description?: string
  data_type: string
  is_public: boolean
  is_encrypted: boolean
}

interface AgencySetting {
  key: string
  value: any
  category: string
  description?: string
  data_type: string
  is_encrypted: boolean
}

interface SettingsHistory {
  id: string
  key: string
  old_value?: any
  new_value: any
  change_reason: string
  changed_at: string
  changed_by_user?: {
    name: string
    email: string
  }
}

interface SettingsTemplate {
  id: string
  name: string
  description?: string
  category: string
  template_data: any
  is_default: boolean
}

export default function GlobalSettingsDashboard() {
  const [activeTab, setActiveTab] = useState('global')
  const [globalSettings, setGlobalSettings] = useState<Record<string, GlobalSetting>>({})
  const [agencySettings, setAgencySettings] = useState<Record<string, AgencySetting>>({})
  const [history, setHistory] = useState<SettingsHistory[]>([])
  const [templates, setTemplates] = useState<SettingsTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showValues, setShowValues] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<string>('')

  // Novos estados para edição
  const [editingKey, setEditingKey] = useState<string>('')
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    category: 'system',
    description: '',
    data_type: 'string',
    is_public: false,
    is_encrypted: false
  })

  const categories = [
    'system', 'email', 'notifications', 'integrations', 'security',
    'billing', 'features', 'limits', 'ui', 'analytics', 'branding', 'workflows'
  ]

  const dataTypes = [
    'string', 'number', 'boolean', 'json', 'array', 'url', 'email'
  ]

  useEffect(() => {
    loadData()
  }, [activeTab, selectedAgency])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('supabase-token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      if (activeTab === 'global') {
        // Carregar configurações globais
        const response = await fetch('/api/settings/global', { headers })
        if (response.ok) {
          const data = await response.json()
          setGlobalSettings(data.settings)
        }
      } else if (activeTab === 'agency') {
        // Carregar configurações da agência
        const url = selectedAgency 
          ? `/api/settings/agency?agency_id=${selectedAgency}`
          : '/api/settings/agency'
        const response = await fetch(url, { headers })
        if (response.ok) {
          const data = await response.json()
          setAgencySettings(data.settings)
        }
      } else if (activeTab === 'history') {
        // Carregar histórico
        const params = new URLSearchParams()
        if (selectedAgency) params.append('agency_id', selectedAgency)
        params.append('limit', '100')

        const response = await fetch(`/api/settings/history?${params}`, { headers })
        if (response.ok) {
          const data = await response.json()
          setHistory(data.history)
        }
      } else if (activeTab === 'templates') {
        // Carregar templates
        const response = await fetch('/api/settings/templates', { headers })
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.templates)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const saveSetting = async (key: string, value: any, isGlobal = true) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('supabase-token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const endpoint = isGlobal ? '/api/settings/global' : '/api/settings/agency'
      const body = isGlobal 
        ? { key, value, ...globalSettings[key] }
        : { key, value, agency_id: selectedAgency, ...agencySettings[key] }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success('Configuração salva com sucesso')
        await loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar configuração')
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  const createNewSetting = async () => {
    if (!newSetting.key || newSetting.value === '') {
      toast.error('Chave e valor são obrigatórios')
      return
    }

    await saveSetting(newSetting.key, newSetting.value, activeTab === 'global')
    setNewSetting({
      key: '',
      value: '',
      category: 'system',
      description: '',
      data_type: 'string',
      is_public: false,
      is_encrypted: false
    })
  }

  const deleteSetting = async (key: string, isGlobal = true) => {
    if (!confirm('Tem certeza que deseja deletar esta configuração?')) return

    try {
      const token = localStorage.getItem('supabase-token')
      const headers = {
        'Authorization': `Bearer ${token}`
      }

      const endpoint = isGlobal 
        ? `/api/settings/global?key=${key}`
        : `/api/settings/agency?key=${key}&agency_id=${selectedAgency}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers
      })

      if (response.ok) {
        toast.success('Configuração deletada com sucesso')
        await loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao deletar configuração')
      }
    } catch (error) {
      console.error('Erro ao deletar configuração:', error)
      toast.error('Erro ao deletar configuração')
    }
  }

  const applyTemplate = async (templateId: string) => {
    try {
      const token = localStorage.getItem('supabase-token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch('/api/settings/templates/apply', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          template_id: templateId,
          agency_id: activeTab === 'agency' ? selectedAgency : undefined,
          scope: activeTab === 'global' ? 'global' : 'agency'
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Template "${data.template.name}" aplicado com sucesso`)
        await loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao aplicar template')
      }
    } catch (error) {
      console.error('Erro ao aplicar template:', error)
      toast.error('Erro ao aplicar template')
    }
  }

  const filteredSettings = (settings: Record<string, any>) => {
    return Object.entries(settings).filter(([key, setting]) => {
      const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           setting.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || setting.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }

  const formatValue = (value: any, dataType: string) => {
    if (value === null || value === undefined) return 'null'
    
    switch (dataType) {
      case 'boolean':
        return value ? 'true' : 'false'
      case 'json':
      case 'array':
        return JSON.stringify(value, null, 2)
      default:
        return String(value)
    }
  }

  const parseValue = (value: string, dataType: string) => {
    try {
      switch (dataType) {
        case 'boolean':
          return value === 'true'
        case 'number':
          return parseFloat(value)
        case 'json':
        case 'array':
          return JSON.parse(value)
        default:
          return value
      }
    } catch {
      return value
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Carregando configurações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Settings className="h-8 w-8 mr-3" />
            Configurações Globais
          </h1>
          <p className="text-muted-foreground">
            Gerenciar configurações do sistema e agências
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowValues(!showValues)}
          >
            {showValues ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showValues ? 'Ocultar' : 'Mostrar'} Valores
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar configurações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="global" className="flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            Global
          </TabsTrigger>
          <TabsTrigger value="agency" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Agência
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <History className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center">
            <Template className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Global Settings */}
        <TabsContent value="global" className="space-y-6">
          {/* New Setting Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Nova Configuração Global
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="new-key">Chave</Label>
                  <Input
                    id="new-key"
                    value={newSetting.key}
                    onChange={(e) => setNewSetting({...newSetting, key: e.target.value})}
                    placeholder="ex: system.feature_enabled"
                  />
                </div>
                <div>
                  <Label htmlFor="new-category">Categoria</Label>
                  <Select value={newSetting.category} onValueChange={(value) => setNewSetting({...newSetting, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-type">Tipo</Label>
                  <Select value={newSetting.data_type} onValueChange={(value) => setNewSetting({...newSetting, data_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dataTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="new-value">Valor</Label>
                <Input
                  id="new-value"
                  value={newSetting.value}
                  onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                  placeholder="Valor da configuração"
                />
              </div>
              <div>
                <Label htmlFor="new-description">Descrição</Label>
                <Textarea
                  id="new-description"
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
                  placeholder="Descrição da configuração"
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newSetting.is_public}
                    onCheckedChange={(checked) => setNewSetting({...newSetting, is_public: checked})}
                  />
                  <Label>Público</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newSetting.is_encrypted}
                    onCheckedChange={(checked) => setNewSetting({...newSetting, is_encrypted: checked})}
                  />
                  <Label>Criptografado</Label>
                </div>
              </div>
              <Button onClick={createNewSetting} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Criar Configuração
              </Button>
            </CardContent>
          </Card>

          {/* Global Settings List */}
          <div className="space-y-4">
            {filteredSettings(globalSettings).map(([key, setting]) => (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{key}</CardTitle>
                      {setting.description && (
                        <CardDescription>{setting.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{setting.category}</Badge>
                      <Badge variant="secondary">{setting.data_type}</Badge>
                      {setting.is_public && <Badge variant="default">Público</Badge>}
                      {setting.is_encrypted && <Badge variant="destructive">Criptografado</Badge>}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSetting(key, true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {showValues && (
                  <CardContent>
                    <div className="space-y-2">
                      <Label>Valor:</Label>
                      {editingKey === key ? (
                        <div className="flex space-x-2">
                          <Input
                            value={formatValue(setting.value, setting.data_type)}
                            onChange={(e) => {
                              const newValue = parseValue(e.target.value, setting.data_type)
                              setGlobalSettings({
                                ...globalSettings,
                                [key]: { ...setting, value: newValue }
                              })
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              saveSetting(key, setting.value, true)
                              setEditingKey('')
                            }}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingKey('')}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 p-2 bg-muted rounded text-sm">
                            {formatValue(setting.value, setting.data_type)}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingKey(key)}
                          >
                            Editar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Agency Settings */}
        <TabsContent value="agency" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Label>Agência:</Label>
                <Input
                  placeholder="ID da Agência (deixe vazio para usar sua agência)"
                  value={selectedAgency}
                  onChange={(e) => setSelectedAgency(e.target.value)}
                  className="max-w-md"
                />
                <Button onClick={loadData} size="sm">
                  Carregar
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredSettings(agencySettings).map(([key, setting]) => (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{key}</CardTitle>
                      {setting.description && (
                        <CardDescription>{setting.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{setting.category}</Badge>
                      <Badge variant="secondary">{setting.data_type}</Badge>
                      {setting.is_encrypted && <Badge variant="destructive">Criptografado</Badge>}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSetting(key, false)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {showValues && (
                  <CardContent>
                    <div className="space-y-2">
                      <Label>Valor:</Label>
                      <code className="block p-2 bg-muted rounded text-sm">
                        {formatValue(setting.value, setting.data_type)}
                      </code>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-6">
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.key}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {new Date(item.changed_at).toLocaleString('pt-BR')}
                      </Badge>
                      {item.changed_by_user && (
                        <Badge variant="secondary">
                          {item.changed_by_user.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{item.change_reason}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Valor Anterior:</Label>
                      <code className="block p-2 bg-muted rounded text-sm mt-1">
                        {item.old_value ? JSON.stringify(item.old_value, null, 2) : 'null'}
                      </code>
                    </div>
                    <div>
                      <Label>Novo Valor:</Label>
                      <code className="block p-2 bg-muted rounded text-sm mt-1">
                        {JSON.stringify(item.new_value, null, 2)}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6">
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {template.name}
                        {template.is_default && (
                          <Badge variant="default" className="ml-2">Default</Badge>
                        )}
                      </CardTitle>
                      {template.description && (
                        <CardDescription>{template.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{template.category}</Badge>
                      <Button
                        size="sm"
                        onClick={() => applyTemplate(template.id)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Configurações do Template:</Label>
                    <code className="block p-2 bg-muted rounded text-sm mt-1">
                      {JSON.stringify(template.template_data, null, 2)}
                    </code>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}