"use client";

import React, { useState } from 'react';
import { PermissionGuard } from "@/components/permission-guard";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/Shared/Topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Trash2, 
  Shield, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Database,
  Users,
  Building2,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';

interface CleanupResult {
  success: boolean;
  message: string;
  summary?: {
    users_deleted: number;
    total_users_found: number;
    errors_count: number;
    errors: string[];
    remaining_admin: string;
  };
}

function SystemCleanupContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const router = useRouter();

  const handleCleanup = async () => {
    if (confirmation !== 'DELETE_ALL_USERS_EXCEPT_ADMIN') {
      toast.error('Confirmação incorreta. Digite exatamente: DELETE_ALL_USERS_EXCEPT_ADMIN');
      return;
    }

    if (!confirm('⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nTodos os usuários (exceto franco@fvstudios.com.br) serão PERMANENTEMENTE excluídos do sistema.\n\nTodas as agências, assinaturas e dados relacionados serão removidos.\n\nDeseja continuar?')) {
      return;
    }

    if (!confirm('🚨 ÚLTIMA CONFIRMAÇÃO:\n\nVocê tem CERTEZA ABSOLUTA de que deseja excluir TODOS os dados de teste?\n\nEsta ação NÃO PODE ser desfeita!\n\nClique OK apenas se tiver certeza.')) {
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setShowResult(false);

    try {
      const response = await fetch('/api/admin/system/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm: 'DELETE_ALL_USERS_EXCEPT_ADMIN'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setShowResult(true);
        toast.success('Limpeza do sistema concluída!');
        setConfirmation(''); // Limpar campo
      } else {
        toast.error('Erro na limpeza: ' + data.error);
        setResult({ success: false, message: data.error });
        setShowResult(true);
      }
    } catch (error: any) {
      console.error('Erro na limpeza:', error);
      toast.error('Erro de conexão: ' + error.message);
      setResult({ success: false, message: 'Erro de conexão: ' + error.message });
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#fafafa] dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex pt-16">
        <Topbar
          name="Limpeza do Sistema"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="p-3 lg:p-6 w-full">
          <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin')}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Admin
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Database className="w-8 h-8 mr-3 text-red-600" />
                    Limpeza do Sistema
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Remover todos os dados de teste e preparar para produção
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Alert */}
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>⚠️ OPERAÇÃO PERIGOSA:</strong> Esta ação irá excluir PERMANENTEMENTE todos os usuários, 
                agências e dados relacionados, mantendo apenas o usuário admin principal (franco@fvstudios.com.br).
                <br /><br />
                <strong>Esta ação é IRREVERSÍVEL!</strong>
              </AlertDescription>
            </Alert>

            {/* What will be deleted */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center">
                  <Trash2 className="w-5 h-5 mr-2" />
                  O que será removido:
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-red-500" />
                    <span>Todos os usuários (exceto admin principal)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-red-500" />
                    <span>Todas as agências criadas por outros usuários</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-red-500" />
                    <span>Todas as assinaturas e planos ativos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Todos os convites pendentes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What will be kept */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-200 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  O que será mantido:
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Usuário admin: franco@fvstudios.com.br</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Todas as configurações do sistema</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Planos de assinatura padrão</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Políticas RLS e configurações de segurança</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cleanup Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Executar Limpeza</CardTitle>
                <CardDescription>
                  Para executar a limpeza, digite exatamente: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">DELETE_ALL_USERS_EXCEPT_ADMIN</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="confirmation">Confirmação</Label>
                  <Input
                    id="confirmation"
                    type="text"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="DELETE_ALL_USERS_EXCEPT_ADMIN"
                    className="font-mono"
                    disabled={isProcessing}
                  />
                </div>

                <Button
                  onClick={handleCleanup}
                  disabled={confirmation !== 'DELETE_ALL_USERS_EXCEPT_ADMIN' || isProcessing}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executando limpeza...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Executar Limpeza do Sistema
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {showResult && result && (
              <Card className={`border-2 ${result.success ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center ${result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 mr-2" />
                    )}
                    {result.success ? 'Limpeza Concluída' : 'Erro na Limpeza'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className={result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                    {result.message}
                  </p>

                  {result.summary && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Resumo da operação:</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Usuários encontrados</Label>
                          <Badge variant="secondary">{result.summary.total_users_found}</Badge>
                        </div>
                        <div>
                          <Label>Usuários excluídos</Label>
                          <Badge variant={result.summary.users_deleted === result.summary.total_users_found ? "default" : "destructive"}>
                            {result.summary.users_deleted}
                          </Badge>
                        </div>
                        <div>
                          <Label>Erros</Label>
                          <Badge variant={result.summary.errors_count === 0 ? "default" : "destructive"}>
                            {result.summary.errors_count}
                          </Badge>
                        </div>
                        <div>
                          <Label>Admin mantido</Label>
                          <Badge variant="default">{result.summary.remaining_admin}</Badge>
                        </div>
                      </div>

                      {result.summary.errors && result.summary.errors.length > 0 && (
                        <div>
                          <Label>Erros encontrados:</Label>
                          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-md">
                            {result.summary.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-700 dark:text-red-300">
                                • {error}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {result.success && (
                    <Alert className="border-green-200 bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        <strong>Sistema limpo com sucesso!</strong> O sistema está agora pronto para receber usuários reais.
                        Você pode começar a criar agências e usuários através do painel admin.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SystemCleanupPage() {
  return (
    <PermissionGuard allowedRoles={['admin']} showUnauthorized>
      <SystemCleanupContent />
    </PermissionGuard>
  );
}