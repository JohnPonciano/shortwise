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
	const [status, setStatus] = useState<'checking' | 'invalid' | 'ready' | 'accepted'>('checking');
	const [workspaceId, setWorkspaceId] = useState<string | null>(null);
	const [role, setRole] = useState<string>('member');

	useEffect(() => {
		const checkInvite = async () => {
			if (!token) { setStatus('invalid'); return; }
			const { data, error } = await supabase
				.from('workspace_invites')
				.select('workspace_id, role, expires_at, accepted_at')
				.eq('token', token)
				.single();
			if (error || !data) { setStatus('invalid'); return; }
			if (data.expires_at && new Date(data.expires_at) < new Date()) { setStatus('invalid'); return; }
			if (data.accepted_at) { setStatus('invalid'); return; }
			setWorkspaceId(data.workspace_id);
			setRole(data.role || 'member');
			setStatus('ready');
		};
		checkInvite();
	}, [token]);

	const acceptInvite = async () => {
		if (!user || !workspaceId || !token) return;
		try {
			const { error: insertErr } = await supabase
				.from('workspace_members')
				.insert({ workspace_id: workspaceId, user_id: user.id, role, joined_at: new Date().toISOString() });
			if (insertErr) throw insertErr;

			await supabase
				.from('workspace_invites')
				.update({ accepted_by: user.id, accepted_at: new Date().toISOString() })
				.eq('token', token);

			setStatus('accepted');
			setTimeout(() => navigate('/settings'), 1200);
		} catch (e) {
			setStatus('invalid');
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Convite para Workspace</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{status === 'checking' && <p>Verificando convite...</p>}
					{status === 'invalid' && <p className="text-destructive">Convite inválido ou expirado.</p>}
					{status === 'ready' && (
						<Button onClick={acceptInvite} className="w-full">Aceitar Convite</Button>
					)}
					{status === 'accepted' && <p className="text-success">Convite aceito! Redirecionando...</p>}
				</CardContent>
			</Card>
		</div>
	);
} 