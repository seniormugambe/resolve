import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Users, 
  Network, 
  GitBranch, 
  Clock, 
  Shield, 
  Building2,
  Workflow,
  BarChart3
} from "lucide-react";
import { organizationService, Organization } from "@/services/organizationService";
import { HierarchyManager } from "@/components/HierarchyManager";
import { EditableHierarchyManager } from "@/components/EditableHierarchyManager";
import { HierarchyNetworkDiagram } from "@/components/HierarchyNetworkDiagram";

interface OrganizationalSettingsProps {
  currentOrganization: Organization | null;
}

export const OrganizationalSettings = ({ currentOrganization }: OrganizationalSettingsProps) => {
  const [organization, setOrganization] = useState<Organization | null>(currentOrganization);
  const [hierarchyStats, setHierarchyStats] = useState({
    totalLevels: 0,
    totalMembers: 0,
    totalDepartments: 0,
    avgMembersPerLevel: 0,
    hierarchyDepth: 0,
    spanOfControl: 0
  });

  useEffect(() => {
    setOrganization(currentOrganization);
    if (currentOrganization) {
      calculateHierarchyStats(currentOrganization);
    }
  }, [currentOrganization]);

  const calculateHierarchyStats = (org: Organization) => {
    const totalLevels = org.hierarchy.length;
    const totalMembers = org.members.length;
    const totalDepartments = org.departments.length;
    const avgMembersPerLevel = totalMembers / Math.max(totalLevels, 1);
    const hierarchyDepth = totalLevels;
    
    // Calculate span of control (average direct reports)
    let totalSpan = 0;
    let managersCount = 0;
    
    for (let i = 1; i < totalLevels; i++) {
      const managersAtLevel = org.members.filter(m => m.level === i).length;
      const subordinatesAtLevel = org.members.filter(m => m.level === i - 1).length;
      if (managersAtLevel > 0) {
        totalSpan += subordinatesAtLevel / managersAtLevel;
        managersCount++;
      }
    }
    
    const spanOfControl = managersCount > 0 ? totalSpan / managersCount : 0;

    setHierarchyStats({
      totalLevels,
      totalMembers,
      totalDepartments,
      avgMembersPerLevel: Math.round(avgMembersPerLevel * 10) / 10,
      hierarchyDepth,
      spanOfControl: Math.round(spanOfControl * 10) / 10
    });
  };

  const handleOrganizationUpdate = (updatedOrg: Organization) => {
    setOrganization(updatedOrg);
    organizationService.updateOrganization(updatedOrg.id, updatedOrg);
    calculateHierarchyStats(updatedOrg);
  };

  const getHierarchyHealthScore = () => {
    if (!organization) return 0;
    
    let score = 100;
    
    // Penalize for too many levels (over 5)
    if (hierarchyStats.totalLevels > 5) {
      score -= (hierarchyStats.totalLevels - 5) * 10;
    }
    
    // Penalize for too wide span of control (over 8)
    if (hierarchyStats.spanOfControl > 8) {
      score -= (hierarchyStats.spanOfControl - 8) * 5;
    }
    
    // Penalize for uneven distribution
    const levelDistribution = organization.hierarchy.map(level => 
      organization.members.filter(m => m.level === level.level).length
    );
    const maxMembers = Math.max(...levelDistribution);
    const minMembers = Math.min(...levelDistribution);
    if (maxMembers > 0 && (maxMembers / Math.max(minMembers, 1)) > 3) {
      score -= 15;
    }
    
    // Bonus for having departments
    if (hierarchyStats.totalDepartments > 0) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getRecommendations = () => {
    if (!organization) return [];
    
    const recommendations = [];
    
    if (hierarchyStats.totalLevels > 5) {
      recommendations.push({
        type: 'warning',
        title: 'Too Many Hierarchy Levels',
        description: 'Consider flattening the organization structure to improve communication and decision-making speed.',
        action: 'Reduce levels by combining similar roles or eliminating unnecessary management layers.'
      });
    }
    
    if (hierarchyStats.spanOfControl > 8) {
      recommendations.push({
        type: 'warning',
        title: 'Wide Span of Control',
        description: 'Some managers may be overloaded with too many direct reports.',
        action: 'Consider adding intermediate management levels or redistributing responsibilities.'
      });
    }
    
    if (hierarchyStats.spanOfControl < 3 && hierarchyStats.totalLevels > 2) {
      recommendations.push({
        type: 'info',
        title: 'Narrow Span of Control',
        description: 'The organization might be over-managed with too many management layers.',
        action: 'Consider flattening the structure to improve efficiency and reduce costs.'
      });
    }
    
    if (hierarchyStats.totalDepartments === 0) {
      recommendations.push({
        type: 'info',
        title: 'No Departments Defined',
        description: 'Creating departments can help organize work and improve specialization.',
        action: 'Define departments based on functional areas or expertise domains.'
      });
    }
    
    // Check for unbalanced levels
    const levelDistribution = organization.hierarchy.map(level => 
      organization.members.filter(m => m.level === level.level).length
    );
    const maxMembers = Math.max(...levelDistribution);
    const minMembers = Math.min(...levelDistribution);
    
    if (maxMembers > 0 && (maxMembers / Math.max(minMembers, 1)) > 3) {
      recommendations.push({
        type: 'warning',
        title: 'Unbalanced Level Distribution',
        description: 'Some hierarchy levels have significantly more members than others.',
        action: 'Consider redistributing members more evenly across levels or adjusting the structure.'
      });
    }
    
    return recommendations;
  };

  if (!organization) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organization Selected</h3>
            <p className="text-muted-foreground">
              Please select an organization to configure its hierarchical settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthScore = getHierarchyHealthScore();
  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Organizational Settings
              </CardTitle>
              <CardDescription>
                {organization.name} - Configure hierarchy, roles, and interconnections
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {organization.type.charAt(0).toUpperCase() + organization.type.slice(1)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Hierarchy Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{hierarchyStats.totalLevels}</div>
              <div className="text-sm text-muted-foreground">Hierarchy Levels</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-info">{hierarchyStats.totalMembers}</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{hierarchyStats.totalDepartments}</div>
              <div className="text-sm text-muted-foreground">Departments</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{hierarchyStats.avgMembersPerLevel}</div>
              <div className="text-sm text-muted-foreground">Avg per Level</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{hierarchyStats.spanOfControl}</div>
              <div className="text-sm text-muted-foreground">Span of Control</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-2 ${getHealthScoreColor(healthScore)}`}>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{healthScore}</div>
              <div className="text-sm text-muted-foreground">Health Score</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Organizational Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered suggestions to optimize your organizational structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <Card key={index} className={`border-l-4 ${
                  rec.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' : 'border-l-blue-500 bg-blue-50'
                }`}>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                    <p className="text-sm font-medium">{rec.action}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Configuration Tabs */}
      <Tabs defaultValue="hierarchy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hierarchy" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Hierarchy Management
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network Visualization
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflow Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy">
          <EditableHierarchyManager 
            organization={organization} 
            onUpdate={handleOrganizationUpdate}
          />
        </TabsContent>

        <TabsContent value="network">
          <HierarchyNetworkDiagram organization={organization} />
        </TabsContent>

        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Workflow Configuration
              </CardTitle>
              <CardDescription>
                Configure automated workflows and business processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Escalation Workflows */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Escalation Workflows</CardTitle>
                    <CardDescription>
                      Automated escalation paths based on complaint characteristics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {organization.hierarchy.map((level, index) => (
                        <div key={level.level} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{level.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Auto-escalate after {level.escalationThreshold} hours
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              SLA: {level.responseTimeSLA}h
                            </Badge>
                            {index < organization.hierarchy.length - 1 && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <GitBranch className="h-3 w-3" />
                                <span>→ Level {level.level + 1}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Department Routing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Department Routing</CardTitle>
                    <CardDescription>
                      Automatic routing based on complaint categories and expertise
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {organization.departments.map((dept) => (
                        <div key={dept.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{dept.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {dept.members.length} members, {dept.categories.length} categories
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {dept.categories.slice(0, 3).map((category, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                            {dept.categories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{dept.categories.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Business Hours Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Business Hours & SLA</CardTitle>
                    <CardDescription>
                      Configure working hours and service level agreements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Organization Timezone</Label>
                        <p className="text-sm">{organization.settings.timezone}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Default Business Hours</Label>
                        <p className="text-sm">
                          {organization.settings.businessHours.start} - {organization.settings.businessHours.end}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};