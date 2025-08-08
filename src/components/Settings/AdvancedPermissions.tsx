
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Shield, Crown, User, Check, X, Settings, Info } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  critical?: boolean;
}

interface RolePermission {
  role: string;
  permissions: { [key: string]: boolean };
  description: string;
  color: string;
}

export default function AdvancedPermissions() {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([
    {
      role: 'owner',
      description: 'Controle total sobre o workspace, incluindo faturamento e exclusão',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      permissions: {
        'manage_workspace': true,
        'manage_members': true,
        'manage_billing': true,
        'create_links': true,
        'edit_links': true,
        'delete_links': true,
        'view_analytics': true,
        'export_data': true,
        'manage_domains': true,
        'manage_integrations': true,
        'manage_api_keys': true,
        'delete_workspace': true,
      }
    },
    {
      role: 'admin',
      description: 'Gerencia membros e configurações avançadas do workspace',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      permissions: {
        'manage_workspace': true,
        'manage_members': true,
        'manage_billing': false,
        'create_links': true,
        'edit_links': true,
        'delete_links': true,
        'view_analytics': true,
        'export_data': true,
        'manage_domains': true,
        'manage_integrations': true,
        'manage_api_keys': false,
        'delete_workspace': false,
      }
    },
    {
      role: 'member',
      description: 'Acesso básico para criação e gerenciamento de links próprios',
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      permissions: {
        'manage_workspace': false,
        'manage_members': false,
        'manage_billing': false,
        'create_links': true,
        'edit_links': true,
        'delete_links': false,
        'view_analytics': true,
        'export_data': false,
        'manage_domains': false,
        'manage_integrations': false,
        'manage_api_keys': false,
        'delete_workspace': false,
      }
    }
  ]);

  const permissions: Permission[] = [
    // Workspace Management
    {
      id: 'manage_workspace',
      name: 'Gerenciar Workspace',
      description: 'Editar configurações, nome, descrição e outras propriedades do workspace',
      category: 'Workspace'
    },
    {
      id: 'delete_workspace',
      name: 'Excluir Workspace',
      description: 'Excluir permanentemente o workspace e todos os seus dados',
      category: 'Workspace',
      critical: true
    },

    // Team Management
    {
      id: 'manage_members',
      name: 'Gerenciar Membros',
      description: 'Convidar, remover e alterar roles de membros da equipe',
      category: 'Equipe'
    },

    // Financial
    {
      id: 'manage_billing',
      name: 'Gerenciar Faturamento',
      description: 'Visualizar e alterar planos, métodos de pagamento e faturas',
      category: 'Financeiro',
      critical: true
    },

    // Links Management
    {
      id: 'create_links',
      name: 'Criar Links',
      description: 'Criar novos links encurtados no workspace',
      category: 'Links'
    },
    {
      id: 'edit_links',
      name: 'Editar Links',
      description: 'Modificar links existentes, incluindo URLs e configurações',
      category: 'Links'
    },
    {
      id: 'delete_links',
      name: 'Excluir Links',
      description: 'Remover links permanentemente do workspace',
      category: 'Links'
    },

    // Analytics & Data
    {
      id: 'view_analytics',
      name: 'Ver Analytics',
      description: 'Acessar relatórios, estatísticas e dados de performance dos links',
      category: 'Analytics'
    },
    {
      id: 'export_data',
      name: 'Exportar Dados',
      description: 'Baixar dados e relatórios em formatos CSV, Excel ou JSON',
      category: 'Analytics'
    },

    // Advanced Settings
    {
      id: 'manage_domains',
      name: 'Gerenciar Domínios',
      description: 'Configurar e gerenciar domínios personalizados para links',
      category: 'Configurações Avançadas'
    },
    {
      id: 'manage_integrations',
      name: 'Gerenciar Integrações',
      description: 'Configurar e gerenciar integrações com APIs e serviços externos',
      category: 'Configurações Avançadas'
    },
    {
      id: 'manage_api_keys',
      name: 'Gerenciar API Keys',
      description: 'Criar, visualizar e revogar chaves de API para integrações',
      category: 'Configurações Avançadas',
      critical: true
    },
  ];

  const categories = Array.from(new Set(permissions.map(p => p.category)));

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-5 h-5" />;
      case 'admin': return <Shield className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'admin': return 'Administrador';
      case 'member': return 'Membro';
      default: return role;
    }
  };

  const togglePermission = (role: string, permissionId: string) => {
    if (role === 'owner') return; // Owner sempre tem todas as permissões

    setRolePermissions(prev => 
      prev.map(rp => 
        rp.role === role 
          ? { 
              ...rp, 
              permissions: { 
                ...rp.permissions, 
                [permissionId]: !rp.permissions[permissionId] 
              } 
            }
          : rp
      )
    );
  };

  const hasPermission = (role: string, permissionId: string) => {
    const rolePermission = rolePermissions.find(rp => rp.role === role);
    return rolePermission?.permissions[permissionId] || false;
  };

  const getPermissionCount = (role: string) => {
    const rolePermission = rolePermissions.find(rp => rp.role === role);
    return Object.values(rolePermission?.permissions || {}).filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permissões Avançadas por Role
          </CardTitle>
          <CardDescription>
            Configure detalhadamente as permissões para cada tipo de usuário no workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Roles Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rolePermissions.map((rolePermission) => (
              <Card key={rolePermission.role} className={`p-4 border-2 ${rolePermission.color}`}>
                <div className="flex items-start gap-3 mb-3">
                  {getRoleIcon(rolePermission.role)}
                  <div className="flex-1">
                    <h3 className="font-semibold">{getRoleName(rolePermission.role)}</h3>
                    <p className="text-sm opacity-80 mt-1">
                      {rolePermission.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {getPermissionCount(rolePermission.role)} de {permissions.length} permissões
                  </span>
                  <div className="w-full bg-background/30 rounded-full h-2 ml-3">
                    <div 
                      className="bg-current h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(getPermissionCount(rolePermission.role) / permissions.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Permissions Matrix */}
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">{category}</h3>
                </div>
                <div className="space-y-4">
                  {permissions
                    .filter(p => p.category === category)
                    .map((permission) => (
                      <div key={permission.id} className={`border rounded-lg p-4 ${permission.critical ? 'border-red-200 bg-red-50' : ''}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{permission.name}</h4>
                              {permission.critical && (
                                <Badge variant="destructive" className="text-xs">
                                  <Info className="w-3 h-3 mr-1" />
                                  Crítico
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {rolePermissions.map((rolePermission) => (
                            <div key={rolePermission.role} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                              <div className="flex items-center gap-2">
                                {getRoleIcon(rolePermission.role)}
                                <span className="text-sm font-medium">
                                  {getRoleName(rolePermission.role)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {rolePermission.role === 'owner' ? (
                                  <Badge variant="default" className="text-xs">
                                    <Check className="w-3 h-3 mr-1" />
                                    Sempre
                                  </Badge>
                                ) : (
                                  <Switch
                                    checked={hasPermission(rolePermission.role, permission.id)}
                                    onCheckedChange={() => togglePermission(rolePermission.role, permission.id)}
                                    disabled={permission.critical && rolePermission.role === 'member'}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {permission.critical && (
                          <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2 text-sm text-red-800">
                              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <p>
                                <strong>Permissão Crítica:</strong> Esta permissão pode afetar significativamente 
                                a segurança e funcionamento do workspace. Conceda apenas a usuários de confiança.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline">
              Resetar para Padrão
            </Button>
            <Button>
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Guia de Roles e Responsabilidades</CardTitle>
          <CardDescription>
            Entenda as responsabilidades e limitações de cada tipo de usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            {rolePermissions.map((rolePermission) => (
              <div key={rolePermission.role} className="flex gap-4">
                <div className={`p-3 rounded-lg border-2 ${rolePermission.color}`}>
                  {getRoleIcon(rolePermission.role)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{getRoleName(rolePermission.role)}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {rolePermission.description}
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Principais responsabilidades:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {Object.entries(rolePermission.permissions)
                        .filter(([_, hasPermission]) => hasPermission)
                        .slice(0, 4)
                        .map(([permissionId]) => {
                          const permission = permissions.find(p => p.id === permissionId);
                          return permission ? (
                            <li key={permissionId} className="flex items-center gap-2">
                              <Check className="w-3 h-3 text-green-600" />
                              {permission.name}
                            </li>
                          ) : null;
                        })}
                      {Object.values(rolePermission.permissions).filter(Boolean).length > 4 && (
                        <li className="text-xs text-muted-foreground">
                          +{Object.values(rolePermission.permissions).filter(Boolean).length - 4} outras permissões
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
