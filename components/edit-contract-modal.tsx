"use client"

import React, { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Loader2, User, DollarSign, FileText, Save } from 'lucide-react'
import { toast } from 'sonner'

interface EditContractModalProps {
  isOpen: boolean
  onClose: () => void
  onContractUpdated: () => void
  contract: Contract | null
}

interface Contract {
  id: string
  name: string
  email: string
  company: string
  phone?: string
  position?: string
  website?: string
  address?: string
  notes?: string
  contract_value: number
  contract_duration: number
  contract_start_date: string
  contract_end_date?: string
  payment_frequency: string
  contract_currency: string
  status: string
  created_at: string
}

const supabase = supabaseBrowser()

export function EditContractModal({ isOpen, onClose, onContractUpdated, contract }: EditContractModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('client')
  const [formData, setFormData] = useState({
    // Informações do Cliente
    name: '',
    email: '',
    company: '',
    phone: '',
    position: '',
    website: '',
    address: '',
    notes: '',
    status: 'active',
    // Informações Financeiras
    contract_value: '',
    contract_duration: '',
    contract_start_date: '',
    payment_frequency: 'monthly',
    contract_currency: 'BRL'
  })

  const { user } = useUser()

  // Preencher formulário quando contrato for selecionado
  useEffect(() => {
    if (contract) {
      setFormData({
        name: contract.name || '',
        email: contract.email || '',
        company: contract.company || '',
        phone: contract.phone || '',
        position: contract.position || '',
        website: contract.website || '',
        address: contract.address || '',
        notes: contract.notes || '',
        status: contract.status || 'active',
        contract_value: contract.contract_value?.toString() || '',
        contract_duration: contract.contract_duration?.toString() || '',
        contract_start_date: contract.contract_start_date || '',
        payment_frequency: contract.payment_frequency || 'monthly',
        contract_currency: contract.contract_currency || 'BRL'
      })
    }
  }, [contract])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contract) return

    // Validações básicas
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      setActiveTab('client')
      return
    }

    if (!formData.email.trim()) {
      toast.error('Email é obrigatório')
      setActiveTab('client')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido')
      setActiveTab('client')
      return
    }

    if (!formData.contract_value || parseFloat(formData.contract_value) <= 0) {
      toast.error('Valor do contrato deve ser maior que zero')
      setActiveTab('contract')
      return
    }

    if (!formData.contract_duration || parseInt(formData.contract_duration) <= 0) {
      toast.error('Duração do contrato deve ser maior que zero')
      setActiveTab('contract')
      return
    }

    setLoading(true)

    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        company: formData.company.trim() || null,
        phone: formData.phone.trim() || null,
        position: formData.position.trim() || null,
        website: formData.website.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        status: formData.status,
        contract_value: parseFloat(formData.contract_value),
        contract_duration: parseInt(formData.contract_duration),
        contract_start_date: formData.contract_start_date || null,
        payment_frequency: formData.payment_frequency,
        contract_currency: formData.contract_currency,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', contract.id)

      if (error) {
        console.error('Erro ao atualizar contrato:', error)
        toast.error(`Erro ao atualizar: ${error.message}`)
        return
      }

      toast.success('Contrato atualizado com sucesso!')
      onContractUpdated()
      onClose()
      resetForm()

    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro inesperado ao atualizar contrato')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      position: '',
      website: '',
      address: '',
      notes: '',
      status: 'active',
      contract_value: '',
      contract_duration: '',
      contract_start_date: '',
      payment_frequency: 'monthly',
      contract_currency: 'BRL'
    })
    setActiveTab('client')
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      resetForm()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Editar Contrato
          </DialogTitle>
          <DialogDescription>
            Edite as informações do cliente e dados do contrato. As alterações serão salvas imediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações do Cliente
              </TabsTrigger>
              <TabsTrigger value="contract" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Dados do Contrato
              </TabsTrigger>
            </TabsList>

            {/* Tab Informações do Cliente */}
            <TabsContent value="client" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Empresa *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="Nome da empresa"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="name">Responsável *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Nome do responsável"
                    disabled={loading}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@empresa.com"
                    disabled={loading}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    placeholder="Ex: CEO, Gerente"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://empresa.com"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Rua, número, cidade"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)} disabled={loading}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Informações adicionais sobre o cliente..."
                  rows={3}
                  disabled={loading}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            {/* Tab Dados do Contrato */}
            <TabsContent value="contract" className="space-y-4 mt-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2 mb-4">
                  💰 Informações Financeiras
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contract_value">Valor do Contrato *</Label>
                    <Input
                      id="contract_value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.contract_value}
                      onChange={(e) => handleChange('contract_value', e.target.value)}
                      placeholder="0.00"
                      disabled={loading}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contract_duration">Duração (meses) *</Label>
                    <Input
                      id="contract_duration"
                      type="number"
                      min="1"
                      value={formData.contract_duration}
                      onChange={(e) => handleChange('contract_duration', e.target.value)}
                      placeholder="12"
                      disabled={loading}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="contract_start_date">Data de Início</Label>
                    <Input
                      id="contract_start_date"
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) => handleChange('contract_start_date', e.target.value)}
                      disabled={loading}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="payment_frequency">Frequência de Pagamento</Label>
                    <Select value={formData.payment_frequency} onValueChange={(value) => handleChange('payment_frequency', value)} disabled={loading}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                        <SelectItem value="one-time">Pagamento Único</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="contract_currency">Moeda</Label>
                    <Select value={formData.contract_currency} onValueChange={(value) => handleChange('contract_currency', value)} disabled={loading}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione a moeda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real (R$)</SelectItem>
                        <SelectItem value="USD">Dólar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.email.trim() || !formData.contract_value}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}