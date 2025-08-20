
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function SecuritySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [factors, setFactors] = useState<any[]>([]);

  const [showTotpModal, setShowTotpModal] = useState(false);
  const [totpQR, setTotpQR] = useState<string>('');
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [enrolledFactorId, setEnrolledFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFactors = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return;
      const allFactors = (data as any)?.factors || (data as any)?.all || [];
      setFactors(allFactors);
      
      // Verificar se há um fator TOTP verificado
      const verifiedTotp = ((data as any)?.totp || allFactors)?.find((f: any) => (f.factor_type === 'totp' || f.type === 'totp') && f.status === 'verified');
      setTwoFactorEnabled(!!verifiedTotp);
      setEnrolledFactorId(verifiedTotp?.id || null);
      
      // Verificar se há um fator TOTP não verificado (para limpeza)
      const unverifiedTotp = ((data as any)?.totp || allFactors)?.find((f: any) => (f.factor_type === 'totp' || f.type === 'totp') && f.status === 'unverified');
      if (unverifiedTotp) {
        // Limpar fator não verificado automaticamente
        await supabase.auth.mfa.unenroll({ factorId: unverifiedTotp.id });
      }
    };
    fetchFactors();
  }, []);

  const handleEnrollTotp = async () => {
    try {
      setLoading(true);
      
      // Primeiro, verificar se já existe um fator não verificado e removê-lo
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const allFactors = (factorsData as any)?.factors || (factorsData as any)?.all || [];
      const unverifiedTotp = allFactors.find((f: any) => (f.factor_type === 'totp' || f.type === 'totp') && f.status === 'unverified');
      
      if (unverifiedTotp) {
        await supabase.auth.mfa.unenroll({ factorId: unverifiedTotp.id });
      }
      
      // Agora criar um novo fator
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      
      setEnrolledFactorId((data as any)?.id || null);
      setTotpQR((data as any)?.totp?.qr_code || '');
      setTotpSecret((data as any)?.totp?.secret || '');
      
      // Create a challenge to be verified
      const { data: chall, error: challErr } = await supabase.auth.mfa.challenge({ factorId: (data as any)?.id });
      if (challErr) throw challErr;
      setChallengeId((chall as any)?.id || null);
      setShowTotpModal(true);
    } catch (e: any) {
      toast({ title: 'Erro ao iniciar 2FA', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (!enrolledFactorId || !challengeId) return;
    try {
      setVerifying(true);
      const { error } = await supabase.auth.mfa.verify({ factorId: enrolledFactorId, challengeId, code: verificationCode });
      if (error) throw error;
      toast({ title: '2FA ativado!' });
      setTwoFactorEnabled(true);
      setShowTotpModal(false);
      setVerificationCode('');
      setChallengeId(null);
      setTotpQR('');
      setTotpSecret('');
      // Atualizar a lista de fatores para refletir o novo estado
      const { data } = await supabase.auth.mfa.listFactors();
      const allFactors = (data as any)?.factors || (data as any)?.all || [];
      setFactors(allFactors);
    } catch (e: any) {
      toast({ title: 'Código inválido', description: 'Tente novamente', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableTotp = async () => {
    if (!enrolledFactorId) return;
    try {
      setLoading(true);
      const { error } = await supabase.auth.mfa.unenroll({ factorId: enrolledFactorId });
      if (error) throw error;
      toast({ title: '2FA desativado' });
      setTwoFactorEnabled(false);
      setEnrolledFactorId(null);
    } catch (e: any) {
      toast({ title: 'Erro ao desativar 2FA', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTotpModal = async () => {
    // Se o modal for fechado sem verificar, limpar o fator não verificado
    if (enrolledFactorId && !twoFactorEnabled) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: enrolledFactorId });
        setEnrolledFactorId(null);
        setChallengeId(null);
        setTotpQR('');
        setTotpSecret('');
        setVerificationCode('');
      } catch (error) {
        console.error('Erro ao limpar fator não verificado:', error);
      }
    }
    setShowTotpModal(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      toast({ title: 'Senha atualizada!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast({ title: 'Erro ao alterar senha', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Segurança
          </CardTitle>
          <CardDescription>Altere sua senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input id="new-password" type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input id="confirm-password" type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))} />
              </div>
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Alterando...' : 'Alterar Senha'}</Button>
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
          <CardDescription>Adicione uma camada extra de segurança à sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">2FA via App Autenticador</p>
              <p className="text-sm text-muted-foreground">Use Google Authenticator, Authy ou similar</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={twoFactorEnabled} onCheckedChange={(checked) => {
                if (checked) handleEnrollTotp();
                else handleDisableTotp();
              }} />
              <Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>{twoFactorEnabled ? 'Ativado' : 'Desativado'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showTotpModal} onOpenChange={handleCloseTotpModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ativar 2FA (TOTP)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Escaneie o QR code no seu app autenticador e depois insira o código de 6 dígitos.</p>
            {totpQR ? (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-white rounded-md" dangerouslySetInnerHTML={{ __html: totpQR }} />
                {totpSecret && (<p className="text-xs text-muted-foreground">Secret: {totpSecret}</p>)}
              </div>
            ) : (
              <p>Gerando QR...</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="totp-code">Código do App</Label>
              <Input id="totp-code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="000000" maxLength={6} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseTotpModal}>Cancelar</Button>
              <Button onClick={handleVerifyTotp} disabled={verifying || verificationCode.length < 6}>{verifying ? 'Verificando...' : 'Ativar 2FA'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
