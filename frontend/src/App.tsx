import { useState, useEffect, useRef } from 'react';
import { useAnalysis, type AnalysisInput } from './context/AnalysisContext';
import './App.css';

const SelloraLogo = ({ className = "h-10 w-10" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sellora-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00d4aa" stopOpacity={1} />
        <stop offset="100%" stopColor="#7c6ff7" stopOpacity={1} />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="80" fill="none" stroke="url(#sellora-logo-grad)" strokeWidth="12" />
    <path d="M70 130 L100 70 L130 130" fill="none" stroke="url(#sellora-logo-grad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="100" cy="100" r="20" fill="url(#sellora-logo-grad)" />
  </svg>
);

function App() {
  const {
    activeAnalysis,
    analysesHistory,
    orchestrationProgress,
    agents,
    currentAgentIndex,
    startAnalysis,
    updateFinancials,
    deleteAnalysis,
    selectAnalysis,
    fetchUserHistory,
    clearHistory
  } = useAnalysis();

  // App routing state: 'landing' | 'form' | 'orchestration' | 'results' | 'profile' | 'not-found'
  const [currentPage, setCurrentPage] = useState<'landing' | 'form' | 'orchestration' | 'results' | 'profile' | 'not-found'>(() => {
    if (window.location.pathname !== '/' && window.location.pathname !== '') {
      return 'not-found';
    }
    return 'landing';
  });
  
  // Active sub-dashboard tab in results view
  const [activeResultTab, setActiveResultTab] = useState<string>('pricing');

  // Real-time competitor tracking state
  const [liveCompetitors, setLiveCompetitors] = useState<any[]>([]);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);

  const fetchLiveData = async () => {
    if (!activeAnalysis) return;
    setIsFetchingLive(true);
    try {
      const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const apiUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
      const productName = encodeURIComponent(activeAnalysis.input.productName);
      const basePrice = activeAnalysis.input.sellingPrice;
      const res = await fetch(`${apiUrl}/api/competitor/track?product_name=${productName}&base_price=${basePrice}`);
      if (res.ok) {
        const data = await res.json();
        setLiveCompetitors(data.data);
        setLastFetchTime(new Date().toLocaleTimeString());
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Failed to fetch live competitors", errData);
        alert(`Failed to fetch: ${errData.detail || res.statusText}`);
      }
    } catch (err) {
      console.error("Failed to fetch live competitors", err);
      alert("Network error: Could not reach the server to fetch live data.");
    } finally {
      setIsFetchingLive(false);
    }
  };

  // History modal toggle
  const [showHistory, setShowHistory] = useState(false);

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Platform Connection State
  const [platforms, setPlatforms] = useState({
    shopify: { connected: true, syncing: true, loading: false },
    amazon: { connected: false, syncing: false, loading: false },
    daraz: { connected: false, syncing: false, loading: false }
  });

  const togglePlatform = (platform: 'shopify' | 'amazon' | 'daraz') => {
    setPlatforms(prev => ({
      ...prev,
      [platform]: { ...prev[platform], loading: true }
    }));
    
    setTimeout(() => {
      setPlatforms(prev => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          connected: !prev[platform].connected,
          syncing: !prev[platform].connected,
          loading: false
        }
      }));
    }, 1000);
  };

  // User Authentication State
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
    plan: string;
    preferred_language: string;
  } | null>(() => {
    const saved = localStorage.getItem('sellora_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Fetch user-specific analysis history from Supabase if logged in
  useEffect(() => {
    if (user) {
      fetchUserHistory();
    }
  }, [user, fetchUserHistory]);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [isSignUp, setIsSignUp] = useState(false);
  const [signupName, setSignupName] = useState('');

  // User Profile Settings State (prepopulated)
  const [profileFirstName, setProfileFirstName] = useState(() => {
    const savedUser = localStorage.getItem('sellora_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const parts = (parsed.name || 'Test Seller').split(' ');
      return parts[0] || 'Test';
    }
    return 'Test';
  });
  
  const [profileLastName, setProfileLastName] = useState(() => {
    const savedUser = localStorage.getItem('sellora_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const parts = (parsed.name || 'Test Seller').split(' ');
      return parts.slice(1).join(' ') || 'Seller';
    }
    return 'Seller';
  });
  
  const [profilePhone, setProfilePhone] = useState('+1 (555) 000-0000');
  const [profileLang, setProfileLang] = useState('English (US)');
  const [profileTimezone, setProfileTimezone] = useState('(GMT+05:00) Islamabad');
  const [profileBio, setProfileBio] = useState('E-commerce professional scaling store operations with AI.');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);

  // Profile Picture State
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(() => {
    return localStorage.getItem('sellora_user_avatar');
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setProfilePictureUrl(dataUrl);
        localStorage.setItem('sellora_user_avatar', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureRemove = () => {
    setProfilePictureUrl(null);
    localStorage.removeItem('sellora_user_avatar');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Invalid email or password.');
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('sellora_user', JSON.stringify(data.user));
      localStorage.setItem('sellora_token', data.access_token);
      
      // Update profile first and last name from logged in user name
      const parts = (data.user.name || '').split(' ');
      setProfileFirstName(parts[0] || 'Test');
      setProfileLastName(parts.slice(1).join(' ') || 'Seller');

      // Fetch user specific analysis history from Supabase!
      await fetchUserHistory();

      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      console.error('Login failed', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please verify credentials.';
      setLoginError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          name: signupName
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to create user account.');
      }

      // Automatically log in after successful registration
      const loginResponse = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      if (!loginResponse.ok) {
        setIsSignUp(false);
        throw new Error('Account created successfully! Please log in with your credentials.');
      }

      const data = await loginResponse.json();
      setUser(data.user);
      localStorage.setItem('sellora_user', JSON.stringify(data.user));
      localStorage.setItem('sellora_token', data.access_token);
      
      const parts = (data.user.name || '').split(' ');
      setProfileFirstName(parts[0] || 'Test');
      setProfileLastName(parts.slice(1).join(' ') || 'Seller');

      await fetchUserHistory();

      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      setSignupName('');
      setIsSignUp(false);
    } catch (err) {
      console.error('Signup/Login failed', err);
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please verify fields.';
      setLoginError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sellora_user');
    localStorage.removeItem('sellora_token');
    clearHistory(); // Clear active report and user history!
    setShowUserDropdown(false);
    setCurrentPage('landing');
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSavedSuccess(false);

    try {
      const token = localStorage.getItem('sellora_token');
      if (token) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            firstName: profileFirstName,
            lastName: profileLastName
          })
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          localStorage.setItem('sellora_user', JSON.stringify(data));
          setProfileSavedSuccess(true);
        } else {
          const data = await response.json();
          setLoginError(data.detail || 'Failed to save profile changes.');
        }
      } else {
        // Guest mode fallback
        if (user) {
          const updatedUser = {
            ...user,
            name: `${profileFirstName} ${profileLastName}`.trim()
          };
          setUser(updatedUser);
          localStorage.setItem('sellora_user', JSON.stringify(updatedUser));
        }
        setProfileSavedSuccess(true);
      }
    } catch (err) {
      console.error('Failed to update profile settings', err);
    } finally {
      setProfileSaving(false);
      setTimeout(() => {
        setProfileSavedSuccess(false);
      }, 3000);
    }
  };

  // Active Result Tab in profile view (mock navigation for sidebar/tabs)
  const [activeProfileTab, setActiveProfileTab] = useState('profile');

  // Form states
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [description, setDescription] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [reportLanguage, setReportLanguage] = useState<'en' | 'ur'>('en');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['daraz', 'local']);

  // Financial calculator local sliders (synced to context)
  const [calcPrice, setCalcPrice] = useState<number>(0);
  const [calcCost, setCalcCost] = useState<number>(0);
  const [calcVolume, setCalcVolume] = useState<number>(200);
  const [calcAdSpend, setCalcAdSpend] = useState<number>(20000);

  const handlePlatformToggle = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName) return;

    const input: AnalysisInput = {
      productName,
      category,
      sellingPrice: Number(sellingPrice) || 1000,
      costPrice: Number(costPrice) || 400,
      platforms: selectedPlatforms,
      description,
      competitorUrl,
      reportLanguage
    };

    // Prepopulate financial calculator sliders
    setCalcPrice(Number(sellingPrice) || 1000);
    setCalcCost(Number(costPrice) || 400);
    setCalcVolume(200);
    setCalcAdSpend(20000);

    setCurrentPage('orchestration');
    await startAnalysis(input);
    setCurrentPage('results');
    setActiveResultTab('pricing');
  };

  const triggerHistorySelect = (id: string) => {
    selectAnalysis(id);
    const found = analysesHistory.find(x => x.id === id);
    if (found) {
      setCalcPrice(found.financials.sellingPrice);
      setCalcCost(found.financials.costPrice);
    }
    setCurrentPage('results');
    setActiveResultTab('pricing');
    setShowHistory(false);
  };

  const handleSliderChange = (type: 'price' | 'cost' | 'volume' | 'adSpend', val: number) => {
    let p = calcPrice;
    let c = calcCost;
    let v = calcVolume;
    let a = calcAdSpend;

    if (type === 'price') { p = val; setCalcPrice(val); }
    else if (type === 'cost') { c = val; setCalcCost(val); }
    else if (type === 'volume') { v = val; setCalcVolume(val); }
    else if (type === 'adSpend') { a = val; setCalcAdSpend(val); }

    updateFinancials(p, c, v, a);
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent-teal/30 relative">
      <div className="animated-bg"></div>

      {/* Global Navigation Header */}
      <nav className="fixed top-0 w-full z-50 bg-bg-primary/80 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="flex justify-between items-center px-6 md:px-12 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('landing')}>
            <SelloraLogo className="h-10 w-10 animate-pulse" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold bg-gradient-to-r from-accent-teal to-accent-purple bg-clip-text text-transparent">Sellora</span>
              <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-on-surface-variant">Intelligence</span>
            </div>
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <button className="text-sm text-text-secondary hover:text-accent-teal transition-colors" onClick={() => setCurrentPage('landing')}>Overview</button>
            <button className="text-sm text-text-secondary hover:text-accent-teal transition-colors" onClick={() => setCurrentPage('form')}>New Analysis</button>
            
            {/* History Dropdown */}
            <div className="relative">
              <button 
                className="text-sm text-text-secondary hover:text-accent-teal transition-colors flex items-center gap-1"
                onClick={() => setShowHistory(!showHistory)}
              >
                Past Reports
                <span className="material-symbols-outlined text-xs">expand_more</span>
              </button>
              
              {showHistory && (
                <div className="absolute right-0 mt-3 w-80 glass-card bg-bg-secondary/95 border border-white/10 rounded-xl p-3 shadow-2xl z-50 animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-2">
                    <span className="text-xs font-bold text-accent-teal uppercase tracking-wider">Analysis History</span>
                    <button className="text-[10px] text-text-tertiary hover:text-white" onClick={() => setShowHistory(false)}>Close</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {analysesHistory.length === 0 ? (
                      <p className="text-xs text-text-tertiary text-center py-4">No previous analyses found.</p>
                    ) : (
                      analysesHistory.map(item => (
                        <div 
                          key={item.id} 
                          className="p-2 hover:bg-white/5 rounded-lg cursor-pointer flex justify-between items-center transition-colors border border-transparent hover:border-white/5"
                          onClick={() => triggerHistorySelect(item.id)}
                        >
                          <div className="flex flex-col max-w-[70%]">
                            <span className="text-xs font-bold text-white truncate">{item.input.productName}</span>
                            <span className="text-[10px] text-text-tertiary">{item.input.category} • Score: {item.overallScore}</span>
                          </div>
                          <button 
                            className="text-text-tertiary hover:text-status-error transition-colors p-1"
                            onClick={(e) => { e.stopPropagation(); deleteAnalysis(item.id); }}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <button 
                  className="text-sm text-text-secondary hover:text-accent-teal hidden sm:block" 
                  onClick={() => setShowLoginModal(true)}
                >
                  Login
                </button>
                <button 
                  className="bg-gradient-to-r from-accent-teal to-accent-purple text-bg-primary text-xs px-5 py-2.5 rounded-lg font-bold active:scale-95 transition-all neon-glow-teal hover:scale-105"
                  onClick={() => setCurrentPage('form')}
                >
                  Analyze Free
                </button>
              </>
            ) : (
              <div className="relative">
                <button 
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent-teal transition-colors"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-teal to-accent-purple flex items-center justify-center text-xs font-bold text-bg-primary">
                      {profileFirstName[0] || 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline font-semibold">{user.name}</span>
                  <span className="material-symbols-outlined text-xs">expand_more</span>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-3 w-48 glass-card bg-bg-secondary/95 border border-white/10 rounded-xl p-2 shadow-2xl z-50 animate-fade-in text-left">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-text-tertiary truncate">{user.email}</p>
                    </div>
                    <button 
                      className="w-full text-left text-xs text-text-secondary hover:text-accent-teal hover:bg-white/5 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                      onClick={() => { setCurrentPage('profile'); setShowUserDropdown(false); }}
                    >
                      <span className="material-symbols-outlined text-sm">person</span>
                      My Profile
                    </button>
                    <button 
                      className="w-full text-left text-xs text-text-secondary hover:text-accent-teal hover:bg-white/5 px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                      onClick={() => { setCurrentPage('form'); setShowUserDropdown(false); }}
                    >
                      <span className="material-symbols-outlined text-sm">analytics</span>
                      New Analysis
                    </button>
                    <button 
                      className="w-full text-left text-xs text-status-error hover:bg-status-error/5 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 border-t border-white/5 mt-1"
                      onClick={handleLogout}
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Body Routing */}
      <main className="pt-20 min-h-screen">
        {currentPage === 'not-found' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
            <h1 className="text-8xl font-hero-lg font-bold text-accent-teal mb-4">404</h1>
            <h2 className="text-3xl font-headline-h2 font-semibold mb-4 text-white">Page Not Found</h2>
            <p className="text-text-secondary text-body-lg mb-8">The route you requested is unavailable.</p>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/');
                setCurrentPage('landing');
              }}
              className="bg-accent-teal text-bg-primary px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              Go Home
            </button>
          </div>
        )}
        {currentPage === 'landing' && (
          <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="relative min-h-[819px] flex flex-col items-center justify-center px-margin-desktop text-center overflow-hidden">
              <div className="max-w-4xl relative z-10 space-y-6">
                <h1 className="font-hero-lg text-hero-lg mb-lg bg-gradient-to-r from-accent-teal to-accent-purple bg-clip-text text-transparent leading-tight">
                  Know Everything About Your Product in 60 Seconds
                </h1>
                <p className="font-body-lg text-body-lg text-text-secondary mb-xl max-w-2xl mx-auto leading-relaxed">
                  16 AI agents analyze your competitors, pricing, SEO, and demand — simultaneously. Professional intelligence for elite e-commerce operators.
                </p>
                <div className="flex flex-col items-center gap-md pt-4">
                  <button 
                    onClick={() => setCurrentPage('form')}
                    className="bg-gradient-to-r from-accent-teal to-[#00B89E] text-bg-primary font-headline-h3 text-headline-h3 px-xxl py-md rounded-xl font-bold neon-glow-teal transition-all hover:scale-105 active:scale-95"
                  >
                    Analyze My Product Free →
                  </button>
                  <div className="flex flex-wrap justify-center gap-sm mt-md">
                    <span className="bg-white/5 border border-white/10 px-md py-xs rounded-full text-body-sm text-text-secondary">✓ No credit card</span>
                    <span className="bg-white/5 border border-white/10 px-md py-xs rounded-full text-body-sm text-text-secondary">✓ 60-second analysis</span>
                    <span className="bg-white/5 border border-white/10 px-md py-xs rounded-full text-body-sm text-text-secondary">✓ English + Urdu</span>
                  </div>
                </div>
              </div>

              {/* Floating Insight Cards */}
              <div className="hidden lg:block absolute inset-0 pointer-events-none">
                {/* Top-Left Card (Price) */}
                <div className="absolute top-[18%] left-[8%] hero-metric-card p-md px-lg rounded-xl flex flex-col items-center floating-p-1 shadow-2xl">
                  <span className="text-xl mb-1">💰</span>
                  <span className="font-label-md text-sm text-on-surface">Price: PKR 2,299</span>
                </div>
                {/* Right Card (Trend) */}
                <div className="absolute top-[38%] right-[15%] hero-metric-card p-md px-lg rounded-xl flex flex-col items-center floating-p-2 shadow-2xl">
                  <span className="text-xl mb-1">📈</span>
                  <span className="font-label-md text-sm text-on-surface">Trend: Rising ↗</span>
                </div>
                {/* Bottom-Left Card (Score) */}
                <div className="absolute bottom-[25%] left-[12%] hero-metric-card p-md px-lg rounded-xl flex flex-col items-center floating-p-3 shadow-2xl">
                  <span className="text-xl mb-1">📊</span>
                  <span className="font-label-md text-sm text-on-surface">Score: 87/100</span>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section className="py-xxl px-margin-desktop bg-bg-secondary/30">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-xxl">
                  <h2 className="font-hero-lg text-headline-h1 mb-md bg-gradient-to-r from-accent-teal to-accent-purple bg-clip-text text-transparent">How Sellora Works</h2>
                  <p className="text-text-secondary font-body-lg max-w-2xl mx-auto leading-relaxed">Our proprietary 3-step analysis engine turns product data into competitive dominance in under 60 seconds.</p>
                </div>
                
                <div className="relative">
                  {/* Enhanced Connecting Line */}
                  <div className="hidden lg:block absolute top-[40%] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-accent-teal/40 to-transparent z-0"></div>
                  <div className="hidden lg:block absolute top-[40%] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-accent-teal/20 to-transparent blur-sm z-0"></div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl relative z-10">
                    {/* Step 1 */}
                    <div className="glass-card p-xl rounded-2xl flex flex-col items-center text-center group transition-all duration-500 hover:bg-white/[0.05]">
                      <div className="flex items-center justify-between w-full mb-lg">
                        <span className="text-xs font-data-mono text-accent-teal/60 tracking-widest">01</span>
                        <div className="w-16 h-16 rounded-xl bg-accent-teal/10 flex items-center justify-center text-3xl border border-accent-teal/20 group-hover:scale-110 transition-transform duration-500">📝</div>
                      </div>
                      <h3 className="font-headline-h2 text-text-primary mb-md">Input Parameters</h3>
                      <p className="font-body-rg text-text-secondary leading-relaxed">Simply provide your product name, target pricing, and the marketplaces you wish to dominate.</p>
                    </div>

                    {/* Step 2 (Highlighted Card) */}
                    <div className="glass-card p-xl rounded-2xl flex flex-col items-center text-center group border-accent-teal/30 bg-accent-teal/[0.03] transition-all duration-500 hover:bg-accent-teal/[0.05]">
                      <div className="flex items-center justify-between w-full mb-lg">
                        <span className="text-xs font-data-mono text-accent-teal/60 tracking-widest">02</span>
                        <div className="w-16 h-16 rounded-xl bg-accent-teal/20 flex items-center justify-center border border-accent-teal/40 shadow-[0_0_20px_rgba(0,212,170,0.2)] group-hover:scale-110 transition-transform duration-500">
                          <span className="material-symbols-outlined text-accent-teal text-4xl select-none">psychology</span>
                        </div>
                      </div>
                      <h3 className="font-headline-h2 text-text-primary mb-md">Agent Orchestration</h3>
                      <p className="font-body-rg text-text-secondary leading-relaxed">16 specialized AI agents synchronize to analyze competitors, SEO metadata, and market sentiment.</p>
                    </div>

                    {/* Step 3 */}
                    <div className="glass-card p-xl rounded-2xl flex flex-col items-center text-center group transition-all duration-500 hover:bg-white/[0.05]">
                      <div className="flex items-center justify-between w-full mb-lg">
                        <span className="text-xs font-data-mono text-accent-teal/60 tracking-widest">03</span>
                        <div className="w-16 h-16 rounded-xl bg-accent-teal/10 flex items-center justify-center text-3xl border border-accent-teal/20 group-hover:scale-110 transition-transform duration-500">📊</div>
                      </div>
                      <h3 className="font-headline-h2 text-text-primary mb-md">Strategic Intelligence</h3>
                      <p className="font-body-rg text-text-secondary leading-relaxed">Receive a comprehensive intelligence report with high-fidelity, actionable growth recommendations.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Grid */}
            <section className="py-xxl px-margin-desktop bg-bg-primary">
              <div className="max-w-7xl mx-auto space-y-12">
                <div className="mb-xl text-center sm:text-left">
                  <h2 className="font-headline-h2 text-headline-h2 text-white mb-xs">Why Choose Sellora?</h2>
                  <p className="text-text-secondary font-body-rg text-body-rg">Enterprise-grade tools built for high-performance sellers.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                  {/* Feature 1 */}
                  <div className="glass-card p-lg rounded-xl flex flex-col gap-md">
                    <span className="material-symbols-outlined text-accent-teal text-4xl">target</span>
                    <div>
                      <h4 className="font-headline-h3 text-headline-h3 mb-xs text-white">Competitor Price Scanning</h4>
                      <p className="font-body-rg text-body-rg text-text-secondary">Real-time pricing intelligence across multiple marketplaces to keep you competitive.</p>
                    </div>
                  </div>
                  {/* Feature 2 */}
                  <div className="glass-card p-lg rounded-xl flex flex-col gap-md">
                    <span className="material-symbols-outlined text-accent-teal text-4xl">forum</span>
                    <div>
                      <h4 className="font-headline-h3 text-headline-h3 mb-xs text-white">Review Sentiment Analysis</h4>
                      <p className="font-body-rg text-body-rg text-text-secondary">Understand exactly what buyers love and hate about your category in seconds.</p>
                    </div>
                  </div>
                  {/* Feature 3 */}
                  <div className="glass-card p-lg rounded-xl flex flex-col gap-md">
                    <span className="material-symbols-outlined text-accent-teal text-4xl">search_insights</span>
                    <div>
                      <h4 className="font-headline-h3 text-headline-h3 mb-xs text-white">SEO Keyword Finder</h4>
                      <p className="font-body-rg text-body-rg text-text-secondary">Unlock the top search terms your competitors are using to steal their traffic.</p>
                    </div>
                  </div>
                  {/* Feature 4 */}
                  <div className="glass-card p-lg rounded-xl flex flex-col gap-md">
                    <span className="material-symbols-outlined text-accent-teal text-4xl">translate</span>
                    <div>
                      <h4 className="font-headline-h3 text-headline-h3 mb-xs text-white">Urdu + English Ad Copy</h4>
                      <p className="font-body-rg text-body-rg text-text-secondary">Professional, high-converting copy for Facebook and Google in dual languages.</p>
                    </div>
                  </div>
                  {/* Feature 5 */}
                  <div className="glass-card p-lg rounded-xl flex flex-col gap-md">
                    <span className="material-symbols-outlined text-accent-teal text-4xl">trending_up</span>
                    <div>
                      <h4 className="font-headline-h3 text-headline-h3 mb-xs text-white">Demand Trend Prediction</h4>
                      <p className="font-body-rg text-body-rg text-text-secondary">Spot rising seasonal demand and niche opportunities before your competition does.</p>
                    </div>
                  </div>
                  {/* Feature 6 */}
                  <div className="glass-card p-lg rounded-xl flex flex-col gap-md">
                    <span className="material-symbols-outlined text-accent-teal text-4xl">account_balance_wallet</span>
                    <div>
                      <h4 className="font-headline-h3 text-headline-h3 mb-xs text-white">Profit Margin Calculator</h4>
                      <p className="font-body-rg text-body-rg text-text-secondary">Optimize your pricing instantly with our deep financial modeling engine.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bento Grid Insights Preview */}
            <section className="py-xxl px-margin-desktop bg-bg-tertiary/20">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-md h-auto md:h-[600px]">
                <div className="md:col-span-2 md:row-span-1 glass-card p-lg rounded-xl relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <h4 className="font-headline-h2 text-headline-h2 mb-sm text-accent-teal">Deep Market Analysis</h4>
                    <p className="text-text-secondary font-body-rg leading-relaxed">Our AI doesn't just scrape data—it understands context. Get actionable advice on market gaps.</p>
                  </div>
                  <img 
                    alt="Market Analysis" 
                    className="w-full h-32 object-cover rounded-lg opacity-60 mt-md border border-white/5 shadow-2xl" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_7hNSZDtHZgJ4jARmHwCVij8-5At229qdAGw6MT2XH3zo7HegmGu-5YLKgDqGRRRHlm11TdiMXaBsTzUL4ZkAiRuUpJtmnri5-ZJXToJav8BcKGk-geH1HjiH56wvHGiuoCXrHwq5lGuvY3XIJIO5iurLWIwExmjUQh9118t02bQjrP6R70yC88ji2KcXUTefXFd51wmCxnElKbi8YWpafI-bStZR3PkZgYB-O6n3o0acSg-yjgLdjCgH8Zrdd1Im8BjYql3lV7bU" 
                  />
                </div>
                <div className="md:col-span-1 md:row-span-2 glass-card p-lg rounded-xl flex flex-col justify-center items-center text-center">
                  <div className="w-32 h-32 rounded-full border-4 border-accent-teal flex items-center justify-center relative mb-md">
                    <span className="text-headline-h1 font-bold text-accent-teal">87</span>
                    <div className="absolute inset-0 rounded-full border-4 border-accent-purple border-t-transparent animate-spin"></div>
                  </div>
                  <h5 className="font-headline-h3 text-headline-h3 mb-xs text-white">Intelligence Score</h5>
                  <p className="text-text-secondary text-body-sm leading-relaxed">Your product performance against top 5% of sellers in your category.</p>
                </div>
                <div className="md:col-span-1 md:row-span-1 glass-card p-lg rounded-xl flex flex-col gap-sm justify-center">
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-status-success">check_circle</span>
                    <span className="font-label-md text-label-md text-white">SEO Optimized</span>
                  </div>
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-status-warning">warning</span>
                    <span className="font-label-md text-label-md text-white">Pricing Warning</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mt-sm">
                    <div className="h-full bg-accent-teal w-[87%] shadow-[0_0_8px_rgba(0,212,170,0.5)]"></div>
                  </div>
                </div>
                <div className="md:col-span-1 md:row-span-1 glass-card p-lg rounded-xl flex flex-col justify-center">
                  <p className="text-body-sm text-text-tertiary mb-xs">Predicted Monthly Growth</p>
                  <div className="text-headline-h1 font-bold text-accent-teal">+24.5%</div>
                </div>
              </div>
            </section>

            {/* Secondary CTA */}
            <section className="py-xxl px-margin-desktop text-center">
              <div className="max-w-3xl mx-auto glass-card p-xl rounded-xxl border-accent-teal/20 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent-teal/5 to-accent-purple/5"></div>
                <div className="relative z-10 space-y-6">
                  <h2 className="font-headline-h1 text-headline-h1 mb-md text-white">Ready to dominate your market?</h2>
                  <p className="text-text-secondary mb-xl font-body-lg">Stop guessing. Start knowing. Join 5,000+ elite sellers using Sellora to scale their operations.</p>
                  <button 
                    onClick={() => setCurrentPage('form')}
                    className="bg-accent-teal text-bg-primary font-headline-h3 text-headline-h3 px-xxl py-md rounded-xl font-bold neon-glow-teal hover:scale-105 active:scale-95 transition-all"
                  >
                    Launch Free Analysis
                  </button>
                </div>
              </div>
            </section>

            {/* Rich Footer */}
            <footer className="bg-bg-tertiary border-t border-white/10 pt-16 pb-8 mt-20">
              <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
                <div className="flex flex-col gap-4 w-full md:w-80 shrink-0 text-left">
                  <div className="flex items-center gap-2">
                    <SelloraLogo className="h-8 w-8" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-md font-bold text-accent-teal">Sellora</span>
                      <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-on-surface-variant">Intelligence</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-tertiary leading-relaxed">
                    The world's most advanced AI-powered e-commerce intelligence platform for the modern seller.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-8 w-full md:w-auto text-left">
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-text-secondary">Product</span>
                    <a className="text-xs text-text-tertiary hover:text-accent-teal transition-colors" href="#">Features</a>
                    <a className="text-xs text-text-tertiary hover:text-accent-teal transition-colors" href="#">Pricing</a>
                    <a className="text-xs text-text-tertiary hover:text-accent-teal transition-colors" href="#">Case Studies</a>
                  </div>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-text-secondary">Company</span>
                    <a className="text-xs text-text-tertiary hover:text-accent-teal transition-colors" href="#">About Us</a>
                    <a className="text-xs text-text-tertiary hover:text-accent-teal transition-colors" href="#">Blog</a>
                    <a className="text-xs text-text-tertiary hover:text-accent-teal transition-colors" href="#">Careers</a>
                  </div>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-text-secondary">Support</span>
                    <a className="text-xs text-text-tertiary hover:text-accent-teal transition-colors" href="#">Help Center</a>
                    <a className="text-xs text-text-tertiary hover:text-accent-teal transition-colors" href="#">Privacy Policy</a>
                    <a className="text-xs text-text-tertiary hover:text-accent-teal transition-colors" href="#">Terms of Service</a>
                  </div>
                </div>
              </div>
              <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                <p className="text-xs text-text-tertiary">© 2026 Sellora AI Intelligence. All rights reserved.</p>
                <div className="flex gap-4">
                  <a className="text-text-tertiary hover:text-accent-teal transition-all scale-110" href="#">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a className="text-text-tertiary hover:text-accent-teal transition-all scale-110" href="#">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                </div>
              </div>
            </footer>
          </div>
        )}

        {currentPage === 'form' && (
          <div className="min-h-[85vh] w-full flex overflow-hidden animate-fade-in">
            {/* Left 35% Decorative Panel */}
            <section className="hidden lg:flex w-[35%] bg-gradient-to-br from-[#0F1117] via-[#1C1F2E] to-[#00382b] relative flex-col justify-center px-12 overflow-hidden border-r border-white/5">
              <div className="absolute inset-0 bg-[radial-gradient(rgba(0,212,170,0.08)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2">
                  <SelloraLogo className="h-8 w-8" />
                  <span className="text-accent-teal text-2xl font-black">Sellora</span>
                  <span className="bg-accent-purple/20 text-accent-purple text-[10px] font-bold px-2 py-0.5 rounded-full border border-accent-purple/30">INTELLIGENCE</span>
                </div>
                <h2 className="text-4xl font-extrabold text-white leading-tight">Master your market with precision.</h2>
                <p className="text-text-secondary text-sm">
                  Our AI-driven engine analyzes real-time competition, pricing elasticity, and demand patterns to give you a winning edge.
                </p>
                <div className="pt-6 space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-accent-teal/50 transition-colors">
                      <span className="material-symbols-outlined text-accent-teal">trending_up</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Market Positioning</p>
                      <p className="text-xs text-text-tertiary">Identify gaps in the current landscape.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-accent-purple/50 transition-colors">
                      <span className="material-symbols-outlined text-accent-purple">monitoring</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Profit Modeling</p>
                      <p className="text-xs text-text-tertiary">Real-time PKR margin calculations.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Right 65% Form Panel */}
            <section className="w-full lg:w-[65%] flex justify-center items-center p-6 bg-[#0a0d1c] overflow-y-auto">
              <div className="w-full max-w-2xl glass-card rounded-xl p-8 sm:p-12 shadow-2xl">
                <header className="mb-8">
                  <h1 className="text-3xl font-extrabold text-white mb-2">Analyze Your Product</h1>
                  <p className="text-sm text-text-secondary">Take 2 minutes to unlock enterprise-grade insights</p>
                </header>
                
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">Product Name *</label>
                      <input 
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-text-tertiary focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all"
                        placeholder="e.g., Wireless Bluetooth Earphones" 
                        required 
                        type="text" 
                      />
                    </div>
                    {/* Category */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">Category</label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all cursor-pointer"
                      >
                        <option>Electronics</option>
                        <option>Clothing</option>
                        <option>Home & Kitchen</option>
                        <option>Beauty & Health</option>
                        <option>Toys & Baby</option>
                        <option>Automotive</option>
                      </select>
                    </div>
                    {/* Selling Price */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">Selling Price (PKR)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-accent-teal text-sm">₨</span>
                        <input 
                          value={sellingPrice}
                          onChange={(e) => setSellingPrice(e.target.value)}
                          className="w-full bg-surface-container border border-white/10 rounded-lg pl-9 pr-4 py-3 text-sm text-white focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all"
                          placeholder="0.00" 
                          type="number" 
                        />
                      </div>
                    </div>
                    {/* Cost Price */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">Cost Price (PKR)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-accent-purple text-sm">₨</span>
                        <input 
                          value={costPrice}
                          onChange={(e) => setCostPrice(e.target.value)}
                          className="w-full bg-surface-container border border-white/10 rounded-lg pl-9 pr-4 py-3 text-sm text-white focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all"
                          placeholder="0.00" 
                          type="number" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Platforms */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">Target Marketplaces</label>
                    <div className="flex flex-wrap gap-2">
                      {['daraz', 'amazon', 'olx', 'instagram', 'local'].map(plat => (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => handlePlatformToggle(plat)}
                          className={`px-4 py-2 rounded-full border text-xs font-bold transition-all capitalize ${
                            selectedPlatforms.includes(plat)
                              ? 'bg-accent-teal/20 border-accent-teal text-accent-teal'
                              : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'
                          }`}
                        >
                          {plat === 'local' ? 'Local Store' : plat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">Report Language</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setReportLanguage('en')}
                        className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-all ${
                          reportLanguage === 'en'
                            ? 'bg-accent-teal/20 border-accent-teal text-accent-teal'
                            : 'bg-surface-container border-white/10 text-text-secondary'
                        }`}
                      >
                        English Report
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportLanguage('ur')}
                        className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-all ${
                          reportLanguage === 'ur'
                            ? 'bg-accent-teal/20 border-accent-teal text-accent-teal'
                            : 'bg-surface-container border-white/10 text-text-secondary'
                        }`}
                      >
                        Urdu Summary (اردو)
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">Product Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-text-tertiary focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all resize-none"
                      rows={3} 
                      placeholder="Detail your product features, materials, and unique selling points..."
                    />
                  </div>

                  {/* Competitor URL */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">Competitor Product URL (Optional)</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-lg">link</span>
                      <input 
                        value={competitorUrl}
                        onChange={(e) => setCompetitorUrl(e.target.value)}
                        className="w-full bg-surface-container border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all"
                        placeholder="https://daraz.pk/product-link" 
                        type="url" 
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-teal to-[#00B89E] text-bg-primary font-bold shadow-[0_0_16px_rgba(0,212,170,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    Run Intelligence Analysis
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </form>
              </div>
            </section>
          </div>
        )}

        {currentPage === 'orchestration' && (
          <div className="min-h-[85vh] flex items-center justify-center relative px-6 py-12 animate-fade-in">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(0,212,170,0.04)_1px,transparent_1px)] bg-[size:40px_40px] z-0"></div>
            
            <div 
              className="w-full glass-card rounded-2xl p-8 flex flex-col items-center relative z-10 shadow-2xl"
              style={{ maxWidth: '512px' }}
            >
              <header className="text-center mb-8 w-full">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-teal/5 mb-4 border border-accent-teal/20 shadow-[0_0_12px_rgba(0,212,170,0.15)]">
                  <SelloraLogo className="h-10 w-10 animate-pulse" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Orchestrating AI Intelligence</h1>
                <p className="text-xs text-text-secondary">Processing 1.2M market data points via 16 specialized agents</p>
              </header>

              {/* Progress SVG Ring */}
              <div className="relative w-44 h-44 mb-6 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 overflow-visible">
                  <circle className="text-white/[0.03]" cx="88" cy="88" fill="transparent" r="76" stroke="currentColor" strokeWidth="6"></circle>
                  <circle className="text-accent-teal/10 blur-[4px]" cx="88" cy="88" fill="transparent" r="76" stroke="currentColor" strokeWidth="10"></circle>
                  <circle 
                    className="transition-all duration-300 stroke-accent-teal" 
                    cx="88" 
                    cy="88" 
                    fill="transparent" 
                    r="76" 
                    stroke="url(#gradient-p-ring)"
                    strokeLinecap="round" 
                    strokeWidth="8"
                    strokeDasharray={477}
                    strokeDashoffset={477 - (477 * orchestrationProgress) / 100}
                  ></circle>
                  
                  {/* Rotating scanner node */}
                  <g className="animate-spin" style={{ animationDuration: '4s' }}>
                    <line stroke="#00D4AA" strokeLinecap="round" strokeWidth="3" x1="88" x2="88" y1="12" y2="20"></line>
                  </g>
                  <defs>
                    <linearGradient id="gradient-p-ring" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="#00D4AA"></stop>
                      <stop offset="100%" stopColor="#7C6FF7"></stop>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{orchestrationProgress}%</span>
                  <span className="text-[9px] text-accent-teal uppercase tracking-[0.2em] font-extrabold">Analysis Depth</span>
                </div>
              </div>

              {/* Dynamic Live Logs */}
              <div className="w-full h-14 bg-black/40 border border-white/5 rounded-lg p-3 overflow-hidden mb-8 font-mono text-[11px] text-accent-teal">
                <div className="animate-pulse flex items-center gap-1.5 mb-1 text-text-secondary uppercase text-[9px] tracking-wider font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-teal"></span>
                  Live Agent Streams:
                </div>
                <div className="truncate text-white/95">
                  &gt; {agents[currentAgentIndex]?.logs[agents[currentAgentIndex]?.logs.length - 1] || 'Routing node data packages...'}
                </div>
              </div>

              {/* Agent Grid */}
              <div className="w-full grid grid-cols-2 gap-x-4 gap-y-3 mb-8">
                {agents.map((agent) => (
                  <div 
                    key={agent.id} 
                    className={`flex items-center gap-2 transition-all duration-300 ${
                      agent.status === 'done' ? 'opacity-100 font-medium' :
                      agent.status === 'running' ? 'opacity-100 text-accent-teal scale-105' : 'opacity-30'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[16px] ${
                      agent.status === 'done' ? 'text-status-success font-bold' :
                      agent.status === 'running' ? 'text-accent-teal animate-spin' : 'text-text-tertiary'
                    }`}>
                      {agent.status === 'done' ? 'check_circle' :
                       agent.status === 'running' ? 'progress_activity' : 'radio_button_unchecked'}
                    </span>
                    <span className="text-xs truncate">{agent.name}</span>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                onClick={() => setCurrentPage('form')}
                className="w-full py-3 rounded-lg border border-white/10 text-xs text-text-secondary hover:bg-white/5 hover:text-white transition-colors"
              >
                Cancel Analysis
              </button>
            </div>
          </div>
        )}

        {currentPage === 'results' && activeAnalysis && (
          <div className="animate-fade-in max-w-7xl mx-auto px-6 md:px-12 py-4">
            
            {/* Analysis Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 p-6 glass-card rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-teal/5 to-accent-purple/5 pointer-events-none"></div>
              <div className="flex items-center gap-3">
                <SelloraLogo className="h-10 w-10 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-2xl font-bold text-white">{activeAnalysis.input.productName}</h1>
                    <span className="bg-accent-teal/15 text-accent-teal text-[10px] font-bold px-2 py-0.5 rounded border border-accent-teal/20 capitalize">{activeAnalysis.input.category}</span>
                    <span className="bg-accent-purple/15 text-accent-purple text-[10px] font-bold px-2 py-0.5 rounded border border-accent-purple/20">PKR {activeAnalysis.input.sellingPrice}</span>
                  </div>
                  <p className="text-xs text-text-secondary max-w-2xl truncate">{activeAnalysis.input.description || 'No description provided.'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-text-tertiary">Overall Intelligence Score</div>
                  <div className="text-2xl font-black text-accent-teal">{activeAnalysis.overallScore}/100</div>
                </div>
                <button 
                  className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl transition-all"
                  onClick={() => window.print()}
                  title="Print Report"
                >
                  <span className="material-symbols-outlined text-lg leading-none">print</span>
                </button>
              </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Sidebar Tabs */}
              <aside className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
                {[
                  { id: 'pricing', label: 'Pricing Strategy', icon: 'payments' },
                  { id: 'seo', label: 'SEO & Listing Content', icon: 'search' },
                  { id: 'adcopies', label: 'Marketing Ad Copies', icon: 'campaign' },
                  { id: 'marketintel', label: 'Market Intelligence', icon: 'analytics' },
                  { id: 'financials', label: 'Financial Margins', icon: 'calculate' },
                  { id: 'recommendations', label: 'Recommendations', icon: 'checklist' },
                  { id: 'strategyCenter', label: 'Strategy Hub', icon: 'shield_with_heart' },
                  { id: 'competitorTracking', label: 'Competitor Tracking', icon: 'monitoring' },
                  { id: 'marketplaceIntegration', label: 'Marketplaces', icon: 'hub' },
                  { id: 'fullReport', label: 'Comprehensive Report', icon: 'receipt_long' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveResultTab(tab.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border text-xs font-bold transition-all ${
                      activeResultTab === tab.id
                        ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal shadow-[0_0_12px_rgba(0,212,170,0.05)]'
                        : 'bg-bg-secondary/40 border-white/5 text-text-secondary hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg leading-none">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </aside>

              {/* Main Content Area */}
              <section className="flex-1 glass-card rounded-2xl p-6 sm:p-8 min-h-[500px]">
                
                {/* Pricing Strategy */}
                {activeResultTab === 'pricing' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Pricing Strategy & Niche Placement</h2>
                      <p className="text-xs text-text-secondary">Analyze elasticity, competitors, and optimal pricing options</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-bg-secondary/60 p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-text-tertiary">Market Avg Price</span>
                        <div className="text-lg font-bold text-white mt-1">PKR {activeAnalysis.pricing.averageCompetitorPrice}</div>
                      </div>
                      <div className="bg-bg-secondary/60 p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-text-tertiary">Optimal Recommended</span>
                        <div className="text-lg font-bold text-accent-teal mt-1">PKR {activeAnalysis.pricing.recommendedPrice}</div>
                      </div>
                      <div className="bg-bg-secondary/60 p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-text-tertiary">Competitor Span</span>
                        <div className="text-lg font-bold text-accent-purple mt-1">PKR {activeAnalysis.pricing.lowestPrice} - {activeAnalysis.pricing.highestPrice}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white">Recommended Pricing Tiers</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {activeAnalysis.pricing.tiers.map((tier, idx) => (
                          <div key={idx} className="bg-bg-secondary/40 border border-white/5 p-5 rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-accent-teal">{tier.name}</span>
                              <span className="text-xs font-extrabold text-white">PKR {tier.price}</span>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">{tier.benefit}</p>
                            <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
                              <span className="text-text-tertiary font-medium">Estimated Margin</span>
                              <span className="font-bold text-status-success">{tier.margin}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SEO & Content */}
                {activeResultTab === 'seo' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">SEO & Listing Optimizer</h2>
                      <p className="text-xs text-text-secondary">Optimize discoverability, titles, and descriptions for Google and Daraz</p>
                    </div>

                    <div className="space-y-4 bg-bg-secondary/30 p-5 rounded-xl border border-white/5">
                      <h3 className="text-xs uppercase font-extrabold text-accent-teal tracking-wider">Search Engine Metadata</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-[10px] text-text-tertiary mb-1">Meta Title</div>
                          <div className="text-sm text-white font-medium bg-black/20 p-3 rounded border border-white/5">{activeAnalysis.seo.metaTitle}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-text-tertiary mb-1">Meta Description</div>
                          <div className="text-sm text-white/90 bg-black/20 p-3 rounded border border-white/5 leading-relaxed">{activeAnalysis.seo.metaDescription}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3 bg-bg-secondary/30 p-5 rounded-xl border border-white/5">
                        <h3 className="text-xs uppercase font-extrabold text-accent-purple tracking-wider">Mined Keywords</h3>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {activeAnalysis.seo.keywords.map((kw, i) => (
                            <span key={i} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-text-secondary font-medium">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 bg-bg-secondary/30 p-5 rounded-xl border border-white/5">
                        <h3 className="text-xs uppercase font-extrabold text-accent-teal tracking-wider">Daraz Niche Bulletins</h3>
                        <div className="text-xs text-text-secondary leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: activeAnalysis.seo.darazDescription }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ad Copies */}
                {activeResultTab === 'adcopies' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">High-Converting Ad Copies</h2>
                      <p className="text-xs text-text-secondary">Copywriting variations tailored for social media campaigns</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* English Copy */}
                      <div className="bg-bg-secondary/40 border border-white/5 p-5 rounded-xl space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs uppercase font-extrabold text-accent-teal tracking-wider">English Copy Variants</span>
                          <span className="text-[10px] text-text-tertiary">Meta / Instagram</span>
                        </div>
                        {activeAnalysis.adCopies.english.map((copy, i) => (
                          <div key={i} className="space-y-2 p-3 bg-black/20 rounded border border-white/5 text-xs">
                            <div className="font-bold text-white">Hook: <span className="font-normal text-text-secondary">{copy.hook}</span></div>
                            <div className="text-text-secondary leading-relaxed"><span className="font-bold text-white">Body:</span> {copy.body}</div>
                            <div className="text-accent-teal font-semibold"><span className="text-white font-bold">CTA:</span> {copy.cta}</div>
                          </div>
                        ))}
                      </div>

                      {/* Urdu Copy */}
                      <div className="bg-bg-secondary/40 border border-white/5 p-5 rounded-xl space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs uppercase font-extrabold text-accent-purple tracking-wider">Urdu Copy Variants (اردو)</span>
                          <span className="text-[10px] text-text-tertiary">Facebook Ads</span>
                        </div>
                        {activeAnalysis.adCopies.urdu.map((copy, i) => (
                          <div key={i} className="space-y-2 p-3 bg-black/20 rounded border border-white/5 text-xs text-right" dir="rtl">
                            <div className="font-bold text-white">ہک: <span className="font-normal text-text-secondary">{copy.hook}</span></div>
                            <div className="text-text-secondary leading-relaxed"><span className="font-bold text-white">تفصیل:</span> {copy.body}</div>
                            <div className="text-accent-purple font-semibold"><span className="text-white font-bold">بٹن:</span> {copy.cta}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-bg-secondary/20 p-5 rounded-xl border border-white/5 space-y-2">
                      <h3 className="text-xs font-bold text-white">Audience Target Recommendations</h3>
                      <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside">
                        {activeAnalysis.adCopies.targetAudiences.map((aud, i) => (
                          <li key={i}>{aud}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Market Intelligence */}
                {activeResultTab === 'marketintel' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Market Intelligence & Trends</h2>
                      <p className="text-xs text-text-secondary">Scrape and track competitor positioning and market volume signals</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-bg-secondary/40 border border-white/5 p-5 rounded-xl text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase text-text-tertiary">Niche Trend Growth</span>
                        <div className="text-2xl font-black text-accent-teal">+{activeAnalysis.marketIntel.marketGrowth}%</div>
                        <span className="text-[10px] text-text-secondary">Year over Year</span>
                      </div>
                      <div className="bg-bg-secondary/40 border border-white/5 p-5 rounded-xl text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase text-text-tertiary">Demand Score</span>
                        <div className="text-2xl font-black text-accent-purple">{activeAnalysis.marketIntel.trendScore}/100</div>
                        <span className="text-[10px] text-text-secondary">High Local Search Intent</span>
                      </div>
                      <div className="bg-bg-secondary/40 border border-white/5 p-5 rounded-xl text-center space-y-1">
                        <span className="text-[10px] font-bold uppercase text-text-tertiary">Customer Sentiment</span>
                        <div className="text-2xl font-black text-status-success">{activeAnalysis.marketIntel.sentiment.positive}% Positive</div>
                        <span className="text-[10px] text-text-secondary">Based on category scrape</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-white">Direct Market Competitors</h3>
                      <div className="space-y-2">
                        {activeAnalysis.marketIntel.competitors.map((comp, i) => (
                          <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-bg-secondary/30 border border-white/5 rounded-xl gap-2">
                            <div>
                              <div className="text-xs font-bold text-white">{comp.name}</div>
                              <div className="text-[10px] text-text-secondary mt-0.5">{comp.advantage}</div>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
                              <span className="text-text-tertiary">Selling Price: <span className="text-white">PKR {comp.price}</span></span>
                              <span className="bg-accent-teal/10 text-accent-teal text-[10px] px-2 py-0.5 rounded border border-accent-teal/15">Match: {comp.matchingScore}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Financials & Interactive Sliders */}
                {activeResultTab === 'financials' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Interactive Financial & Margin Center</h2>
                      <p className="text-xs text-text-secondary">Drag sliders to adjust selling price, cost price, and sales volume in real-time</p>
                    </div>

                    {/* Output Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-bg-secondary/60 p-4 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] uppercase font-bold text-text-tertiary">Net Margin</span>
                        <div className="text-xl font-black text-accent-teal mt-1">{activeAnalysis.financials.margin}%</div>
                      </div>
                      <div className="bg-bg-secondary/60 p-4 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] uppercase font-bold text-text-tertiary">Monthly Profit</span>
                        <div className={`text-xl font-black mt-1 ${activeAnalysis.financials.netProfit >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                          PKR {activeAnalysis.financials.netProfit}
                        </div>
                      </div>
                      <div className="bg-bg-secondary/60 p-4 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] uppercase font-bold text-text-tertiary">Proj ROI</span>
                        <div className={`text-xl font-black mt-1 ${activeAnalysis.financials.roi >= 0 ? 'text-accent-teal' : 'text-status-error'}`}>
                          {activeAnalysis.financials.roi}%
                        </div>
                      </div>
                      <div className="bg-bg-secondary/60 p-4 rounded-xl border border-white/5 text-center">
                        <span className="text-[10px] uppercase font-bold text-text-tertiary">Breakeven Volume</span>
                        <div className="text-xl font-black text-accent-purple mt-1">{activeAnalysis.financials.breakevenUnits} units</div>
                      </div>
                    </div>

                    {/* Interactive Sliders Panel */}
                    <div className="bg-bg-secondary/40 border border-white/5 p-6 rounded-xl space-y-6">
                      <h3 className="text-xs uppercase font-extrabold text-accent-teal tracking-wider">Financial Simulation Controls</h3>
                      
                      <div className="space-y-4">
                        {/* Selling Price */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white">Target Selling Price (PKR)</span>
                            <span className="text-accent-teal font-extrabold">PKR {calcPrice}</span>
                          </div>
                          <input 
                            type="range" 
                            min={calcCost ? calcCost + 10 : 50} 
                            max={activeAnalysis.input.sellingPrice * 3}
                            value={calcPrice}
                            onChange={(e) => handleSliderChange('price', Number(e.target.value))}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-accent-teal" 
                          />
                        </div>

                        {/* Cost Price */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white">Unit Cost Price (PKR)</span>
                            <span className="text-accent-purple font-extrabold">PKR {calcCost}</span>
                          </div>
                          <input 
                            type="range" 
                            min={1} 
                            max={calcPrice ? calcPrice - 10 : 5000}
                            value={calcCost}
                            onChange={(e) => handleSliderChange('cost', Number(e.target.value))}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-accent-purple" 
                          />
                        </div>

                        {/* Volume */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white">Target Monthly Volume (Units)</span>
                            <span className="text-white font-extrabold">{calcVolume} units</span>
                          </div>
                          <input 
                            type="range" 
                            min={10} 
                            max={1000}
                            value={calcVolume}
                            onChange={(e) => handleSliderChange('volume', Number(e.target.value))}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-white" 
                          />
                        </div>

                        {/* Advertising Spend */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white">Monthly Ad Spend (PKR)</span>
                            <span className="text-text-secondary font-extrabold">PKR {calcAdSpend}</span>
                          </div>
                          <input 
                            type="range" 
                            min={1000} 
                            max={100000}
                            step={1000}
                            value={calcAdSpend}
                            onChange={(e) => handleSliderChange('adSpend', Number(e.target.value))}
                            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-text-secondary" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {activeResultTab === 'recommendations' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Strategic Strategic Recommendations</h2>
                      <p className="text-xs text-text-secondary">Tactical suggestions derived from multi-scenario models</p>
                    </div>

                    <div className="space-y-4">
                      {activeAnalysis.recommendations.map((rec, i) => (
                        <div key={i} className="bg-bg-secondary/30 border border-white/5 p-6 rounded-xl space-y-3">
                          <div className="flex justify-between items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-teal"></span>
                              {rec.title}
                            </h3>
                            <div className="flex gap-2 text-[9px] font-bold">
                              <span className="bg-accent-teal/15 text-accent-teal px-2 py-0.5 rounded border border-accent-teal/10">Impact: {rec.impact}</span>
                              <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-text-secondary">Effort: {rec.effort}</span>
                            </div>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strategy Center (Mock Dashboard) */}
                {activeResultTab === 'strategyCenter' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">AI Strategy & Optimization Center</h2>
                      <p className="text-xs text-text-secondary">Monitor your current market campaign channels and growth hacks</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-bg-secondary/30 p-5 rounded-xl border border-white/5 space-y-3">
                        <h3 className="text-xs uppercase font-extrabold text-accent-teal tracking-wider">Growth Campaign Status</h3>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-accent-teal w-2/3"></div>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed pt-2">Your strategy engine has unlocked 5 marketing pipelines. Active target channels include Daraz sponsored search and Facebook Lead Ads.</p>
                      </div>
                      <div className="bg-bg-secondary/30 p-5 rounded-xl border border-white/5 space-y-3">
                        <h3 className="text-xs uppercase font-extrabold text-accent-purple tracking-wider">Action Plan Priority</h3>
                        <ul className="text-xs text-text-secondary space-y-2 list-inside list-disc">
                          <li>Run AB tests with the generated Urdu hooks.</li>
                          <li>Recalculate margin targets when cost increases.</li>
                          <li>Establish Daraz store keywords optimization.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Competitor Tracking (Real-Time Dashboard) */}
                {activeResultTab === 'competitorTracking' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1">Real-Time Competitor Tracking</h2>
                        <p className="text-xs text-text-secondary">Scraping live prices from major marketplaces</p>
                      </div>
                      <button 
                        onClick={fetchLiveData}
                        disabled={isFetchingLive}
                        className="bg-accent-teal/10 text-accent-teal px-4 py-2 rounded-lg text-xs font-bold border border-accent-teal/20 hover:bg-accent-teal/20 transition-all flex items-center gap-2"
                      >
                        {isFetchingLive ? (
                          <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">sensors</span>
                        )}
                        {isFetchingLive ? 'Fetching...' : 'Fetch Live Data'}
                      </button>
                    </div>
                    
                    <div className="bg-bg-secondary/30 p-6 rounded-xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">Active Scrapers: <span className="text-accent-teal">3 Stores</span></span>
                        <span className="text-[10px] text-text-tertiary">Last scrape: {lastFetchTime || 'Not fetched yet'}</span>
                      </div>
                      <div className="space-y-3">
                        {liveCompetitors.length > 0 ? (
                          liveCompetitors.map((c, i) => (
                            <div key={i} className="p-4 bg-black/20 border border-white/5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                              <div className="flex flex-col">
                                <span className="font-semibold text-white flex items-center gap-1">
                                  {c.platform === 'Daraz' ? <span className="text-[#FF6A00] font-bold">d</span> : c.platform === 'Amazon' ? <span className="text-[#FF9900] font-bold">a</span> : <span className="text-accent-teal material-symbols-outlined text-[14px]">storefront</span>}
                                  {c.name}
                                </span>
                                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-teal hover:underline mt-0.5">View Listing</a>
                              </div>
                              <div className="flex items-center gap-4 text-right">
                                {c.in_stock ? (
                                  <span className="text-status-success bg-status-success/10 px-2 py-0.5 rounded text-[10px] border border-status-success/20">In Stock</span>
                                ) : (
                                  <span className="text-status-error bg-status-error/10 px-2 py-0.5 rounded text-[10px] border border-status-error/20">Out of Stock</span>
                                )}
                                <span className="text-text-secondary font-bold bg-white/5 px-3 py-1 rounded-md">PKR {c.price.toLocaleString()}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-text-tertiary text-xs">
                            <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">troubleshoot</span>
                            Click "Fetch Live Data" to run scrapers and pull real-time prices.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Marketplace Integration (Mock Dashboard) */}
                {activeResultTab === 'marketplaceIntegration' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">Marketplace Sync & Integrations</h2>
                      <p className="text-xs text-text-secondary">Export catalog sheets and synchronize listing inventories</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-bg-secondary/30 p-5 rounded-xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">Daraz Seller Center API</span>
                          <span className="bg-accent-teal/10 text-accent-teal text-[8px] font-bold px-2 py-0.5 rounded border border-accent-teal/10">CONNECTED</span>
                        </div>
                        <p className="text-xs text-text-secondary">Synchronize meta content and keyword enhancements in one-click.</p>
                      </div>
                      <div className="bg-bg-secondary/30 p-5 rounded-xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">Shopify Niche Plugin</span>
                          <span className="bg-white/5 text-text-secondary text-[8px] font-bold px-2 py-0.5 rounded border border-white/5">STANDBY</span>
                        </div>
                        <p className="text-xs text-text-secondary">Ready to sync catalogs and product reviews automatically.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Comprehensive Report */}
                {activeResultTab === 'fullReport' && (
                  <div className="space-y-8 animate-fade-in max-w-5xl mx-auto py-4" id="printable-report">
                    <div className="text-center pb-6 border-b border-white/10">
                      <h2 className="text-2xl font-black text-white">{activeAnalysis.input.productName}</h2>
                      <p className="text-xs text-text-secondary uppercase tracking-widest mt-1">{activeAnalysis.input.category} • Full Intelligence Report</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-xs uppercase font-extrabold text-accent-teal tracking-wider">Market Dynamics</h3>
                        <div className="bg-bg-secondary/30 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                          <div><span className="text-text-tertiary">Recommended Price:</span> <span className="font-bold text-white">PKR {activeAnalysis.pricing.recommendedPrice}</span></div>
                          <div><span className="text-text-tertiary">Niche Trend Growth:</span> <span className="font-bold text-accent-teal">+{activeAnalysis.marketIntel.marketGrowth}%</span></div>
                          <div><span className="text-text-tertiary">Customer Sentiment:</span> <span className="font-bold text-status-success">{activeAnalysis.marketIntel.sentiment.positive}% Positive</span></div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs uppercase font-extrabold text-accent-purple tracking-wider">Target Financial Model</h3>
                        <div className="bg-bg-secondary/30 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                          <div><span className="text-text-tertiary">Unit Margins:</span> <span className="font-bold text-white">{activeAnalysis.financials.margin}%</span></div>
                          <div><span className="text-text-tertiary">Simulated Profit:</span> <span className="font-bold text-status-success">PKR {activeAnalysis.financials.netProfit}</span></div>
                          <div><span className="text-text-tertiary">Break-even Units:</span> <span className="font-bold text-white">{activeAnalysis.financials.breakevenUnits} units</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs uppercase font-extrabold text-accent-teal tracking-wider">Top SEO Metadata</h3>
                      <div className="bg-bg-secondary/20 p-4 rounded-xl border border-white/5 space-y-2 text-xs leading-relaxed">
                        <div><span className="text-text-tertiary block mb-0.5">Optimized Title:</span> <span className="text-white font-medium">{activeAnalysis.seo.metaTitle}</span></div>
                        <div><span className="text-text-tertiary block mb-0.5">Meta Description:</span> <span className="text-text-secondary">{activeAnalysis.seo.metaDescription}</span></div>
                      </div>
                    </div>

                    <div className="space-y-3 text-center pt-6">
                      <button 
                        type="button" 
                        onClick={() => window.print()}
                        className="bg-accent-teal text-bg-primary text-xs font-bold px-8 py-3 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_12px_rgba(0,212,170,0.2)]"
                      >
                        Print Full PDF Report
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {currentPage === 'profile' && (
          <div className="max-w-6xl mx-auto p-6 md:p-12 animate-fade-in text-left">
            {/* Settings Header Section */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
              <div>
                <h1 className="font-headline-h1 text-headline-h1 text-text-primary">Profile Settings</h1>
                <p className="text-text-secondary font-body-lg mt-base">Manage your personal information and public profile.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  className="px-lg py-sm font-label-md text-label-md text-text-secondary hover:text-white transition-colors"
                  onClick={() => setCurrentPage('landing')}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProfileSave}
                  className="px-lg py-sm font-label-md text-label-md bg-accent-teal text-bg-primary rounded-lg font-bold glow-teal active:scale-95 transition-all shadow-[0_0_20px_rgba(0,212,170,0.3)] hover:brightness-110 flex items-center gap-1.5"
                >
                  {profileSaving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                      Saving...
                    </>
                  ) : profileSavedSuccess ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      Saved!
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </header>

            <div className="grid grid-cols-12 gap-6 items-start">
              {/* Settings Sub-Navigation */}
              <nav className="col-span-12 lg:col-span-3 flex flex-col gap-2">
                <button 
                  className={`flex items-center gap-2 p-4 glass-panel border-l-4 rounded-lg text-left transition-all ${
                    activeProfileTab === 'profile' 
                      ? 'border-accent-teal text-accent-teal bg-accent-teal/5' 
                      : 'border-transparent text-text-secondary hover:bg-white/5'
                  }`}
                  onClick={() => setActiveProfileTab('profile')}
                >
                  <span className="material-symbols-outlined text-md">person</span>
                  <span className="font-label-md text-sm">Profile</span>
                </button>
                <button 
                  className={`flex items-center gap-2 p-4 glass-panel border-l-4 rounded-lg text-left transition-all ${
                    activeProfileTab === 'security' 
                      ? 'border-accent-teal text-accent-teal bg-accent-teal/5' 
                      : 'border-transparent text-text-secondary hover:bg-white/5'
                  }`}
                  onClick={() => setActiveProfileTab('security')}
                >
                  <span className="material-symbols-outlined text-md">lock</span>
                  <span className="font-label-md text-sm">Security & Password</span>
                </button>
                <button 
                  className={`flex items-center gap-2 p-4 glass-panel border-l-4 rounded-lg text-left transition-all ${
                    activeProfileTab === 'notifications' 
                      ? 'border-accent-teal text-accent-teal bg-accent-teal/5' 
                      : 'border-transparent text-text-secondary hover:bg-white/5'
                  }`}
                  onClick={() => setActiveProfileTab('notifications')}
                >
                  <span className="material-symbols-outlined text-md">notifications</span>
                  <span className="font-label-md text-sm">Notifications</span>
                </button>
                <button 
                  className={`flex items-center gap-2 p-4 glass-panel border-l-4 rounded-lg text-left transition-all ${
                    activeProfileTab === 'billing' 
                      ? 'border-accent-teal text-accent-teal bg-accent-teal/5' 
                      : 'border-transparent text-text-secondary hover:bg-white/5'
                  }`}
                  onClick={() => setActiveProfileTab('billing')}
                >
                  <span className="material-symbols-outlined text-md">credit_card</span>
                  <span className="font-label-md text-sm">Billing & Plan</span>
                </button>
                <button 
                  className={`flex items-center gap-2 p-4 glass-panel border-l-4 rounded-lg text-left transition-all ${
                    activeProfileTab === 'platforms' 
                      ? 'border-accent-teal text-accent-teal bg-accent-teal/5' 
                      : 'border-transparent text-text-secondary hover:bg-white/5'
                  }`}
                  onClick={() => setActiveProfileTab('platforms')}
                >
                  <span className="material-symbols-outlined text-md">hub</span>
                  <span className="font-label-md text-sm">Connected Platforms</span>
                </button>
              </nav>

              {/* Main Settings Content Area */}
              <section className="col-span-12 lg:col-span-9 flex flex-col gap-6">
                {activeProfileTab === 'profile' ? (
                  <>
                    {/* Avatar Section */}
                    <div className="glass-panel p-6 rounded-xl flex flex-col sm:flex-row items-center gap-6">
                      <div className="relative group" onClick={() => fileInputRef.current?.click()}>
                        {profilePictureUrl ? (
                          <img src={profilePictureUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-accent-teal/50" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent-teal to-accent-purple flex items-center justify-center text-4xl font-bold text-bg-primary border-2 border-accent-teal/50">
                            {profileFirstName[0] || 'U'}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-bg-primary/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                          <span className="material-symbols-outlined text-white text-md">photo_camera</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center sm:items-start gap-1">
                        <h3 className="font-headline-h3 text-headline-h3 text-white">Profile Picture</h3>
                        <p className="text-body-sm text-text-tertiary">PNG, JPG or GIF. Max size of 2MB.</p>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleProfilePictureChange} 
                          accept="image/png, image/jpeg, image/gif" 
                          className="hidden" 
                        />
                        <div className="flex gap-3 mt-2">
                          <button onClick={() => fileInputRef.current?.click()} className="bg-accent-teal text-bg-primary px-4 py-1.5 rounded-lg font-label-md text-xs hover:opacity-90 transition-opacity font-bold">Change</button>
                          <button onClick={handleProfilePictureRemove} className="border border-white/10 text-status-error px-4 py-1.5 rounded-lg font-label-md text-xs hover:bg-status-error/10 transition-colors font-bold">Remove</button>
                        </div>
                      </div>
                    </div>

                    {/* Personal Info Form */}
                    <form onSubmit={handleProfileSave} className="glass-panel p-6 rounded-xl flex flex-col gap-6">
                      <h3 className="font-headline-h3 text-headline-h3 text-white border-b border-white/5 pb-3">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-md text-xs text-text-secondary">First Name</label>
                          <input 
                            value={profileFirstName}
                            onChange={(e) => setProfileFirstName(e.target.value)}
                            className="bg-surface-container border border-white/10 rounded-lg p-3 text-text-primary font-body-rg text-sm focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all" 
                            placeholder="John" 
                            type="text"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-md text-xs text-text-secondary">Last Name</label>
                          <input 
                            value={profileLastName}
                            onChange={(e) => setProfileLastName(e.target.value)}
                            className="bg-surface-container border border-white/10 rounded-lg p-3 text-text-primary font-body-rg text-sm focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all" 
                            placeholder="Doe" 
                            type="text"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-md text-xs text-text-secondary">Email Address</label>
                          <div className="relative">
                            <input 
                              className="w-full bg-white/[0.03] border border-white/5 rounded-lg p-3 text-text-tertiary font-body-rg text-sm cursor-not-allowed" 
                              disabled 
                              type="email" 
                              value={user?.email || 'test@sellora.com'}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-status-success flex items-center gap-1">
                              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                              <span className="text-body-sm font-semibold">Verified</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-md text-xs text-text-secondary">Phone Number</label>
                          <input 
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="bg-surface-container border border-white/10 rounded-lg p-3 text-text-primary font-body-rg text-sm focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all" 
                            placeholder="+1 (555) 000-0000" 
                            type="tel"
                          />
                        </div>
                      </div>

                      {/* Localization */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-md text-xs text-text-secondary">Language</label>
                          <select 
                            value={profileLang}
                            onChange={(e) => setProfileLang(e.target.value)}
                            className="bg-surface-container border border-white/10 rounded-lg p-3 text-text-primary font-body-rg text-sm cursor-pointer focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all"
                          >
                            <option>English (US)</option>
                            <option>Urdu (اردو)</option>
                            <option>Spanish (ES)</option>
                            <option>Mandarin (CN)</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-md text-xs text-text-secondary">Timezone</label>
                          <select 
                            value={profileTimezone}
                            onChange={(e) => setProfileTimezone(e.target.value)}
                            className="bg-surface-container border border-white/10 rounded-lg p-3 text-text-primary font-body-rg text-sm cursor-pointer focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all"
                          >
                            <option>(GMT-08:00) Pacific Time</option>
                            <option>(GMT+00:00) UTC</option>
                            <option>(GMT+05:00) Islamabad</option>
                            <option>(GMT+01:00) London</option>
                          </select>
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="flex flex-col gap-2 mt-2">
                        <label className="font-label-md text-xs text-text-secondary">Bio / Description</label>
                        <textarea 
                          value={profileBio}
                          onChange={(e) => setProfileBio(e.target.value)}
                          className="bg-surface-container border border-white/10 rounded-lg p-3 text-text-primary font-body-rg text-sm resize-none focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all" 
                          placeholder="Briefly describe your role or business focus..." 
                          rows={4}
                        />
                        <p className="text-body-sm text-text-tertiary text-right">{profileBio.length}/500 characters</p>
                      </div>

                      {/* Submit */}
                      <div className="flex justify-end gap-4 border-t border-white/5 pt-4 mt-2">
                        <button 
                          type="button" 
                          className="px-6 py-2.5 rounded-lg text-xs font-bold text-text-secondary hover:text-white transition-colors"
                          onClick={() => setCurrentPage('landing')}
                        >
                          Discard
                        </button>
                        <button 
                          type="submit" 
                          className="bg-accent-teal text-bg-primary px-6 py-2.5 rounded-lg text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(0,212,170,0.2)] flex items-center gap-1.5"
                        >
                          {profileSaving ? (
                            <>
                              <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                              Updating...
                            </>
                          ) : profileSavedSuccess ? (
                            <>
                              <span className="material-symbols-outlined text-[18px]">check</span>
                              Saved!
                            </>
                          ) : (
                            'Update Profile'
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                ) : activeProfileTab === 'security' ? (
                  <div className="glass-panel p-6 rounded-xl flex flex-col gap-6 text-left animate-fade-in w-full">
                    <h3 className="font-headline-h3 text-headline-h3 text-white border-b border-white/5 pb-3">Security & Password</h3>
                    <div className="flex flex-col gap-5 w-full max-w-2xl">
                      <div className="flex flex-col gap-2">
                        <label className="font-label-md text-sm text-text-secondary">Current Password</label>
                        <div className="relative">
                          <input 
                            type={showCurrentPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="w-full bg-surface-container border border-white/10 rounded-lg p-4 text-text-primary text-sm focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all" 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white transition-colors flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showCurrentPassword ? "visibility" : "visibility_off"}
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-md text-sm text-text-secondary">New Password</label>
                        <div className="relative">
                          <input 
                            type={showNewPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="w-full bg-surface-container border border-white/10 rounded-lg p-4 text-text-primary text-sm focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all" 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white transition-colors flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showNewPassword ? "visibility" : "visibility_off"}
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button className="bg-accent-teal text-bg-primary px-6 py-2.5 rounded-lg text-sm font-bold w-fit hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(0,212,170,0.2)]">Update Password</button>
                      </div>
                    </div>
                  </div>
                ) : activeProfileTab === 'notifications' ? (
                  <div className="glass-panel p-6 rounded-xl flex flex-col gap-6 text-left animate-fade-in" style={{ width: '100%' }}>
                    <h3 className="font-headline-h3 text-headline-h3 text-white border-b border-white/5 pb-3">Notification Preferences</h3>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                        <div>
                          <p className="text-sm font-bold text-white">Email Alerts</p>
                          <p className="text-xs text-text-tertiary">Receive updates about competitor price drops.</p>
                        </div>
                        <div className="w-10 h-6 bg-accent-teal rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                        <div>
                          <p className="text-sm font-bold text-white">Weekly Digest</p>
                          <p className="text-xs text-text-tertiary">A summary report of your product's performance.</p>
                        </div>
                        <div className="w-10 h-6 bg-white/10 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm"></div></div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                        <div>
                          <p className="text-sm font-bold text-white">New Agent Insights</p>
                          <p className="text-xs text-text-tertiary">Get notified when AI discovers new market gaps.</p>
                        </div>
                        <div className="w-10 h-6 bg-accent-teal rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div>
                      </div>
                    </div>
                  </div>
                ) : activeProfileTab === 'billing' ? (
                  <div className="glass-panel p-6 rounded-xl flex flex-col gap-6 text-left animate-fade-in" style={{ width: '100%' }}>
                    <h3 className="font-headline-h3 text-headline-h3 text-white border-b border-white/5 pb-3">Billing & Plan</h3>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 p-6 rounded-xl border border-accent-teal/30 bg-accent-teal/5 relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent-teal/10 rounded-full blur-2xl"></div>
                        <p className="text-accent-teal text-xs font-bold uppercase tracking-wider mb-2">Current Plan</p>
                        <h4 className="text-2xl font-bold text-white mb-2">Free Tier</h4>
                        <p className="text-sm text-text-secondary mb-4">You have used 15 out of 50 free AI analyses this month.</p>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-1"><div className="bg-accent-teal w-[30%] h-full"></div></div>
                        <p className="text-[10px] text-text-tertiary text-right">Resets in 12 days</p>
                      </div>
                      <div className="flex-1 p-6 rounded-xl border border-white/10 flex flex-col justify-center items-center text-center bg-white/[0.02]">
                        <span className="material-symbols-outlined text-accent-purple text-3xl mb-2">rocket_launch</span>
                        <h4 className="text-lg font-bold text-white mb-2">Pro Plan</h4>
                        <p className="text-sm text-text-secondary mb-4">Unlimited analyses & premium AI agents.</p>
                        <button className="bg-gradient-to-r from-accent-teal to-accent-purple text-bg-primary px-6 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-lg">Upgrade to Pro</button>
                      </div>
                    </div>
                  </div>
                ) : activeProfileTab === 'platforms' ? (
                  <div className="glass-panel p-6 rounded-xl flex flex-col gap-6 text-left animate-fade-in w-full">
                    <h3 className="font-headline-h3 text-headline-h3 text-white border-b border-white/5 pb-3">Connected Platforms</h3>
                    <p className="text-sm text-text-secondary">Sync your stores to allow AI agents to automatically optimize your listings.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Shopify */}
                      <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${platforms.shopify.connected ? 'bg-white/5 border-accent-teal/30' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-2xl ${platforms.shopify.connected ? 'text-accent-teal' : 'text-text-secondary'}`}>storefront</span>
                          <div>
                            <p className="text-sm font-bold text-white">Shopify</p>
                            <p className={`text-xs ${platforms.shopify.connected ? 'text-accent-teal' : 'text-text-tertiary'}`}>
                              {platforms.shopify.connected ? 'Connected (Syncing)' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => togglePlatform('shopify')}
                          disabled={platforms.shopify.loading}
                          className={`text-xs px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${platforms.shopify.connected ? 'text-text-secondary hover:text-status-error' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                          {platforms.shopify.loading ? <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> : null}
                          {platforms.shopify.connected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>

                      {/* Amazon */}
                      <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${platforms.amazon.connected ? 'bg-white/5 border-accent-teal/30' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-2xl ${platforms.amazon.connected ? 'text-accent-teal' : 'text-text-secondary'}`}>shopping_cart</span>
                          <div>
                            <p className="text-sm font-bold text-white">Amazon</p>
                            <p className={`text-xs ${platforms.amazon.connected ? 'text-accent-teal' : 'text-text-tertiary'}`}>
                              {platforms.amazon.connected ? 'Connected (Syncing)' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => togglePlatform('amazon')}
                          disabled={platforms.amazon.loading}
                          className={`text-xs px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${platforms.amazon.connected ? 'text-text-secondary hover:text-status-error' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                          {platforms.amazon.loading ? <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> : null}
                          {platforms.amazon.connected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>

                      {/* Daraz */}
                      <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${platforms.daraz.connected ? 'bg-white/5 border-accent-teal/30' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-2xl ${platforms.daraz.connected ? 'text-accent-teal' : 'text-text-secondary'}`}>local_mall</span>
                          <div>
                            <p className="text-sm font-bold text-white">Daraz</p>
                            <p className={`text-xs ${platforms.daraz.connected ? 'text-accent-teal' : 'text-text-tertiary'}`}>
                              {platforms.daraz.connected ? 'Connected (Syncing)' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => togglePlatform('daraz')}
                          disabled={platforms.daraz.loading}
                          className={`text-xs px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${platforms.daraz.connected ? 'text-text-secondary hover:text-status-error' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                          {platforms.daraz.loading ? <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> : null}
                          {platforms.daraz.connected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            boxSizing: 'border-box'
          }}
        >
          <div 
            className="w-full max-w-md glass-card rounded-2xl p-8 border border-white/10 shadow-2xl relative text-left"
            style={{
              width: '90%',
              maxWidth: '440px',
              minWidth: '280px',
              margin: 'auto',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <button 
              className="absolute right-4 top-4 text-text-tertiary hover:text-white transition-colors p-1"
              onClick={() => { setShowLoginModal(false); setLoginError(''); }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <header className="mb-6" style={{ width: '100%' }}>
              <div className="flex items-center gap-2 mb-2">
                <SelloraLogo className="h-6 w-6" />
                <span className="text-white text-md font-bold">
                  {isSignUp ? 'Create Account' : 'Sellora Login'}
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                {isSignUp 
                  ? 'Register to save your analysis results and reports.' 
                  : 'Enter your seller credentials to access reports.'}
              </p>
            </header>

            {loginError && (
              <div className="bg-status-error/10 border border-status-error/20 text-status-error text-xs p-3 rounded-lg mb-4 flex items-start gap-2" style={{ width: '100%' }}>
                <span className="material-symbols-outlined text-sm shrink-0">error</span>
                <span>{loginError}</span>
              </div>
            )}

            <form 
              onSubmit={isSignUp ? handleSignupSubmit : handleLoginSubmit} 
              className="space-y-4" 
              style={{ width: '100%' }}
            >
              {isSignUp && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    placeholder="e.g., Jane Doe"
                    className="w-full bg-surface-container border border-white/10 rounded-lg p-3 text-sm text-white focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Email Address</label>
                <input 
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="e.g., test@sellora.com"
                  className="w-full bg-surface-container border border-white/10 rounded-lg p-3 text-sm text-white focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Password</label>
                <input 
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-surface-container border border-white/10 rounded-lg p-3 text-sm text-white focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-purple text-bg-primary font-bold shadow-[0_0_12px_rgba(0,212,170,0.2)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                style={{ width: '100%' }}
              >
                {isLoggingIn ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                    {isSignUp ? 'Signing Up...' : 'Logging In...'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">
                      {isSignUp ? 'how_to_reg' : 'login'}
                    </span>
                    {isSignUp ? 'Sign Up' : 'Log In'}
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-white/5 text-center flex flex-col gap-2" style={{ width: '100%' }}>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setLoginError('');
                }}
                className="text-[11px] text-accent-teal hover:underline font-bold transition-all"
              >
                {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
              </button>
              
              {!isSignUp && (
                <p className="text-[9px] text-text-tertiary">
                  Hint: Use <span className="text-white font-mono">test@sellora.com</span> / <span className="text-white font-mono">password123</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
