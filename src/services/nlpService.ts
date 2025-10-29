// NLP Service for intelligent complaint analysis
export interface NLPAnalysis {
  category: string;
  priority: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: number; // 0-10 scale
  keywords: string[];
  confidence: number;
}

export interface ComplaintAnalysis extends NLPAnalysis {
  suggestedDepartment: string;
  estimatedResolutionTime: number; // hours
  similarComplaints: string[];
}

class NLPService {
  private apiKey: string | null = null;

  constructor() {
    // In production, this would come from environment variables
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  async analyzeComplaint(title: string, description: string): Promise<ComplaintAnalysis> {
    // Simulate AI analysis - in production this would call actual NLP APIs
    const text = `${title} ${description}`.toLowerCase();
    
    // Category detection based on keywords
    const category = this.detectCategory(text);
    
    // Priority detection based on urgency keywords
    const priority = this.detectPriority(text);
    
    // Sentiment analysis simulation
    const sentiment = this.analyzeSentiment(text);
    
    // Urgency scoring
    const urgency = this.calculateUrgency(text, sentiment);
    
    // Extract keywords
    const keywords = this.extractKeywords(text);
    
    return {
      category,
      priority,
      sentiment,
      urgency,
      keywords,
      confidence: 0.85, // Simulated confidence score
      suggestedDepartment: this.suggestDepartment(category),
      estimatedResolutionTime: this.estimateResolutionTime(priority, category),
      similarComplaints: [] // Would be populated by ML similarity search
    };
  }

  private detectCategory(text: string): string {
    const categoryKeywords = {
      technical: ['server', 'bug', 'error', 'crash', 'down', 'outage', 'performance', 'slow', 'loading'],
      billing: ['invoice', 'payment', 'charge', 'bill', 'refund', 'money', 'cost', 'price'],
      service: ['support', 'staff', 'rude', 'unhelpful', 'wait', 'response', 'quality'],
      product: ['defect', 'broken', 'damaged', 'quality', 'manufacturing', 'faulty']
    };

    let maxScore = 0;
    let detectedCategory = 'other';

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (text.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        detectedCategory = category;
      }
    }

    return detectedCategory;
  }

  private detectPriority(text: string): string {
    const urgentKeywords = ['urgent', 'critical', 'emergency', 'immediately', 'asap', 'production', 'down'];
    const highKeywords = ['important', 'serious', 'major', 'significant'];
    
    const urgentCount = urgentKeywords.reduce((acc, keyword) => acc + (text.includes(keyword) ? 1 : 0), 0);
    const highCount = highKeywords.reduce((acc, keyword) => acc + (text.includes(keyword) ? 1 : 0), 0);
    
    if (urgentCount > 0) return 'critical';
    if (highCount > 0) return 'high';
    if (text.length > 200) return 'medium'; // Longer descriptions might indicate complexity
    return 'low';
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const negativeWords = ['angry', 'frustrated', 'terrible', 'awful', 'horrible', 'disappointed', 'unacceptable'];
    const positiveWords = ['good', 'great', 'excellent', 'satisfied', 'happy', 'pleased'];
    
    const negativeCount = negativeWords.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
    const positiveCount = positiveWords.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
    
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  private calculateUrgency(text: string, sentiment: string): number {
    let urgency = 5; // Base urgency
    
    // Increase urgency for negative sentiment
    if (sentiment === 'negative') urgency += 2;
    
    // Increase urgency for certain keywords
    const urgentIndicators = ['production', 'critical', 'emergency', 'down', 'outage'];
    urgentIndicators.forEach(indicator => {
      if (text.includes(indicator)) urgency += 1;
    });
    
    return Math.min(10, Math.max(1, urgency));
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production would use more sophisticated NLP
    const words = text.split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'will'].includes(word.toLowerCase()));
    
    // Return top 5 most relevant words
    return [...new Set(words)].slice(0, 5);
  }

  private suggestDepartment(category: string): string {
    const departmentMapping = {
      technical: 'IT Support',
      billing: 'Finance',
      service: 'Customer Service',
      product: 'Quality Assurance',
      other: 'General Support'
    };
    
    return departmentMapping[category as keyof typeof departmentMapping] || 'General Support';
  }

  private estimateResolutionTime(priority: string, category: string): number {
    const baseTime = {
      technical: 24,
      billing: 48,
      service: 12,
      product: 72,
      other: 24
    };
    
    const priorityMultiplier = {
      critical: 0.25,
      high: 0.5,
      medium: 1,
      low: 2
    };
    
    const base = baseTime[category as keyof typeof baseTime] || 24;
    const multiplier = priorityMultiplier[priority as keyof typeof priorityMultiplier] || 1;
    
    return Math.round(base * multiplier);
  }
}

export const nlpService = new NLPService();