"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Key, RefreshCw, Trash2, Eye, EyeOff } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/components/ui/use-toast';

interface SocialMediaKey {
  id: string;
  platform: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PlatformConfig {
  name: string;
  icon: string;
  description: string;
  fields: {
    name: keyof KeyFormData;
    label: string;
    type: 'text' | 'password';
    placeholder: string;
    required: boolean;
  }[];
  docUrl?: string;
}

interface KeyFormData {
  api_key: string;
  access_token: string;
  refresh_token: string;
  app_id: string;
  app_secret: string;
}

const PLATFORMS: Record<string, PlatformConfig> = {
  instagram: {
    name: 'Instagram',
    icon: '📷',
    description: 'Conecte sua conta do Instagram para agendar posts e obter insights',
    fields: [
      { name: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Cole seu access token aqui', required: true },
      { name: 'app_id', label: 'App ID', type: 'text', placeholder: 'ID da aplicação Facebook', required: false },
      { name: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'Secret da aplicação Facebook', required: false }
    ],
    docUrl: 'https://developers.facebook.com/docs/instagram-basic-display-api'
  },
  facebook: {
    name: 'Facebook',
    icon: '👤',
    description: 'Conecte sua página do Facebook para gerenciar posts e campanhas',
    fields: [
      { name: 'access_token', label: 'Page Access Token', type: 'password', placeholder: 'Token de acesso da página', required: true },
      { name: 'app_id', label: 'App ID', type: 'text', placeholder: 'ID da aplicação Facebook', required: false },
      { name: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'Secret da aplicação Facebook', required: false }
    ],
    docUrl: 'https://developers.facebook.com/docs/pages/access-tokens'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    description: 'Conecte sua empresa no LinkedIn para posts profissionais',
    fields: [
      { name: 'access_token', label: 'Access Token', type: 'password', placeholder: 'LinkedIn access token', required: true },
      { name: 'app_id', label: 'Client ID', type: 'text', placeholder: 'LinkedIn Client ID', required: false },
      { name: 'app_secret', label: 'Client Secret', type: 'password', placeholder: 'LinkedIn Client Secret', required: false }
    ],
    docUrl: 'https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow'
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    description: 'Conecte sua conta TikTok Business para agendar vídeos',
    fields: [
      { name: 'access_token', label: 'Access Token', type: 'password', placeholder: 'TikTok access token', required: true },
      { name: 'app_id', label: 'App ID', type: 'text', placeholder: 'TikTok App ID', required: false },
      { name: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'TikTok App Secret', required: false }
    ],
    docUrl: 'https://developers.tiktok.com/doc/content-posting-api-get-started'
  },
  google_ads: {
    name: 'Google Ads',
    icon: '🎯',
    description: 'Conecte sua conta Google Ads para gerenciar campanhas',
    fields: [
      { name: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Google Ads access token', required: true },
      { name: 'refresh_token', label: 'Refresh Token', type: 'password', placeholder: 'Google refresh token', required: false },
      { name: 'app_id', label: 'Client ID', type: 'text', placeholder: 'Google Client ID', required: false },
      { name: 'app_secret', label: 'Client Secret', type: 'password', placeholder: 'Google Client Secret', required: false }
    ],
    docUrl: 'https://developers.google.com/google-ads/api/docs/oauth/overview'
  },
  meta_ads: {
    name: 'Meta Ads',
    icon: '📊',
    description: 'Conecte sua conta Meta Business para gerenciar anúncios',
    fields: [
      { name: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Meta Business access token', required: true },
      { name: 'app_id', label: 'App ID', type: 'text', placeholder: 'Meta App ID', required: false },
      { name: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'Meta App Secret', required: false }
    ],
    docUrl: 'https://developers.facebook.com/docs/marketing-api'
  },
  rd_station: {
    name: 'RD Station',
    icon: '🚀',
    description: 'Conecte sua conta RD Station para automação de marketing',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', placeholder: 'Sua chave de API do RD Station', required: true },
      { name: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Token de acesso (opcional)', required: false }
    ],
    docUrl: 'https://developers.rdstation.com/reference/authentication'
  }
};

export default function SocialMediaSettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [keys, setKeys] = useState<SocialMediaKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, KeyFormData>>({});

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/social-media-keys');
      if (response.ok) {
        const data = await response.json();
        setKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Error fetching keys:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async (platform: string) => {
    setSaving(platform);
    
    try {
      const data = formData[platform] || {};
      
      const response = await fetch('/api/social-media-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          ...data
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Configuração do ${PLATFORMS[platform].name} salva com sucesso`,
        });
        
        // Reset form
        setFormData(prev => ({
          ...prev,
          [platform]: {
            api_key: '',
            access_token: '',
            refresh_token: '',
            app_id: '',
            app_secret: ''
          }
        }));
        
        await fetchKeys();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao salvar');
      }
    } catch (error) {
      console.error('Error saving key:', error);
      toast({
        title: "Erro",
        description: `Falha ao salvar configuração do ${PLATFORMS[platform].name}`,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteKey = async (platform: string) => {
    try {
      const response = await fetch(`/api/social-media-keys?platform=${platform}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Configuração do ${PLATFORMS[platform].name} removida`,
        });
        await fetchKeys();
      } else {
        throw new Error('Falha ao remover');
      }
    } catch (error) {
      console.error('Error deleting key:', error);
      toast({
        title: "Erro",
        description: `Falha ao remover configuração do ${PLATFORMS[platform].name}`,
        variant: "destructive",
      });
    }
  };

  const updateFormData = (platform: string, field: keyof KeyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform] || {
          api_key: '',
          access_token: '',
          refresh_token: '',
          app_id: '',
          app_secret: ''
        },
        [field]: value
      }
    }));
  };

  const toggleTokenVisibility = (key: string) => {
    setShowTokens(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isKeyConfigured = (platform: string) => {
    return keys.some(key => key.platform === platform && key.is_active);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações de Social Media</h1>
        <p className="text-muted-foreground">
          Configure suas chaves de API para conectar com redes sociais e ferramentas de marketing
        </p>
      </div>

      <Tabs defaultValue="social" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="social">Redes Sociais</TabsTrigger>
          <TabsTrigger value="ads">Anúncios</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="social" className="space-y-6">
          <div className="grid gap-6">
            {['instagram', 'facebook', 'linkedin', 'tiktok'].map((platform) => (
              <PlatformCard
                key={platform}
                platform={platform}
                config={PLATFORMS[platform]}
                isConfigured={isKeyConfigured(platform)}
                formData={formData[platform] || {
                  api_key: '',
                  access_token: '',
                  refresh_token: '',
                  app_id: '',
                  app_secret: ''
                }}
                showTokens={showTokens}
                saving={saving === platform}
                onUpdateField={(field, value) => updateFormData(platform, field, value)}
                onSave={() => handleSaveKey(platform)}
                onDelete={() => handleDeleteKey(platform)}
                onToggleVisibility={toggleTokenVisibility}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ads" className="space-y-6">
          <div className="grid gap-6">
            {['google_ads', 'meta_ads'].map((platform) => (
              <PlatformCard
                key={platform}
                platform={platform}
                config={PLATFORMS[platform]}
                isConfigured={isKeyConfigured(platform)}
                formData={formData[platform] || {
                  api_key: '',
                  access_token: '',
                  refresh_token: '',
                  app_id: '',
                  app_secret: ''
                }}
                showTokens={showTokens}
                saving={saving === platform}
                onUpdateField={(field, value) => updateFormData(platform, field, value)}
                onSave={() => handleSaveKey(platform)}
                onDelete={() => handleDeleteKey(platform)}
                onToggleVisibility={toggleTokenVisibility}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <div className="grid gap-6">
            {['rd_station'].map((platform) => (
              <PlatformCard
                key={platform}
                platform={platform}
                config={PLATFORMS[platform]}
                isConfigured={isKeyConfigured(platform)}
                formData={formData[platform] || {
                  api_key: '',
                  access_token: '',
                  refresh_token: '',
                  app_id: '',
                  app_secret: ''
                }}
                showTokens={showTokens}
                saving={saving === platform}
                onUpdateField={(field, value) => updateFormData(platform, field, value)}
                onSave={() => handleSaveKey(platform)}
                onDelete={() => handleDeleteKey(platform)}
                onToggleVisibility={toggleTokenVisibility}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PlatformCardProps {
  platform: string;
  config: PlatformConfig;
  isConfigured: boolean;
  formData: KeyFormData;
  showTokens: Record<string, boolean>;
  saving: boolean;
  onUpdateField: (field: keyof KeyFormData, value: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onToggleVisibility: (key: string) => void;
}

function PlatformCard({
  platform,
  config,
  isConfigured,
  formData,
  showTokens,
  saving,
  onUpdateField,
  onSave,
  onDelete,
  onToggleVisibility
}: PlatformCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <CardTitle className="flex items-center space-x-2">
                {config.name}
                {isConfigured && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
          </div>
          
          {isConfigured && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {config.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={`${platform}-${field.name}`}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id={`${platform}-${field.name}`}
                  type={field.type === 'password' && !showTokens[`${platform}-${field.name}`] ? 'password' : 'text'}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => onUpdateField(field.name, e.target.value)}
                />
                {field.type === 'password' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => onToggleVisibility(`${platform}-${field.name}`)}
                  >
                    {showTokens[`${platform}-${field.name}`] ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Key className="h-4 w-4" />
            <span>Suas chaves são criptografadas e seguras</span>
          </div>
          
          <div className="flex space-x-2">
            {config.docUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={config.docUrl} target="_blank" rel="noopener noreferrer">
                  Documentação
                </a>
              </Button>
            )}
            
            <Button 
              onClick={onSave} 
              disabled={saving}
              size="sm"
            >
              {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {isConfigured ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}