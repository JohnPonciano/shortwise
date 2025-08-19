
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, CreditCard, Upload } from 'lucide-react';

export default function AccountSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    custom_domain: profile?.custom_domain || '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          custom_domain: formData.custom_domain || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram atualizadas com sucesso.',
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações do Perfil
          </CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais e preferências
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-lg">
                {profile?.full_name ? getInitials(profile.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Alterar Foto
              </Button>
              <p className="text-sm text-muted-foreground">
                JPG, PNG ou GIF. Máximo 2MB.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

       {/* <div className="space-y-2">
            <Label htmlFor="custom_domain">Domínio Personalizado</Label>
              <Input
                id="custom_domain"
                value={formData.custom_domain}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_domain: e.target.value }))}
                placeholder="seudominio.com"
              />
              <p className="text-sm text-muted-foreground">
                Configure seu próprio domínio para os links encurtados
              </p>
         </div> */}


            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Plano e Assinatura
          </CardTitle>
          <CardDescription>
            Gerencie seu plano e informações de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Plano Atual:</span>
                <Badge variant={profile?.subscription_tier === 'pro' ? 'default' : 'secondary'}>
                  {profile?.subscription_tier === 'pro' ? 'Pro' : 'Gratuito'}
                </Badge>
              </div>
              {profile?.subscription_end_date && (
                <p className="text-sm text-muted-foreground mt-1">
                  Renovação em: {new Date(profile.subscription_end_date).toLocaleDateString()}
                </p>
              )}
            </div>
            {profile?.subscription_tier === 'free' && (
              <Button>Fazer Upgrade</Button>
            )}
          </div>

          {profile?.subscription_tier === 'pro' && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Recursos Pro Ativos:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Links ilimitados</li>
                <li>• Analytics avançados</li>
                <li>• Domínio personalizado</li>
                <li>• Colaboração em equipe</li>
                <li>• Suporte prioritário</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis da conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <h4 className="font-medium text-destructive">Excluir Conta</h4>
              <p className="text-sm text-muted-foreground">
                Exclua permanentemente sua conta e todos os dados associados
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Excluir Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
