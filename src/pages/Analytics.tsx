import React, { useEffect, useMemo, useState } from 'react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LinkAnalytics from '@/components/Analytics/LinkAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, Settings } from 'lucide-react';
import { WorkspaceSelector } from '@/components/WorkspaceSelector';

export default function AnalyticsPage() {
	const { workspaces, currentWorkspace } = useWorkspaces();
	const { signOut } = useAuth();
	const navigate = useNavigate();
	const [mode, setMode] = useState<'all' | 'workspace' | 'link'>('all');
	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>(undefined);
	const [links, setLinks] = useState<Array<{ id: string; title: string; short_slug: string }>>([]);
	const [selectedLinkId, setSelectedLinkId] = useState<string | undefined>(undefined);

	useEffect(() => {
		if (mode === 'workspace') {
			setSelectedWorkspaceId(currentWorkspace?.id);
		} else if (mode === 'all') {
			setSelectedWorkspaceId(undefined);
			setSelectedLinkId(undefined);
		}
	}, [mode, currentWorkspace?.id]);

	useEffect(() => {
		const loadLinks = async () => {
			if (!selectedWorkspaceId) {
				setLinks([]);
				setSelectedLinkId(undefined);
				return;
			}
			const { data } = await supabase
				.from('links')
				.select('id, title, short_slug')
				.eq('workspace_id', selectedWorkspaceId);
			setLinks(data || []);
		};
		loadLinks();
	}, [selectedWorkspaceId]);

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<LinkIcon className="w-8 h-8 text-primary" />
							<h1 className="text-2xl font-bold">Shortwise</h1>
						</div>
						<div className="flex items-center gap-4">
							<WorkspaceSelector />
							<Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>Voltar</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => navigate('/settings')}
								className="flex items-center gap-2"
							>
								<Settings className="w-4 h-4" />
								Configurações
							</Button>
							<Button variant="outline" size="sm" onClick={signOut}>Sair</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="container mx-auto px-4 py-8 space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">Analytics</h1>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Filtros</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
						<Select value={mode} onValueChange={(v: 'all' | 'workspace' | 'link') => setMode(v)}>
							<SelectTrigger className="w-[220px]"><SelectValue placeholder="Modo" /></SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Mostrar tudo</SelectItem>
								<SelectItem value="workspace">Apenas workspace selecionado</SelectItem>
								<SelectItem value="link">Por link</SelectItem>
							</SelectContent>
						</Select>

						{(mode === 'workspace' || mode === 'link') && (
							<Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
								<SelectTrigger className="w-[240px]"><SelectValue placeholder="Selecione um workspace" /></SelectTrigger>
								<SelectContent>
									{workspaces.map(w => (
										<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{mode === 'link' && (
							<Select value={selectedLinkId} onValueChange={setSelectedLinkId}>
								<SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecione um link" /></SelectTrigger>
								<SelectContent>
									{links.map(l => (
										<SelectItem key={l.id} value={l.id}>{l.title || `/${l.short_slug}`}</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</CardContent>
				</Card>

				<LinkAnalytics 
					mode={mode}
					workspaceId={mode !== 'all' ? selectedWorkspaceId : undefined}
					linkId={mode === 'link' ? selectedLinkId : undefined}
				/>
			</div>
		</div>
	);
} 