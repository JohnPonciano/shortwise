import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeGeneratorProps {
  shortUrl: string;
  linkTitle?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ shortUrl, linkTitle }) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  const generateQRCode = async () => {
    if (!shortUrl || !canvasRef.current) return;

    try {
      // Simple QR Code generation using a free service
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortUrl)}`;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = 200;
        canvas.height = 200;
        ctx.drawImage(img, 0, 0, 200, 200);
        setQrGenerated(true);
      };
      img.src = qrApiUrl;
      
      toast({
        title: "QR Code gerado",
        description: "QR Code criado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code",
        variant: "destructive"
      });
    }
  };

  const downloadQRCode = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${linkTitle || 'link'}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
    
    toast({
      title: "QR Code baixado",
      description: "QR Code salvo com sucesso!"
    });
  };

  useEffect(() => {
    if (shortUrl) {
      generateQRCode();
    }
  }, [shortUrl]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <QrCode className="h-5 w-5" />
          <span>QR Code</span>
        </CardTitle>
        <CardDescription>
          Geração automática de QR Code com tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <canvas 
            ref={canvasRef}
            className="border rounded-lg max-w-[200px] max-h-[200px]"
            style={{ display: qrGenerated ? 'block' : 'none' }}
          />
          
          {!qrGenerated && shortUrl && (
            <div className="text-center text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Gerando QR Code...</p>
            </div>
          )}
          
          {!shortUrl && (
            <div className="text-center text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Crie o link para gerar o QR Code</p>
            </div>
          )}
          
          {qrGenerated && (
            <div className="flex space-x-2">
              <Button onClick={generateQRCode} variant="outline">
                Regenerar
              </Button>
              <Button onClick={downloadQRCode}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          )}
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          {shortUrl && (
            <p>QR Code para: <code className="bg-muted px-1 rounded">{shortUrl}</code></p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;