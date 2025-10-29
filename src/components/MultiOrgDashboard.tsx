import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Building, 
  GraduationCap, 
  Heart, 
  MapPin,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BarChart3
} from "lucide-react";
import { organizationService, Organization } from "@/services/organizationService";

interface MultiOrgDashboardProps {
  currentOrganization: Organization | null;
}

export const MultiOrgDashboard = ({ currentOrganization }: MultiOrgDashboardProps) => {
  const [orgStats, setOrgStats] = useState({
    totalComplaints: 0,
    activeEscalations: 0,
    avgResolutionTime: 0,
    satisfactionScore: 0,
    departmentBreakdown: [] as any[],
    hierarchyUtilization: [] as any[]
  });

  useEffect(() => {
    if (currentOrganization) {
      generateOrgStats(currentOrganization);
    }
  }, [currentOrganization]);

  const generateOrgStats = (org: Organization) => {
    // Simulate organization-specific statistics
    const baseComplaints = Math.floor(Math.random() * 500) + 100;
    const stats = {
      totalComplaints: baseComplaints,
      activeEscalations: Math.floor(baseComplaints * 0.15),
      avgResolutionTime: Math.random() * 48 + 12, // 12-60 hours
      satisfactionScore: Math.random() * 1.5 + 3.5, // 3.5-5.0
      departmentBreakdown: org.departments.map(dept => ({
        name: dept.name,
        complaints: Math.floor(Math.random() * 50) + 10,
        avgTime: Math.random() * 24 + 6
      })),
      hierarchyUtilization: org.hierarchy.map(level => ({
        level: level.level,
        name: level.name,
        activeComplaints: Math.floor(Math.random() * 30) + 5,
        responseTime: level.responseTimeSLA,
        utilization: Math.random() * 40 + 60 // 60-100%
      }))
    };
    setOrgStats(stats);
  };

  const getOrgTypeIcon = (typeId: string) => {
    switch (typeId) {
      case 'government': return <Building2 className="h-6 w-6" />;
      case 'corporate': return <Building className="h-6 w-6" />;
      case 'education': return <GraduationCap className="h-6 w-6" />;
      case 'healthcare': return <Heart className="h-6 w-6" />;
      case 'municipal': return <MapPin className="h-6 w-6" />;
      default: return <Building className="h-6 w-6" />;
    }
  };

  const getOrgTypeColor = (typeId: string) => {
    switch (typeId) {
      case 'government': return 'text-blue-500 bg-blue-500/10';
      case 'corporate': return 'text-green-500 bg-green-500/10';
      case 'education': return 'text-purple-500 bg-purple-500/10';
      case 'healthcare': return 'text-red-500 bg-red-500/10';
      case 'municipal': return 'text-orange-500 bg-orange-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getOrgSpecificMetrics = (orgType: string) => {
    switch (orgType) {
      case 'government':
        return [
          { label: 'Citizen Satisfaction', value: '87%', icon: CheckCircle2 },
          { label: 'Policy Compliance', value: '94%', icon: AlertTriangle },
          { label: 'Public Transparency', value: '91%', icon: Users },
          { label: 'Response SLA Met', value: '78%', icon: Clock }
        ];
      case 'corporate':
        return [
          { label: 'Customer Retention', value: '92%', icon: Users },
          { label: 'Revenue Impact', value: '$2.3M', icon: TrendingUp },
          { label: 'Employee Satisfaction', value: '85%', icon: CheckCircle2 },
          { label: 'SLA Compliance', value: '96%', icon: Clock }
        ];
      case 'education':
        return [
          { label: 'Student Satisfaction', value: '89%', icon: CheckCircle2 },
          { label: 'Parent Engagement', value: '76%', icon: Users },
          { label: 'Academic Impact', value: 'Low', icon: TrendingUp },
          { label: 'Resolution Rate', value: '94%', icon: AlertTriangle }
        ];
      case 'healthcare':
        return [
          { label: 'Patient Safety Score', value: '98%', icon: AlertTriangle },
          { label: 'Care Quality Index', value: '4.6/5', icon: CheckCircle2 },
          { label: 'Staff Response Time', value: '12min', icon: Clock },
          { label: 'Regulatory Compliance', value: '100%', icon: Users }
        ];
      case 'municipal':
        return [
          { label: 'Community Satisfaction', value: '82%', icon: Users },
          { label: 'Infrastructure Issues', value: '23', icon: AlertTriangle },
          { label: 'Service Delivery', value: '88%', icon: CheckCircle2 },
          { label: 'Budget Efficiency', value: '91%', icon: TrendingUp }
        ];
      default:
        return [];
    }
  };

  if (!currentOrganization) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organization Selected</h3>
            <p className="text-muted-foreground">
              Please select an organization to view the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const orgSpecificMetrics = getOrgSpecificMetrics(currentOrganization.type);

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <Card className={`border-l-4 ${getOrgTypeColor(currentOrganization.type)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${getOrgTypeColor(currentOrganization.type)}`}>
                {getOrgTypeIcon(currentOrganization.type)}
              </div>
              <div>
                <CardTitle className="text-xl">{currentOrganization.name}</CardTitle>
                <CardDescription className="text-base">
                  {currentOrganization.description}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {currentOrganization.type.charAt(0).toUpperCase() + currentOrganization.type.slice(1)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
                <p className="text-2xl font-bold">{orgStats.totalComplaints}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Escalations</p>
                <p className="text-2xl font-bold text-warning">{orgStats.activeEscalations}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Resolution</p>
                <p className="text-2xl font-bold">{orgStats.avgResolutionTime.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold text-success">{orgStats.satisfactionScore.toFixed(1)}/5</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization-Specific Metrics */}
      {orgSpecificMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Organization-Specific Metrics</CardTitle>
            <CardDescription>
              Key performance indicators relevant to {currentOrganization.type} organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {orgSpecificMetrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <metric.icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{metric.label}</p>
                    <p className="text-lg font-bold">{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hierarchy Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Hierarchy Utilization</CardTitle>
          <CardDescription>
            Current workload distribution across organizational levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orgStats.hierarchyUtilization.map((level, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Level {level.level}</Badge>
                  <div>
                    <p className="font-medium">{level.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {level.activeComplaints} active complaints
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{level.utilization.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">
                    SLA: {level.responseTime}h
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      {orgStats.departmentBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>
              Complaint volume and resolution times by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orgStats.departmentBreakdown.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{dept.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {dept.complaints} complaints this month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{dept.avgTime.toFixed(1)}h</p>
                    <p className="text-sm text-muted-foreground">avg resolution</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <CardDescription>
            Current organization settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Business Hours</p>
              <p className="text-sm">
                {currentOrganization.settings.businessHours.start} - {currentOrganization.settings.businessHours.end}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentOrganization.settings.timezone}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Notifications</p>
              <div className="flex gap-1">
                {currentOrganization.settings.notificationSettings.emailEnabled && (
                  <Badge variant="secondary" className="text-xs">Email</Badge>
                )}
                {currentOrganization.settings.notificationSettings.smsEnabled && (
                  <Badge variant="secondary" className="text-xs">SMS</Badge>
                )}
                {currentOrganization.settings.notificationSettings.slackEnabled && (
                  <Badge variant="secondary" className="text-xs">Slack</Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Compliance</p>
              <div className="flex gap-1">
                {currentOrganization.settings.complianceSettings.auditTrailRequired && (
                  <Badge variant="secondary" className="text-xs">Audit Trail</Badge>
                )}
                {currentOrganization.settings.complianceSettings.gdprCompliant && (
                  <Badge variant="secondary" className="text-xs">GDPR</Badge>
                )}
                {currentOrganization.settings.complianceSettings.encryptionRequired && (
                  <Badge variant="secondary" className="text-xs">Encrypted</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};