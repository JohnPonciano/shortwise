import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UTMBuilderProps {
  originalUrl: string;
  onUrlChange: (url: string) => void;
}

const UTMBuilder: React.FC<UTMBuilderProps> = ({ originalUrl, onUrlChange }) => {
  const { toast } = useToast();
  const [utmParams, setUtmParams] = useState({
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: ''
  });

  const buildUTMUrl = () => {
    if (!originalUrl) return '';
    
    const url = new URL(originalUrl);
    const params = new URLSearchParams(url.search);
    
    if (utmParams.source) params.set('utm_source', utmParams.source);
    if (utmParams.medium) params.set('utm_medium', utmParams.medium);
    if (utmParams.campaign) params.set('utm_campaign', utmParams.campaign);
    if (utmParams.term) params.set('utm_term', utmParams.term);
    if (utmParams.content) params.set('utm_content', utmParams.content);
    
    url.search = params.toString();
    return url.toString();
  };

  const applyUTM = () => {
    const utmUrl = buildUTMUrl();
    onUrlChange(utmUrl);
    toast({
      title: "UTM aplicado",
      description: "Parâmetros UTM foram adicionados à URL"
    });
  };

  const copyUTMUrl = () => {
    const utmUrl = buildUTMUrl();
    navigator.clipboard.writeText(utmUrl);
    toast({
      title: "URL copiada",
      description: "URL com UTM copiada para a área de transferência"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Construtor de UTM</CardTitle>
        <CardDescription>
          Adicione parâmetros de rastreamento para campanhas e analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="utm_source">UTM Source</Label>
            <Input
              id="utm_source"
              placeholder="google, facebook, newsletter"
              value={utmParams.source}
              onChange={(e) => setUtmParams(prev => ({ ...prev, source: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="utm_medium">UTM Medium</Label>
            <Input
              id="utm_medium"
              placeholder="cpc, banner, email"
              value={utmParams.medium}
              onChange={(e) => setUtmParams(prev => ({ ...prev, medium: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="utm_campaign">UTM Campaign</Label>
            <Input
              id="utm_campaign"
              placeholder="summer_sale, product_launch"
              value={utmParams.campaign}
              onChange={(e) => setUtmParams(prev => ({ ...prev, campaign: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="utm_term">UTM Term</Label>
            <Input
              id="utm_term"
              placeholder="keyword, target_audience"
              value={utmParams.term}
              onChange={(e) => setUtmParams(prev => ({ ...prev, term: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="utm_content">UTM Content</Label>
            <Input
              id="utm_content"
              placeholder="ad_variant_a, footer_link"
              value={utmParams.content}
              onChange={(e) => setUtmParams(prev => ({ ...prev, content: e.target.value }))}
            />
          </div>
        </div>
        
        {buildUTMUrl() && (
          <div className="space-y-2">
            <Label>URL com UTM:</Label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                {buildUTMUrl()}
              </div>
              <Button variant="outline" size="sm" onClick={copyUTMUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button onClick={applyUTM} disabled={!originalUrl}>
            Aplicar UTM
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setUtmParams({ source: '', medium: '', campaign: '', term: '', content: '' })}
          >
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UTMBuilder;