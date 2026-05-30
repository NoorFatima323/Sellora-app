/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

export interface AnalysisInput {
  productName: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  platforms: string[];
  description: string;
  competitorUrl?: string;
  reportLanguage: 'en' | 'ur';
}

export interface AgentProgress {
  id: string;
  name: string;
  description: string;
  status: 'waiting' | 'running' | 'done' | 'failed';
  progress: number;
  logs: string[];
}

export interface AnalysisResult {
  id: string;
  input: AnalysisInput;
  overallScore: number;
  status: 'pending' | 'orchestrating' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  
  // Custom generated insights
  pricing: {
    averageCompetitorPrice: number;
    lowestPrice: number;
    highestPrice: number;
    recommendedPrice: number;
    tiers: Array<{ name: string; price: number; margin: number; benefit: string }>;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    darazTitle: string;
    darazDescription: string;
  };
  adCopies: {
    english: Array<{ hook: string; body: string; cta: string }>;
    urdu: Array<{ hook: string; body: string; cta: string }>;
    targetAudiences: string[];
  };
  marketIntel: {
    trendScore: number; // 0-100
    marketGrowth: number; // %
    sentiment: { positive: number; neutral: number; negative: number };
    competitors: Array<{ name: string; price: number; matchingScore: number; advantage: string }>;
  };
  financials: {
    sellingPrice: number;
    costPrice: number;
    margin: number;
    netProfit: number;
    roi: number;
    breakevenUnits: number;
    growthPrediction: number;
  };
  recommendations: Array<{
    title: string;
    impact: 'High' | 'Medium' | 'Low';
    effort: 'High' | 'Medium' | 'Low';
    description: string;
  }>;
}

