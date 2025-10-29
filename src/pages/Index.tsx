import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplaintForm, ComplaintFormData } from "@/components/ComplaintForm";
import { Dashboard } from "@/components/Dashboard";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { NotificationCenter } from "@/components/NotificationCenter";
import { AIDemo } from "@/components/AIDemo";
import { EscalationMatrix } from "@/components/EscalationMatrix";
import { EscalationMatrixDebug } from "@/components/EscalationMatrixDebug";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { MultiOrgDashboard } from "@/components/MultiOrgDashboard";
import { Complaint } from "@/components/ComplaintCard";
import { Bot, Shield, TrendingUp, Zap, BarChart3, Brain, Users, Building2, Plus } from "lucide-react";
import { organizationService, Organization } from "@/services/organizationService";
import { notificationService } from "@/services/notificationService";
import { useEscalationMonitor } from "@/hooks/useEscalationMonitor";

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [showOrgSelector, setShowOrgSelector] = useState(false);


  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: "1",
      title: "Server downtime affecting production",
      description: "Our production servers have been experiencing intermittent downtime for the past 3 hours, affecting approximately 500 users.",
      category: "technical",
      priority: "critical",
      status: "escalated",
      contactName: "Sarah Johnson",
      contactEmail: "sarah.j@company.com",
      createdAt: new Date("2025-01-15T10:30:00"),
      escalationLevel: 2,
    },
    {
      id: "2",
      title: "Incorrect billing amount on invoice",
      description: "The latest invoice shows an amount that is $200 more than what was agreed upon in the contract.",
      category: "billing",
      priority: "high",
      status: "in-progress",
      contactName: "Michael Chen",
      contactEmail: "m.chen@business.com",
      createdAt: new Date("2025-01-14T14:20:00"),
      escalationLevel: 1,
    },
    {
      id: "3",
      title: "Product quality issue with recent shipment",
      description: "Received 50 units with manufacturing defects. Photos attached showing the damaged products.",
      category: "product",
      priority: "medium",
      status: "new",
      contactName: "Emily Rodriguez",
      contactEmail: "emily.r@retail.com",
      createdAt: new Date("2025-01-16T09:15:00"),
      escalationLevel: 0,
    },
  ]);

  // Initialize escalation monitoring
  const { alerts, escalateComplaint } = useEscalationMonitor(complaints);

  // Initialize organization service on component mount
  useEffect(() => {
    const initOrganizations = () => {
      try {
        const existingOrgs = organizationService.getOrganizations();
        if (existingOrgs.length === 0) {
          organizationService.initializeSampleOrganizations();
        }
        const current = organizationService.getCurrentOrganization();
        setCurrentOrganization(current);
        
        // If no organization is selected, show the selector
        if (!current) {
          setShowOrgSelector(true);
        } else {
          // If organization is already selected, go directly to dashboard
          setShowDashboard(true);
        }
      } catch (error) {
        console.error('Failed to initialize organizations:', error);
      }
    };

    initOrganizations();
  }, []);

  // Handle organization selection
  const handleOrganizationChange = (org: Organization | null) => {
    setCurrentOrganization(org);
    if (org) {
      setShowOrgSelector(false);
      setShowDashboard(true);
    }
  };

  // Send notifications for escalation alerts
  useEffect(() => {
    alerts.forEach(alert => {
      const complaint = complaints.find(c => c.id === alert.complaintId);
      if (complaint) {
        notificationService.notifyEscalation(
          complaint.id,
          alert.currentLevel,
          alert.suggestedLevel,
          alert.reason
        );
      }
    });
  }, [alerts, complaints]);

  const handleComplaintSubmit = (data: ComplaintFormData) => {
    const newComplaint: Complaint = {
      id: (complaints.length + 1).toString(),
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: "new",
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      createdAt: new Date(),
      escalationLevel: 0,
    };
    
    setComplaints([newComplaint, ...complaints]);
    setShowForm(false);
    setShowDashboard(true);

    // Send notification for new complaint
    notificationService.notifyNewComplaint(
      newComplaint.id,
      newComplaint.title,
      newComplaint.priority
    );
  };

  if (showDashboard) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {currentOrganization?.name || 'Complaint Dashboard'}
                  </h1>
                  {currentOrganization && (
                    <p className="text-sm text-muted-foreground">
                      {currentOrganization.type.charAt(0).toUpperCase() + currentOrganization.type.slice(1)} Organization
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <NotificationCenter />
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowOrgSelector(true);
                    setShowDashboard(false);
                  }}
                >
                  Change Organization
                </Button>
                <Button variant="outline" onClick={() => setShowDashboard(false)}>
                  Back to Home
                </Button>
                <Button 
                  onClick={() => {
                    console.log('New Complaint button clicked from dashboard');
                    setShowForm(true);
                  }}
                >
                  New Complaint
                </Button>

              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {currentOrganization ? (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="complaints" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Complaints
                </TabsTrigger>
                <TabsTrigger value="hierarchy" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Hierarchy & Settings
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <div className="space-y-6">
                  <MultiOrgDashboard currentOrganization={currentOrganization} />
                  
                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setShowForm(true)}
                    >
                      <Plus className="h-6 w-6" />
                      Submit New Complaint
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2"
                      onClick={() => {
                        // Switch to hierarchy tab
                        const hierarchyTab = document.querySelector('[value="hierarchy"]') as HTMLElement;
                        hierarchyTab?.click();
                      }}
                    >
                      <Users className="h-6 w-6" />
                      Manage Hierarchy
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2"
                      onClick={() => {
                        // Switch to analytics tab
                        const analyticsTab = document.querySelector('[value="analytics"]') as HTMLElement;
                        analyticsTab?.click();
                      }}
                    >
                      <BarChart3 className="h-6 w-6" />
                      View Analytics
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="complaints">
                <Dashboard complaints={complaints} />
              </TabsContent>
              
              <TabsContent value="hierarchy">
                <EscalationMatrixDebug complaints={complaints} />
              </TabsContent>
              
              <TabsContent value="analytics">
                <div className="space-y-6">
                  <AnalyticsDashboard complaints={complaints} />
                  <AIDemo />
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Organization Selected</h3>
              <p className="text-muted-foreground mb-6">
                Please select an organization to access the complaint management system.
              </p>
              <Button onClick={() => setShowOrgSelector(true)}>
                Select Organization
              </Button>
            </div>
          )}
        </main>
        
        {/* Floating Action Button for New Complaint */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => {
              console.log('Floating New Complaint button clicked');
              setShowForm(true);
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            New Complaint
          </Button>
        </div>
      </div>
    );
  }

  // Organization Selector Modal
  if (showOrgSelector) {
    return (
      <div className="min-h-screen bg-muted/30 py-12 px-4">
        <div className="container mx-auto">
          {/* Back button if user already has an organization */}
          {currentOrganization && (
            <Button 
              variant="ghost" 
              onClick={() => {
                console.log('Back to Dashboard clicked from org selector');
                setShowOrgSelector(false);
                setShowDashboard(true);
              }}
              className="mb-6"
            >
              ← Back to Dashboard
            </Button>
          )}
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">
              {currentOrganization ? 'Change Organization' : 'Welcome to AI Complaint Management'}
            </h1>
            <p className="text-xl text-muted-foreground">
              {currentOrganization 
                ? 'Select a different organization or continue with your current one'
                : 'Select your organization to get started with intelligent complaint processing'
              }
            </p>
            {currentOrganization && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Currently using: <strong>{currentOrganization.name}</strong> ({currentOrganization.type})
                </p>
              </div>
            )}
          </div>
          <OrganizationSelector onOrganizationChange={handleOrganizationChange} />
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-muted/30 py-12 px-4">
        <div className="container mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => {
              console.log('Back button clicked from form');
              setShowForm(false);
            }}
            className="mb-6"
          >
            ← Back
          </Button>
          <ComplaintForm onSubmit={handleComplaintSubmit} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-90" />
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Bot className="h-5 w-5" />
              <span className="text-sm font-medium">AI-Powered Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Smart Complaint Escalation System
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Automate complaint triage, routing, and escalation with artificial intelligence.
              Ensure accountability and faster resolution times.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="shadow-2xl bg-white text-primary hover:bg-white/90"
                onClick={() => {
                  console.log('Submit Complaint button clicked from hero');
                  setShowForm(true);
                }}
              >
                Submit Complaint
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={() => {
                  console.log('View Dashboard button clicked from hero');
                  if (currentOrganization) {
                    setShowDashboard(true);
                  } else {
                    setShowOrgSelector(true);
                  }
                }}
              >
                {currentOrganization ? 'View Dashboard' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Intelligent Complaint Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Leverage AI to streamline your complaint resolution process
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automated Triage</h3>
              <p className="text-muted-foreground">
                AI analyzes and categorizes complaints instantly, routing them to the right department automatically.
              </p>
            </div>
            <div className="bg-card border rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Escalation</h3>
              <p className="text-muted-foreground">
                Automatically escalate unresolved issues through organizational hierarchy based on priority and time.
              </p>
            </div>
            <div className="bg-card border rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Full Transparency</h3>
              <p className="text-muted-foreground">
                Track every complaint from submission to resolution with complete accountability and audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Complaint Management?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join organizations using AI to deliver better customer experiences and faster resolutions.
          </p>
          <Button 
            size="lg" 
            onClick={() => {
              console.log('Get Started Now button clicked from CTA');
              if (currentOrganization) {
                setShowDashboard(true);
              } else {
                setShowOrgSelector(true);
              }
            }}
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-card">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 AI Complaint Escalation System. Powered by intelligent automation.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;