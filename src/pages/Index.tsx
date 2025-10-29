import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ComplaintForm, ComplaintFormData } from "@/components/ComplaintForm";
import { Dashboard } from "@/components/Dashboard";
import { Complaint } from "@/components/ComplaintCard";
import { Bot, Shield, TrendingUp, Zap } from "lucide-react";

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
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
  };

  if (showDashboard) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Complaint Dashboard
                </h1>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDashboard(false)}>
                  Back to Home
                </Button>
                <Button onClick={() => setShowForm(true)}>
                  New Complaint
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Dashboard complaints={complaints} />
        </main>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-muted/30 py-12 px-4">
        <div className="container mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setShowForm(false)}
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
                variant="hero"
                className="shadow-2xl"
                onClick={() => setShowForm(true)}
              >
                Submit Complaint
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={() => setShowDashboard(true)}
              >
                View Dashboard
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
          <Button size="lg" onClick={() => setShowForm(true)}>
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