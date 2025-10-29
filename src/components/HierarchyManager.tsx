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
  Mail,
  MessageSquare,
  Shield,
  Eye,
  UserCheck,
  Network,
  GitBranch,
  Zap
} from "lucide-react";
import { organizationService, Organization, HierarchyLevel, OrganizationMember } from "@/services/organizationService";

interface HierarchyConnection {
  fromLevel: number;
  toLevel: number;
  type: 'escalation' | 'delegation' | 'collaboration' | 'reporting';
  conditions: string[];
  autoTrigger: boolean;
  notificationRequired: boolean;
}

interface HierarchyManagerProps {
  organization: Organization;
  onUpdate: (updatedOrg: Organization) => void;
}

export const HierarchyManager = ({ organization, onUpdate }: HierarchyManagerProps) => {
  const [selectedLevel, setSelectedLevel] = useState<HierarchyLevel | null>(null);
  const [editingLevel, setEditingLevel] = useState<HierarchyLevel | null>(null);
  const [connections, setConnections] = useState<HierarchyConnection[]>([]);
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditLevel, setShowEditLevel] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  
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

  useEffect(() => {
    generateConnections();
  }, [organization]);

  const generateConnections = () => {
    const conns: HierarchyConnection[] = [];
    
    // Generate escalation connections
    for (let i = 0; i < organization.hierarchy.length - 1; i++) {
      conns.push({
        fromLevel: i,
        toLevel: i + 1,
        type: 'escalation',
        conditions: ['time_threshold_exceeded', 'priority_critical', 'manual_escalation'],
        autoTrigger: true,
        notificationRequired: true
      });
    }

    // Generate delegation connections (downward)
    for (let i = 1; i < organization.hierarchy.length; i++) {
      conns.push({
        fromLevel: i,
        toLevel: i - 1,
        type: 'delegation',
        conditions: ['workload_distribution', 'expertise_match', 'availability'],
        autoTrigger: false,
        notificationRequired: true
      });
    }

    // Generate collaboration connections (same level)
    organization.hierarchy.forEach((level, index) => {
      if (level.roles.length > 1) {
        conns.push({
          fromLevel: index,
          toLevel: index,
          type: 'collaboration',
          conditions: ['peer_consultation', 'knowledge_sharing', 'workload_balancing'],
          autoTrigger: false,
          notificationRequired: false
        });
      }
    });

    setConnections(conns);
  };

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
    setNewLevel({
      level: organization.hierarchy.length + 1,
      name: '',
      roles: [],
      permissions: [],
      responseTimeSLA: 24,
      escalationThreshold: 48
    });
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

  const editLevel = (level: HierarchyLevel) => {
    setEditingLevel(level);
    setShowEditLevel(true);
  };

  const saveEditedLevel = () => {
    if (!editingLevel) return;
    
    const levelIndex = organization.hierarchy.findIndex(l => l.level === editingLevel.level);
    if (levelIndex !== -1) {
      updateLevel(levelIndex, editingLevel);
    }
    
    setEditingLevel(null);
    setShowEditLevel(false);
  };

  const addRoleToLevel = (levelIndex: number, role: string) => {
    if (!role.trim()) return;
    
    const level = organization.hierarchy[levelIndex];
    const updatedRoles = [...level.roles, role.trim()];
    updateLevel(levelIndex, { roles: updatedRoles });
  };

  const removeRoleFromLevel = (levelIndex: number, roleIndex: number) => {
    const level = organization.hierarchy[levelIndex];
    const updatedRoles = level.roles.filter((_, index) => index !== roleIndex);
    updateLevel(levelIndex, { roles: updatedRoles });
  };

  const addPermissionToLevel = (levelIndex: number, permission: string) => {
    if (!permission.trim()) return;
    
    const level = organization.hierarchy[levelIndex];
    const updatedPermissions = [...level.permissions, permission.trim()];
    updateLevel(levelIndex, { permissions: updatedPermissions });
  };

  const removePermissionFromLevel = (levelIndex: number, permissionIndex: number) => {
    const level = organization.hierarchy[levelIndex];
    const updatedPermissions = level.permissions.filter((_, index) => index !== permissionIndex);
    updateLevel(levelIndex, { permissions: updatedPermissions });
  };

  const getConnectionColor = (type: string) => {
    switch (type) {
      case 'escalation': return 'text-red-500 bg-red-50 border-red-200';
      case 'delegation': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'collaboration': return 'text-green-500 bg-green-50 border-green-200';
      case 'reporting': return 'text-purple-500 bg-purple-50 border-purple-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'escalation': return <ArrowUp className="h-4 w-4" />;
      case 'delegation': return <ArrowDown className="h-4 w-4" />;
      case 'collaboration': return <Network className="h-4 w-4" />;
      case 'reporting': return <GitBranch className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
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
      {/* Hierarchy Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organizational Hierarchy
              </CardTitle>
              <CardDescription>
                {organization.name} - {organization.hierarchy.length} levels, {organization.members.length} members
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowConnections(!showConnections)}>
                <Network className="h-4 w-4 mr-2" />
                {showConnections ? 'Hide' : 'Show'} Connections
              </Button>
              <Dialog open={showAddLevel} onOpenChange={setShowAddLevel}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Level
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Hierarchy Level</DialogTitle>
                    <DialogDescription>
                      Create a new level in the organizational hierarchy
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
                        <Label>Level Name</Label>
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
        <CardContent>
          <div className="space-y-4">
            {organization.hierarchy.map((level, index) => {
              const members = getMembersAtLevel(level.level);
              const isSelected = selectedLevel?.level === level.level;

              return (
                <div key={level.level}>
                  <Card 
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedLevel(isSelected ? null : level)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="outline">Level {level.level}</Badge>
                            <h3 className="font-semibold text-lg">{level.name}</h3>
                            <Badge variant="secondary">{members.length} members</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>Response: {level.responseTimeSLA}h</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Zap className="h-4 w-4 text-muted-foreground" />
                              <span>Escalation: {level.escalationThreshold}h</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{level.roles.length} roles</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span>{level.permissions.length} permissions</span>
                            </div>
                          </div>

                          {/* Roles */}
                          <div className="mb-3">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Roles:</p>
                            <div className="flex flex-wrap gap-1">
                              {level.roles.map((role, roleIndex) => (
                                <Badge key={roleIndex} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Permissions */}
                          <div className="mb-3">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Permissions:</p>
                            <div className="flex flex-wrap gap-1">
                              {level.permissions.map((permission, permIndex) => (
                                <Badge key={permIndex} variant="secondary" className="text-xs flex items-center gap-1">
                                  {getPermissionIcon(permission)}
                                  {permission.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Members */}
                          {members.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Members:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {members.slice(0, 4).map((member) => (
                                  <div key={member.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
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
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Plus className="h-3 w-3 mr-1" />
                                Add Member
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Team Member</DialogTitle>
                                <DialogDescription>
                                  Add a new member to {level.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                      value={newMember.name || ''}
                                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                      placeholder="Full name"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Email</Label>
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
                                      onValueChange={(value) => setNewMember({ ...newMember, role: value, level: level.level })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {level.roles.map(role => (
                                          <SelectItem key={role} value={role}>
                                            {role}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Select
                                      value={newMember.department || ''}
                                      onValueChange={(value) => setNewMember({ ...newMember, department: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {organization.departments.map(dept => (
                                          <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Phone (optional)</Label>
                                  <Input
                                    value={newMember.phone || ''}
                                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                                    placeholder="+1234567890"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={addMember}>Add Member</Button>
                                  <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Connection Arrows */}
                  {index < organization.hierarchy.length - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ArrowUp className="h-4 w-4" />
                        <span className="text-xs">Escalates to</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Interconnectivity Map */}
      {showConnections && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Hierarchy Interconnections
            </CardTitle>
            <CardDescription>
              Visual representation of connections and workflows between hierarchy levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connections.map((connection, index) => {
                const fromLevel = organization.hierarchy.find(l => l.level === connection.fromLevel);
                const toLevel = organization.hierarchy.find(l => l.level === connection.toLevel);

                return (
                  <Card key={index} className={`border-l-4 ${getConnectionColor(connection.type)}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getConnectionIcon(connection.type)}
                            <span className="font-semibold capitalize">{connection.type}</span>
                            <Badge variant="outline">
                              {fromLevel?.name} → {toLevel?.name}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Conditions:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {connection.conditions.map((condition, condIndex) => (
                                  <Badge key={condIndex} variant="secondary" className="text-xs">
                                    {condition.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Auto Trigger:</span>
                              <div className="mt-1">
                                <Badge variant={connection.autoTrigger ? "success" : "outline"}>
                                  {connection.autoTrigger ? "Yes" : "No"}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Notifications:</span>
                              <div className="mt-1">
                                <Badge variant={connection.notificationRequired ? "info" : "outline"}>
                                  {connection.notificationRequired ? "Required" : "Optional"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Hours & SLA Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Hours & SLA Configuration
          </CardTitle>
          <CardDescription>
            Configure working hours and service level agreements for each hierarchy level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organization.hierarchy.map((level, index) => (
              <Card key={level.level} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">{level.name}</h4>
                    <Badge variant="outline">Level {level.level}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm">Business Hours</Label>
                      <div className="text-sm font-medium">
                        {level.businessHours.start} - {level.businessHours.end}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {level.businessHours.timezone}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Working Days</Label>
                      <div className="text-sm font-medium">
                        {level.businessHours.workdays.length} days/week
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mon-{level.businessHours.workdays.includes(6) ? 'Sat' : 'Fri'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Response SLA</Label>
                      <div className="text-sm font-medium text-info">
                        {level.responseTimeSLA} hours
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Escalation Threshold</Label>
                      <div className="text-sm font-medium text-warning">
                        {level.escalationThreshold} hours
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};