import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Icon className="w-6 h-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action && (
        <CardContent className="text-center">
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}