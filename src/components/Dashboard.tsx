import { useState } from "react";
import { ComplaintCard, Complaint } from "@/components/ComplaintCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
  complaints: Complaint[];
}

export const Dashboard = ({ complaints }: DashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: complaints.length,
    new: complaints.filter(c => c.status === "new").length,
    inProgress: complaints.filter(c => c.status === "in-progress").length,
    escalated: complaints.filter(c => c.status === "escalated").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-info">{stats.new}</div>
          <div className="text-sm text-muted-foreground">New</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
          <div className="text-sm text-muted-foreground">In Progress</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-warning">{stats.escalated}</div>
          <div className="text-sm text-muted-foreground">Escalated</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-success">{stats.resolved}</div>
          <div className="text-sm text-muted-foreground">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Complaints List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredComplaints.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No complaints found matching your filters.
          </div>
        ) : (
          filteredComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              onClick={setSelectedComplaint}
            />
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedComplaint?.title}</DialogTitle>
            <DialogDescription>
              Complaint ID: {selectedComplaint?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedComplaint.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Category</h4>
                  <Badge variant="outline" className="capitalize">{selectedComplaint.category}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Priority</h4>
                  <Badge variant={
                    selectedComplaint.priority === "critical" ? "destructive" :
                    selectedComplaint.priority === "high" ? "warning" :
                    selectedComplaint.priority === "medium" ? "info" : "outline"
                  } className="capitalize">{selectedComplaint.priority}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <Badge variant={
                    selectedComplaint.status === "resolved" ? "success" :
                    selectedComplaint.status === "escalated" ? "warning" :
                    selectedComplaint.status === "in-progress" ? "info" : "default"
                  } className="capitalize">{selectedComplaint.status.replace("-", " ")}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Escalation Level</h4>
                  <span className="text-muted-foreground">{selectedComplaint.escalationLevel}</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <p className="text-muted-foreground">
                  {selectedComplaint.contactName && `${selectedComplaint.contactName} - `}
                  {selectedComplaint.contactEmail}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Submitted</h4>
                <p className="text-muted-foreground">
                  {new Date(selectedComplaint.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};