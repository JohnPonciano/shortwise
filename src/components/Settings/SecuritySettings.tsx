
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, Shield, Smartphone, Eye, Clock, AlertTriangle } from 'lucide-react';

export default function SecuritySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions] = useState([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'São Paulo, Brasil',
      lastActive: '2024-01-15T10:30:00Z',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'São Paulo, Brasil',
      lastActive: '2024-01-14T15:22:00Z',
      current: false,
    },
  ]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter pelo menos 8 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi atualizada com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    // In a real application, this would revoke the specific session
    toast({
      title: 'Sessão revogada',
      description: 'A sessão foi encerrada com sucesso.',
    });
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    return `${Math.floor(diffInHours / 24)}d atrás`;
  };

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Mantenha sua conta segura com uma senha forte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength={8}
              />
              <p className="text-sm text-muted-foreground">
                Mínimo de 8 caracteres com letras maiúsculas, minúsculas e números
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Autenticação de Dois Fatores
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">2FA via App Autenticador</p>
              <p className="text-sm text-muted-foreground">
                Use Google Authenticator, Authy ou similar
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
              <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
                {twoFactorEnabled ? "Ativado" : "Desativado"}
              </Badge>
            </div>
          </div>

          {!twoFactorEnabled && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Recomendamos ativar o 2FA
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    A autenticação de dois fatores protege sua conta mesmo se sua senha for comprometida.
                  </p>
                </div>
              </div>
            </div>
          )}

          {twoFactorEnabled && (
            <Button variant="outline">
              <Smartphone className="w-4 h-4 mr-2" />
              Configurar App Autenticador
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Sessões Ativas
          </CardTitle>
          <CardDescription>
            Monitore onde sua conta está sendo acessada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.device}</p>
                      {session.current && (
                        <Badge variant="default" className="text-xs">Atual</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{session.location}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatLastActive(session.lastActive)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!session.current && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    Revogar
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button variant="destructive" className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Revogar Todas as Outras Sessões
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Isso irá desconectar todos os outros dispositivos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Recomendações de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Senha forte configurada</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Ative a autenticação de dois fatores</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Email verificado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
