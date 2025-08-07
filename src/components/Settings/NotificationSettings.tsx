
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, Smartphone, Users, BarChart3, Shield, CheckCircle } from 'lucide-react';

interface NotificationSettings {
  email: {
    newLinks: boolean;
    analytics: boolean;
    security: boolean;
    team: boolean;
    marketing: boolean;
  };
  push: {
    newLinks: boolean;
    analytics: boolean;
    security: boolean;
    team: boolean;
  };
  frequency: string;
}

export default function NotificationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      newLinks: true,
      analytics: true,
      security: true,
      team: true,
      marketing: false,
    },
    push: {
      newLinks: false,
      analytics: false,
      security: true,
      team: true,
    },
    frequency: 'daily',
  });

  const handleEmailToggle = (key: keyof NotificationSettings['email']) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: !prev.email[key],
      },
    }));
  };

  const handlePushToggle = (key: keyof NotificationSettings['push']) => {
    setSettings(prev => ({
      ...prev,
      push: {
        ...prev.push,
        [key]: !prev.push[key],
      },
    }));
  };

  const handleFrequencyChange = (frequency: string) => {
    setSettings(prev => ({
      ...prev,
      frequency,
    }));
  };

  const handleSaveSettings = () => {
    // In a real application, this would save to the database
    toast({
      title: 'Configurações salvas!',
      description: 'Suas preferências de notificação foram atualizadas.',
    });
  };

  const handleTestNotification = () => {
    toast({
      title: 'Notificação de teste enviada!',
      description: 'Verifique seu email para confirmar o recebimento.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Notificações por Email
          </CardTitle>
          <CardDescription>
            Configure quando e como receber emails sobre suas atividades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Novos Links e Atividade
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações quando novos links forem criados
                </p>
              </div>
              <Switch
                checked={settings.email.newLinks}
                onCheckedChange={() => handleEmailToggle('newLinks')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Relatórios de Analytics
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receba resumos periódicos das estatísticas dos seus links
                </p>
              </div>
              <Switch
                checked={settings.email.analytics}
                onCheckedChange={() => handleEmailToggle('analytics')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Segurança
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alertas sobre atividades suspeitas e mudanças de segurança
                </p>
              </div>
              <Switch
                checked={settings.email.security}
                onCheckedChange={() => handleEmailToggle('security')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Atividade da Equipe
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notificações sobre novos membros e atividades do workspace
                </p>
              </div>
              <Switch
                checked={settings.email.team}
                onCheckedChange={() => handleEmailToggle('team')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Marketing e Novidades</Label>
                <p className="text-sm text-muted-foreground">
                  Receba dicas, novos recursos e ofertas especiais
                </p>
              </div>
              <Switch
                checked={settings.email.marketing}
                onCheckedChange={() => handleEmailToggle('marketing')}
              />
            </div>
          </div>

          {/* Frequency Settings */}
          <div className="pt-4 border-t">
            <div className="space-y-3">
              <Label>Frequência dos Relatórios</Label>
              <Select value={settings.frequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Tempo Real</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="never">Nunca</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Defina com que frequência receber resumos de atividade
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Notificações instantâneas no navegador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Novos Links</Label>
              <p className="text-sm text-muted-foreground">
                Notificação quando novos links são criados
              </p>
            </div>
            <Switch
              checked={settings.push.newLinks}
              onCheckedChange={() => handlePushToggle('newLinks')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Analytics Importantes</Label>
              <p className="text-sm text-muted-foreground">
                Alertas sobre picos de tráfego e marcos importantes
              </p>
            </div>
            <Switch
              checked={settings.push.analytics}
              onCheckedChange={() => handlePushToggle('analytics')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Segurança</Label>
              <p className="text-sm text-muted-foreground">
                Alertas críticos de segurança
              </p>
            </div>
            <Switch
              checked={settings.push.security}
              onCheckedChange={() => handlePushToggle('security')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Equipe</Label>
              <p className="text-sm text-muted-foreground">
                Atividades importantes da equipe
              </p>
            </div>
            <Switch
              checked={settings.push.team}
              onCheckedChange={() => handlePushToggle('team')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Test */}
      <Card>
        <CardHeader>
          <CardTitle>Teste de Notificações</CardTitle>
          <CardDescription>
            Teste suas configurações de notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTestNotification} variant="outline" className="w-full">
            <Bell className="w-4 h-4 mr-2" />
            Enviar Notificação de Teste
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Uma notificação de teste será enviada para verificar suas configurações
          </p>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={handleSaveSettings} className="w-full">
            <CheckCircle className="w-4 h-4 mr-2" />
            Salvar Configurações de Notificação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
