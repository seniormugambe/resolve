import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Network, 
  Users, 
  ArrowUp, 
  ArrowDown, 
  GitBranch,
  Zap,
  Clock,
  Shield,
  Eye,
  Settings
} from "lucide-react";
import { Organization, HierarchyLevel } from "@/services/organizationService";

interface NetworkNode {
  id: string;
  level: number;
  name: string;
  memberCount: number;
  x: number;
  y: number;
  color: string;
}

interface NetworkEdge {
  from: string;
  to: string;
  type: 'escalation' | 'delegation' | 'collaboration' | 'reporting';
  weight: number;
  color: string;
}

interface HierarchyNetworkDiagramProps {
  organization: Organization;
}

export const HierarchyNetworkDiagram = ({ organization }: HierarchyNetworkDiagramProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    generateNetworkData();
  }, [organization]);

  useEffect(() => {
    drawNetwork();
  }, [nodes, edges, selectedNode, hoveredNode]);

  const generateNetworkData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Generate nodes
    const networkNodes: NetworkNode[] = organization.hierarchy.map((level, index) => {
      const memberCount = organization.members.filter(m => m.level === level.level).length;
      const angle = (index / organization.hierarchy.length) * 2 * Math.PI - Math.PI / 2;
      const radius = Math.min(width, height) * 0.3;
      
      return {
        id: `level-${level.level}`,
        level: level.level,
        name: level.name,
        memberCount,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        color: getNodeColor(level.level, organization.hierarchy.length)
      };
    });

    // Generate edges
    const networkEdges: NetworkEdge[] = [];

    // Escalation edges (upward)
    for (let i = 0; i < organization.hierarchy.length - 1; i++) {
      networkEdges.push({
        from: `level-${i}`,
        to: `level-${i + 1}`,
        type: 'escalation',
        weight: 3,
        color: '#ef4444'
      });
    }

    // Delegation edges (downward)
    for (let i = 1; i < organization.hierarchy.length; i++) {
      networkEdges.push({
        from: `level-${i}`,
        to: `level-${i - 1}`,
        type: 'delegation',
        weight: 2,
        color: '#3b82f6'
      });
    }

    // Collaboration edges (same level departments)
    organization.hierarchy.forEach((level, index) => {
      const departments = organization.departments.filter(dept => 
        dept.members.some(memberId => 
          organization.members.find(m => m.id === memberId)?.level === level.level
        )
      );

      if (departments.length > 1) {
        networkEdges.push({
          from: `level-${level.level}`,
          to: `level-${level.level}`,
          type: 'collaboration',
          weight: 1,
          color: '#10b981'
        });
      }
    });

    setNodes(networkNodes);
    setEdges(networkEdges);
  };

  const getNodeColor = (level: number, totalLevels: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[level % colors.length];
  };

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode) {
        drawEdge(ctx, fromNode, toNode, edge);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      drawNode(ctx, node);
    });

    // Draw labels
    nodes.forEach(node => {
      drawNodeLabel(ctx, node);
    });
  };

  const drawEdge = (ctx: CanvasRenderingContext2D, from: NetworkNode, to: NetworkNode, edge: NetworkEdge) => {
    ctx.beginPath();
    ctx.strokeStyle = edge.color;
    ctx.lineWidth = edge.weight;
    ctx.globalAlpha = 0.7;

    if (edge.type === 'collaboration' && from.id === to.id) {
      // Draw self-loop for collaboration
      const radius = 30;
      ctx.arc(from.x + radius, from.y, radius, 0, 2 * Math.PI);
    } else {
      // Draw arrow
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const distance = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
      const nodeRadius = 25;
      
      const startX = from.x + Math.cos(angle) * nodeRadius;
      const startY = from.y + Math.sin(angle) * nodeRadius;
      const endX = to.x - Math.cos(angle) * nodeRadius;
      const endY = to.y - Math.sin(angle) * nodeRadius;

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);

      // Draw arrowhead
      const arrowLength = 10;
      const arrowAngle = Math.PI / 6;
      
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle - arrowAngle),
        endY - arrowLength * Math.sin(angle - arrowAngle)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle + arrowAngle),
        endY - arrowLength * Math.sin(angle + arrowAngle)
      );
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: NetworkNode) => {
    const radius = 25;
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Draw border
    ctx.strokeStyle = isSelected ? '#000' : isHovered ? '#666' : '#fff';
    ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
    ctx.stroke();

    // Draw member count
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.memberCount.toString(), node.x, node.y);
  };

  const drawNodeLabel = (ctx: CanvasRenderingContext2D, node: NetworkNode) => {
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Split long names into multiple lines
    const words = node.name.split(' ');
    const maxWidth = 100;
    let lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }

    lines.forEach((line, index) => {
      ctx.fillText(line, node.x, node.y + 35 + (index * 14));
    });

    // Draw level badge
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Arial';
    ctx.fillText(`Level ${node.level}`, node.x, node.y + 35 + (lines.length * 14) + 5);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is on a node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= 25;
    });

    setSelectedNode(clickedNode || null);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if mouse is over a node
    const hoveredNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= 25;
    });

    setHoveredNode(hoveredNode || null);
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  };

  const getConnectionStats = () => {
    const escalationConnections = edges.filter(e => e.type === 'escalation').length;
    const delegationConnections = edges.filter(e => e.type === 'delegation').length;
    const collaborationConnections = edges.filter(e => e.type === 'collaboration').length;

    return {
      escalation: escalationConnections,
      delegation: delegationConnections,
      collaboration: collaborationConnections,
      total: edges.length
    };
  };

  const stats = getConnectionStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Hierarchy Network Visualization
          </CardTitle>
          <CardDescription>
            Interactive network diagram showing organizational structure and interconnections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Network Canvas */}
            <div className="lg:col-span-3">
              <div className="border rounded-lg p-4 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="w-full h-auto cursor-pointer"
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMouseMove}
                />
              </div>
            </div>

            {/* Legend and Controls */}
            <div className="space-y-4">
              {/* Connection Types Legend */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Connection Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-0.5 bg-red-500"></div>
                    <ArrowUp className="h-3 w-3 text-red-500" />
                    <span>Escalation ({stats.escalation})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-0.5 bg-blue-500"></div>
                    <ArrowDown className="h-3 w-3 text-blue-500" />
                    <span>Delegation ({stats.delegation})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-0.5 bg-green-500"></div>
                    <GitBranch className="h-3 w-3 text-green-500" />
                    <span>Collaboration ({stats.collaboration})</span>
                  </div>
                </CardContent>
              </Card>

              {/* Node Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Node Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      #
                    </div>
                    <span>Number shows member count</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Click on nodes to view details
                  </div>
                </CardContent>
              </Card>

              {/* Selected Node Details */}
              {selectedNode && (
                <Card className="border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {selectedNode.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Level:</span>
                      <Badge variant="outline">{selectedNode.level}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Members:</span>
                      <Badge variant="secondary">{selectedNode.memberCount}</Badge>
                    </div>
                    
                    {/* Level Details */}
                    {(() => {
                      const levelData = organization.hierarchy.find(l => l.level === selectedNode.level);
                      if (!levelData) return null;

                      return (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3" />
                            <span>Response SLA: {levelData.responseTimeSLA}h</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Zap className="h-3 w-3" />
                            <span>Escalation: {levelData.escalationThreshold}h</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Shield className="h-3 w-3" />
                            <span>{levelData.permissions.length} permissions</span>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Network Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Network Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Nodes:</span>
                    <span className="font-medium">{nodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Connections:</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Density:</span>
                    <span className="font-medium">
                      {nodes.length > 1 ? ((stats.total / (nodes.length * (nodes.length - 1))) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};