import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Workspace {
	id: string;
	name: string;
	description: string;
	slug: string;
	owner_id: string;
	created_at: string;
	updated_at: string;
}

interface WorkspaceContextType {
	workspaces: Workspace[];
	currentWorkspace: Workspace | null;
	setCurrentWorkspace: (workspace: Workspace | null) => void;
	loading: boolean;
	createWorkspace: (data: { name: string; description?: string; slug: string }) => Promise<Workspace>;
	refetch: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const useWorkspaceContext = () => {
	const ctx = useContext(WorkspaceContext);
	if (!ctx) {
		throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
	}
	return ctx;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user } = useAuth();
	const { toast } = useToast();
	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user) {
			setWorkspaces([]);
			setCurrentWorkspace(null);
			setLoading(false);
			return;
		}
		setLoading(true);
		loadWorkspaces();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id]);

	const loadWorkspaces = async () => {
		try {
			// Owned workspaces
			const { data: ownedWorkspaces, error: ownedError } = await supabase
				.from('workspaces')
				.select('*')
				.eq('owner_id', user?.id)
				.order('created_at', { ascending: false });

			if (ownedError) throw ownedError;

			// Member workspaces (exclude ones already owned)
			const { data: memberWorkspaces, error: memberError } = await supabase
				.from('workspace_members')
				.select('workspaces(*)')
				.eq('user_id', user?.id)
				.neq('workspaces.owner_id', user?.id);

			if (memberError) throw memberError;

			const memberWorkspacesList = (memberWorkspaces?.map((m: any) => m.workspaces).filter(Boolean) as Workspace[]) || [];

			const all = [...(ownedWorkspaces || []), ...memberWorkspacesList];
			setWorkspaces(all);

			// Restore last selection from localStorage if present
			const lastId = typeof window !== 'undefined' ? window.localStorage.getItem('currentWorkspaceId') : null;
			const last = all.find(w => w.id === lastId);
			if (last) {
				setCurrentWorkspace(last);
			} else if (all.length > 0) {
				setCurrentWorkspace(all[0]);
			} else {
				setCurrentWorkspace(null);
			}
		} catch (error: any) {
			console.error('Error loading workspaces:', error);
			toast({
				title: 'Erro',
				description: 'Não foi possível carregar os workspaces',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleSetCurrentWorkspace = (workspace: Workspace | null) => {
		setCurrentWorkspace(workspace);
		if (typeof window !== 'undefined') {
			if (workspace) {
				window.localStorage.setItem('currentWorkspaceId', workspace.id);
			} else {
				window.localStorage.removeItem('currentWorkspaceId');
			}
		}
	};

	const createWorkspace = async (data: { name: string; description?: string; slug: string }) => {
		try {
			const { data: workspace, error } = await supabase
				.from('workspaces')
				.insert({
					name: data.name,
					description: data.description,
					slug: data.slug,
					owner_id: user?.id,
				})
				.select()
				.single();

			if (error) throw error;

			setWorkspaces(prev => [workspace as Workspace, ...prev]);
			handleSetCurrentWorkspace(workspace as Workspace);

			toast({
				title: 'Workspace criado!',
				description: 'Seu novo workspace foi criado com sucesso.',
			});

			return workspace as Workspace;
		} catch (error: any) {
			toast({
				title: 'Erro',
				description: error.message,
				variant: 'destructive',
			});
			throw error;
		}
	};

	const value: WorkspaceContextType = useMemo(() => ({
		workspaces,
		currentWorkspace,
		setCurrentWorkspace: handleSetCurrentWorkspace,
		loading,
		createWorkspace,
		refetch: loadWorkspaces,
	}), [workspaces, currentWorkspace, loading]);

	return (
		<WorkspaceContext.Provider value={value}>
			{children}
		</WorkspaceContext.Provider>
	);
}; 