import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Globe, MousePointer, TrendingUp, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/LoadingState';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
	totalClicks: number;
	totalLinks: number;
	averageClicksPerLink: number;
	clicksToday: number;
	clicksByDate: Array<{ date: string; clicks: number }>;
	clicksByCountry: Array<{ country: string; clicks: number }>;
	clicksByDevice: Array<{ device: string; clicks: number }>;
	clicksByBrowser: Array<{ browser: string; clicks: number }>;
	clicksBySource: Array<{ source: string; clicks: number }>;
	topLinks: Array<{ 
		title: string; 
		short_slug: string; 
		clicks: number; 
		original_url: string;
	}>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

type Mode = 'all' | 'workspace' | 'link';

interface Props {
	mode?: Mode;
	workspaceId?: string;
	linkId?: string;
}

export default function LinkAnalytics({ mode = 'all', workspaceId, linkId }: Props) {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
	const [selectedPeriod, setSelectedPeriod] = useState('7d');

	useEffect(() => {
		if (user) {
			loadAnalyticsData();
		}
	}, [user, selectedPeriod, mode, workspaceId, linkId]);

	const loadAnalyticsData = async () => {
		try {
			setLoading(true);
			const now = new Date();
			const daysBack = selectedPeriod === '1d' ? 1 : selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
			const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

			// Build base query for links depending on mode
			let linksQuery = supabase
				.from('links')
				.select('id, title, short_slug, original_url, click_count')
				.eq('user_id', user?.id);

			if (mode === 'workspace' && workspaceId) {
				linksQuery = linksQuery.eq('workspace_id', workspaceId);
			}
			if (mode === 'link' && linkId) {
				linksQuery = linksQuery.eq('id', linkId);
			}

			const { data: links, error: linksError } = await linksQuery;
			if (linksError) throw linksError;

			const linkIds = links?.map(link => link.id) || [];
			if (linkIds.length === 0) {
				setAnalyticsData({
					totalClicks: 0,
					totalLinks: 0,
					averageClicksPerLink: 0,
					clicksToday: 0,
					clicksByDate: [],
					clicksByCountry: [],
					clicksByDevice: [],
					clicksByBrowser: [],
					clicksBySource: [],
					topLinks: []
				});
				setLoading(false);
				return;
			}

			const { data: clicks, error: clicksError } = await supabase
				.from('clicks')
				.select('*')
				.in('link_id', linkIds)
				.gte('clicked_at', startDate.toISOString());
			if (clicksError) throw clicksError;

			const totalClicks = clicks?.length || 0;
			const totalLinks = links?.length || 0;
			const averageClicksPerLink = totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0;

			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const clicksToday = clicks?.filter(click => new Date(click.clicked_at) >= today).length || 0;

			const clicksByDate = processClicksByDate(clicks || [], daysBack);

			const countryMap = new Map();
			clicks?.forEach(click => {
				const country = click.country || 'Unknown';
				countryMap.set(country, (countryMap.get(country) || 0) + 1);
			});
			const clicksByCountry = Array.from(countryMap.entries())
				.map(([country, clicks]) => ({ country, clicks }))
				.sort((a, b) => b.clicks - a.clicks)
				.slice(0, 10);

			const deviceMap = new Map();
			clicks?.forEach(click => {
				const device = click.device_type || 'unknown';
				deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
			});
			const clicksByDevice = Array.from(deviceMap.entries()).map(([device, clicks]) => ({ device, clicks }));

			const browserMap = new Map();
			clicks?.forEach(click => {
				const browser = click.browser || 'unknown';
				browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
			});
			const clicksByBrowser = Array.from(browserMap.entries())
				.map(([browser, clicks]) => ({ browser, clicks }))
				.sort((a, b) => b.clicks - a.clicks)
				.slice(0, 5);

			const sourceMap = new Map();
			clicks?.forEach(click => {
				const source = click.source_platform || 'Direct';
				sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
			});
			const clicksBySource = Array.from(sourceMap.entries())
				.map(([source, clicks]) => ({ source, clicks }))
				.sort((a, b) => b.clicks - a.clicks)
				.slice(0, 10);

			const topLinks = links
				?.sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
				.slice(0, 5)
				.map(link => ({
					title: link.title || 'Sem título',
					short_slug: link.short_slug,
					clicks: link.click_count || 0,
					original_url: link.original_url
				})) || [];

			setAnalyticsData({
				totalClicks,
				totalLinks,
				averageClicksPerLink,
				clicksToday,
				clicksByDate,
				clicksByCountry,
				clicksByDevice,
				clicksByBrowser,
				clicksBySource,
				topLinks
			});
		} catch (error) {
			console.error('Error loading analytics:', error);
		} finally {
			setLoading(false);
		}
	};

	const processClicksByDate = (clicks: any[], daysBack: number) => {
		const dateMap = new Map();
		const now = new Date();
		for (let i = daysBack - 1; i >= 0; i--) {
			const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
			const dateStr = date.toISOString().split('T')[0];
			dateMap.set(dateStr, 0);
		}
		clicks.forEach(click => {
			const date = new Date(click.clicked_at).toISOString().split('T')[0];
			if (dateMap.has(date)) {
				dateMap.set(date, dateMap.get(date) + 1);
			}
		});
		return Array.from(dateMap.entries()).map(([date, clicks]) => ({ date, clicks })).sort((a, b) => a.date.localeCompare(b.date));
	};

	const exportCsv = () => {
		if (!analyticsData) return;
		const rows: string[] = [];
		rows.push('Métrica,Valor');
		rows.push(`Total de Cliques,${analyticsData.totalClicks}`);
		rows.push(`Total de Links,${analyticsData.totalLinks}`);
		rows.push(`Média por Link,${analyticsData.averageClicksPerLink}`);
		rows.push(`Cliques Hoje,${analyticsData.clicksToday}`);
		rows.push('');
		rows.push('Cliques por Data');
		rows.push('Data,Cliques');
		analyticsData.clicksByDate.forEach(d => rows.push(`${d.date},${d.clicks}`));
		rows.push('');
		rows.push('Origem dos Acessos');
		rows.push('Origem,Cliques');
		analyticsData.clicksBySource.forEach(s => rows.push(`${s.source},${s.clicks}`));
		rows.push('');
		rows.push('Dispositivos');
		rows.push('Dispositivo,Cliques');
		analyticsData.clicksByDevice.forEach(d => rows.push(`${d.device},${d.clicks}`));
		rows.push('');
		rows.push('Países');
		rows.push('País,Cliques');
		analyticsData.clicksByCountry.forEach(c => rows.push(`${c.country},${c.clicks}`));
		rows.push('');
		rows.push('Navegadores');
		rows.push('Navegador,Cliques');
		analyticsData.clicksByBrowser.forEach(b => rows.push(`${b.browser},${b.clicks}`));

		const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		const scope = mode === 'all' ? 'todos' : mode === 'workspace' ? `workspace-${workspaceId}` : `link-${linkId}`;
		a.download = `analytics-${scope}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading) return <LoadingState />;
	if (!analyticsData) {
		return (
			<div className="text-center py-8">
				<p className="text-muted-foreground">Erro ao carregar dados de analytics</p>
			</div>
		);
	}

	const chartConfig = {
		clicks: { label: 'Cliques', color: 'hsl(var(--chart-1))' },
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold">Analytics</h2>
					<p className="text-muted-foreground">Acompanhe o desempenho dos seus links</p>
				</div>
				<div className="flex items-center gap-2">
					<Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1d">1 dia</SelectItem>
							<SelectItem value="7d">7 dias</SelectItem>
							<SelectItem value="30d">30 dias</SelectItem>
							<SelectItem value="90d">90 dias</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline" onClick={exportCsv}>Exportar CSV</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
						<MousePointer className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analyticsData.totalClicks}</div>
						<p className="text-xs text-muted-foreground">{selectedPeriod === '1d' ? 'Hoje' : `Últimos ${selectedPeriod.replace('d', ' dias')}`}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total de Links</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analyticsData.totalLinks}</div>
						<p className="text-xs text-muted-foreground">Links ativos</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Cliques Hoje</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analyticsData.clicksToday}</div>
						<p className="text-xs text-muted-foreground">Últimas 24 horas</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Média por Link</CardTitle>
						<Globe className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analyticsData.averageClicksPerLink}</div>
						<p className="text-xs text-muted-foreground">Cliques por link</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Clicks over time */}
				<Card>
					<CardHeader>
						<CardTitle>Cliques ao Longo do Tempo</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig}>
							<LineChart data={analyticsData.clicksByDate}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-1))' }} />
							</LineChart>
						</ChartContainer>
					</CardContent>
				</Card>

				{/* Source platforms */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Share className="h-5 w-5" />
							<span>Origem dos Acessos</span>
						</CardTitle>
						<CardDescription>De onde vieram os cliques nos seus links</CardDescription>
					</CardHeader>
					<CardContent>
						{analyticsData.clicksBySource.length === 0 ? (
							<p className="text-sm text-muted-foreground">Nenhum dado de origem disponível</p>
						) : (
							<ChartContainer config={chartConfig}>
								<BarChart data={analyticsData.clicksBySource} layout="horizontal">
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis type="number" />
									<YAxis dataKey="source" type="category" width={100} />
									<ChartTooltip content={<ChartTooltipContent />} />
									<Bar dataKey="clicks" fill="hsl(var(--chart-2))" />
								</BarChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>

				{/* Device breakdown */}
				<Card>
					<CardHeader>
						<CardTitle>Dispositivos</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig}>
							<PieChart>
								<Pie data={analyticsData.clicksByDevice} cx="50%" cy="50%" outerRadius={80} dataKey="clicks" nameKey="device" label={({ device, clicks }) => `${device}: ${clicks}` }>
									{analyticsData.clicksByDevice.map((_, index) => (
										<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
									))}
								</Pie>
								<ChartTooltip content={<ChartTooltipContent />} />
							</PieChart>
						</ChartContainer>
					</CardContent>
				</Card>

				{/* Top countries */}
				<Card>
					<CardHeader>
						<CardTitle>Principais Países</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig}>
							<BarChart data={analyticsData.clicksByCountry} layout="horizontal">
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis type="number" />
								<YAxis dataKey="country" type="category" width={80} />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar dataKey="clicks" fill="hsl(var(--chart-3))" />
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			{/* Additional info cards */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Top links */}
				<Card>
					<CardHeader>
						<CardTitle>Links Mais Populares</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{analyticsData.topLinks.length === 0 ? (
								<p className="text-sm text-muted-foreground">Nenhum link com cliques ainda</p>
							) : (
								analyticsData.topLinks.map((link) => (
									<div key={link.short_slug} className="flex items-center justify-between">
										<div className="flex-1 min-w-0">
											<p className="font-medium truncate">{link.title}</p>
											<p className="text-sm text-muted-foreground truncate">/{link.short_slug}</p>
										</div>
										<Badge variant="secondary">{link.clicks} cliques</Badge>
									</div>
								))
							)}
						</div>
					</CardContent>
				</Card>

				{/* Browser stats */}
				<Card>
					<CardHeader>
						<CardTitle>Navegadores</CardTitle>
					</CardHeader>
					<CardContent>
						{analyticsData.clicksByBrowser.length === 0 ? (
							<p className="text-sm text-muted-foreground">Nenhum dado de navegador disponível</p>
						) : (
							<ChartContainer config={chartConfig}>
								<BarChart data={analyticsData.clicksByBrowser}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="browser" />
									<YAxis />
									<ChartTooltip content={<ChartTooltipContent />} />
									<Bar dataKey="clicks" fill="hsl(var(--chart-4))" />
								</BarChart>
							</ChartContainer>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
