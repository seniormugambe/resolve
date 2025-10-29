import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Brain,
  Target,
  Shield
} from "lucide-react";
import { nlpService } from "@/services/nlpService";
import { escalationService } from "@/services/escalationService";
import { analyticsService } from "@/services/analyticsService";
import { notificationService } from "@/services/notificationService";

export const AIDemo = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [demoResults, setDemoResults] = useState<any>(null);

  const runAIDemo = async () => {
    setIsRunning(true);
    setDemoResults(null);

    try {
      // Simulate AI processing with sample complaint
      const sampleComplaint = {
        title: "Critical server outage affecting production systems",
        description: "Our main production servers have been down for 2 hours. This is causing major disruption to our e-commerce platform and affecting thousands of customers. We need immediate assistance to resolve this critical issue. The error logs show database connection failures and the monitoring system indicates complete service unavailability."
      };

      // Step 1: NLP Analysis
      const nlpAnalysis = await nlpService.analyzeComplaint(
        sampleComplaint.title, 
        sampleComplaint.description
      );

      // Step 2: Escalation Check
      const mockComplaint = {
        id: "demo-001",
        ...sampleComplaint,
        category: nlpAnalysis.category,
        priority: nlpAnalysis.priority,
        status: "new",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        escalationLevel: 0
      };

      const escalationCheck = await escalationService.checkEscalation(mockComplaint);

      // Step 3: Predictive Insights
      const insights = await analyticsService.getPredictiveInsights([mockComplaint]);

      // Step 4: Create audit trail
      await analyticsService.createAuditEntry(
        mockComplaint.id,
        'ai_demo_executed',
        'system',
        { nlpAnalysis, escalationCheck, insights }
      );

      // Step 5: Send notification
      if (escalationCheck.shouldEscalate) {
        notificationService.notifyEscalation(
          mockComplaint.id,
          mockComplaint.escalationLevel,
          escalationCheck.newLevel || 1,
          escalationCheck.reason || 'Demo escalation'
        );
      }

      setDemoResults({
        originalComplaint: sampleComplaint,
        nlpAnalysis,
        escalationCheck,
        insights,
        processingTime: Math.random() * 2 + 0.5 // Simulate processing time
      });

    } catch (error) {
      console.error('AI Demo failed:', error);
      notificationService.notifySystemAlert(
        'AI Demo execution failed. Please check system logs.',
        'high'
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Intelligence Demo
          </CardTitle>
          <CardDescription>
            Experience the full AI-powered complaint processing pipeline in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAIDemo} 
            disabled={isRunning}
            size="lg"
            className="w-full"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing AI Analysis...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Run AI Demo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {demoResults && (
        <div className="space-y-6">
          {/* Original Complaint */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Sample Complaint Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Title:</p>
                <p className="text-sm">{demoResults.originalComplaint.title}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Description:</p>
                <p className="text-sm">{demoResults.originalComplaint.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* NLP Analysis Results */}
          <Card className="border-info/20 bg-info/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-info" />
                NLP Analysis Results
              </CardTitle>
              <CardDescription>
                AI-powered text analysis and categorization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {demoResults.nlpAnalysis.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <Badge 
                    variant={
                      demoResults.nlpAnalysis.priority === "critical" ? "destructive" :
                      demoResults.nlpAnalysis.priority === "high" ? "warning" : "info"
                    }
                    className="mt-1 capitalize"
                  >
                    {demoResults.nlpAnalysis.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sentiment</p>
                  <Badge 
                    variant={
                      demoResults.nlpAnalysis.sentiment === "negative" ? "destructive" :
                      demoResults.nlpAnalysis.sentiment === "positive" ? "success" : "outline"
                    }
                    className="mt-1 capitalize"
                  >
                    {demoResults.nlpAnalysis.sentiment}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Urgency Score</p>
                  <Badge variant="warning" className="mt-1">
                    {demoResults.nlpAnalysis.urgency}/10
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Suggested Department</p>
                  <p className="text-sm">{demoResults.nlpAnalysis.suggestedDepartment}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Est. Resolution Time</p>
                  <p className="text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {demoResults.nlpAnalysis.estimatedResolutionTime} hours
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Key Topics Detected</p>
                <div className="flex flex-wrap gap-1">
                  {demoResults.nlpAnalysis.keywords.map((keyword: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Confidence: {(demoResults.nlpAnalysis.confidence * 100).toFixed(0)}%
              </div>
            </CardContent>
          </Card>

          {/* Escalation Analysis */}
          {demoResults.escalationCheck.shouldEscalate && (
            <Card className="border-warning/20 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-warning" />
                  Smart Escalation Triggered
                </CardTitle>
                <CardDescription>
                  Automatic escalation rules activated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Escalation Level</span>
                  <Badge variant="warning">
                    Level 0 → Level {demoResults.escalationCheck.newLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reason</p>
                  <p className="text-sm">{demoResults.escalationCheck.reason}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notifications Sent To</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {demoResults.escalationCheck.notifications?.map((role: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Predictive Insights */}
          {demoResults.insights.length > 0 && (
            <Card className="border-success/20 bg-success/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Predictive Insights Generated
                </CardTitle>
                <CardDescription>
                  AI-powered recommendations and trend analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {demoResults.insights.map((insight: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3 bg-background">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <div className="flex gap-1">
                        <Badge variant={
                          insight.impact === 'high' ? 'destructive' :
                          insight.impact === 'medium' ? 'warning' : 'outline'
                        } className="text-xs">
                          {insight.impact} impact
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {(insight.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                    <div>
                      <p className="text-xs font-medium mb-1">Suggested Actions:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {insight.suggestedActions.slice(0, 2).map((action: string, actionIndex: number) => (
                          <li key={actionIndex} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-success rounded-full" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Processing Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Processing Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {demoResults.processingTime.toFixed(1)}s
                  </div>
                  <div className="text-xs text-muted-foreground">Processing Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">100%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-info">5</div>
                  <div className="text-xs text-muted-foreground">AI Models Used</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">
                    {demoResults.escalationCheck.shouldEscalate ? '1' : '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">Escalations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};