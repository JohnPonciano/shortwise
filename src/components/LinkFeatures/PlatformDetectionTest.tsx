import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Globe, 
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isMacOS: boolean;
  isWindows: boolean;
  isLinux: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  screenSize: string;
  touchSupport: boolean;
}

const PlatformDetectionTest: React.FC = () => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    const detectPlatform = () => {
      const ua = navigator.userAgent;
      const lowerUA = ua.toLowerCase();
      
      const info: PlatformInfo = {
        isIOS: /ipad|iphone|ipod/.test(lowerUA),
        isAndroid: /android/.test(lowerUA),
        isMobile: /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(lowerUA),
        isTablet: /tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(lowerUA),
        isDesktop: !/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile|tablet|ipad|playbook|silk/i.test(lowerUA),
        isSafari: /safari/i.test(lowerUA) && !/chrome|chromium|edg/i.test(lowerUA),
        isChrome: /chrome/i.test(lowerUA),
        isFirefox: /firefox/i.test(lowerUA),
        isEdge: /edg/i.test(lowerUA),
        isMacOS: /macintosh|mac os x/i.test(lowerUA),
        isWindows: /windows/i.test(lowerUA),
        isLinux: /linux/i.test(lowerUA),
        deviceType: /tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(lowerUA) ? 'tablet' : 
                    /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(lowerUA) ? 'mobile' : 'desktop',
        userAgent: ua,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
      };

      setPlatformInfo(info);
    };

    detectPlatform();
  }, []);

  const testDeepLink = (type: 'ios' | 'android' | 'web') => {
    const testLinks = {
      ios: 'https://apps.apple.com/app/instagram/id389801252',
      android: 'https://play.google.com/store/apps/details?id=com.instagram.android',
      web: 'https://www.instagram.com'
    };

    const appSchemes = {
      ios: 'instagram://camera',
      android: 'intent://camera#Intent;scheme=instagram;package=com.instagram.android;end',
      web: 'https://www.instagram.com'
    };

    if (!platformInfo) return;

    let redirectUrl = testLinks[type];
    let scheme = appSchemes[type];

    if (type === 'ios' && platformInfo.isIOS) {
      setTestResult('🍎 iOS detectado! Tentando abrir o app Instagram...');
      
      // Try to open the app first
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = scheme;
      document.body.appendChild(iframe);
      
      setTimeout(() => {
        document.body.removeChild(iframe);
        setTestResult('📱 Se o app não abriu, você será redirecionado para a App Store');
        window.open(redirectUrl, '_blank');
      }, 2000);
      
    } else if (type === 'android' && platformInfo.isAndroid) {
      setTestResult('🤖 Android detectado! Tentando abrir o app Instagram...');
      
      const startTime = Date.now();
      window.location.href = scheme;
      
      setTimeout(() => {
        if (Date.now() - startTime < 2100) {
          setTestResult('📱 Se o app não abriu, você será redirecionado para a Play Store');
          window.open(redirectUrl, '_blank');
        }
      }, 2000);
      
    } else {
      setTestResult('🌐 Plataforma não mobile ou diferente - abrindo versão web');
      window.open(redirectUrl, '_blank');
    }
  };

  const getDeviceIcon = () => {
    if (!platformInfo) return <Monitor className="h-5 w-5" />;
    
    if (platformInfo.isMobile) return <Smartphone className="h-5 w-5" />;
    if (platformInfo.isTablet) return <Tablet className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const getPlatformBadges = () => {
    if (!platformInfo) return [];
    
    const badges = [];
    
    if (platformInfo.isIOS) badges.push({ label: 'iOS', variant: 'default' as const });
    if (platformInfo.isAndroid) badges.push({ label: 'Android', variant: 'default' as const });
    if (platformInfo.isMobile) badges.push({ label: 'Mobile', variant: 'secondary' as const });
    if (platformInfo.isTablet) badges.push({ label: 'Tablet', variant: 'secondary' as const });
    if (platformInfo.isDesktop) badges.push({ label: 'Desktop', variant: 'secondary' as const });
    
    // Browser
    if (platformInfo.isChrome) badges.push({ label: 'Chrome', variant: 'outline' as const });
    if (platformInfo.isSafari) badges.push({ label: 'Safari', variant: 'outline' as const });
    if (platformInfo.isFirefox) badges.push({ label: 'Firefox', variant: 'outline' as const });
    if (platformInfo.isEdge) badges.push({ label: 'Edge', variant: 'outline' as const });
    
    // OS
    if (platformInfo.isMacOS) badges.push({ label: 'macOS', variant: 'outline' as const });
    if (platformInfo.isWindows) badges.push({ label: 'Windows', variant: 'outline' as const });
    if (platformInfo.isLinux) badges.push({ label: 'Linux', variant: 'outline' as const });
    
    return badges;
  };

  if (!platformInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Detectando plataforma...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getDeviceIcon()}
          <span>Teste de Detecção de Plataforma</span>
        </CardTitle>
        <CardDescription>
          Veja como o Deep Linking detecta sua plataforma e dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Detection Results */}
        <div className="space-y-4">
          <h3 className="font-medium">🎯 Plataforma Detectada</h3>
          <div className="flex flex-wrap gap-2">
            {getPlatformBadges().map((badge, index) => (
              <Badge key={index} variant={badge.variant}>
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Device Details */}
        <div className="space-y-4">
          <h3 className="font-medium">📱 Detalhes do Dispositivo</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Tipo:</strong> {platformInfo.deviceType}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span><strong>Resolução:</strong> {platformInfo.screenSize}</span>
              </div>
              <div className="flex items-center space-x-2">
                {platformInfo.touchSupport ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span><strong>Touch:</strong> {platformInfo.touchSupport ? 'Suportado' : 'Não suportado'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span><strong>Mobile:</strong> {platformInfo.isMobile ? 'Sim' : 'Não'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span><strong>Tablet:</strong> {platformInfo.isTablet ? 'Sim' : 'Não'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span><strong>Desktop:</strong> {platformInfo.isDesktop ? 'Sim' : 'Não'}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Deep Link Test */}
        <div className="space-y-4">
          <h3 className="font-medium">🔗 Teste de Deep Linking</h3>
          <p className="text-sm text-muted-foreground">
            Teste como o deep linking funciona em diferentes plataformas usando o Instagram como exemplo:
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={() => testDeepLink('ios')}
              className="h-auto p-4 flex-col space-y-2"
            >
              <span className="text-2xl">🍎</span>
              <span className="font-medium">Teste iOS</span>
              <span className="text-xs text-muted-foreground">App Store / Deep Link</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => testDeepLink('android')}
              className="h-auto p-4 flex-col space-y-2"
            >
              <span className="text-2xl">🤖</span>
              <span className="font-medium">Teste Android</span>
              <span className="text-xs text-muted-foreground">Play Store / Intent</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => testDeepLink('web')}
              className="h-auto p-4 flex-col space-y-2"
            >
              <span className="text-2xl">🌐</span>
              <span className="font-medium">Teste Web</span>
              <span className="text-xs text-muted-foreground">Versão Web</span>
            </Button>
          </div>
        </div>

        {testResult && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {testResult}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Technical Details */}
        <div className="space-y-4">
          <h3 className="font-medium">🔧 Detalhes Técnicos</h3>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-xs font-mono break-all">
              <strong>User Agent:</strong><br />
              {platformInfo.userAgent}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformDetectionTest;