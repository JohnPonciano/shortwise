
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Link, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SimpleLinkFormProps {
  onSuccess?: (link: any) => void;
  onCancel?: () => void;
  initialData?: any;
}

export function SimpleLinkForm({ onSuccess, onCancel, initialData }: SimpleLinkFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [formData, setFormData] = useState({
    original_url: '',
    title: '',
    custom_slug: '',
    password: '',
    password_protected: false,
    expires_at: '',
    enableExpiration: false,
    qr_code_enabled: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        original_url: initialData.original_url || '',
        title: initialData.title || '',
        custom_slug: initialData.custom_slug ? initialData.short_slug : '',
        password: initialData.password || '',
        password_protected: initialData.password_protected || false,
        expires_at: initialData.expires_at ? new Date(initialData.expires_at).toISOString().slice(0, 16) : '',
        enableExpiration: !!initialData.expires_at,
        qr_code_enabled: initialData.qr_code_enabled || false,
      });
      setShowAdvanced(true);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Get user's default workspace
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (!workspaces || workspaces.length === 0) {
        throw new Error('Nenhum workspace encontrado');
      }

      const linkData = {
        original_url: formData.original_url,
        title: formData.title || null,
        user_id: user.id,
        workspace_id: workspaces[0].id,
        short_slug: formData.custom_slug || undefined,
        custom_slug: !!formData.custom_slug,
        password_protected: formData.password_protected,
        password: formData.password_protected ? formData.password : null,
        expires_at: formData.enableExpiration && formData.expires_at ? formData.expires_at : null,
        qr_code_enabled: formData.qr_code_enabled,
      };

      if (initialData) {
        // Update existing link
        const { data: link, error } = await supabase
          .from('links')
          .update(linkData)
          .eq('id', initialData.id)
          .select()
          .single();

        if (error) throw error;
        onSuccess?.(link);
      } else {
        // Create new link
        const { data: link, error } = await supabase
          .from('links')
          .insert([linkData])
          .select()
          .single();

        if (error) throw error;
        onSuccess?.(link);
      }
    } catch (error: any) {
      console.error('Error saving link:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar o link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Original */}
      <div className="space-y-2">
        <Label htmlFor="original_url">URL Original *</Label>
        <Input
          id="original_url"
          type="url"
          placeholder="https://exemplo.com/minha-pagina"
          value={formData.original_url}
          onChange={(e) => setFormData(prev => ({ ...prev, original_url: e.target.value }))}
          required
        />
      </div>

      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="title">Título (opcional)</Label>
        <Input
          id="title"
          placeholder="Meu Link Incrível"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>

      {/* Slug personalizado */}
      <div className="space-y-2">
        <Label htmlFor="custom_slug">Slug personalizado (opcional)</Label>
        <Input
          id="custom_slug"
          placeholder="meu-link-personalizado"
          value={formData.custom_slug}
          onChange={(e) => setFormData(prev => ({ ...prev, custom_slug: e.target.value }))}
        />
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
          {/* QR Code */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="qr_code_enabled">Gerar QR Code</Label>
              <p className="text-sm text-muted-foreground">
                Permite visualizar e baixar o QR Code do link
              </p>
            </div>
            <Switch
              id="qr_code_enabled"
              checked={formData.qr_code_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, qr_code_enabled: checked }))}
            />
          </div>

          {/* Proteção por senha */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="password_protected">Proteger com senha</Label>
              <p className="text-sm text-muted-foreground">
                Exige senha para acessar o link
              </p>
            </div>
            <Switch
              id="password_protected"
              checked={formData.password_protected}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                password_protected: checked,
                password: checked ? prev.password : ''
              }))}
            />
          </div>

          {formData.password_protected && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite uma senha"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          )}

          {/* Data de expiração */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableExpiration">Data de expiração</Label>
              <p className="text-sm text-muted-foreground">
                Link expira automaticamente
              </p>
            </div>
            <Switch
              id="enableExpiration"
              checked={formData.enableExpiration}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                enableExpiration: checked,
                expires_at: checked ? prev.expires_at : ''
              }))}
            />
          </div>

          {formData.enableExpiration && (
            <div className="space-y-2">
              <Label htmlFor="expires_at">Data e hora de expiração</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Botões */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Salvando...' : initialData ? 'Atualizar Link' : 'Criar Link'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
