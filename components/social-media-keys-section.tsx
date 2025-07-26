"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Key, RefreshCw, Trash2, Eye, EyeOff, MessageCircle } from 'lucide-react';
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
    description: 'Conecte sua conta do Instagram para agendar posts',
    fields: [
      { name: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Cole seu access token aqui', required: true }
    ],
    docUrl: 'https://developers.facebook.com/docs/instagram-basic-display-api'
  },
  facebook: {
    name: 'Facebook',
    icon: '👤',
    description: 'Conecte sua página do Facebook para gerenciar posts',
    fields: [
      { name: 'access_token', label: 'Page Access Token', type: 'password', placeholder: 'Token de acesso da página', required: true }
    ],
    docUrl: 'https://developers.facebook.com/docs/pages/access-tokens'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    description: 'Conecte sua empresa no LinkedIn para posts profissionais',
    fields: [
      { name: 'access_token', label: 'Access Token', type: 'password', placeholder: 'LinkedIn access token', required: true }
    ],
    docUrl: 'https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow'
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    description: 'Conecte sua conta TikTok Business para agendar vídeos',
    fields: [
      { name: 'access_token', label: 'Access Token', type: 'password', placeholder: 'TikTok access token', required: true }
    ],
    docUrl: 'https://developers.tiktok.com/doc/content-posting-api-get-started'
  }
};

export function SocialMediaKeysSection() {
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
      <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Redes Sociais
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure suas chaves de API para conectar com suas redes sociais
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(PLATFORMS).map(([platform, config]) => (
            <div key={platform} className="border border-gray-200 dark:border-[#272727] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{config.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                      {config.name}
                      {isKeyConfigured(platform) && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configurado
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{config.description}</p>
                  </div>
                </div>
                
                {isKeyConfigured(platform) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteKey(platform)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {config.fields.map((field) => (
                  <div key={field.name}>
                    <Label htmlFor={`${platform}-${field.name}`} className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id={`${platform}-${field.name}`}
                        type={field.type === 'password' && !showTokens[`${platform}-${field.name}`] ? 'password' : 'text'}
                        placeholder={field.placeholder}
                        value={formData[platform]?.[field.name] || ''}
                        onChange={(e) => updateFormData(platform, field.name, e.target.value)}
                        className="pr-10"
                      />
                      {field.type === 'password' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => toggleTokenVisibility(`${platform}-${field.name}`)}
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

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-[#272727]">
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <Key className="h-3 w-3" />
                  <span>Suas chaves são criptografadas</span>
                </div>
                
                <div className="flex space-x-2">
                  {config.docUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={config.docUrl} target="_blank" rel="noopener noreferrer">
                        Ajuda
                      </a>
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => handleSaveKey(platform)} 
                    disabled={saving === platform}
                    size="sm"
                  >
                    {saving === platform && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    {isKeyConfigured(platform) ? 'Atualizar' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">Como obter suas chaves de API</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Para cada rede social, você precisará criar uma aplicação ou usar as ferramentas de desenvolvedor da plataforma. 
                Clique em "Ajuda" ao lado de cada rede social para ver a documentação oficial.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}