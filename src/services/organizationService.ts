// Multi-Organizational Management Service
export interface OrganizationType {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultHierarchy: HierarchyLevel[];
  defaultCategories: string[];
  defaultWorkflows: WorkflowTemplate[];
  customFields: CustomField[];
}

export interface HierarchyLevel {
  level: number;
  name: string;
  roles: string[];
  permissions: string[];
  responseTimeSLA: number; // hours
  escalationThreshold: number; // hours
  businessHours: BusinessHours;
}

export interface BusinessHours {
  start: string;
  end: string;
  timezone: string;
  workdays: number[];
  holidays: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  stages: WorkflowStage[];
  triggers: WorkflowTrigger[];
}

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  assignedLevel: number;
  requiredActions: string[];
  autoAdvanceConditions?: string[];
  maxDuration: number; // hours
}

export interface WorkflowTrigger {
  condition: string;
  action: string;
  parameters: Record<string, any>;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean';
  required: boolean;
  options?: string[];
  validation?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  description: string;
  logo?: string;
  settings: OrganizationSettings;
  hierarchy: HierarchyLevel[];
  members: OrganizationMember[];
  departments: Department[];
  workflows: WorkflowTemplate[];
  customFields: CustomField[];
  branding: BrandingConfig;
}

export interface OrganizationSettings {
  timezone: string;
  language: string;
  currency: string;
  businessHours: BusinessHours;
  notificationSettings: NotificationSettings;
  escalationSettings: EscalationSettings;
  complianceSettings: ComplianceSettings;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  slackEnabled: boolean;
  teamsEnabled: boolean;
  webhookUrl?: string;
  escalationNotifications: boolean;
  dailyDigest: boolean;
}

export interface EscalationSettings {
  autoEscalationEnabled: boolean;
  escalationMatrix: EscalationRule[];
  approvalRequired: boolean;
  executiveNotificationThreshold: number;
}

export interface ComplianceSettings {
  dataRetentionPeriod: number; // days
  auditTrailRequired: boolean;
  encryptionRequired: boolean;
  gdprCompliant: boolean;
  regulatoryFramework?: string;
}

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  level: number;
  department: string;
  permissions: string[];
  isActive: boolean;
  joinedAt: Date;
  lastActive?: Date;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  head: string; // member id
  members: string[]; // member ids
  categories: string[];
  specializations: string[];
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  favicon?: string;
  customCSS?: string;
  emailTemplate?: string;
}

export interface EscalationRule {
  id: string;
  name: string;
  organizationType: string;
  conditions: {
    priority: string[];
    category: string[];
    department?: string[];
    timeThreshold: number;
    statusRequired: string[];
    customFieldConditions?: Record<string, any>;
  };
  actions: {
    escalateToLevel: number;
    notifyRoles: string[];
    updateStatus?: string;
    assignToDepartment?: string;
    requireApproval?: boolean;
    customActions?: string[];
  };
}

