
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Crown, User, Check, X } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermission {
  role: string;
  permissions: { [key: string]: boolean };
}

export default function RolePermissions() {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([
    {
      role: 'owner',
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
      }
    },
    {
      role: 'admin',
      permissions: {
        'manage_workspace': false,
        'manage_members': true,
        'manage_billing': false,
        'create_links': true,
        'edit_links': true,
        'delete_links': true,
        'view_analytics': true,
        'export_data': true,
        'manage_domains': false,
        'manage_integrations': true,
      }
    },
    {
      role: 'member',
      permissions: {
        'manage_workspace': false,
        'manage_members': false,
        'manage_billing': false,
        'create_links': true,
        'edit_links': true,
        'delete_links': false,
        'view_analytics': false,
        'export_data': false,
        'manage_domains': false,
        'manage_integrations': false,
      }
    }
  ]);

  const permissions: Permission[] = [
    {
      id: 'manage_workspace',
      name: 'Gerenciar Workspace',
      description: 'Editar configurações do workspace, nome, descrição',
      category: 'Workspace'
    },
    {
      id: 'manage_members',
      name: 'Gerenciar Membros',
      description: 'Convidar, remover e alterar roles de membros',
      category: 'Equipe'
    },
    {
      id: 'manage_billing',
      name: 'Gerenciar Faturamento',
      description: 'Visualizar e alterar planos e métodos de pagamento',
      category: 'Financeiro'
    },
    {
      id: 'create_links',
      name: 'Criar Links',
      description: 'Criar novos links encurtados',
      category: 'Links'
    },
    {
      id: 'edit_links',
      name: 'Editar Links',
      description: 'Modificar links existentes',
      category: 'Links'
    },
    {
      id: 'delete_links',
      name: 'Excluir Links',
      description: 'Remover links permanentemente',
      category: 'Links'
    },
    {
      id: 'view_analytics',
      name: 'Ver Analytics',
      description: 'Acessar relatórios e estatísticas dos links',
      category: 'Analytics'
    },
    {
      id: 'export_data',
      name: 'Exportar Dados',
      description: 'Baixar dados e relatórios em CSV/Excel',
      category: 'Analytics'
    },
    {
      id: 'manage_domains',
      name: 'Gerenciar Domínios',
      description: 'Configurar e gerenciar domínios personalizados',
      category: 'Configurações'
    },
    {
      id: 'manage_integrations',
      name: 'Gerenciar Integrações',
      description: 'Configurar APIs e integrações externas',
      category: 'Configurações'
    },
  ];

  const categories = Array.from(new Set(permissions.map(p => p.category)));

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
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

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'owner': return 'Controle total sobre o workspace';
      case 'admin': return 'Gerencia membros e configurações avançadas';
      case 'member': return 'Acesso básico para criação de links';
      default: return '';
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permissões Baseadas em Roles
          </CardTitle>
          <CardDescription>
            Configure as permissões para cada tipo de usuário no workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Roles Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rolePermissions.map((rolePermission) => (
              <Card key={rolePermission.role} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getRoleIcon(rolePermission.role)}
                  <h3 className="font-medium">{getRoleName(rolePermission.role)}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {getRoleDescription(rolePermission.role)}
                </p>
                <div className="text-sm">
                  <span className="font-medium">
                    {Object.values(rolePermission.permissions).filter(Boolean).length}
                  </span>
                  <span className="text-muted-foreground">
                    /{permissions.length} permissões
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Permissions Matrix */}
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category} className="space-y-4">
                <h3 className="font-semibold text-lg">{category}</h3>
                <div className="space-y-3">
                  {permissions
                    .filter(p => p.category === category)
                    .map((permission) => (
                      <div key={permission.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{permission.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          {rolePermissions.map((rolePermission) => (
                            <div key={rolePermission.role} className="flex items-center justify-between p-3 bg-muted rounded-lg">
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
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Descrição dos Roles</CardTitle>
          <CardDescription>
            Entenda as responsabilidades de cada tipo de usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Crown className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Proprietário (Owner)</h4>
                <p className="text-sm text-muted-foreground">
                  Tem acesso total ao workspace, incluindo gerenciamento de faturamento, 
                  exclusão do workspace e todas as permissões administrativas. 
                  Apenas um proprietário por workspace.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Administrador (Admin)</h4>
                <p className="text-sm text-muted-foreground">
                  Pode gerenciar membros da equipe, configurar integrações e 
                  ter acesso avançado aos recursos. Não pode alterar configurações 
                  de faturamento ou excluir o workspace.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <User className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Membro (Member)</h4>
                <p className="text-sm text-muted-foreground">
                  Acesso básico para criar e editar seus próprios links. 
                  Não pode gerenciar outros usuários ou acessar configurações 
                  administrativas.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
