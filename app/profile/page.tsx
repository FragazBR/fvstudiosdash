'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useUser } from '@/hooks/useUser'
import { DepartmentSelector } from '@/components/department-selector'
import {
  User,
  Mail,
  Phone,
  Building2,
  Camera,
  Save,
  Shield,
  Calendar,
  MapPin,
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react'

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  department_id?: string;
  specialization_id?: string;
  location?: string;
  website?: string;
}

function ProfileContent() {
  const { user, refreshUser } = useUser()
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  
  // Profile form data
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    avatar_url: '',
    department_id: '',
    specialization_id: '',
    location: '',
    website: ''
  })

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || '',
        department_id: user.department_id || '',
        specialization_id: user.specialization_id || '',
        location: user.location || '',
        website: user.website || ''
      })
    }
  }, [user])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro no upload",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "Por favor, selecione uma imagem menor que 5MB.",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      // Create FormData
      const formData = new FormData()
      formData.append('avatar', file)

      // Upload to server
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        handleInputChange('avatar_url', result.url)
        
        toast({
          title: "Avatar atualizado!",
          description: "Sua foto de perfil foi atualizada com sucesso."
        })
      } else {
        throw new Error('Failed to upload avatar')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload do avatar. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        await refreshUser() // Refresh user data in context
        
        toast({
          title: "Perfil atualizado!",
          description: "Suas informações foram salvas com sucesso."
        })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e confirmação devem ser iguais.",
        variant: "destructive"
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordSection(false)
        
        toast({
          title: "Senha alterada!",
          description: "Sua senha foi atualizada com sucesso."
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to change password')
      }
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar a senha. Verifique sua senha atual.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrador',
      'agency_owner': 'Dono da Agência',
      'agency_manager': 'Gerente',
      'agency_staff': 'Colaborador',
      'independent_producer': 'Produtor Independente',
      'agency_client': 'Cliente',
      'influencer': 'Influenciador',
      'free_user': 'Usuário Gratuito'
    }
    return roleMap[role] || role
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name="Meu Perfil"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <User className="h-8 w-8 text-blue-500" />
                Meu Perfil
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gerencie suas informações pessoais e configurações de conta
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Picture & Basic Info */}
              <div className="space-y-6">
                <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Foto de Perfil</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={profileData.avatar_url} alt={profileData.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-2xl">
                            {profileData.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <label className="absolute -bottom-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer transition-colors">
                          <Camera className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={loading}
                          />
                        </label>
                      </div>
                      
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {user?.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Role & Department Info */}
                <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Informações do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Função</Label>
                      <Badge className="mt-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {getRoleDisplayName(user?.role || '')}
                      </Badge>
                    </div>
                    
                    {user?.created_at && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Membro desde</Label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(user.created_at).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Profile Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Edit3 className="h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Nome Completo
                        </Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Seu nome completo"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="seu@email.com"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="location" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Localização
                        </Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="São Paulo, Brasil"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://seusite.com"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Biografia</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Conte um pouco sobre você..."
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    {/* Department Selector */}
                    <div>
                      <Label>Departamento e Especialização</Label>
                      <div className="mt-1">
                        <DepartmentSelector
                          departmentId={profileData.department_id}
                          specializationId={profileData.specialization_id}
                          onDepartmentChange={(deptId) => handleInputChange('department_id', deptId)}
                          onSpecializationChange={(specId) => handleInputChange('specialization_id', specId)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Salvando...' : 'Salvar Perfil'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Password Section */}
                <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Segurança
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPasswordSection(!showPasswordSection)}
                      >
                        {showPasswordSection ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Alterar Senha
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {showPasswordSection && (
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Senha Atual</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          placeholder="Digite sua senha atual"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          placeholder="Digite a nova senha"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          placeholder="Confirme a nova senha"
                          className="mt-1"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          onClick={handleChangePassword}
                          disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {saving ? 'Alterando...' : 'Alterar Senha'}
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return <ProfileContent />
}