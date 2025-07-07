import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Clock, Lock, Smartphone, Tags, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

interface AdvancedLinkFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
}

const AdvancedLinkForm: React.FC<AdvancedLinkFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    custom_slug: '',
    password: '',
    password_protected: false,
    expires_at: null as Date | null,
    max_clicks: '',
    tags: [] as string[],
    ab_test_urls: [] as string[],
    deep_link_ios: '',
    deep_link_android: '',
    qr_code_enabled: true,
  });
  
  const [newTag, setNewTag] = useState('');
  const [newABUrl, setNewABUrl] = useState('');

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addABTestUrl = () => {
    if (newABUrl.trim() && !formData.ab_test_urls.includes(newABUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        ab_test_urls: [...prev.ab_test_urls, newABUrl.trim()]
      }));
      setNewABUrl('');
    }
  };

  const removeABTestUrl = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      ab_test_urls: prev.ab_test_urls.filter(url => url !== urlToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Link Avançado</CardTitle>
        <CardDescription>
          Configure todas as opções avançadas para seu link encurtado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Principal */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL Original *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/very-long-url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                required
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Meu Link Incrível"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_slug">Slug Personalizado</Label>
                <Input
                  id="custom_slug"
                  placeholder="meu-link-personalizado"
                  value={formData.custom_slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_slug: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações de Expiração */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Expiração do Link</span>
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Expiração</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expires_at ? format(formData.expires_at, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.expires_at}
                      onSelect={(date) => setFormData(prev => ({ ...prev, expires_at: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_clicks">Máximo de Cliques</Label>
                <Input
                  id="max_clicks"
                  type="number"
                  placeholder="100"
                  value={formData.max_clicks}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_clicks: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Proteção por Senha */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span className="text-lg font-medium">Proteção por Senha</span>
              </div>
              <Switch
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
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Tags className="h-5 w-5" />
              <span>Tags e Categorias</span>
            </h3>
            
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Digite uma tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Adicionar
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* A/B Testing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">A/B Test / Link Rotativo</h3>
            <p className="text-sm text-muted-foreground">
              Adicione URLs alternativas para redirecionamento rotativo
            </p>
            
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="https://alternativa.com"
                  value={newABUrl}
                  onChange={(e) => setNewABUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addABTestUrl())}
                />
                <Button type="button" variant="outline" onClick={addABTestUrl}>
                  Adicionar
                </Button>
              </div>
              
              {formData.ab_test_urls.length > 0 && (
                <div className="space-y-2">
                  {formData.ab_test_urls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-mono">{url}</span>
                      <X 
                        className="h-4 w-4 cursor-pointer" 
                        onClick={() => removeABTestUrl(url)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Deep Linking */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Deep Linking</span>
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deep_link_ios">Deep Link iOS</Label>
                <Input
                  id="deep_link_ios"
                  placeholder="myapp://open?content=xyz"
                  value={formData.deep_link_ios}
                  onChange={(e) => setFormData(prev => ({ ...prev, deep_link_ios: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deep_link_android">Deep Link Android</Label>
                <Input
                  id="deep_link_android"
                  placeholder="intent://open?content=xyz#Intent;scheme=myapp;end"
                  value={formData.deep_link_android}
                  onChange={(e) => setFormData(prev => ({ ...prev, deep_link_android: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* QR Code */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Gerar QR Code</h3>
              <p className="text-sm text-muted-foreground">
                Criar QR Code automaticamente para este link
              </p>
            </div>
            <Switch
              checked={formData.qr_code_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, qr_code_enabled: checked }))}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar Link Avançado"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdvancedLinkForm;