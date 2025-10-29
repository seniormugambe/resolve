// Smart Escalation Engine
export interface EscalationRule {
  id: string;
  name: string;
  conditions: {
    priority: string[];
    category: string[];
    timeThreshold: number; // hours
    statusRequired: string[];
    businessHoursOnly?: boolean;
    excludeWeekends?: boolean;
  };
  actions: {
    escalateToLevel: number;
    notifyRoles: string[];
    updateStatus?: string;
    requireApproval?: boolean;
    autoAssign?: boolean;
  };
}

export interface EscalationHistory {
  timestamp: Date;
  fromLevel: number;
  toLevel: number;
  reason: string;
  triggeredBy: 'system' | 'manual';
  notifiedUsers: string[];
}

export interface NotificationConfig {
  email: boolean;
  sms: boolean;
  dashboard: boolean;
  webhook?: string;
  slackChannel?: string;
  teamsChannel?: string;
}

export interface StakeholderGroup {
  id: string;
  name: string;
  level: number;
  members: StakeholderMember[];
  notificationPreferences: NotificationConfig;
  escalationThreshold: number; // hours
  businessHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
    timezone: string;
    workdays: number[]; // [1,2,3,4,5] for Mon-Fri
  };
}

export interface StakeholderMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  backupFor?: string[];
}

class EscalationService {
  private stakeholderGroups: StakeholderGroup[] = [
    {
      id: 'frontline',
      name: 'Frontline Support',
      level: 0,
      members: [
        { id: 'agent1', name: 'John Smith', email: 'john.smith@company.com', phone: '+1234567890', role: 'Support Agent', isActive: true },
        { id: 'agent2', name: 'Jane Doe', email: 'jane.doe@company.com', phone: '+1234567891', role: 'Support Agent', isActive: true },
        { id: 'agent3', name: 'Mike Johnson', email: 'mike.johnson@company.com', phone: '+1234567892', role: 'Senior Agent', isActive: true }
      ],
      notificationPreferences: { email: true, sms: false, dashboard: true },
      escalationThreshold: 4,
      businessHours: { start: '08:00', end: '18:00', timezone: 'UTC', workdays: [1,2,3,4,5] }
    },
    {
      id: 'supervisors',
      name: 'Team Supervisors',
      level: 1,
      members: [
        { id: 'sup1', name: 'Sarah Wilson', email: 'sarah.wilson@company.com', phone: '+1234567893', role: 'Team Supervisor', isActive: true },
        { id: 'sup2', name: 'David Brown', email: 'david.brown@company.com', phone: '+1234567894', role: 'Team Lead', isActive: true }
      ],
      notificationPreferences: { email: true, sms: true, dashboard: true },
      escalationThreshold: 8,
      businessHours: { start: '07:00', end: '19:00', timezone: 'UTC', workdays: [1,2,3,4,5] }
    },
    {
      id: 'managers',
      name: 'Department Managers',
      level: 2,
      members: [
        { id: 'mgr1', name: 'Lisa Anderson', email: 'lisa.anderson@company.com', phone: '+1234567895', role: 'Customer Service Manager', isActive: true },
        { id: 'mgr2', name: 'Robert Taylor', email: 'robert.taylor@company.com', phone: '+1234567896', role: 'Technical Manager', isActive: true }
      ],
      notificationPreferences: { email: true, sms: true, dashboard: true, slackChannel: '#management' },
      escalationThreshold: 24,
      businessHours: { start: '06:00', end: '20:00', timezone: 'UTC', workdays: [1,2,3,4,5,6] }
    },
    {
      id: 'executives',
      name: 'Executive Leadership',
      level: 3,
      members: [
        { id: 'ceo', name: 'Jennifer Martinez', email: 'ceo@company.com', phone: '+1234567897', role: 'CEO', isActive: true },
        { id: 'cto', name: 'Michael Davis', email: 'cto@company.com', phone: '+1234567898', role: 'CTO', isActive: true }
      ],
      notificationPreferences: { email: true, sms: true, dashboard: true, slackChannel: '#executive' },
      escalationThreshold: 72,
      businessHours: { start: '00:00', end: '23:59', timezone: 'UTC', workdays: [1,2,3,4,5,6,7] }
    }
  ];

