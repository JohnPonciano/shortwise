import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Link, 
  BarChart3, 
  Plus, 
  ExternalLink, 
  Copy, 
  Globe, 
  MousePointerClick,
  Calendar,
  Smartphone,
  Monitor,
  CreditCard,
  LogOut,
  Filter,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  slug: string;
}

interface LinkData {
  id: string;
  title: string | null;
  original_url: string;
  short_slug: string;
  custom_slug: boolean;
  is_active: boolean;
  created_at: string;
  clicks?: ClickData[];
}

interface ClickData {
  id: string;
  country: string | null;
  device_type: string;
  clicked_at: string;
}

const Dashboard = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<LinkData[]>([]);
  const [selectedLinkFilter, setSelectedLinkFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [createLinkLoading, setCreateLinkLoading] = useState(false);
  const [customDomain, setCustomDomain] = useState<string>('');
  const [savingDomain, setSavingDomain] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchLinks();
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (profile?.custom_domain) {
      setCustomDomain(profile.custom_domain);
    }
  }, [profile]);

  useEffect(() => {
    filterLinks();
  }, [links, selectedLinkFilter]);

  const filterLinks = () => {
    if (selectedLinkFilter === "all") {
      setFilteredLinks(links);
    } else {
      const filtered = links.filter(link => link.id === selectedLinkFilter);
      setFilteredLinks(filtered);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWorkspaces(data || []);
      if (data && data.length > 0) {
        setCurrentWorkspace(data[0]);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workspaces",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLinks = async () => {
    if (!currentWorkspace) return;

    try {
      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      // Fetch click analytics for each link
      const linksWithClicks = await Promise.all(
        (linksData || []).map(async (link) => {
          const { data: clicksData } = await supabase
            .from('clicks')
            .select('id, country, device_type, clicked_at')
            .eq('link_id', link.id)
            .order('clicked_at', { ascending: false });

          return {
            ...link,
            clicks: clicksData || []
          };
        })
      );

      setLinks(linksWithClicks);
    } catch (error) {
      console.error('Error fetching links:', error);
      toast({
        title: "Error",
        description: "Failed to fetch links",
        variant: "destructive"
      });
    }
  };

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    setCreateLinkLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const originalUrl = formData.get('url') as string;
    const title = formData.get('title') as string;
    const customSlug = formData.get('custom_slug') as string;

    try {
      // Check link limits for free users
      if (profile?.subscription_tier === 'free' && links.length >= 5) {
        toast({
          title: "Limit Reached",
          description: "Free plan allows up to 5 links. Upgrade to Pro for unlimited links.",
          variant: "destructive"
        });
        return;
      }

      // Generate or use custom slug
      let shortSlug = customSlug;
      if (!shortSlug) {
        const { data: slugData, error: slugError } = await supabase
          .rpc('generate_short_slug');
        
        if (slugError) throw slugError;
        shortSlug = slugData;
      } else {
        // Check if custom slug already exists
        const { data: existingLink } = await supabase
          .from('links')
          .select('id')
          .eq('short_slug', customSlug)
          .single();
        
        if (existingLink) {
          toast({
            title: "Slug Already Taken",
            description: "This custom slug is already in use. Please choose another.",
            variant: "destructive"
          });
          return;
        }
      }

      const { error } = await supabase
        .from('links')
        .insert({
          workspace_id: currentWorkspace.id,
          user_id: user?.id,
          title: title || null,
          original_url: originalUrl,
          short_slug: shortSlug,
          custom_slug: !!customSlug
        });

      if (error) throw error;

      toast({
        title: "Link Created",
        description: "Your short link has been created successfully!",
      });

      // Reset form and refresh links
      (e.target as HTMLFormElement).reset();
      fetchLinks();
    } catch (error: any) {
      console.error('Error creating link:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create link",
        variant: "destructive"
      });
    } finally {
      setCreateLinkLoading(false);
    }
  };

  const copyToClipboard = (slug: string) => {
    const domain = profile?.custom_domain && profile?.subscription_tier === 'pro' 
      ? profile.custom_domain 
      : window.location.origin;
    const shortUrl = `${domain}/${slug}`;
    navigator.clipboard.writeText(shortUrl);
    toast({
      title: "Copied!",
      description: "Short link copied to clipboard",
    });
  };

  const saveDomain = async () => {
    if (!user || profile?.subscription_tier !== 'pro') {
      toast({
        title: "Pro Required",
        description: "Custom domains are available for Pro users only",
        variant: "destructive"
      });
      return;
    }

    setSavingDomain(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_domain: customDomain || null })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Domain Updated",
        description: "Your custom domain has been saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving domain:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save custom domain",
        variant: "destructive"
      });
    } finally {
      setSavingDomain(false);
    }
  };

  const getClicksLast7Days = (clicks: ClickData[]) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return clicks.filter(click => 
      new Date(click.clicked_at) >= sevenDaysAgo
    ).length;
  };

  const getDeviceStats = (clicks: ClickData[]) => {
    const devices = clicks.reduce((acc, click) => {
      const device = click.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return devices;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalClicks = links.reduce((sum, link) => sum + (link.clicks?.length || 0), 0);
  const activeLinks = links.filter(link => link.is_active).length;
  const linksUsed = links.length;
  const linksLimit = profile?.subscription_tier === 'free' ? 5 : 999;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Shortwise
            </h1>
            {currentWorkspace && (
              <Badge variant="secondary">{currentWorkspace.name}</Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant={profile?.subscription_tier === 'pro' ? 'default' : 'secondary'}>
              {profile?.subscription_tier?.toUpperCase() || 'FREE'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || profile?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Links</CardTitle>
              <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLinks}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {linksUsed}/{linksLimit} used
                </p>
                {profile?.subscription_tier === 'free' && (
                  <Progress value={(linksUsed / linksLimit) * 100} className="w-16 h-2" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {links.reduce((sum, link) => sum + getClicksLast7Days(link.clicks || []), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {profile?.subscription_tier || 'Free'}
              </div>
              {profile?.subscription_tier === 'free' && (
                <Button variant="link" className="p-0 h-auto text-xs">
                  Upgrade to Pro
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="links" className="space-y-6">
          <TabsList>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {profile?.subscription_tier === 'pro' && (
              <TabsTrigger value="settings">Pro Settings</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="links" className="space-y-6">
            {/* Pro Filter Controls */}
            {profile?.subscription_tier === 'pro' && links.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Filter className="h-5 w-5" />
                    <span>Filter Analytics</span>
                  </CardTitle>
                  <CardDescription>
                    Filter your analytics data by specific link
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="link-filter">Filter by Link:</Label>
                    <Select value={selectedLinkFilter} onValueChange={setSelectedLinkFilter}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select a link" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Links</SelectItem>
                        {links.map((link) => (
                          <SelectItem key={link.id} value={link.id}>
                            {link.title || 'Untitled'} ({link.short_slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create Link Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Create New Link</span>
                </CardTitle>
                <CardDescription>
                  Transform your long URLs into short, trackable links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createLink} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">Original URL *</Label>
                      <Input
                        id="url"
                        name="url"
                        type="url"
                        placeholder="https://example.com/very-long-url"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title (optional)</Label>
                      <Input
                        id="title"
                        name="title"
                        type="text"
                        placeholder="My Amazing Link"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom_slug">Custom Slug (optional)</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm border border-r-0 border-input bg-muted rounded-l-md">
                        {profile?.custom_domain && profile?.subscription_tier === 'pro' 
                          ? `${profile.custom_domain}/` 
                          : `${window.location.origin}/`}
                      </span>
                      <Input
                        id="custom_slug"
                        name="custom_slug"
                        type="text"
                        placeholder="my-custom-link"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={createLinkLoading}>
                    {createLinkLoading ? "Creating..." : "Create Link"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Links List */}
            <div className="space-y-4">
              {filteredLinks.length === 0 && selectedLinkFilter !== "all" ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No results</h3>
                      <p>No data found for the selected filter. Try selecting a different link.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : links.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No links yet</h3>
                      <p>Create your first short link to get started!</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredLinks.map((link) => (
                  <Card key={link.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium truncate">
                              {link.title || 'Untitled Link'}
                            </h3>
                            {link.custom_slug && (
                              <Badge variant="outline" className="text-xs">Custom</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span className="font-mono bg-secondary px-2 py-1 rounded">
                              {profile?.custom_domain && profile?.subscription_tier === 'pro' 
                                ? `${profile.custom_domain}/${link.short_slug}`
                                : `${window.location.origin}/${link.short_slug}`}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(link.short_slug)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/${link.short_slug}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate">
                            {link.original_url}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <MousePointerClick className="h-3 w-3" />
                              <span>{link.clicks?.length || 0} clicks</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{getClicksLast7Days(link.clicks || [])} this week</span>
                            </span>
                          </div>
                        </div>
                        
                        {profile?.subscription_tier === 'pro' && link.clicks && link.clicks.length > 0 && (
                          <div className="ml-4 text-right">
                            <div className="text-sm font-medium mb-1">Top Countries</div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              {Object.entries(
                                link.clicks.reduce((acc, click) => {
                                  const country = click.country || 'Unknown';
                                  acc[country] = (acc[country] || 0) + 1;
                                  return acc;
                                }, {} as Record<string, number>)
                              )
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 3)
                                .map(([country, count]) => (
                                  <div key={country} className="flex items-center space-x-1">
                                    <Globe className="h-3 w-3" />
                                    <span>{country}: {count}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {profile?.subscription_tier === 'free' ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Analytics Available in Pro</h3>
                    <p className="text-muted-foreground mb-4">
                      Upgrade to Pro to access detailed analytics, location data, and device insights.
                    </p>
                    <Button>Upgrade to Pro</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5" />
                      <span>Top Countries</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(
                        links.flatMap(link => link.clicks || [])
                          .reduce((acc, click) => {
                            const country = click.country || 'Unknown';
                            acc[country] = (acc[country] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                      )
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([country, count]) => (
                          <div key={country} className="flex justify-between items-center">
                            <span className="text-sm">{country}</span>
                            <span className="text-sm font-medium">{count} clicks</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Monitor className="h-5 w-5" />
                      <span>Device Types</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(
                        links.flatMap(link => link.clicks || [])
                          .reduce((acc, click) => {
                            const device = click.device_type || 'unknown';
                            acc[device] = (acc[device] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                      )
                        .sort(([,a], [,b]) => b - a)
                        .map(([device, count]) => (
                          <div key={device} className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              {device === 'mobile' ? (
                                <Smartphone className="h-4 w-4" />
                              ) : (
                                <Monitor className="h-4 w-4" />
                              )}
                              <span className="text-sm capitalize">{device}</span>
                            </div>
                            <span className="text-sm font-medium">{count} clicks</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          {/* Pro Settings Tab */}
          {profile?.subscription_tier === 'pro' && (
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Pro Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Advanced settings available for Pro users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Custom Domain */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Custom Domain</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Use your own domain for all short links. Make sure your domain points to our servers.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="custom_domain">Domain (without protocol)</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="custom_domain"
                          type="text"
                          placeholder="links.yourcompany.com"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={saveDomain} 
                          disabled={savingDomain}
                          variant="outline"
                        >
                          {savingDomain ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>

                    {profile?.custom_domain && (
                      <Alert>
                        <Globe className="h-4 w-4" />
                        <AlertDescription>
                          Your custom domain is active: <strong>{profile.custom_domain}</strong>
                          <br />
                          Make sure your domain's CNAME record points to: <code>shortwise.app</code>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Pro Features List */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-medium mb-4">Pro Features Active</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-sm">Unlimited links</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-sm">Advanced analytics</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-sm">Link filtering</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-sm">Custom domain</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;