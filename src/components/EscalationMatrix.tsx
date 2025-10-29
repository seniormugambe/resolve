import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Clock, 
  ArrowUp, 
  Mail, 
  MessageSquare, 
  Bell,
  Settings,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Building2
} from "lucide-react";
import { escalationService, EscalationRule } from "@/services/escalationService";
import { notificationService } from "@/services/notificationService";
import { EscalationMonitor } from "@/components/EscalationMonitor";
import { OrganizationalSettings } from "@/components/OrganizationalSettings";
import { organizationService } from "@/services/organizationService";

interface HierarchyLevel {
  level: number;
  name: string;
  roles: string[];
  users: string[];
  responseTime: number; // hours
  escalationThreshold: number; // hours
}

interface EscalationMatrixProps {
  complaints?: any[];
}

export const EscalationMatrix = ({ complaints = [] }: EscalationMatrixProps) => {
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);

  useEffect(() => {
    // Initialize organization service and get current organization
    const initializeOrganization = () => {
      try {
        let org = organizationService.getCurrentOrganization();
        if (!org) {
          // Initialize sample organizations if none exist
          organizationService.initializeSampleOrganizations();
          org = organizationService.getCurrentOrganization();
        }
        setCurrentOrganization(org);
      } catch (error) {
        console.error('Failed to initialize organization:', error);
      }
    };

    initializeOrganization();
  }, []);
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyLevel[]>([
    {
      level: 0,
      name: "Frontline Support",
      roles: ["support-agent", "customer-service"],
      users: ["agent1@company.com", "agent2@company.com", "agent3@company.com"],
      responseTime: 2,
      escalationThreshold: 4
    },
    {
      level: 1,
      name: "Team Supervisors",
      roles: ["supervisor", "team-lead"],
      users: ["supervisor1@company.com", "supervisor2@company.com"],
      responseTime: 1,
      escalationThreshold: 8
    },
    {
      level: 2,
      name: "Department Managers",
      roles: ["manager", "department-head"],
      users: ["manager1@company.com", "manager2@company.com"],
      responseTime: 0.5,
      escalationThreshold: 24
    },
    {
      level: 3,
      name: "Executive Leadership",
      roles: ["executive", "ceo", "cto"],
      users: ["ceo@company.com", "cto@company.com"],
      responseTime: 0.25,
      escalationThreshold: 72
    }
  ]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRule, setSelectedRule] = useState<EscalationRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<EscalationRule>>({
    name: "",
    conditions: {
      priority: [],
      category: [],
      timeThreshold: 4,
      statusRequired: ["new", "in-progress"]
    },
    actions: {
      escalateToLevel: 1,
      notifyRoles: []
    }
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = () => {
    const existingRules = escalationService.getAllRules();
    setRules(existingRules);
  };

  const saveRule = () => {
    if (!newRule.name || !newRule.conditions || !newRule.actions) return;

    const rule: EscalationRule = {
      id: selectedRule?.id || `rule_${Date.now()}`,
      name: newRule.name,
      conditions: newRule.conditions,
      actions: newRule.actions
    } as EscalationRule;

    if (selectedRule) {
      escalationService.updateRule(selectedRule.id, rule);
    } else {
      escalationService.addRule(rule);
    }

    loadRules();
    resetForm();
    
    notificationService.notifySystemAlert(
      `Escalation rule "${rule.name}" ${selectedRule ? 'updated' : 'created'} successfully`,
      'low'
    );
  };

  const deleteRule = (ruleId: string) => {
    escalationService.removeRule(ruleId);
    loadRules();
    
    notificationService.notifySystemAlert(
      'Escalation rule deleted successfully',
      'low'
    );
  };

  const editRule = (rule: EscalationRule) => {
    setSelectedRule(rule);
    setNewRule(rule);
    setIsEditing(true);
  };

  const resetForm = () => {
    setSelectedRule(null);
    setIsEditing(false);
    setNewRule({
      name: "",
      conditions: {
        priority: [],
        category: [],
        timeThreshold: 4,
        statusRequired: ["new", "in-progress"]
      },
      actions: {
        escalateToLevel: 1,
        notifyRoles: []
      }
    });
  };

  const testEscalation = async (level: number) => {
    const testComplaint = {
      id: `test_${Date.now()}`,
      title: "Test Escalation",
      description: "Testing escalation system",
      category: "technical",
      priority: "high",
      status: "in-progress",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      escalationLevel: level - 1
    };

    const escalationCheck = await escalationService.checkEscalation(testComplaint);
    
    if (escalationCheck.shouldEscalate) {
      // Send test notifications
      const levelInfo = hierarchy.find(h => h.level === level);
      if (levelInfo) {
        await notificationService.sendEmailNotification(
          levelInfo.users,
          `Test Escalation - Level ${level}`,
          `This is a test escalation to ${levelInfo.name}. Complaint: ${testComplaint.title}`
        );
        
        notificationService.notifyEscalation(
          testComplaint.id,
          level - 1,
          level,
          "Test escalation triggered"
        );
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Organizational Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Organizational Hierarchy Settings
          </CardTitle>
          <CardDescription>
            {currentOrganization ? `Managing ${currentOrganization.name}` : 'Loading organization...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentOrganization ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{currentOrganization.hierarchy.length}</div>
                  <div className="text-sm text-muted-foreground">Hierarchy Levels</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">{currentOrganization.members.length}</div>
                  <div className="text-sm text-muted-foreground">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{currentOrganization.departments.length}</div>
                  <div className="text-sm text-muted-foreground">Departments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{currentOrganization.type}</div>
                  <div className="text-sm text-muted-foreground">Organization Type</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Hierarchy Levels:</h4>
                {currentOrganization.hierarchy.map((level, index) => (
                  <div key={level.level} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Badge variant="outline" className="mr-2">Level {level.level}</Badge>
                      <span className="font-medium">{level.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      SLA: {level.responseTimeSLA}h | Escalation: {level.escalationThreshold}h
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Initializing organization settings...</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Real-time Monitor */}
      <EscalationMonitor complaints={complaints} />
      {/* Hierarchy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Escalation Hierarchy
          </CardTitle>
          <CardDescription>
            Organizational structure for complaint escalation routing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hierarchy.map((level, index) => (
              <div key={level.level}>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">Level {level.level}</Badge>
                      <h3 className="font-semibold">{level.name}</h3>
                      <div className="flex gap-2">
                        {level.roles.map((role, roleIndex) => (
                          <Badge key={roleIndex} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {level.users.length} users assigned
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {level.responseTime}h response time
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        {level.escalationThreshold}h escalation threshold
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testEscalation(level.level)}
                    >
                      Test
                    </Button>
                  </div>
                </div>
                {index < hierarchy.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Escalation Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Escalation Rules
              </CardTitle>
              <CardDescription>
                Configure automatic escalation triggers and conditions
              </CardDescription>
            </div>
            <Button onClick={() => setIsEditing(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rule Form */}
          {isEditing && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedRule ? 'Edit' : 'Create'} Escalation Rule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input
                      value={newRule.name || ""}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      placeholder="e.g., Critical Issues - Immediate Escalation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Threshold (hours)</Label>
                    <Input
                      type="number"
                      value={newRule.conditions?.timeThreshold || 4}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        conditions: {
                          ...newRule.conditions!,
                          timeThreshold: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority Levels</Label>
                    <div className="flex flex-wrap gap-2">
                      {['low', 'medium', 'high', 'critical'].map(priority => (
                        <Button
                          key={priority}
                          variant={newRule.conditions?.priority?.includes(priority) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const currentPriorities = newRule.conditions?.priority || [];
                            const newPriorities = currentPriorities.includes(priority)
                              ? currentPriorities.filter(p => p !== priority)
                              : [...currentPriorities, priority];
                            setNewRule({
                              ...newRule,
                              conditions: { ...newRule.conditions!, priority: newPriorities }
                            });
                          }}
                        >
                          <Badge variant={getPriorityColor(priority) as any} className="mr-1 text-xs">
                            {priority}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Categories</Label>
                    <div className="flex flex-wrap gap-2">
                      {['technical', 'billing', 'service', 'product', 'other'].map(category => (
                        <Button
                          key={category}
                          variant={newRule.conditions?.category?.includes(category) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const currentCategories = newRule.conditions?.category || [];
                            const newCategories = currentCategories.includes(category)
                              ? currentCategories.filter(c => c !== category)
                              : [...currentCategories, category];
                            setNewRule({
                              ...newRule,
                              conditions: { ...newRule.conditions!, category: newCategories }
                            });
                          }}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Escalate to Level</Label>
                  <Select
                    value={newRule.actions?.escalateToLevel?.toString() || "1"}
                    onValueChange={(value) => setNewRule({
                      ...newRule,
                      actions: { ...newRule.actions!, escalateToLevel: parseInt(value) }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hierarchy.map(level => (
                        <SelectItem key={level.level} value={level.level.toString()}>
                          Level {level.level} - {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveRule}>
                    {selectedRule ? 'Update' : 'Create'} Rule
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Rules */}
          <div className="space-y-3">
            {rules.map((rule) => (
              <Card key={rule.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{rule.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Conditions:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rule.conditions.priority.map(p => (
                              <Badge key={p} variant={getPriorityColor(p) as any} className="text-xs">
                                {p}
                              </Badge>
                            ))}
                            {rule.conditions.category.map(c => (
                              <Badge key={c} variant="outline" className="text-xs">
                                {c}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time Threshold:</span>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {rule.conditions.timeThreshold}h
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Escalates to:</span>
                          <div className="mt-1">
                            <Badge variant="info">
                              Level {rule.actions.escalateToLevel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editRule(rule)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Configure how stakeholders are notified during escalations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-info/20 bg-info/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-info" />
                  <span className="font-medium">Email Notifications</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Automatic email alerts to relevant stakeholders
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Configure SMTP
                </Button>
              </CardContent>
            </Card>

            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-warning" />
                  <span className="font-medium">SMS Alerts</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Critical escalations via SMS for immediate attention
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Configure SMS Gateway
                </Button>
              </CardContent>
            </Card>

            <Card className="border-success/20 bg-success/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-4 w-4 text-success" />
                  <span className="font-medium">Dashboard Alerts</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Real-time notifications in the management dashboard
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Active
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};