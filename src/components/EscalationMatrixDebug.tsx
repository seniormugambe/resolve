import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Building2, Users } from "lucide-react";
import { organizationService } from "@/services/organizationService";
import { EditableHierarchyManager } from "@/components/EditableHierarchyManager";

interface EscalationMatrixDebugProps {
  complaints?: any[];
}

export const EscalationMatrixDebug = ({ complaints = [] }: EscalationMatrixDebugProps) => {
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    const debug: string[] = [];
    
    try {
      debug.push("Starting organization initialization...");
      
      // Check if organizations exist
      const existingOrgs = organizationService.getOrganizations();
      debug.push(`Found ${existingOrgs.length} existing organizations`);
      
      if (existingOrgs.length === 0) {
        debug.push("Initializing sample organizations...");
        organizationService.initializeSampleOrganizations();
        const newOrgs = organizationService.getOrganizations();
        debug.push(`Created ${newOrgs.length} sample organizations`);
      }
      
      // Get current organization
      const current = organizationService.getCurrentOrganization();
      debug.push(`Current organization: ${current ? current.name : 'None'}`);
      
      setCurrentOrganization(current);
      setDebugInfo(debug);
      
    } catch (error) {
      debug.push(`Error: ${error}`);
      setDebugInfo(debug);
      console.error('Organization initialization error:', error);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Debug Information */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-sm font-mono text-yellow-700">
                {index + 1}. {info}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editable Hierarchy Manager */}
      {currentOrganization ? (
        <EditableHierarchyManager 
          organization={currentOrganization} 
          onUpdate={(updatedOrg) => {
            organizationService.updateOrganization(updatedOrg.id, updatedOrg);
            setCurrentOrganization(updatedOrg);
          }}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No organization loaded</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complaints Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Complaints Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total complaints: {complaints.length}</p>
          {complaints.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Sample complaint:</p>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                {JSON.stringify(complaints[0], null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};