class OrganizationService {
  private organizationTypes: OrganizationType[] = [
    {
      id: 'government',
      name: 'Government Agency',
      description: 'Citizen complaint redress systems',
      icon: 'Building2',
      defaultHierarchy: [
        {
          level: 0,
          name: 'Public Service Officers',
          roles: ['officer', 'clerk', 'assistant'],
          permissions: ['view_complaints', 'update_status', 'add_comments'],
          responseTimeSLA: 24,
          escalationThreshold: 72,
          businessHours: { start: '09:00', end: '17:00', timezone: 'UTC', workdays: [1,2,3,4,5], holidays: [] }
        },
        {
          level: 1,
          name: 'Department Supervisors',
          roles: ['supervisor', 'senior-officer'],
          permissions: ['view_complaints', 'update_status', 'assign_cases', 'approve_actions'],
          responseTimeSLA: 12,
          escalationThreshold: 48,
          businessHours: { start: '08:00', end: '18:00', timezone: 'UTC', workdays: [1,2,3,4,5], holidays: [] }
        },
        {
          level: 2,
          name: 'Department Heads',
          roles: ['department-head', 'director'],
          permissions: ['view_all_complaints', 'policy_decisions', 'resource_allocation'],
          responseTimeSLA: 6,
          escalationThreshold: 24,
          businessHours: { start: '07:00', end: '19:00', timezone: 'UTC', workdays: [1,2,3,4,5,6], holidays: [] }
        },
        {
          level: 3,
          name: 'Senior Leadership',
          roles: ['secretary', 'minister', 'commissioner'],
          permissions: ['executive_decisions', 'policy_changes', 'public_statements'],
          responseTimeSLA: 2,
          escalationThreshold: 12,
          businessHours: { start: '00:00', end: '23:59', timezone: 'UTC', workdays: [1,2,3,4,5,6,7], holidays: [] }
        }
      ],
      defaultCategories: ['public-services', 'infrastructure', 'taxation', 'licensing', 'welfare', 'law-enforcement'],
      defaultWorkflows: [],
      customFields: [
        { id: 'citizen_id', name: 'Citizen ID', type: 'text', required: true },
        { id: 'district', name: 'District', type: 'select', required: true, options: ['North', 'South', 'East', 'West', 'Central'] },
        { id: 'urgency_level', name: 'Urgency Level', type: 'select', required: true, options: ['Routine', 'Urgent', 'Emergency'] }
      ]
    },
    {
      id: 'corporate',
      name: 'Corporate Company',
      description: 'Employee and customer issue tracking',
      icon: 'Building',
      defaultHierarchy: [
        {
          level: 0,
          name: 'Support Representatives',
          roles: ['support-rep', 'customer-service', 'hr-assistant'],
          permissions: ['view_assigned_cases', 'update_status', 'communicate_with_customers'],
          responseTimeSLA: 4,
          escalationThreshold: 8,
          businessHours: { start: '08:00', end: '18:00', timezone: 'UTC', workdays: [1,2,3,4,5], holidays: [] }
        },
        {
          level: 1,
          name: 'Team Leaders',
          roles: ['team-lead', 'senior-rep', 'supervisor'],
          permissions: ['assign_cases', 'approve_resolutions', 'access_customer_data'],
          responseTimeSLA: 2,
          escalationThreshold: 4,
          businessHours: { start: '07:00', end: '19:00', timezone: 'UTC', workdays: [1,2,3,4,5], holidays: [] }
        },
        {
          level: 2,
          name: 'Department Managers',
          roles: ['manager', 'department-head', 'director'],
          permissions: ['policy_decisions', 'budget_approval', 'strategic_planning'],
          responseTimeSLA: 1,
          escalationThreshold: 2,
          businessHours: { start: '06:00', end: '20:00', timezone: 'UTC', workdays: [1,2,3,4,5,6], holidays: [] }
        },
        {
          level: 3,
          name: 'Executive Leadership',
          roles: ['vp', 'ceo', 'cto', 'cfo'],
          permissions: ['executive_decisions', 'company_policy', 'public_relations'],
          responseTimeSLA: 0.5,
          escalationThreshold: 1,
          businessHours: { start: '00:00', end: '23:59', timezone: 'UTC', workdays: [1,2,3,4,5,6,7], holidays: [] }
        }
      ],
      defaultCategories: ['technical-support', 'billing', 'hr-issues', 'product-feedback', 'compliance', 'security'],
      defaultWorkflows: [],
      customFields: [
        { id: 'employee_id', name: 'Employee ID', type: 'text', required: false },
        { id: 'customer_tier', name: 'Customer Tier', type: 'select', required: false, options: ['Bronze', 'Silver', 'Gold', 'Platinum'] },
        { id: 'business_impact', name: 'Business Impact', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Critical'] }
      ]
    },
    {
      id: 'education',
      name: 'Educational Institution',
      description: 'Student-teacher-admin issue escalation',
      icon: 'GraduationCap',
      defaultHierarchy: [
        {
          level: 0,
          name: 'Academic Staff',
          roles: ['teacher', 'instructor', 'teaching-assistant'],
          permissions: ['view_student_issues', 'grade_management', 'classroom_issues'],
          responseTimeSLA: 24,
          escalationThreshold: 48,
          businessHours: { start: '08:00', end: '16:00', timezone: 'UTC', workdays: [1,2,3,4,5], holidays: [] }
        },
        {
          level: 1,
          name: 'Department Coordinators',
          roles: ['coordinator', 'senior-teacher', 'department-secretary'],
          permissions: ['schedule_management', 'resource_allocation', 'student_records'],
          responseTimeSLA: 12,
          escalationThreshold: 24,
          businessHours: { start: '07:30', end: '17:00', timezone: 'UTC', workdays: [1,2,3,4,5], holidays: [] }
        },
        {
          level: 2,
          name: 'Department Heads',
          roles: ['department-head', 'dean', 'academic-director'],
          permissions: ['curriculum_decisions', 'faculty_management', 'budget_oversight'],
          responseTimeSLA: 6,
          escalationThreshold: 12,
          businessHours: { start: '07:00', end: '18:00', timezone: 'UTC', workdays: [1,2,3,4,5,6], holidays: [] }
        },
        {
          level: 3,
          name: 'Senior Administration',
          roles: ['principal', 'vice-chancellor', 'president'],
          permissions: ['institutional_policy', 'strategic_planning', 'external_relations'],
          responseTimeSLA: 2,
          escalationThreshold: 6,
          businessHours: { start: '06:00', end: '20:00', timezone: 'UTC', workdays: [1,2,3,4,5,6], holidays: [] }
        }
      ],
      defaultCategories: ['academic-issues', 'disciplinary', 'facilities', 'financial-aid', 'admissions', 'student-services'],
      defaultWorkflows: [],
      customFields: [
        { id: 'student_id', name: 'Student ID', type: 'text', required: false },
        { id: 'grade_level', name: 'Grade/Year', type: 'select', required: true, options: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'Undergraduate', 'Graduate'] },
        { id: 'subject_area', name: 'Subject Area', type: 'select', required: false, options: ['Mathematics', 'Science', 'English', 'History', 'Arts', 'Physical Education', 'Other'] }
      ]
    },
    {
      id: 'healthcare',
      name: 'Healthcare Institution',
      description: 'Patient feedback routing and medical issue escalation',
      icon: 'Heart',
      defaultHierarchy: [
        {
          level: 0,
          name: 'Patient Services',
          roles: ['patient-coordinator', 'receptionist', 'nurse'],
          permissions: ['patient_communication', 'appointment_management', 'basic_inquiries'],
          responseTimeSLA: 2,
          escalationThreshold: 4,
          businessHours: { start: '06:00', end: '22:00', timezone: 'UTC', workdays: [1,2,3,4,5,6,7], holidays: [] }
        },
        {
          level: 1,
          name: 'Clinical Supervisors',
          roles: ['charge-nurse', 'clinical-supervisor', 'department-coordinator'],
          permissions: ['clinical_decisions', 'staff_coordination', 'quality_assurance'],
          responseTimeSLA: 1,
          escalationThreshold: 2,
          businessHours: { start: '00:00', end: '23:59', timezone: 'UTC', workdays: [1,2,3,4,5,6,7], holidays: [] }
        },
        {
          level: 2,
          name: 'Medical Directors',
          roles: ['medical-director', 'department-head', 'chief-nurse'],
          permissions: ['medical_protocols', 'resource_allocation', 'quality_improvement'],
          responseTimeSLA: 0.5,
          escalationThreshold: 1,
          businessHours: { start: '00:00', end: '23:59', timezone: 'UTC', workdays: [1,2,3,4,5,6,7], holidays: [] }
        },
        {
          level: 3,
          name: 'Executive Leadership',
          roles: ['ceo', 'cmo', 'chief-of-staff'],
          permissions: ['institutional_policy', 'regulatory_compliance', 'public_relations'],
          responseTimeSLA: 0.25,
          escalationThreshold: 0.5,
          businessHours: { start: '00:00', end: '23:59', timezone: 'UTC', workdays: [1,2,3,4,5,6,7], holidays: [] }
        }
      ],
      defaultCategories: ['patient-care', 'billing-insurance', 'medical-records', 'safety-incidents', 'quality-of-care', 'accessibility'],
      defaultWorkflows: [],
      customFields: [
        { id: 'patient_id', name: 'Patient ID', type: 'text', required: false },
        { id: 'medical_record_number', name: 'Medical Record Number', type: 'text', required: false },
        { id: 'department', name: 'Department', type: 'select', required: true, options: ['Emergency', 'Surgery', 'Cardiology', 'Pediatrics', 'Oncology', 'Radiology', 'Laboratory', 'Administration'] },
        { id: 'incident_type', name: 'Incident Type', type: 'select', required: false, options: ['Safety', 'Quality', 'Communication', 'Billing', 'Access', 'Other'] }
      ]
    },
    {
      id: 'municipal',
      name: 'Municipal Council',
      description: 'Community issue resolution and civic services',
      icon: 'MapPin',
      defaultHierarchy: [
        {
          level: 0,
          name: 'Municipal Officers',
          roles: ['municipal-officer', 'clerk', 'field-inspector'],
          permissions: ['citizen_services', 'permit_processing', 'complaint_logging'],
          responseTimeSLA: 48,
          escalationThreshold: 120,
          businessHours: { start: '09:00', end: '17:00', timezone: 'UTC', workdays: [1,2,3,4,5], holidays: [] }
        },
        {
          level: 1,
          name: 'Department Supervisors',
          roles: ['supervisor', 'senior-officer', 'team-lead'],
          permissions: ['work_order_approval', 'resource_coordination', 'citizen_meetings'],
          responseTimeSLA: 24,
          escalationThreshold: 72,
          businessHours: { start: '08:00', end: '18:00', timezone: 'UTC', workdays: [1,2,3,4,5], holidays: [] }
        },
        {
          level: 2,
          name: 'Department Heads',
          roles: ['department-head', 'municipal-engineer', 'city-planner'],
          permissions: ['budget_decisions', 'policy_implementation', 'contractor_management'],
          responseTimeSLA: 12,
          escalationThreshold: 48,
          businessHours: { start: '07:00', end: '19:00', timezone: 'UTC', workdays: [1,2,3,4,5,6], holidays: [] }
        },
        {
          level: 3,
          name: 'Municipal Leadership',
          roles: ['mayor', 'city-manager', 'council-member'],
          permissions: ['policy_creation', 'public_statements', 'strategic_planning'],
          responseTimeSLA: 4,
          escalationThreshold: 24,
          businessHours: { start: '06:00', end: '22:00', timezone: 'UTC', workdays: [1,2,3,4,5,6,7], holidays: [] }
        }
      ],
      defaultCategories: ['infrastructure', 'utilities', 'public-safety', 'zoning-permits', 'waste-management', 'parks-recreation'],
      defaultWorkflows: [],
      customFields: [
        { id: 'address', name: 'Property Address', type: 'text', required: true },
        { id: 'ward_number', name: 'Ward Number', type: 'select', required: true, options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
        { id: 'service_type', name: 'Service Type', type: 'select', required: true, options: ['Water', 'Electricity', 'Roads', 'Waste', 'Parks', 'Building', 'Other'] },
        { id: 'location_coordinates', name: 'GPS Coordinates', type: 'text', required: false }
      ]
    }
  ];

  private organizations: Organization[] = [];
  private currentOrganization: Organization | null = null;

  getOrganizationTypes(): OrganizationType[] {
    return [...this.organizationTypes];
  }

  getOrganizationType(typeId: string): OrganizationType | undefined {
    return this.organizationTypes.find(type => type.id === typeId);
  }

  createOrganization(
    name: string,
    typeId: string,
    description: string,
    customizations?: Partial<Organization>
  ): Organization {
    const orgType = this.getOrganizationType(typeId);
    if (!orgType) {
      throw new Error(`Organization type ${typeId} not found`);
    }

    const organization: Organization = {
      id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: typeId,
      description,
      settings: {
        timezone: 'UTC',
        language: 'en',
        currency: 'USD',
        businessHours: orgType.defaultHierarchy[0].businessHours,
        notificationSettings: {
          emailEnabled: true,
          smsEnabled: false,
          slackEnabled: false,
          teamsEnabled: false,
          escalationNotifications: true,
          dailyDigest: true
        },
        escalationSettings: {
          autoEscalationEnabled: true,
          escalationMatrix: [],
          approvalRequired: false,
          executiveNotificationThreshold: 2
        },
        complianceSettings: {
          dataRetentionPeriod: 2555, // 7 years
          auditTrailRequired: true,
          encryptionRequired: true,
          gdprCompliant: true
        }
      },
      hierarchy: [...orgType.defaultHierarchy],
      members: [],
      departments: [],
      workflows: [...orgType.defaultWorkflows],
      customFields: [...orgType.customFields],
      branding: {
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b'
      },
      ...customizations
    };

    this.organizations.push(organization);
    return organization;
  }

  getOrganizations(): Organization[] {
    return [...this.organizations];
  }

  getOrganization(id: string): Organization | undefined {
    return this.organizations.find(org => org.id === id);
  }

  setCurrentOrganization(id: string): boolean {
    const org = this.getOrganization(id);
    if (org) {
      this.currentOrganization = org;
      return true;
    }
    return false;
  }

  getCurrentOrganization(): Organization | null {
    return this.currentOrganization;
  }

  updateOrganization(id: string, updates: Partial<Organization>): boolean {
    const index = this.organizations.findIndex(org => org.id === id);
    if (index !== -1) {
      this.organizations[index] = { ...this.organizations[index], ...updates };
      if (this.currentOrganization?.id === id) {
        this.currentOrganization = this.organizations[index];
      }
      return true;
    }
    return false;
  }

  addMember(organizationId: string, member: Omit<OrganizationMember, 'id' | 'joinedAt'>): OrganizationMember | null {
    const org = this.getOrganization(organizationId);
    if (!org) return null;

    const newMember: OrganizationMember = {
      ...member,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      joinedAt: new Date()
    };

    org.members.push(newMember);
    return newMember;
  }

  addDepartment(organizationId: string, department: Omit<Department, 'id'>): Department | null {
    const org = this.getOrganization(organizationId);
    if (!org) return null;

    const newDepartment: Department = {
      ...department,
      id: `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    org.departments.push(newDepartment);
    return newDepartment;
  }

  // Initialize with sample organizations
  initializeSampleOrganizations(): void {
    // Government Agency
    const govOrg = this.createOrganization(
      'City Public Services Department',
      'government',
      'Municipal government agency handling citizen complaints and service requests'
    );

    // Corporate Company
    const corpOrg = this.createOrganization(
      'TechCorp Solutions Inc.',
      'corporate',
      'Technology company providing software solutions and customer support'
    );

    // Educational Institution
    const eduOrg = this.createOrganization(
      'Metropolitan University',
      'education',
      'Large public university with multiple departments and student services'
    );

    // Healthcare Institution
    const healthOrg = this.createOrganization(
      'General Hospital Medical Center',
      'healthcare',
      'Regional hospital providing comprehensive medical services'
    );

    // Municipal Council
    const municOrg = this.createOrganization(
      'Riverside Municipal Council',
      'municipal',
      'Local municipal government serving community needs and infrastructure'
    );

    // Set the first organization as current
    this.setCurrentOrganization(govOrg.id);
  }
}

export const organizationService = new OrganizationService();