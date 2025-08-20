
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function InvitePage() {
	const { token } = useParams<{ token: string }>();
	const { user } = useAuth();
	const navigate = useNavigate();
	const [status, setStatus] = useState<'checking' | 'invalid' | 'needs_auth' | 'ready' | 'processing' | 'accepted'>('checking');
	const [inviteData, setInviteData] = useState<any>(null);

	useEffect(() => {
		if (!token) {
			setStatus('invalid');
			return;
		}

		// Guardar o token no localStorage para usar após autenticação
		localStorage.setItem('pending_invite_token', token);
		
		checkInvite();
	}, [token]);

	useEffect(() => {
		// Se o usuário se autenticou e temos um convite válido, processar automaticamente
		if (user && status === 'needs_auth' && inviteData) {
			acceptInvite();
		}
	}, [user, status, inviteData]);

	const checkInvite = async () => {
		if (!token) { 
			setStatus('invalid'); 
			return; 
		}

		try {
			const { data, error } = await supabase
				.from('workspace_invites')
				.select(`
					*,
					workspaces(name, slug)
				`)
				.eq('token', token)
				.single();

			if (error || !data) { 
				console.error('Invite not found:', error);
				setStatus('invalid'); 
				return; 
			}

			// Verificar se expirou
			if (data.expires_at && new Date(data.expires_at) < new Date()) { 
				setStatus('invalid'); 
				return; 
			}

			// Verificar se já foi aceito
			if (data.accepted_at) { 
				setStatus('invalid'); 
				return; 
			}

			setInviteData(data);

			// Se o usuário não está logado, pedir para fazer login
			if (!user) {
				setStatus('needs_auth');
				return;
			}

			// Se está logado, pronto para aceitar
			setStatus('ready');
		} catch (error) {
			console.error('Error checking invite:', error);
			setStatus('invalid');
		}
	};

	const acceptInvite = async () => {
		if (!user || !inviteData || !token) return;
		
		setStatus('processing');

		try {
			// Verificar se o usuário já é membro do workspace
			const { data: existingMember } = await supabase
				.from('workspace_members')
				.select('id')
				.eq('workspace_id', inviteData.workspace_id)
				.eq('user_id', user.id)
				.single();

			if (existingMember) {
				// Usuário já é membro, apenas marcar convite como aceito
				await supabase
					.from('workspace_invites')
					.update({ 
						accepted_by: user.id, 
						accepted_at: new Date().toISOString() 
					})
					.eq('token', token);
			} else {
				// Adicionar usuário como membro
				const { error: insertErr } = await supabase
					.from('workspace_members')
					.insert({ 
						workspace_id: inviteData.workspace_id, 
						user_id: user.id, 
						role: inviteData.role, 
						joined_at: new Date().toISOString() 
					});

				if (insertErr) throw insertErr;

				// Marcar convite como aceito
				await supabase
					.from('workspace_invites')
					.update({ 
						accepted_by: user.id, 
						accepted_at: new Date().toISOString() 
					})
					.eq('token', token);
			}

			// Limpar o token do localStorage
			localStorage.removeItem('pending_invite_token');

			setStatus('accepted');
			setTimeout(() => navigate('/settings?tab=workspaces'), 2000);
		} catch (error) {
			console.error('Error accepting invite:', error);
			setStatus('invalid');
		}
	};

	const handleGoToAuth = () => {
		// Manter o token no localStorage e ir para auth
		navigate('/auth');
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Convite para Workspace</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{status === 'checking' && (
						<p>Verificando convite...</p>
					)}
					
					{status === 'invalid' && (
						<div className="text-center space-y-4">
							<p className="text-destructive">Convite inválido, expirado ou já utilizado.</p>
							<Button onClick={() => navigate('/dashboard')} variant="outline">
								Ir para Dashboard
							</Button>
						</div>
					)}
					
					{status === 'needs_auth' && inviteData && (
						<div className="text-center space-y-4">
							<div>
								<h3 className="font-semibold mb-2">
									Você foi convidado para: {inviteData.workspaces?.name}
								</h3>
								<p className="text-sm text-muted-foreground mb-4">
									Role: {inviteData.role === 'admin' ? 'Administrador' : 'Membro'}
								</p>
								<p className="text-sm">
									Para aceitar este convite, você precisa fazer login ou criar uma conta.
								</p>
							</div>
							<Button onClick={handleGoToAuth} className="w-full">
								Fazer Login / Criar Conta
							</Button>
						</div>
					)}
					
					{status === 'ready' && inviteData && (
						<div className="text-center space-y-4">
							<div>
								<h3 className="font-semibold mb-2">
									Convite para: {inviteData.workspaces?.name}
								</h3>
								<p className="text-sm text-muted-foreground">
									Role: {inviteData.role === 'admin' ? 'Administrador' : 'Membro'}
								</p>
							</div>
							<Button onClick={acceptInvite} className="w-full">
								Aceitar Convite
							</Button>
						</div>
					)}
					
					{status === 'processing' && (
						<p className="text-center">Processando convite...</p>
					)}
					
					{status === 'accepted' && (
						<div className="text-center space-y-2">
							<p className="text-success">Convite aceito com sucesso!</p>
							<p className="text-sm text-muted-foreground">Redirecionando para configurações...</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
} 
