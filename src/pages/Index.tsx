import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BarChart3, Globe, Link, MousePointerClick, Zap } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Shortwise
          </h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            Smart Link Management Platform
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Shorten, Track & Optimize Your Links
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your long URLs into powerful, trackable short links with detailed analytics. 
            Perfect for freelancers, agencies, and small teams.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" onClick={() => navigate('/auth')} className="shadow-glow">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to manage links
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for modern businesses and professionals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Link className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Smart Link Shortening</CardTitle>
              <CardDescription>
                Create branded short links with custom slugs or auto-generated ones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Custom domain support</li>
                <li>• Bulk link creation</li>
                <li>• Link expiration controls</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Track clicks, locations, devices, and more with detailed insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Real-time click tracking</li>
                <li>• Geographic analytics</li>
                <li>• Device & browser insights</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Team Workspaces</CardTitle>
              <CardDescription>
                Organize links in workspaces and collaborate with your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Multiple workspaces</li>
                <li>• Team collaboration</li>
                <li>• Role-based permissions</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            Start free, upgrade when you need more
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Free</CardTitle>
                <Badge variant="secondary">Perfect for testing</Badge>
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <MousePointerClick className="h-4 w-4 text-success mr-3" />
                  <span>Up to 5 links per workspace</span>
                </li>
                <li className="flex items-center">
                  <Globe className="h-4 w-4 text-success mr-3" />
                  <span>1 workspace</span>
                </li>
                <li className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-muted-foreground mr-3" />
                  <span className="text-muted-foreground">Basic analytics</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg ring-2 ring-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pro</CardTitle>
                <Badge>Most Popular</Badge>
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">$5</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Zap className="h-4 w-4 text-success mr-3" />
                  <span>Unlimited links</span>
                </li>
                <li className="flex items-center">
                  <Globe className="h-4 w-4 text-success mr-3" />
                  <span>Multiple workspaces</span>
                </li>
                <li className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-success mr-3" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <MousePointerClick className="h-4 w-4 text-success mr-3" />
                  <span>Custom domains</span>
                </li>
              </ul>
              <Button className="w-full shadow-glow" onClick={() => navigate('/auth')}>
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Shortwise
            </h3>
            <p className="text-sm text-muted-foreground">
              Smart link management for modern teams
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
