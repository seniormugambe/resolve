// Analytics and Insights Service
export interface ComplaintMetrics {
  totalComplaints: number;
  averageResolutionTime: number;
  escalationRate: number;
  satisfactionScore: number;
  trendsData: TrendData[];
}

export interface TrendData {
  date: string;
  complaints: number;
  resolved: number;
  escalated: number;
  category: string;
}

export interface PredictiveInsight {
  type: 'trend' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  suggestedActions: string[];
}

export interface AuditTrail {
  id: string;
  complaintId: string;
  timestamp: Date;
  action: string;
  performedBy: string;
  details: Record<string, any>;
  hash?: string; // For blockchain-inspired immutability
}

class AnalyticsService {
  private auditTrail: AuditTrail[] = [];

  async getComplaintMetrics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ComplaintMetrics> {
    // Simulate analytics calculation
    const mockMetrics: ComplaintMetrics = {
      totalComplaints: 156,
      averageResolutionTime: 18.5, // hours
      escalationRate: 0.23, // 23%
      satisfactionScore: 4.2, // out of 5
      trendsData: this.generateTrendData(timeRange)
    };

    return mockMetrics;
  }

  private generateTrendData(timeRange: string): TrendData[] {
    const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const data: TrendData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        complaints: Math.floor(Math.random() * 20) + 5,
        resolved: Math.floor(Math.random() * 15) + 3,
        escalated: Math.floor(Math.random() * 5) + 1,
        category: 'all'
      });
    }

    return data;
  }

  async getPredictiveInsights(complaints: any[]): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Analyze complaint patterns
    const categoryCount = this.analyzeCategoryTrends(complaints);
    const timePatterns = this.analyzeTimePatterns(complaints);
    const escalationPatterns = this.analyzeEscalationPatterns(complaints);

    // Generate insights based on patterns
    if (categoryCount.technical > categoryCount.billing * 2) {
      insights.push({
        type: 'trend',
        title: 'Rising Technical Issues',
        description: 'Technical complaints are increasing significantly compared to other categories.',
        confidence: 0.85,
        impact: 'high',
        suggestedActions: [
          'Review recent system deployments',
          'Increase technical support capacity',
          'Implement proactive monitoring'
        ]
      });
    }

    if (escalationPatterns.highEscalationRate) {
      insights.push({
        type: 'anomaly',
        title: 'High Escalation Rate Detected',
        description: 'Complaints are escalating more frequently than normal.',
        confidence: 0.78,
        impact: 'medium',
        suggestedActions: [
          'Review first-level support training',
          'Analyze common escalation triggers',
          'Improve initial response procedures'
        ]
      });
    }

    insights.push({
      type: 'recommendation',
      title: 'Optimize Response Times',
      description: 'Implementing automated responses could reduce initial response time by 40%.',
      confidence: 0.92,
      impact: 'medium',
      suggestedActions: [
        'Deploy chatbot for common queries',
        'Create automated acknowledgment system',
        'Implement smart routing based on complaint type'
      ]
    });

    return insights;
  }

  private analyzeCategoryTrends(complaints: any[]) {
    return complaints.reduce((acc, complaint) => {
      acc[complaint.category] = (acc[complaint.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private analyzeTimePatterns(complaints: any[]) {
    // Analyze complaint submission patterns by time
    const hourlyPattern = complaints.reduce((acc, complaint) => {
      const hour = new Date(complaint.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return { hourlyPattern };
  }

  private analyzeEscalationPatterns(complaints: any[]) {
    const totalComplaints = complaints.length;
    const escalatedComplaints = complaints.filter(c => c.escalationLevel > 0).length;
    const escalationRate = escalatedComplaints / totalComplaints;

    return {
      escalationRate,
      highEscalationRate: escalationRate > 0.3 // 30% threshold
    };
  }

  async createAuditEntry(
    complaintId: string,
    action: string,
    performedBy: string,
    details: Record<string, any>
  ): Promise<AuditTrail> {
    const entry: AuditTrail = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      complaintId,
      timestamp: new Date(),
      action,
      performedBy,
      details,
      hash: this.generateHash(complaintId, action, performedBy, details)
    };

    this.auditTrail.push(entry);
    return entry;
  }

  private generateHash(complaintId: string, action: string, performedBy: string, details: Record<string, any>): string {
    // Simple hash generation - in production would use proper cryptographic hashing
    const data = JSON.stringify({ complaintId, action, performedBy, details, timestamp: Date.now() });
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  async getAuditTrail(complaintId?: string): Promise<AuditTrail[]> {
    if (complaintId) {
      return this.auditTrail.filter(entry => entry.complaintId === complaintId);
    }
    return [...this.auditTrail];
  }

  async verifyAuditIntegrity(entry: AuditTrail): Promise<boolean> {
    const expectedHash = this.generateHash(
      entry.complaintId,
      entry.action,
      entry.performedBy,
      entry.details
    );
    return entry.hash === expectedHash;
  }

  async generateReport(type: 'summary' | 'detailed' | 'trends', timeRange: string = 'month') {
    const metrics = await this.getComplaintMetrics(timeRange as any);
    
    const report = {
      generatedAt: new Date(),
      type,
      timeRange,
      metrics,
      summary: {
        totalComplaints: metrics.totalComplaints,
        avgResolutionTime: `${metrics.averageResolutionTime} hours`,
        escalationRate: `${(metrics.escalationRate * 100).toFixed(1)}%`,
        satisfactionScore: `${metrics.satisfactionScore}/5.0`
      }
    };

    // Create audit entry for report generation
    await this.createAuditEntry(
      'system',
      'report_generated',
      'system',
      { reportType: type, timeRange }
    );

    return report;
  }
}

export const analyticsService = new AnalyticsService();