  private rules: EscalationRule[] = [
    {
      id: 'critical-immediate',
      name: 'Critical Issues - Immediate Escalation',
      conditions: {
        priority: ['critical'],
        category: ['technical', 'service'],
        timeThreshold: 1, // 1 hour
        statusRequired: ['new', 'in-progress'],
        businessHoursOnly: false,
        excludeWeekends: false
      },
      actions: {
        escalateToLevel: 2,
        notifyRoles: ['supervisor', 'manager'],
        updateStatus: 'escalated',
        requireApproval: false,
        autoAssign: true
      }
    },
    {
      id: 'high-priority-escalation',
      name: 'High Priority - 4 Hour Rule',
      conditions: {
        priority: ['high'],
        category: ['technical', 'billing', 'service'],
        timeThreshold: 4,
        statusRequired: ['new', 'in-progress'],
        businessHoursOnly: true,
        excludeWeekends: false
      },
      actions: {
        escalateToLevel: 1,
        notifyRoles: ['supervisor'],
        autoAssign: true
      }
    },
    {
      id: 'standard-escalation',
      name: 'Standard Issues - 24 Hour Rule',
      conditions: {
        priority: ['medium'],
        category: ['technical', 'billing', 'service', 'product'],
        timeThreshold: 24,
        statusRequired: ['new', 'in-progress'],
        businessHoursOnly: true,
        excludeWeekends: true
      },
      actions: {
        escalateToLevel: 1,
        notifyRoles: ['supervisor'],
        autoAssign: false
      }
    },
    {
      id: 'executive-escalation',
      name: 'Executive Escalation - Unresolved Critical',
      conditions: {
        priority: ['critical'],
        category: ['technical', 'service'],
        timeThreshold: 8, // 8 hours at level 2
        statusRequired: ['escalated'],
        businessHoursOnly: false,
        excludeWeekends: false
      },
      actions: {
        escalateToLevel: 3,
        notifyRoles: ['executive', 'ceo'],
        updateStatus: 'escalated',
        requireApproval: true,
        autoAssign: true
      }
    }
  ];

  private hierarchyLevels = {
    0: { name: 'Frontline Support', roles: ['agent', 'support'] },
    1: { name: 'Supervisor Level', roles: ['supervisor', 'team-lead'] },
    2: { name: 'Management Level', roles: ['manager', 'department-head'] },
    3: { name: 'Executive Level', roles: ['executive', 'ceo', 'cto'] }
  };

  async checkEscalation(complaint: any): Promise<{
    shouldEscalate: boolean;
    newLevel?: number;
    reason?: string;
    notifications?: string[];
  }> {
    const now = new Date();
    const createdAt = new Date(complaint.createdAt);
    const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    for (const rule of this.rules) {
      if (this.matchesRule(complaint, rule, hoursElapsed)) {
        return {
          shouldEscalate: true,
          newLevel: rule.actions.escalateToLevel,
          reason: `${rule.name} - ${hoursElapsed.toFixed(1)} hours elapsed`,
          notifications: rule.actions.notifyRoles
        };
      }
    }

    return { shouldEscalate: false };
  }

  private matchesRule(complaint: any, rule: EscalationRule, hoursElapsed: number): boolean {
    // Check if complaint matches rule conditions
    const priorityMatch = rule.conditions.priority.includes(complaint.priority);
    const categoryMatch = rule.conditions.category.includes(complaint.category);
    const statusMatch = rule.conditions.statusRequired.includes(complaint.status);
    const levelMatch = complaint.escalationLevel < rule.actions.escalateToLevel;
    
    // Advanced time matching with business hours consideration
    const timeMatch = this.checkTimeThreshold(complaint.createdAt, rule.conditions, hoursElapsed);

    return priorityMatch && categoryMatch && statusMatch && timeMatch && levelMatch;
  }

  private checkTimeThreshold(createdAt: Date, conditions: EscalationRule['conditions'], hoursElapsed: number): boolean {
    // Basic time check
    if (hoursElapsed < conditions.timeThreshold) {
      return false;
    }

    // If business hours only, calculate business hours elapsed
    if (conditions.businessHoursOnly) {
      const businessHoursElapsed = this.calculateBusinessHoursElapsed(createdAt, conditions);
      return businessHoursElapsed >= conditions.timeThreshold;
    }

    // If weekends excluded, check if created on weekend and adjust
    if (conditions.excludeWeekends) {
      const adjustedHours = this.adjustForWeekends(createdAt, hoursElapsed);
      return adjustedHours >= conditions.timeThreshold;
    }

    return true;
  }

  private calculateBusinessHoursElapsed(createdAt: Date, conditions: EscalationRule['conditions']): number {
    const now = new Date();
    const created = new Date(createdAt);
    let businessHours = 0;
    
    // Simplified business hours calculation
    // In production, this would use a proper business hours library
    const msPerHour = 60 * 60 * 1000;
    const totalHours = (now.getTime() - created.getTime()) / msPerHour;
    
    // Rough estimate: assume 8 business hours per day, 5 days per week
    const businessDays = Math.floor(totalHours / 24) * (5/7); // Approximate business days
    const remainingHours = totalHours % 24;
    
    businessHours = businessDays * 8 + Math.min(remainingHours, 8);
    
    return Math.max(0, businessHours);
  }

