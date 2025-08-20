
import React, { useRef, useState } from 'react';
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
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    custom_domain: profile?.custom_domain || '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleAvatarButton = () => {
    fileInputRef.current?.click();
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Tamanho máximo: 2MB', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl.publicUrl })
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      await refreshProfile();
      toast({ title: 'Foto atualizada!' });
    } catch (error: any) {
      toast({ title: 'Erro ao enviar avatar', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = confirm('Tem certeza que deseja excluir sua conta e todos os dados? Esta ação é irreversível.');
    if (!confirmed) return;

    try {
      setLoading(true);
      // Remover participação em workspaces
      await supabase.from('workspace_members').delete().eq('user_id', user.id);
      // Remover links do usuário (clicks têm ON DELETE CASCADE)
      await supabase.from('links').delete().eq('user_id', user.id);
      // Remover workspaces que o usuário é owner (membros/links relacionados devem ser limpos pelas FKs)
      await supabase.from('workspaces').delete().eq('owner_id', user.id);
      // Remover perfil
      await supabase.from('profiles').delete().eq('user_id', user.id);

      toast({ title: 'Conta excluída', description: 'Seus dados foram removidos.' });
      await signOut();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir conta', description: error.message, variant: 'destructive' });
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
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
              <Button variant="outline" size="sm" onClick={handleAvatarButton} disabled={loading}>
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
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={loading}>
              Excluir Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
