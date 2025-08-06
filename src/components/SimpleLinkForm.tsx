
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Link, Settings, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFormValidation } from '@/hooks/useFormValidation';
import { linkSchema } from '@/lib/validations';
import { useAsync } from '@/hooks/useAsync';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SimpleLinkFormProps {
  onSuccess?: (link: any) => void;
  onCancel?: () => void;
}

export function SimpleLinkForm({ onSuccess, onCancel }: SimpleLinkFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enablePassword, setEnablePassword] = useState(false);
  const [enableExpiration, setEnableExpiration] = useState(false);
  
  const { execute: createLink, loading } = useAsync();

  const { form, handleSubmit, errors } = useFormValidation(linkSchema, {
    onSuccess: async (data) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Get user's default workspace
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (!workspaces || workspaces.length === 0) {
        throw new Error('Nenhum workspace encontrado');
      }

      // Prepare link data - only include fields that have values
      const linkData: any = {
        original_url: data.original_url,
        user_id: user.id,
        workspace_id: workspaces[0].id,
        is_active: true,
      };

      // Only add optional fields if they have values
      if (data.title?.trim()) {
        linkData.title = data.title.trim();
      }

      if (data.custom_slug?.trim()) {
        linkData.short_slug = data.custom_slug.trim();
        linkData.custom_slug = true;
      } else {
        linkData.custom_slug = false;
      }

      // Only add password if enabled and provided
      if (enablePassword && data.password?.trim()) {
        linkData.password_protected = true;
        linkData.password = data.password.trim();
      } else {
        linkData.password_protected = false;
      }

      // Only add expiration if enabled and provided
      if (enableExpiration && data.expires_at) {
        linkData.expires_at = data.expires_at;
      }

      // Only add max_clicks if provided
      if (data.max_clicks && data.max_clicks > 0) {
        linkData.max_clicks = data.max_clicks;
      }

      console.log('Creating link with data:', linkData);

      const newLink = await createLink(async () => {
        const { data: link, error } = await supabase
          .from('links')
          .insert([linkData])
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        return link;
      });

      toast({
        title: 'Sucesso!',
        description: 'Link criado com sucesso',
      });

      onSuccess?.(newLink);
    },
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          Criar novo link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Original */}
          <div className="space-y-2">
            <Label htmlFor="original_url">URL Original *</Label>
            <Input
              id="original_url"
              placeholder="https://exemplo.com"
              {...form.register('original_url')}
            />
            {errors.original_url && (
              <p className="text-sm text-destructive">{errors.original_url.message}</p>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título (opcional)</Label>
            <Input
              id="title"
              placeholder="Título do link"
              {...form.register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Slug personalizado */}
          <div className="space-y-2">
            <Label htmlFor="custom_slug">Slug personalizado (opcional)</Label>
            <Input
              id="custom_slug"
              placeholder="meu-link-personalizado"
              {...form.register('custom_slug')}
            />
            {errors.custom_slug && (
              <p className="text-sm text-destructive">{errors.custom_slug.message}</p>
            )}
          </div>

          {/* Configurações avançadas */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" type="button" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configurações avançadas
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Proteção por senha */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-password">Proteger com senha</Label>
                  <Switch
                    id="enable-password"
                    checked={enablePassword}
                    onCheckedChange={setEnablePassword}
                  />
                </div>
                {enablePassword && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Digite a senha"
                      type="password"
                      {...form.register('password')}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Data de expiração */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-expiration">Data de expiração</Label>
                  <Switch
                    id="enable-expiration"
                    checked={enableExpiration}
                    onCheckedChange={setEnableExpiration}
                  />
                </div>
                {enableExpiration && (
                  <div className="space-y-2">
                    <Input
                      type="datetime-local"
                      {...form.register('expires_at')}
                    />
                    {errors.expires_at && (
                      <p className="text-sm text-destructive">{errors.expires_at.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Limite de cliques */}
              <div className="space-y-2">
                <Label htmlFor="max_clicks">Máximo de cliques (opcional)</Label>
                <Input
                  id="max_clicks"
                  type="number"
                  placeholder="Ex: 100"
                  {...form.register('max_clicks', { valueAsNumber: true })}
                />
                {errors.max_clicks && (
                  <p className="text-sm text-destructive">{errors.max_clicks.message}</p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Criando...' : 'Criar Link'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