interface AnalysisContextType {
  activeAnalysis: AnalysisResult | null;
  analysesHistory: AnalysisResult[];
  isOrchestrating: boolean;
  orchestrationProgress: number;
  agents: AgentProgress[];
  currentAgentIndex: number;
  startAnalysis: (input: AnalysisInput) => Promise<void>;
  updateFinancials: (price: number, cost: number, volume: number, adSpend: number) => void;
  deleteAnalysis: (id: string) => Promise<void>;
  selectAnalysis: (id: string) => void;
  fetchUserHistory: () => Promise<void>;
  clearHistory: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

const AGENTS_LIST: Omit<AgentProgress, 'status' | 'progress' | 'logs'>[] = [
  { id: 'cat_classifier', name: 'Category Classifier', description: 'Classifies product and pinpoints primary/secondary niches.' },
  { id: 'price_spy', name: 'Price Spy Agent', description: 'Scans major e-commerce platforms to match competitor pricing.' },
  { id: 'seo_keyword_bot', name: 'SEO Keyword Bot', description: 'Mines high-volume search queries and local search intents.' },
  { id: 'sentiment_analyzer', name: 'Sentiment & Reviews Analyzer', description: 'Processes thousands of historical category reviews for pain points.' },
  { id: 'demand_forecaster', name: 'Demand & Trend Forecaster', description: 'Analyzes search volume trajectories, seasonal metrics, and spikes.' },
  { id: 'financial_optimizer', name: 'Financial Margin Optimizer', description: 'Models target profit structures, break-evens, and growth rates.' },
  { id: 'urdu_copywriter', name: 'Urdu Copywriter Pro', description: 'Drafts localized, authentic Urdu marketing hooks and social copies.' },
  { id: 'recommendation_engine', name: 'Strategy Recommendation Engine', description: 'Consolidates all metrics to draft highly tactical next-steps.' }
];

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);
  
  const [analysesHistory, setAnalysesHistory] = useState<AnalysisResult[]>(() => {
    const saved = localStorage.getItem('sellora_analyses_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
    return [];
  });

  const [isOrchestrating, setIsOrchestrating] = useState<boolean>(false);
  const [orchestrationProgress, setOrchestrationProgress] = useState<number>(0);
  const [agents, setAgents] = useState<AgentProgress[]>([]);
  const [currentAgentIndex, setCurrentAgentIndex] = useState<number>(0);

  const fetchUserHistory = useCallback(async () => {
    const token = localStorage.getItem('sellora_token');
    if (!token) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/analysis/my-reports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalysesHistory(data);
        if (data.length > 0) {
          setActiveAnalysis(prev => prev || data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user analysis history from Supabase', err);
    }
  }, []);

  const clearHistory = () => {
    setActiveAnalysis(null);
    setAnalysesHistory([]);
    localStorage.removeItem('sellora_analyses_history');
  };

  // Save history to localStorage
  const saveHistory = (history: AnalysisResult[]) => {
    setAnalysesHistory(history);
    localStorage.setItem('sellora_analyses_history', JSON.stringify(history));
  };

  // Helper to generate dynamic, premium-quality analysis results tailored to user form input
  const generateAnalysisResult = (input: AnalysisInput): AnalysisResult => {
    const id = `analysis_${Date.now()}`;
    const overallScore = Math.floor(65 + Math.random() * 25); // 65 - 90
    
    // Pricing calculation
    const basePrice = Number(input.sellingPrice);
    const avgCompetitor = basePrice * (0.9 + Math.random() * 0.25);
    const lowest = avgCompetitor * 0.8;
    const highest = avgCompetitor * 1.3;
    const recommendedPrice = basePrice * 0.95;

    // Margins
    const cost = Number(input.costPrice);
    const margin = ((basePrice - cost) / basePrice) * 100;
    const volume = 200; // default volume
    const adSpend = 20000; // default marketing
    const netProfit = (basePrice - cost) * volume - adSpend;
    const roi = (netProfit / (cost * volume + adSpend)) * 100;
    const breakeven = adSpend / (basePrice - cost);

    // Dynamic Keywords
    const keywordsMap: { [key: string]: string[] } = {
      electronics: ['wireless', 'bluetooth', 'fast charging', 'noise cancelling', 'earphones', 'premium audio'],
      fashion: ['organic cotton', 'breathable', 'premium fit', 'casual wear', 'designer', 'summer collection'],
      beauty: ['natural ingredients', 'skin hydration', 'organic skin care', 'dermatologist tested', 'anti-aging'],
      home: ['eco-friendly', 'minimalist', 'durable', 'space saving', 'premium build', 'home decor']
    };

    const catKey = input.category.toLowerCase();
    const relativeKeywords = keywordsMap[catKey] || ['premium quality', 'high demand', 'easy returns', 'free delivery'];
    const keywords = [
      input.productName.toLowerCase().replace(/\s+/g, ' '),
      ...relativeKeywords,
      `${input.productName.toLowerCase()} discount`,
      `${input.productName.toLowerCase()} online`
    ];

    // English copies
    const englishCopies = [
      {
        hook: `Stop compromising on premium quality. Get the ultimate ${input.productName} today!`,
        body: `Designed for those who value excellence. ${input.description || `The high-performance ${input.productName} is now available locally with rapid shipping.`} Shop the best deals and join 5000+ satisfied buyers.`,
        cta: `Shop Now & Save 15%`
      },
      {
        hook: `Meet the only ${input.productName} you will ever need.`,
        body: `Crafted from top-tier materials to provide unmatched performance. Limited stock available. Rated 4.9/5 stars! Get yours delivered in 2-3 business days.`,
        cta: `Claim Yours Free Shipping`
      }
    ];

    // Professional Urdu copies
    const urduCopies = [
      {
        hook: `اب پاکستان میں بھی دستیاب! پیش ہے بہترین اور معیاری ${input.productName}۔`,
        body: `معیار اور پائیداری کا وہ امتزاج جو آپ چاہتے تھے۔ ${input.description ? `ہماری خاص پروڈکٹ: ${input.description.substring(0, 50)}...` : `اعلیٰ ترین کارکردگی کی حامل یہ پروڈکٹ اب محدود مدت کے لیے رعایتی قیمت پر دستیاب ہے۔`} آج ہی آرڈر کریں اور تیز ترین ہوم ڈلیوری حاصل کریں۔`,
        cta: `آج ہی آرڈر کریں`
      },
      {
        hook: `کیا آپ اپنی روزمرہ زندگی کو آسان بنانا چاہتے ہیں؟`,
        body: `ہم لائے ہیں آپ کے لیے بہترین ${input.productName} جو کہ جدید ڈیزائن اور پریمیم کوالٹی کے ساتھ آتی ہے۔ 100٪ اطمینان کی ضمانت۔`,
        cta: `مزید معلومات حاصل کریں`
      }
    ];

    const competitors = [
      { name: 'AlphaCart Store', price: Math.floor(avgCompetitor * 1.05), matchingScore: 92, advantage: 'Slightly higher price but offers next-day delivery.' },
      { name: 'Zenith E-Commerce', price: Math.floor(lowest), matchingScore: 84, advantage: 'Low budget competitor. Sells low quality generic variants.' },
      { name: 'K-Retailers', price: Math.floor(highest), matchingScore: 88, advantage: 'High-end brand. Uses premium packaging and high ad-spend.' }
    ];

    return {
      id,
      input,
      overallScore,
      status: 'completed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      pricing: {
        averageCompetitorPrice: Math.floor(avgCompetitor),
        lowestPrice: Math.floor(lowest),
        highestPrice: Math.floor(highest),
        recommendedPrice: Math.floor(recommendedPrice),
        tiers: [
          { name: 'Starter Pack', price: Math.floor(basePrice * 0.85), margin: Math.floor(margin - 10), benefit: 'Appeals to price-sensitive buyers and drives high volume.' },
          { name: 'Smart Bundle (Recommended)', price: Math.floor(basePrice * 1.2), margin: Math.round(margin + 5), benefit: 'Bundled with accessories for maximum cart-value boost.' },
          { name: 'Elite Care Warranty Pack', price: Math.floor(basePrice * 1.45), margin: Math.round(margin + 12), benefit: 'High margins. Appeals to buyers looking for protection.' }
        ]
      },
      seo: {
        metaTitle: `Buy ${input.productName} Online - Premium Quality & Best Rates`,
        metaDescription: `Discover the premium ${input.productName}. ${input.description ? input.description.substring(0, 100) : 'High performance and long-lasting build.'} Available at the best prices with free home delivery. Order now!`,
        keywords,
        darazTitle: `${input.productName} - Premium Quality - Certified Seller`,
        darazDescription: `<ul><li>Premium design and certified reliability</li><li>Best pricing for ${input.productName} online</li><li>Highly reviewed by verified customers</li><li>24/7 dedicated support desk</li></ul>`
      },
      adCopies: {
        english: englishCopies,
        urdu: urduCopies,
        targetAudiences: [
          `Active E-commerce shoppers in Pakistan aged 18-35`,
          `Niche audiences searching for "${input.productName}" or related items`,
          `High-intent buyers looking on Daraz and local marketplaces`
        ]
      },
      marketIntel: {
        trendScore: Math.floor(75 + Math.random() * 20),
        marketGrowth: Number((12 + Math.random() * 18).toFixed(1)),
        sentiment: { positive: 74, neutral: 18, negative: 8 },
        competitors
      },
      financials: {
        sellingPrice: basePrice,
        costPrice: cost,
        margin: Math.round(margin),
        netProfit,
        roi: Math.round(roi),
        breakevenUnits: Math.round(breakeven),
        growthPrediction: 24.5
      },
      recommendations: [
        {
          title: 'Bundle Strategy for Higher Cart Margins',
          impact: 'High',
          effort: 'Medium',
          description: `Combine your ${input.productName} with standard add-ons to boost your margins by up to 15%. This increases the average order value (AOV) and lowers shipping ratios.`
        },
        {
          title: 'Optimize Google SEO & Keywords Meta',
          impact: 'High',
          effort: 'Low',
          description: `Add local Urdu + English keywords like "${keywords[1]}" to your marketplace title to double your organic clicks without spending on paid ads.`
        },
        {
          title: 'Targeted High-Converting Facebook Urdu Ads',
          impact: 'Medium',
          effort: 'Medium',
          description: 'Leverage our generated Urdu copy hooks on Meta Ads. Localized Urdu copy converts 40% better than standard English copy in targeted demographics.'
        }
      ]
    };
  };

  const startAnalysis = async (input: AnalysisInput) => {
    setIsOrchestrating(true);
    setOrchestrationProgress(0);
    setCurrentAgentIndex(0);

    // Initialize agent statuses
    const initialAgents: AgentProgress[] = AGENTS_LIST.map((a, index) => ({
      ...a,
      status: index === 0 ? 'running' : 'waiting',
      progress: 0,
      logs: [`Agent ${a.name} is standing by...`]
    }));
    setAgents(initialAgents);

    // Simulate Agent Orchestration timeline
    const totalDuration = 8000; // 8 seconds total
    const stepsCount = AGENTS_LIST.length;
    const stepDuration = totalDuration / stepsCount;

    for (let i = 0; i < stepsCount; i++) {
      setCurrentAgentIndex(i);
      
      // Mark current agent as running
      setAgents(prev => prev.map((a, idx) => {
        if (idx === i) {
          return {
            ...a,
            status: 'running',
            logs: [...a.logs, `Initializing agent routines...`, `Connecting to data sockets...`, `Scanning inputs...`]
          };
        }
        return a;
      }));

      // Simulate partial progress inside the active agent
      const subSteps = 3;
      for (let s = 1; s <= subSteps; s++) {
        await new Promise(resolve => setTimeout(resolve, stepDuration / subSteps));
        const currentProg = Math.round((i * 100 / stepsCount) + (s * (100 / stepsCount) / subSteps));
        setOrchestrationProgress(currentProg);

        setAgents(prev => prev.map((a, idx) => {
          if (idx === i) {
            const dynamicLogs = [
              s === 1 ? `Checking data matrices...` : '',
              s === 2 ? `Processing market nodes...` : '',
              s === 3 ? `Generating intelligence signals...` : ''
            ].filter(Boolean);
            
            return {
              ...a,
              progress: Math.round(s * 100 / subSteps),
              logs: [...a.logs, ...dynamicLogs]
            };
          }
          return a;
        }));
      }

      // Mark active agent as done
      setAgents(prev => prev.map((a, idx) => {
        if (idx === i) {
          return {
            ...a,
            status: 'done',
            progress: 100,
            logs: [...a.logs, `Agent completed execution successfully! Finished in ${Math.round(stepDuration)}ms.`]
          };
        }
        // Mark next agent as running
        if (idx === i + 1) {
          return {
            ...a,
            status: 'running',
            logs: [`Starting execution pipelines...`]
          };
        }
        return a;
      }));
    }

    // Finalize
    const completedResult = generateAnalysisResult(input);
    
    // If authenticated, persist to remote Supabase DB!
    const token = localStorage.getItem('sellora_token');
    if (token) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/analysis/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(completedResult)
        });
        if (res.ok) {
          const data = await res.json();
          completedResult.id = data.id; // Replace temporary ID with permanent Supabase UUID!
        }
      } catch (err) {
        console.error('Failed to persist analysis to Supabase', err);
      }
    }
    
    setActiveAnalysis(completedResult);
    setIsOrchestrating(false);
    setOrchestrationProgress(100);
    
    // Add to history
    const updatedHistory = [completedResult, ...analysesHistory.filter(x => x.id !== completedResult.id)];
    saveHistory(updatedHistory);
  };

  // Live financials recalculator
  const updateFinancials = (price: number, cost: number, volume: number, adSpend: number) => {
    if (!activeAnalysis) return;
    
    const margin = ((price - cost) / price) * 100;
    const netProfit = (price - cost) * volume - adSpend;
    const roi = (netProfit / (cost * volume + adSpend)) * 100;
    const breakevenUnits = adSpend / (price - cost);

    const updated = {
      ...activeAnalysis,
      pricing: {
        ...activeAnalysis.pricing,
        tiers: activeAnalysis.pricing.tiers.map((tier, idx) => {
          if (idx === 0) return { ...tier, price: Math.floor(price * 0.85), margin: Math.round(margin - 10) };
          if (idx === 1) return { ...tier, price: Math.floor(price * 1.2), margin: Math.round(margin + 5) };
          return { ...tier, price: Math.floor(price * 1.45), margin: Math.round(margin + 12) };
        })
      },
      financials: {
        ...activeAnalysis.financials,
        sellingPrice: price,
        costPrice: cost,
        margin: Math.round(margin),
        netProfit: Math.round(netProfit),
        roi: Math.round(roi),
        breakevenUnits: Math.round(breakevenUnits)
      }
    };
    
    setActiveAnalysis(updated);
    // Update history record as well
    const updatedHistory = analysesHistory.map(item => {
      if (item.id === activeAnalysis.id) {
        return updated;
      }
      return item;
    });
    saveHistory(updatedHistory);
  };

  const deleteAnalysis = async (id: string) => {
    const token = localStorage.getItem('sellora_token');
    if (token && id.includes('-')) { // Supabase UUIDs contain dashes
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        await fetch(`${apiUrl}/api/analysis/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Failed to delete analysis from Supabase', err);
      }
    }

    const updated = analysesHistory.filter(x => x.id !== id);
    saveHistory(updated);
    if (activeAnalysis && activeAnalysis.id === id) {
      setActiveAnalysis(updated[0] || null);
    }
  };

  const selectAnalysis = (id: string) => {
    const found = analysesHistory.find(x => x.id === id);
    if (found) {
      setActiveAnalysis(found);
    }
  };

  return (
    <AnalysisContext.Provider value={{
      activeAnalysis,
      analysesHistory,
      isOrchestrating,
      orchestrationProgress,
      agents,
      currentAgentIndex,
      startAnalysis,
      updateFinancials,
      deleteAnalysis,
      selectAnalysis,
      fetchUserHistory,
      clearHistory
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};
