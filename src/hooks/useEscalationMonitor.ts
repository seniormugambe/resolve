import { useState, useEffect, useCallback } from 'react';
import { escalationService } from '@/services/escalationService';
import { analyticsService } from '@/services/analyticsService';

export interface EscalationAlert {
  complaintId: string;
  currentLevel: number;
  suggestedLevel: number;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeElapsed: number;
}

export const useEscalationMonitor = (complaints: any[], intervalMs: number = 60000) => {
  const [alerts, setAlerts] = useState<EscalationAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const checkEscalations = useCallback(async () => {
    if (!complaints.length) return;

    const newAlerts: EscalationAlert[] = [];

    for (const complaint of complaints) {
      try {
        const escalationCheck = await escalationService.checkEscalation(complaint);
        
        if (escalationCheck.shouldEscalate) {
          const timeElapsed = (new Date().getTime() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60);
          
          newAlerts.push({
            complaintId: complaint.id,
            currentLevel: complaint.escalationLevel || 0,
            suggestedLevel: escalationCheck.newLevel || 1,
            reason: escalationCheck.reason || 'Time threshold exceeded',
            urgency: complaint.priority === 'critical' ? 'critical' :
                    complaint.priority === 'high' ? 'high' :
                    complaint.priority === 'medium' ? 'medium' : 'low',
            timeElapsed: Math.round(timeElapsed * 10) / 10
          });

          // Create audit trail for escalation alert
          await analyticsService.createAuditEntry(
            complaint.id,
            'escalation_alert_generated',
            'system',
            {
              currentLevel: complaint.escalationLevel,
              suggestedLevel: escalationCheck.newLevel,
              reason: escalationCheck.reason,
              timeElapsed
            }
          );
        }
      } catch (error) {
        console.error(`Failed to check escalation for complaint ${complaint.id}:`, error);
      }
    }

    setAlerts(newAlerts);
  }, [complaints]);

  const escalateComplaint = useCallback(async (
    complaintId: string, 
    newLevel: number, 
    reason: string
  ) => {
    try {
      await escalationService.escalateComplaint(complaintId, newLevel, reason, 'manual');
      
      // Remove the alert after escalation
      setAlerts(prev => prev.filter(alert => alert.complaintId !== complaintId));
      
      // Create audit trail
      await analyticsService.createAuditEntry(
        complaintId,
        'complaint_escalated',
        'user',
        { newLevel, reason, triggeredBy: 'manual' }
      );

      return true;
    } catch (error) {
      console.error(`Failed to escalate complaint ${complaintId}:`, error);
      return false;
    }
  }, []);

  const dismissAlert = useCallback((complaintId: string) => {
    setAlerts(prev => prev.filter(alert => alert.complaintId !== complaintId));
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Set up monitoring interval
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(checkEscalations, intervalMs);
    
    // Initial check
    checkEscalations();

    return () => clearInterval(interval);
  }, [isMonitoring, checkEscalations, intervalMs]);

  // Auto-start monitoring when complaints change
  useEffect(() => {
    if (complaints.length > 0 && !isMonitoring) {
      startMonitoring();
    }
  }, [complaints.length, isMonitoring, startMonitoring]);

  return {
    alerts,
    isMonitoring,
    escalateComplaint,
    dismissAlert,
    startMonitoring,
    stopMonitoring,
    checkEscalations
  };
};