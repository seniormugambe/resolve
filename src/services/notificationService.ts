// Real-time Notification Service
export interface NotificationPayload {
  id: string;
  type: 'escalation' | 'new_complaint' | 'status_update' | 'system_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface NotificationSubscriber {
  id: string;
  callback: (notification: NotificationPayload) => void;
  filters?: {
    types?: string[];
    priorities?: string[];
  };
}

class NotificationService {
  private subscribers: Map<string, NotificationSubscriber> = new Map();
  private notifications: NotificationPayload[] = [];
  private maxNotifications = 100;

  subscribe(subscriber: NotificationSubscriber): () => void {
    this.subscribers.set(subscriber.id, subscriber);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriber.id);
    };
  }

  notify(payload: Omit<NotificationPayload, 'id' | 'timestamp'>): void {
    const notification: NotificationPayload = {
      ...payload,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // Store notification
    this.notifications.unshift(notification);
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Notify subscribers
    this.subscribers.forEach(subscriber => {
      if (this.shouldNotifySubscriber(subscriber, notification)) {
        try {
          subscriber.callback(notification);
        } catch (error) {
          console.error(`Error notifying subscriber ${subscriber.id}:`, error);
        }
      }
    });

    // Browser notification for high priority
    if (notification.priority === 'critical' || notification.priority === 'high') {
      this.showBrowserNotification(notification);
    }
  }

  private shouldNotifySubscriber(subscriber: NotificationSubscriber, notification: NotificationPayload): boolean {
    const { filters } = subscriber;
    if (!filters) return true;

    if (filters.types && !filters.types.includes(notification.type)) {
      return false;
    }

    if (filters.priorities && !filters.priorities.includes(notification.priority)) {
      return false;
    }

    return true;
  }

  private async showBrowserNotification(notification: NotificationPayload): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return;
    }

    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical'
      });
    }
  }

  getNotifications(limit?: number): NotificationPayload[] {
    return limit ? this.notifications.slice(0, limit) : [...this.notifications];
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.data) {
      notification.data.read = true;
    }
  }

  clearNotifications(): void {
    this.notifications = [];
  }

  // Predefined notification templates
  notifyEscalation(complaintId: string, fromLevel: number, toLevel: number, reason: string): void {
    this.notify({
      type: 'escalation',
      title: 'Complaint Escalated',
      message: `Complaint ${complaintId} escalated from level ${fromLevel} to ${toLevel}. Reason: ${reason}`,
      priority: toLevel >= 3 ? 'critical' : toLevel >= 2 ? 'high' : 'medium',
      data: { complaintId, fromLevel, toLevel, reason },
      actions: [
        {
          id: 'view',
          label: 'View Complaint',
          action: () => console.log(`Navigate to complaint ${complaintId}`)
        }
      ]
    });
  }

  notifyNewComplaint(complaintId: string, title: string, priority: string): void {
    this.notify({
      type: 'new_complaint',
      title: 'New Complaint Received',
      message: `${title} (Priority: ${priority})`,
      priority: priority === 'critical' ? 'critical' : 
               priority === 'high' ? 'high' : 'medium',
      data: { complaintId, title, priority },
      actions: [
        {
          id: 'assign',
          label: 'Assign',
          action: () => console.log(`Assign complaint ${complaintId}`)
        },
        {
          id: 'view',
          label: 'View',
          action: () => console.log(`View complaint ${complaintId}`)
        }
      ]
    });
  }

  notifyStatusUpdate(complaintId: string, oldStatus: string, newStatus: string): void {
    this.notify({
      type: 'status_update',
      title: 'Complaint Status Updated',
      message: `Complaint ${complaintId} status changed from ${oldStatus} to ${newStatus}`,
      priority: newStatus === 'resolved' ? 'low' : 'medium',
      data: { complaintId, oldStatus, newStatus }
    });
  }

  notifySystemAlert(message: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    this.notify({
      type: 'system_alert',
      title: 'System Alert',
      message,
      priority,
      data: { source: 'system' }
    });
  }

  // Email notification simulation
  async sendEmailNotification(
    recipients: string[], 
    subject: string, 
    body: string, 
    attachments?: string[]
  ): Promise<boolean> {
    // Simulate email sending
    console.log('Sending email notification:', {
      recipients,
      subject,
      body,
      attachments
    });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      this.notify({
        type: 'system_alert',
        title: 'Email Sent',
        message: `Email notification sent to ${recipients.length} recipient(s)`,
        priority: 'low',
        data: { recipients, subject }
      });
    } else {
      this.notify({
        type: 'system_alert',
        title: 'Email Failed',
        message: `Failed to send email to ${recipients.length} recipient(s)`,
        priority: 'high',
        data: { recipients, subject, error: 'SMTP connection failed' }
      });
    }

    return success;
  }

  // SMS notification simulation
  async sendSMSNotification(phoneNumbers: string[], message: string): Promise<boolean> {
    console.log('Sending SMS notification:', { phoneNumbers, message });

    await new Promise(resolve => setTimeout(resolve, 500));

    const success = Math.random() > 0.05; // 95% success rate

    if (success) {
      this.notify({
        type: 'system_alert',
        title: 'SMS Sent',
        message: `SMS notification sent to ${phoneNumbers.length} recipient(s)`,
        priority: 'low',
        data: { phoneNumbers, message }
      });
    } else {
      this.notify({
        type: 'system_alert',
        title: 'SMS Failed',
        message: `Failed to send SMS to ${phoneNumbers.length} recipient(s)`,
        priority: 'medium',
        data: { phoneNumbers, message, error: 'SMS gateway error' }
      });
    }

    return success;
  }
}

export const notificationService = new NotificationService();