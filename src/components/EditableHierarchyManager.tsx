import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Clock,
  Shield,
  Eye,
  UserCheck,
  Save,
  X,
  GripVertical
} from "lucide-react";
import { organizationService, Organization, HierarchyLevel, OrganizationMember } from "@/services/organizationService";

interface EditableHierarchyManagerProps {
  organization: Organization;
  onUpdate: (updatedOrg: Organization) => void;
}

export const EditableHierarchyManager = ({ organization, onUpdate }: EditableHierarchyManagerProps) => {
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedLevelForMember, setSelectedLevelForMember] = useState<number>(0);
  
  const [newLevel, setNewLevel] = useState<Partial<HierarchyLevel>>({
    level: organization.hierarchy.length,
    name: '',
    roles: [],
    permissions: [],
    responseTimeSLA: 24,
    escalationThreshold: 48,
    businessHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'UTC',
      workdays: [1, 2, 3, 4, 5],
      holidays: []
    }
  });

  const [newMember, setNewMember] = useState<Partial<OrganizationMember>>({
    name: '',
    email: '',
    phone: '',
    role: '',
    level: 0,
    department: '',
    permissions: [],
    isActive: true
  });

  const [newRole, setNewRole] = useState('');
  const [newPermission, setNewPermission] = useState('');

  // Predefined permissions for easy selection
  const availablePermissions = [
    'view_complaints',
    'update_status',
    'assign_cases',
    'approve_actions',
    'escalate_complaints',
    'manage_team',
    'view_analytics',
    'export_data',
    'manage_settings',
    'delete_complaints'
  ];

  const addHierarchyLevel = () => {
    if (!newLevel.name) return;

    const level: HierarchyLevel = {
      level: newLevel.level || organization.hierarchy.length,
      name: newLevel.name,
      roles: newLevel.roles || [],
      permissions: newLevel.permissions || [],
      responseTimeSLA: newLevel.responseTimeSLA || 24,
      escalationThreshold: newLevel.escalationThreshold || 48,
      businessHours: newLevel.businessHours || {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC',
        workdays: [1, 2, 3, 4, 5],
        holidays: []
      }
    };

    const updatedOrg = {
      ...organization,
      hierarchy: [...organization.hierarchy, level].sort((a, b) => a.level - b.level)
    };

    onUpdate(updatedOrg);
    setShowAddLevel(false);
    resetNewLevel();
  };

  const resetNewLevel = () => {
    setNewLevel({
      level: organization.hierarchy.length,
      name: '',
      roles: [],
      permissions: [],
      responseTimeSLA: 24,
      escalationThreshold: 48,
      businessHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC',
        workdays: [1, 2, 3, 4, 5],
        holidays: []
      }
    });
  };

  const updateLevel = (levelIndex: number, updates: Partial<HierarchyLevel>) => {
    const updatedHierarchy = [...organization.hierarchy];
    updatedHierarchy[levelIndex] = { ...updatedHierarchy[levelIndex], ...updates };
    
    const updatedOrg = {
      ...organization,
      hierarchy: updatedHierarchy
    };

    onUpdate(updatedOrg);
  };

  const deleteLevel = (levelIndex: number) => {
    if (organization.hierarchy.length <= 1) {
      alert("Cannot delete the last hierarchy level");
      return;
    }

    const updatedHierarchy = organization.hierarchy.filter((_, index) => index !== levelIndex);
    // Reorder levels
    const reorderedHierarchy = updatedHierarchy.map((level, index) => ({
      ...level,
      level: index
    }));
    
    const updatedOrg = {
      ...organization,
      hierarchy: reorderedHierarchy
    };

    onUpdate(updatedOrg);
  };

  const addRoleToLevel = (levelIndex: number) => {
    if (!newRole.trim()) return;
    
    const level = organization.hierarchy[levelIndex];
    const updatedRoles = [...level.roles, newRole.trim()];
    updateLevel(levelIndex, { roles: updatedRoles });
    setNewRole('');
  };

  const removeRoleFromLevel = (levelIndex: number, roleIndex: number) => {
    const level = organization.hierarchy[levelIndex];
    const updatedRoles = level.roles.filter((_, index) => index !== roleIndex);
    updateLevel(levelIndex, { roles: updatedRoles });
  };

  const addPermissionToLevel = (levelIndex: number, permission: string) => {
    const level = organization.hierarchy[levelIndex];
    if (level.permissions.includes(permission)) return;
    
    const updatedPermissions = [...level.permissions, permission];
    updateLevel(levelIndex, { permissions: updatedPermissions });
  };

  const removePermissionFromLevel = (levelIndex: number, permissionIndex: number) => {
    const level = organization.hierarchy[levelIndex];
    const updatedPermissions = level.permissions.filter((_, index) => index !== permissionIndex);
    updateLevel(levelIndex, { permissions: updatedPermissions });
  };

  const addMember = () => {
    if (!newMember.name || !newMember.email) return;

    const member: OrganizationMember = {
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newMember.name!,
      email: newMember.email!,
      phone: newMember.phone,
      role: newMember.role!,
      level: newMember.level!,
      department: newMember.department!,
      permissions: newMember.permissions || [],
      isActive: newMember.isActive !== false,
      joinedAt: new Date()
    };

    const updatedOrg = {
      ...organization,
      members: [...organization.members, member]
    };

    onUpdate(updatedOrg);
    setShowAddMember(false);
    resetNewMember();
  };

  const resetNewMember = () => {
    setNewMember({
      name: '',
      email: '',
      phone: '',
      role: '',
      level: 0,
      department: '',
      permissions: [],
      isActive: true
    });
  };

  const getMembersAtLevel = (level: number) => {
    return organization.members.filter(member => member.level === level);
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'view_complaints': return <Eye className="h-3 w-3" />;
      case 'update_status': return <Edit className="h-3 w-3" />;
      case 'assign_cases': return <UserCheck className="h-3 w-3" />;
      case 'approve_actions': return <Shield className="h-3 w-3" />;
      default: return <Settings className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Editable Organizational Hierarchy
              </CardTitle>
              <CardDescription>
                Create and customize your organization's hierarchy - {organization.hierarchy.length} levels, {organization.members.length} members
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={showAddLevel} onOpenChange={setShowAddLevel}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Level
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Hierarchy Level</DialogTitle>
                    <DialogDescription>
                      Create a new level in your organizational hierarchy
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Level Number</Label>
                        <Input
                          type="number"
                          value={newLevel.level || 0}
                          onChange={(e) => setNewLevel({ ...newLevel, level: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Level Name *</Label>
                        <Input
                          value={newLevel.name || ''}
                          onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                          placeholder="e.g., Senior Management"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Response SLA (hours)</Label>
                        <Input
                          type="number"
                          value={newLevel.responseTimeSLA || 24}
                          onChange={(e) => setNewLevel({ ...newLevel, responseTimeSLA: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Escalation Threshold (hours)</Label>
                        <Input
                          type="number"
                          value={newLevel.escalationThreshold || 48}
                          onChange={(e) => setNewLevel({ ...newLevel, escalationThreshold: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Hours Start</Label>
                        <Input
                          type="time"
                          value={newLevel.businessHours?.start || '09:00'}
                          onChange={(e) => setNewLevel({
                            ...newLevel,
                            businessHours: { ...newLevel.businessHours!, start: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Business Hours End</Label>
                        <Input
                          type="time"
                          value={newLevel.businessHours?.end || '17:00'}
                          onChange={(e) => setNewLevel({
                            ...newLevel,
                            businessHours: { ...newLevel.businessHours!, end: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addHierarchyLevel}>Add Level</Button>
                      <Button variant="outline" onClick={() => setShowAddLevel(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Hierarchy Levels */}
      <div className="space-y-4">
        {organization.hierarchy.map((level, levelIndex) => {
          const members = getMembersAtLevel(level.level);
          const isEditing = editingLevel === levelIndex;

          return (
            <Card key={level.level} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <Badge variant="outline">Level {level.level}</Badge>
                    {isEditing ? (
                      <Input
                        value={level.name}
                        onChange={(e) => updateLevel(levelIndex, { name: e.target.value })}
                        className="font-semibold text-lg"
                      />
                    ) : (
                      <h3 className="font-semibold text-lg">{level.name}</h3>
                    )}
                    <Badge variant="secondary">{members.length} members</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingLevel(isEditing ? null : levelIndex)}
                    >
                      {isEditing ? <Save className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteLevel(levelIndex)}
                      disabled={organization.hierarchy.length <= 1}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* SLA Settings */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm">Response SLA (hours)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={level.responseTimeSLA}
                        onChange={(e) => updateLevel(levelIndex, { responseTimeSLA: parseInt(e.target.value) })}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{level.responseTimeSLA}h</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm">Escalation Threshold (hours)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={level.escalationThreshold}
                        onChange={(e) => updateLevel(levelIndex, { escalationThreshold: parseInt(e.target.value) })}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowUp className="h-4 w-4 text-muted-foreground" />
                        <span>{level.escalationThreshold}h</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm">Business Hours</Label>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Input
                          type="time"
                          value={level.businessHours.start}
                          onChange={(e) => updateLevel(levelIndex, {
                            businessHours: { ...level.businessHours, start: e.target.value }
                          })}
                        />
                        <Input
                          type="time"
                          value={level.businessHours.end}
                          onChange={(e) => updateLevel(levelIndex, {
                            businessHours: { ...level.businessHours, end: e.target.value }
                          })}
                        />
                      </div>
                    ) : (
                      <div className="text-sm">
                        {level.businessHours.start} - {level.businessHours.end}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm">Timezone</Label>
                    {isEditing ? (
                      <Select
                        value={level.businessHours.timezone}
                        onValueChange={(value) => updateLevel(levelIndex, {
                          businessHours: { ...level.businessHours, timezone: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">EST</SelectItem>
                          <SelectItem value="PST">PST</SelectItem>
                          <SelectItem value="GMT">GMT</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">{level.businessHours.timezone}</div>
                    )}
                  </div>
                </div>

                {/* Roles */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Roles</Label>
                    {isEditing && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add role..."
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="w-32"
                        />
                        <Button size="sm" onClick={() => addRoleToLevel(levelIndex)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {level.roles.map((role, roleIndex) => (
                      <Badge key={roleIndex} variant="outline" className="text-xs">
                        {role}
                        {isEditing && (
                          <button
                            onClick={() => removeRoleFromLevel(levelIndex, roleIndex)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-2 w-2" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Permissions</Label>
                    {isEditing && (
                      <Select onValueChange={(value) => addPermissionToLevel(levelIndex, value)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Add permission..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePermissions.map(permission => (
                            <SelectItem key={permission} value={permission}>
                              {permission.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {level.permissions.map((permission, permissionIndex) => (
                      <Badge key={permissionIndex} variant="secondary" className="text-xs flex items-center gap-1">
                        {getPermissionIcon(permission)}
                        {permission.replace('_', ' ')}
                        {isEditing && (
                          <button
                            onClick={() => removePermissionFromLevel(levelIndex, permissionIndex)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-2 w-2" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Members */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Members ({members.length})</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLevelForMember(level.level);
                        setNewMember({ ...newMember, level: level.level });
                        setShowAddMember(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Member
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {members.slice(0, 4).map((member) => (
                      <div key={member.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                        <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="font-medium">{member.name}</span>
                        <Badge variant="outline" className="text-xs">{member.role}</Badge>
                      </div>
                    ))}
                    {members.length > 4 && (
                      <div className="text-sm text-muted-foreground p-2">
                        +{members.length - 4} more members
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to Level {selectedLevelForMember}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={newMember.name || ''}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newMember.email || ''}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="email@company.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={newMember.role || ''}
                  onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {organization.hierarchy[selectedLevelForMember]?.roles.map(role => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input
                  value={newMember.phone || ''}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addMember}>Add Member</Button>
              <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};