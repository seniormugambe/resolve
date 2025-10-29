import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Building2, 
  Building, 
  GraduationCap, 
  Heart, 
  MapPin,
  Plus,
  Settings,
  Users,
  CheckCircle2
} from "lucide-react";
import { organizationService, Organization, OrganizationType } from "@/services/organizationService";

interface OrganizationSelectorProps {
  onOrganizationChange: (organization: Organization | null) => void;
}

export const OrganizationSelector = ({ onOrganizationChange }: OrganizationSelectorProps) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationTypes, setOrganizationTypes] = useState<OrganizationType[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    type: '',
    description: ''
  });

  useEffect(() => {
    // Initialize sample organizations if none exist
    const existingOrgs = organizationService.getOrganizations();
    if (existingOrgs.length === 0) {
      organizationService.initializeSampleOrganizations();
    }
    
    loadData();
  }, []);

  const loadData = () => {
    const orgs = organizationService.getOrganizations();
    const types = organizationService.getOrganizationTypes();
    const current = organizationService.getCurrentOrganization();
    
    setOrganizations(orgs);
    setOrganizationTypes(types);
    setCurrentOrganization(current);
    // Don't automatically call onOrganizationChange here - only call it when user explicitly selects
  };

  const handleOrganizationSelect = (orgId: string) => {
    const success = organizationService.setCurrentOrganization(orgId);
    if (success) {
      const org = organizationService.getCurrentOrganization();
      setCurrentOrganization(org);
      onOrganizationChange(org);
    }
  };

  const handleCreateOrganization = () => {
    if (!newOrgForm.name || !newOrgForm.type) return;

    try {
      const newOrg = organizationService.createOrganization(
        newOrgForm.name,
        newOrgForm.type,
        newOrgForm.description
      );

      organizationService.setCurrentOrganization(newOrg.id);
      loadData();
      setShowCreateDialog(false);
      setNewOrgForm({ name: '', type: '', description: '' });
      
      // Explicitly call the callback for new organization creation
      onOrganizationChange(newOrg);
    } catch (error) {
      console.error('Failed to create organization:', error);
    }
  };

  const getOrgTypeIcon = (typeId: string) => {
    switch (typeId) {
      case 'government': return <Building2 className="h-5 w-5" />;
      case 'corporate': return <Building className="h-5 w-5" />;
      case 'education': return <GraduationCap className="h-5 w-5" />;
      case 'healthcare': return <Heart className="h-5 w-5" />;
      case 'municipal': return <MapPin className="h-5 w-5" />;
      default: return <Building className="h-5 w-5" />;
    }
  };

  const getOrgTypeColor = (typeId: string) => {
    switch (typeId) {
      case 'government': return 'bg-blue-500';
      case 'corporate': return 'bg-green-500';
      case 'education': return 'bg-purple-500';
      case 'healthcare': return 'bg-red-500';
      case 'municipal': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Organization Display */}
      {currentOrganization && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getOrgTypeColor(currentOrganization.type)} text-white`}>
                  {getOrgTypeIcon(currentOrganization.type)}
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {currentOrganization.name}
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </CardTitle>
                  <CardDescription>{currentOrganization.description}</CardDescription>
                </div>
              </div>
              <Badge variant="outline">
                {organizationTypes.find(t => t.id === currentOrganization.type)?.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Members:</span>
                <div className="font-medium">{currentOrganization.members.length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Departments:</span>
                <div className="font-medium">{currentOrganization.departments.length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Hierarchy Levels:</span>
                <div className="font-medium">{currentOrganization.hierarchy.length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Timezone:</span>
                <div className="font-medium">{currentOrganization.settings.timezone}</div>
              </div>
            </div>
          </CardContent>
          {currentOrganization && (
            <div className="mt-4 flex justify-center">
              <Button 
                onClick={() => onOrganizationChange(currentOrganization)}
                className="w-full"
              >
                Continue with {currentOrganization.name}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Organization Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Organization
              </CardTitle>
              <CardDescription>
                Choose the organization context for complaint management
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Set up a new organization with customized hierarchy and workflows
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organization Name</Label>
                      <Input
                        value={newOrgForm.name}
                        onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                        placeholder="e.g., City Health Department"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Organization Type</Label>
                      <Select
                        value={newOrgForm.type}
                        onValueChange={(value) => setNewOrgForm({ ...newOrgForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizationTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                {getOrgTypeIcon(type.id)}
                                {type.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newOrgForm.description}
                      onChange={(e) => setNewOrgForm({ ...newOrgForm, description: e.target.value })}
                      placeholder="Brief description of the organization's purpose and scope"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateOrganization}>
                      Create Organization
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => {
              const orgType = organizationTypes.find(t => t.id === org.type);
              const isSelected = currentOrganization?.id === org.id;

              return (
                <Card 
                  key={org.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleOrganizationSelect(org.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getOrgTypeColor(org.type)} text-white`}>
                        {getOrgTypeIcon(org.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{org.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {org.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {orgType?.name}
                          </Badge>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Organization Types Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Organization Types
          </CardTitle>
          <CardDescription>
            Available organization templates with pre-configured hierarchies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizationTypes.map((type) => (
              <Card key={type.id} className="border-l-4" style={{ borderLeftColor: getOrgTypeColor(type.id).replace('bg-', '#') }}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getOrgTypeColor(type.id)} text-white`}>
                      {getOrgTypeIcon(type.id)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{type.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {type.description}
                      </p>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Hierarchy Levels:</span>
                          <div className="text-xs">{type.defaultHierarchy.length} levels</div>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Default Categories:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {type.defaultCategories.slice(0, 3).map((category, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                            {type.defaultCategories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{type.defaultCategories.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};