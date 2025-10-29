import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { nlpService, ComplaintAnalysis } from "@/services/nlpService";
import { analyticsService } from "@/services/analyticsService";
import { organizationService, Organization } from "@/services/organizationService";
import { Bot, Sparkles, Clock } from "lucide-react";

export interface ComplaintFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  contactName: string;
  contactEmail: string;
  organizationId?: string;
  department?: string;
  customFields?: Record<string, any>;
}

interface ComplaintFormProps {
  onSubmit: (data: ComplaintFormData) => void;
}

export const ComplaintForm = ({ onSubmit }: ComplaintFormProps) => {
  const [formData, setFormData] = useState<ComplaintFormData>({
    title: "",
    description: "",
    category: "",
    priority: "",
    contactName: "",
    contactEmail: "",
    customFields: {},
  });

  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<ComplaintAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  useEffect(() => {
    const org = organizationService.getCurrentOrganization();
    setCurrentOrganization(org);
    if (org) {
      setFormData(prev => ({ ...prev, organizationId: org.id }));
    }
  }, []);

  const analyzeComplaint = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please provide title and description for AI analysis");
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await nlpService.analyzeComplaint(formData.title, formData.description);
      setAiAnalysis(analysis);
      setShowAiSuggestions(true);
      
      // Create audit trail
      await analyticsService.createAuditEntry(
        'new_complaint',
        'ai_analysis_performed',
        'system',
        { analysis, confidence: analysis.confidence }
      );
      
      toast.success("AI analysis completed! Review suggestions below.");
    } catch (error) {
      toast.error("AI analysis failed. Please try again.");
      console.error('AI Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestions = () => {
    if (!aiAnalysis) return;
    
    setFormData(prev => ({
      ...prev,
      category: aiAnalysis.category,
      priority: aiAnalysis.priority
    }));
    
    toast.success("AI suggestions applied!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || !formData.priority || !formData.contactEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create audit trail for submission
    await analyticsService.createAuditEntry(
      'new_complaint',
      'complaint_submitted',
      formData.contactEmail,
      { 
        title: formData.title,
        category: formData.category,
        priority: formData.priority,
        aiAnalysisUsed: !!aiAnalysis
      }
    );

    onSubmit(formData);
    
    // Reset form
    setFormData({
      title: "",
      description: "",
      category: "",
      priority: "",
      contactName: "",
      contactEmail: "",
      organizationId: currentOrganization?.id,
      customFields: {},
    });
    setAiAnalysis(null);
    setShowAiSuggestions(false);
    
    toast.success("Complaint submitted successfully!");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit a Complaint</CardTitle>
        <CardDescription>
          Fill out the form below to submit your complaint. Our AI system will analyze and route it appropriately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Complaint Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {currentOrganization ? (
                  // Organization-specific categories
                  <>
                    {currentOrganization.type === 'government' && (
                      <>
                        <SelectItem value="public-services">Public Services</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="taxation">Taxation</SelectItem>
                        <SelectItem value="licensing">Licensing</SelectItem>
                        <SelectItem value="welfare">Welfare</SelectItem>
                        <SelectItem value="law-enforcement">Law Enforcement</SelectItem>
                      </>
                    )}
                    {currentOrganization.type === 'corporate' && (
                      <>
                        <SelectItem value="technical-support">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="hr-issues">HR Issues</SelectItem>
                        <SelectItem value="product-feedback">Product Feedback</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                      </>
                    )}
                    {currentOrganization.type === 'education' && (
                      <>
                        <SelectItem value="academic-issues">Academic Issues</SelectItem>
                        <SelectItem value="disciplinary">Disciplinary</SelectItem>
                        <SelectItem value="facilities">Facilities</SelectItem>
                        <SelectItem value="financial-aid">Financial Aid</SelectItem>
                        <SelectItem value="admissions">Admissions</SelectItem>
                        <SelectItem value="student-services">Student Services</SelectItem>
                      </>
                    )}
                    {currentOrganization.type === 'healthcare' && (
                      <>
                        <SelectItem value="patient-care">Patient Care</SelectItem>
                        <SelectItem value="billing-insurance">Billing & Insurance</SelectItem>
                        <SelectItem value="medical-records">Medical Records</SelectItem>
                        <SelectItem value="safety-incidents">Safety Incidents</SelectItem>
                        <SelectItem value="quality-of-care">Quality of Care</SelectItem>
                        <SelectItem value="accessibility">Accessibility</SelectItem>
                      </>
                    )}
                    {currentOrganization.type === 'municipal' && (
                      <>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="public-safety">Public Safety</SelectItem>
                        <SelectItem value="zoning-permits">Zoning & Permits</SelectItem>
                        <SelectItem value="waste-management">Waste Management</SelectItem>
                        <SelectItem value="parks-recreation">Parks & Recreation</SelectItem>
                      </>
                    )}
                    <SelectItem value="other">Other</SelectItem>
                  </>
                ) : (
                  // Default categories
                  <>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing & Payment</SelectItem>
                    <SelectItem value="service">Service Quality</SelectItem>
                    <SelectItem value="product">Product Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Department Selection */}
          {currentOrganization && currentOrganization.departments.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department || ""} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {currentOrganization.departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your complaint..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              required
            />
            {formData.title && formData.description && (
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={analyzeComplaint}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" />
                      AI Analysis
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* AI Analysis Results */}
          {showAiSuggestions && aiAnalysis && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Analysis Results
                </CardTitle>
                <CardDescription>
                  Confidence: {(aiAnalysis.confidence * 100).toFixed(0)}% | 
                  Urgency: {aiAnalysis.urgency}/10 | 
                  Sentiment: {aiAnalysis.sentiment}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Suggested Category</Label>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {aiAnalysis.category}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Suggested Priority</Label>
                    <Badge 
                      variant={
                        aiAnalysis.priority === "critical" ? "destructive" :
                        aiAnalysis.priority === "high" ? "warning" :
                        aiAnalysis.priority === "medium" ? "info" : "outline"
                      }
                      className="mt-1 capitalize"
                    >
                      {aiAnalysis.priority}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Suggested Department</Label>
                  <p className="text-sm text-muted-foreground mt-1">{aiAnalysis.suggestedDepartment}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Estimated Resolution Time
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {aiAnalysis.estimatedResolutionTime} hours
                  </p>
                </div>
                
                {aiAnalysis.keywords.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Key Topics</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aiAnalysis.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applySuggestions}
                  className="w-full"
                >
                  Apply AI Suggestions
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Organization-specific Custom Fields */}
          {currentOrganization && currentOrganization.customFields.length > 0 && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-medium text-sm">Organization-Specific Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentOrganization.customFields.map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>
                      {field.name} {field.required && '*'}
                    </Label>
                    {field.type === 'text' && (
                      <Input
                        id={field.id}
                        value={formData.customFields?.[field.id] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          customFields: { ...formData.customFields, [field.id]: e.target.value }
                        })}
                        required={field.required}
                      />
                    )}
                    {field.type === 'select' && (
                      <Select
                        value={formData.customFields?.[field.id] || ''}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          customFields: { ...formData.customFields, [field.id]: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === 'number' && (
                      <Input
                        id={field.id}
                        type="number"
                        value={formData.customFields?.[field.id] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          customFields: { ...formData.customFields, [field.id]: e.target.value }
                        })}
                        required={field.required}
                      />
                    )}
                    {field.type === 'date' && (
                      <Input
                        id={field.id}
                        type="date"
                        value={formData.customFields?.[field.id] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          customFields: { ...formData.customFields, [field.id]: e.target.value }
                        })}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Your Name</Label>
              <Input
                id="contactName"
                placeholder="John Doe"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email Address *</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="john@example.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Submit Complaint
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};