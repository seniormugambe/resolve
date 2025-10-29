import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  contactName: string;
  contactEmail: string;
  createdAt: Date;
  escalationLevel: number;
}

interface ComplaintCardProps {
  complaint: Complaint;
  onClick: (complaint: Complaint) => void;
}

const statusConfig = {
  new: { label: "New", variant: "default" as const, icon: Clock },
  "in-progress": { label: "In Progress", variant: "info" as const, icon: TrendingUp },
  escalated: { label: "Escalated", variant: "warning" as const, icon: AlertCircle },
  resolved: { label: "Resolved", variant: "success" as const, icon: CheckCircle2 },
};

const priorityConfig = {
  low: { label: "Low", variant: "outline" as const },
  medium: { label: "Medium", variant: "info" as const },
  high: { label: "High", variant: "warning" as const },
  critical: { label: "Critical", variant: "destructive" as const },
};

export const ComplaintCard = ({ complaint, onClick }: ComplaintCardProps) => {
  const statusInfo = statusConfig[complaint.status as keyof typeof statusConfig];
  const priorityInfo = priorityConfig[complaint.priority as keyof typeof priorityConfig];
  const StatusIcon = statusInfo.icon;

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]" 
      onClick={() => onClick(complaint)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{complaint.title}</CardTitle>
            <CardDescription className="line-clamp-2">{complaint.description}</CardDescription>
          </div>
          <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
            <span className="text-muted-foreground capitalize">{complaint.category}</span>
          </div>
          <div className="text-muted-foreground">
            {new Date(complaint.createdAt).toLocaleDateString()}
          </div>
        </div>
        {complaint.escalationLevel > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-warning" />
              <span className="text-muted-foreground">
                Escalation Level: <span className="font-semibold text-warning">{complaint.escalationLevel}</span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};