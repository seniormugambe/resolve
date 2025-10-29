import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Users, 
  Mail, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  Play,
  Pause
} from "lucide-react";
import { useEscalationMonitor } from "@/hooks/useEscalationMonitor";
import { escalationService } from "@/services/escalationService";
import { notificationService } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";

interface EscalationMonitorProps {
  complaints: any[];
}

export const EscalationMonitor = ({ complaints }: EscalationMonitorProps) => {
  const { 
    alerts, 
    isMonitoring, 
    escalateComplaint, 
    dismissAlert, 
    startMonitoring, 
    stopMonitoring 
  } = useEscalationMonitor(complaints, 30000); // Check every 30 seconds

  const [activeEscalations, setActiveEscalations] = useState<any[]>([]);
  const [escalationStats, setEscalationStats] = useState({
    totalActive: 0,
    criticalAlerts: 0,
    avgResponseTime: 0,
    escalationRate: 0
  });

  useEffect(() => {
    // Simulate active escalations data
    const active = complaints.filter(c => c.escalationLevel > 0);
    setActiveEscalations(active);

    // Calculate stats
    const criticalAlerts = alerts.filter(a => a.urgency === 'critical').length;
    const totalActive = active.length;
    const avgResponseTime = active.reduce((acc, c) => {
      const elapsed = (new Date().getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
      return acc + elapsed;
    }, 0) / Math.max(active.length, 1);

    const escalationRate = complaints.length > 0 ? (totalActive / complaints.length) * 100 : 0;

    setEscalationStats({
      totalActive,
      criticalAlerts,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      escalationRate: Math.round(escalationRate * 10) / 10
    });
  }, [complaints, alerts]);

  const handleEscalate = async (alert: any) => {
    const success = await escalateComplaint(
      alert.complaintId,
      alert.suggestedLevel,
      alert.reason
    );

    if (success) {
      // Send notifications
      const stakeholderGroup = escalationService.getStakeholderGroup(alert.suggestedLevel);
      if (stakeholderGroup) {
        await escalationService.sendMultiChannelNotification(
          stakeholderGroup,
          { id: alert.complaintId },
          alert.suggestedLevel,
          alert.reason
        );
      }

      notificationService.notifySystemAlert(
        `Complaint ${alert.complaintId} escalated to Level ${alert.suggestedLevel}`,
        'high'
      );
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTimeProgress = (createdAt: Date, threshold: number) => {
    const elapsed = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return Math.min((elapsed / threshold) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Monitor Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Escalation Monitor
              </CardTitle>
              <CardDescription>
                Real-time monitoring of complaint escalations and alerts
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
              >
                {isMonitoring ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Monitoring
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Monitoring
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{escalationStats.totalActive}</div>
              <div className="text-sm text-muted-foreground">Active Escalations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{escalationStats.criticalAlerts}</div>
              <div className="text-sm text-muted-foreground">Critical Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">{escalationStats.avgResponseTime}h</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{escalationStats.escalationRate}%</div>
              <div className="text-sm text-muted-foreground">Escalation Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Escalation Alerts ({alerts.length})
            </CardTitle>
            <CardDescription>
              Complaints requiring immediate escalation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert, index) => {
              const complaint = complaints.find(c => c.id === alert.complaintId);
              if (!complaint) return null;

              const timeProgress = getTimeProgress(complaint.createdAt, alert.timeElapsed);

              return (
                <Card key={index} className="border-l-4 border-l-warning">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{complaint.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{alert.reason}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alert.timeElapsed}h elapsed
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Level {alert.currentLevel} → {alert.suggestedLevel}
                          </div>
                          <Badge variant={getUrgencyColor(alert.urgency) as any}>
                            {alert.urgency}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEscalate(alert)}
                        >
                          Escalate Now
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => dismissAlert(alert.complaintId)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Time to escalation</span>
                        <span>{Math.round(timeProgress)}%</span>
                      </div>
                      <Progress value={timeProgress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Active Escalations */}
      {activeEscalations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Escalations ({activeEscalations.length})
            </CardTitle>
            <CardDescription>
              Complaints currently escalated through the hierarchy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeEscalations.map((complaint, index) => {
              const stakeholderGroup = escalationService.getStakeholderGroup(complaint.escalationLevel);
              const timeElapsed = formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true });

              return (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{complaint.title}</h4>
                          <Badge variant="info">Level {complaint.escalationLevel}</Badge>
                          <Badge variant={
                            complaint.priority === 'critical' ? 'destructive' :
                            complaint.priority === 'high' ? 'warning' : 'outline'
                          }>
                            {complaint.priority}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Assigned to:</span>
                            <div className="font-medium">
                              {stakeholderGroup?.name || 'Unassigned'}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Escalated:</span>
                            <div className="font-medium">{timeElapsed}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="font-medium capitalize">{complaint.status}</div>
                          </div>
                        </div>

                        {stakeholderGroup && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {stakeholderGroup.members.length} members
                              </div>
                              {stakeholderGroup.notificationPreferences.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  Email enabled
                                </div>
                              )}
                              {stakeholderGroup.notificationPreferences.sms && (
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  SMS enabled
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {complaint.escalationLevel < 3 && (
                          <Button size="sm">
                            Escalate Further
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* No Active Escalations */}
      {alerts.length === 0 && activeEscalations.length === 0 && (
        <Card className="border-success bg-success/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-success mb-2">All Clear</h3>
              <p className="text-muted-foreground">
                No escalation alerts or active escalations at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};