  private adjustForWeekends(createdAt: Date, hoursElapsed: number): number {
    const created = new Date(createdAt);
    const dayOfWeek = created.getDay(); // 0 = Sunday, 6 = Saturday
    
    // If created on weekend, don't count weekend hours
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Simplified: reduce elapsed time by weekend hours
      const weekendHours = Math.min(hoursElapsed, 48); // Max 2 days
      return Math.max(0, hoursElapsed - weekendHours);
    }
    
    return hoursElapsed;
  }

  async escalateComplaint(
    complaintId: string, 
    newLevel: number, 
    reason: string,
    triggeredBy: 'system' | 'manual' = 'system'
  ): Promise<EscalationHistory> {
    const escalationRecord: EscalationHistory = {
      timestamp: new Date(),
      fromLevel: 0, // Would get from current complaint
      toLevel: newLevel,
      reason,
      triggeredBy,
      notifiedUsers: [] // Would be populated after sending notifications
    };

    // In a real implementation, this would:
    // 1. Update the complaint in the database
    // 2. Send notifications
    // 3. Create audit trail
    // 4. Update escalation history

    return escalationRecord;
  }

  async sendNotifications(
    complaintId: string,
    roles: string[],
    config: NotificationConfig = { email: true, sms: false, dashboard: true }
  ): Promise<void> {
    // Simulate notification sending
    console.log(`Sending notifications for complaint ${complaintId} to roles:`, roles);
    
    if (config.email) {
      await this.sendEmailNotifications(complaintId, roles);
    }
    
    if (config.sms) {
      await this.sendSMSNotifications(complaintId, roles);
    }
    
    if (config.dashboard) {
      await this.sendDashboardNotifications(complaintId, roles);
    }
    
    if (config.webhook) {
      await this.sendWebhookNotification(complaintId, config.webhook);
    }
  }

  private async sendEmailNotifications(complaintId: string, roles: string[]): Promise<void> {
    // Email notification implementation
    console.log(`Email notifications sent for complaint ${complaintId} to:`, roles);
  }

  private async sendSMSNotifications(complaintId: string, roles: string[]): Promise<void> {
    // SMS notification implementation
    console.log(`SMS notifications sent for complaint ${complaintId} to:`, roles);
  }

  private async sendDashboardNotifications(complaintId: string, roles: string[]): Promise<void> {
    // Dashboard notification implementation
    console.log(`Dashboard notifications sent for complaint ${complaintId} to:`, roles);
  }

  private async sendWebhookNotification(complaintId: string, webhookUrl: string): Promise<void> {
    // Webhook notification implementation
    console.log(`Webhook notification sent for complaint ${complaintId} to:`, webhookUrl);
  }

  getHierarchyLevel(level: number) {
    return this.hierarchyLevels[level as keyof typeof this.hierarchyLevels] || 
           { name: 'Unknown Level', roles: [] };
  }

  getAllRules(): EscalationRule[] {
    return [...this.rules];
  }

  addRule(rule: EscalationRule): void {
    this.rules.push(rule);
  }

  updateRule(ruleId: string, updates: Partial<EscalationRule>): void {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
    }
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  // Stakeholder Management
  getStakeholderGroups(): StakeholderGroup[] {
    return [...this.stakeholderGroups];
  }

  getStakeholderGroup(level: number): StakeholderGroup | undefined {
    return this.stakeholderGroups.find(group => group.level === level);
  }

  getAvailableStakeholders(level: number): StakeholderMember[] {
    const group = this.getStakeholderGroup(level);
    if (!group) return [];

    return group.members.filter(member => member.isActive);
  }

  // Intelligent Routing
  async routeComplaint(complaint: any): Promise<{
    assignedTo: StakeholderMember | null;
    escalationPath: number[];
    estimatedResolutionTime: number;
    recommendedActions: string[];
  }> {
    const currentLevel = complaint.escalationLevel || 0;
    const stakeholderGroup = this.getStakeholderGroup(currentLevel);
    
    if (!stakeholderGroup) {
      return {
        assignedTo: null,
        escalationPath: [],
        estimatedResolutionTime: 24,
        recommendedActions: ['Create stakeholder group for this level']
      };
    }

    // Find best available stakeholder based on workload, expertise, etc.
    const availableStakeholders = this.getAvailableStakeholders(currentLevel);
    const assignedTo = this.selectBestStakeholder(availableStakeholders, complaint);

    // Calculate escalation path
    const escalationPath = this.calculateEscalationPath(complaint);

    // Estimate resolution time based on priority and complexity
    const estimatedResolutionTime = this.estimateResolutionTime(complaint, currentLevel);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(complaint, stakeholderGroup);

    return {
      assignedTo,
      escalationPath,
      estimatedResolutionTime,
      recommendedActions
    };
  }

  private selectBestStakeholder(stakeholders: StakeholderMember[], complaint: any): StakeholderMember | null {
    if (stakeholders.length === 0) return null;

    // Simple round-robin for now
    // In production, this would consider:
    // - Current workload
    // - Expertise/specialization
    // - Availability/timezone
    // - Performance metrics
    const randomIndex = Math.floor(Math.random() * stakeholders.length);
    return stakeholders[randomIndex];
  }

  private calculateEscalationPath(complaint: any): number[] {
    const path = [];
    const maxLevel = Math.max(...this.stakeholderGroups.map(g => g.level));
    
    for (let level = complaint.escalationLevel + 1; level <= maxLevel; level++) {
      // Check if this level would be triggered by any rule
      const wouldEscalate = this.rules.some(rule => 
        rule.actions.escalateToLevel === level &&
        rule.conditions.priority.includes(complaint.priority) &&
        rule.conditions.category.includes(complaint.category)
      );
      
      if (wouldEscalate) {
        path.push(level);
      }
    }
    
    return path;
  }

  private estimateResolutionTime(complaint: any, currentLevel: number): number {
    const baseTime = {
      'critical': 2,
      'high': 8,
      'medium': 24,
      'low': 72
    };

    const levelMultiplier = {
      0: 1.5,  // Frontline takes longer
      1: 1.0,  // Supervisors are efficient
      2: 0.8,  // Managers have resources
      3: 0.5   // Executives get immediate attention
    };

    const base = baseTime[complaint.priority as keyof typeof baseTime] || 24;
    const multiplier = levelMultiplier[currentLevel as keyof typeof levelMultiplier] || 1;

    return Math.round(base * multiplier);
  }

  private generateRecommendedActions(complaint: any, stakeholderGroup: StakeholderGroup): string[] {
    const actions = [];

    // Priority-based recommendations
    if (complaint.priority === 'critical') {
      actions.push('Immediate response required within 1 hour');
      actions.push('Consider setting up war room for coordination');
      actions.push('Prepare executive briefing');
    } else if (complaint.priority === 'high') {
      actions.push('Respond within 4 hours');
      actions.push('Escalate if no progress within 8 hours');
    }

    // Category-based recommendations
    if (complaint.category === 'technical') {
      actions.push('Engage technical team for root cause analysis');
      actions.push('Check system monitoring for related issues');
    } else if (complaint.category === 'billing') {
      actions.push('Review account history and transactions');
      actions.push('Prepare refund/credit if applicable');
    }

    // Level-based recommendations
    if (stakeholderGroup.level >= 2) {
      actions.push('Consider process improvements to prevent recurrence');
      actions.push('Review escalation triggers for similar issues');
    }

    return actions;
  }

  // Advanced Notification Methods
  async sendMultiChannelNotification(
    stakeholderGroup: StakeholderGroup,
    complaint: any,
    escalationLevel: number,
    reason: string
  ): Promise<void> {
    const { notificationPreferences } = stakeholderGroup;

    const promises = [];

    if (notificationPreferences.email) {
      const emails = stakeholderGroup.members.map(m => m.email);
      promises.push(this.sendEmailNotifications(complaint.id, emails));
    }

    if (notificationPreferences.sms) {
      const phones = stakeholderGroup.members
        .filter(m => m.phone)
        .map(m => m.phone!);
      promises.push(this.sendSMSNotifications(complaint.id, phones));
    }

    if (notificationPreferences.dashboard) {
      promises.push(this.sendDashboardNotifications(complaint.id, stakeholderGroup.members.map(m => m.role)));
    }

    if (notificationPreferences.slackChannel) {
      promises.push(this.sendSlackNotification(complaint.id, notificationPreferences.slackChannel, escalationLevel, reason));
    }

    if (notificationPreferences.teamsChannel) {
      promises.push(this.sendTeamsNotification(complaint.id, notificationPreferences.teamsChannel, escalationLevel, reason));
    }

    await Promise.all(promises);
  }

  private async sendSlackNotification(complaintId: string, channel: string, level: number, reason: string): Promise<void> {
    console.log(`Slack notification sent to ${channel} for complaint ${complaintId} (Level ${level}): ${reason}`);
    // In production, integrate with Slack API
  }

  private async sendTeamsNotification(complaintId: string, channel: string, level: number, reason: string): Promise<void> {
    console.log(`Teams notification sent to ${channel} for complaint ${complaintId} (Level ${level}): ${reason}`);
    // In production, integrate with Microsoft Teams API
  }
}

export const escalationService = new EscalationService();