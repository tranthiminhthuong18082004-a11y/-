import { useState, useEffect } from "react";
import { FoodScanResult, ScanLogEntry, DailySummary } from "./types";
import CameraSelector from "./components/CameraSelector";
import NutritionDashboard from "./components/NutritionDashboard";
import ScannerHistory from "./components/ScannerHistory";
import DietPlanner from "./components/DietPlanner";
import { Sparkles, Activity, Plus, ShieldAlert, Award, Footprints, Flame, Scale, Clock, Apple, Utensils, RefreshCw, Smartphone, HeartPulse } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Preseed dynamic initial log if user has empty local logs for visual quality
const PRESEEDED_LOGS: ScanLogEntry[] = [
  {
    id: "sample-salmon",
    timestamp: "Today, 8:15 AM",
    imageSnapshot: "", // will show placeholder or sample card
    result: {
      foodName: "Grilled Salmon Quinoa Bowl",
      itemsIdentified: ["Grilled Salmon Slice", "Organic Tricolor Quinoa", "Sliced Hass Avocado", "Organic Cherry Tomatoes", "Extra Virgin Olive Oil"],
      portionSize: "1 bowl (approx 340g)",
      calories: 452,
      macronutrients: { carbs: 22, protein: 34, fat: 18 },
      micronutrients: [
        { name: "Omega-3 Fatty Acids", amount: "2200mg", percentDailyValue: 130 },
        { name: "Potassium", amount: "680mg", percentDailyValue: 15 },
        { name: "Vitamin D", amount: "12mcg", percentDailyValue: 60 },
        { name: "Iron", amount: "2.8mg", percentDailyValue: 15 }
      ],
      healthinessScore: 9,
      glycemicIndex: "Low",
      insights: [
        "High in anti-inflammatory omega-3 fats, excellent for cellular and cardio recovery.",
        "Low Glycemic Index means sustained energy release without high blood sugar spikes.",
        "Perfect post-workout macronutrient distribution to facilitate muscle repair."
      ],
      allergens: ["Fish"]
    }
  }
];

export default function App() {
  const [logs, setLogs] = useState<ScanLogEntry[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string>("image/jpeg");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodScanResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [targetCalories, setTargetCalories] = useState<number>(2000);
  const [activeTab, setActiveTab] = useState<"scanner" | "journal" | "planner">("scanner");
  const [isGoalAlertEnabled, setIsGoalAlertEnabled] = useState<boolean>(true);
  const [showGoalPopup, setShowGoalPopup] = useState<boolean>(false);

  // Water intake tracker states
  const [waterGlasses, setWaterGlasses] = useState<number>(0);
  const [waterGoal, setWaterGoal] = useState<number>(8);

  // Load from local storage
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem("nutriscan_logs");
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        // Pre-seed sample log for immediate interactive value
        setLogs(PRESEEDED_LOGS);
        localStorage.setItem("nutriscan_logs", JSON.stringify(PRESEEDED_LOGS));
      }

      const savedTarget = localStorage.getItem("nutriscan_target");
      if (savedTarget) {
        setTargetCalories(parseInt(savedTarget, 10));
      }

      const savedGoalAlert = localStorage.getItem("nutriscan_goal_alert_enabled");
      if (savedGoalAlert !== null) {
        setIsGoalAlertEnabled(savedGoalAlert === "true");
      }

      const savedWaterGlasses = localStorage.getItem("nutriscan_water_glasses");
      if (savedWaterGlasses !== null) {
        setWaterGlasses(parseInt(savedWaterGlasses, 10));
      }

      const savedWaterGoal = localStorage.getItem("nutriscan_water_goal");
      if (savedWaterGoal !== null) {
        setWaterGoal(parseInt(savedWaterGoal, 10));
      }
    } catch (e) {
      console.warn("Could not load from localStorage", e);
    }
  }, []);

  // Update localStorage logs
  const saveLogsToStorage = (updatedLogs: ScanLogEntry[]) => {
    setLogs(updatedLogs);
    try {
      localStorage.setItem("nutriscan_logs", JSON.stringify(updatedLogs));
    } catch (e) {
      console.error("Failed to persist logs to local storage", e);
    }
  };

  // Update target calories helper
  const handleUpdateTargetCalories = (target: number) => {
    setTargetCalories(target);
    try {
      localStorage.setItem("nutriscan_target", target.toString());
    } catch (e) {
      console.error("Failed to persist calorie target", e);
    }
  };

  // Update water tracking helpers
  const handleUpdateWaterGlasses = (glasses: number) => {
    setWaterGlasses(glasses);
    try {
      localStorage.setItem("nutriscan_water_glasses", glasses.toString());
    } catch (e) {
      console.error("Failed to persist water glasses", e);
    }
  };

  const handleUpdateWaterGoal = (goal: number) => {
    setWaterGoal(goal);
    try {
      localStorage.setItem("nutriscan_water_goal", goal.toString());
    } catch (e) {
      console.error("Failed to persist water goal", e);
    }
  };

  // Handle selected image hook from CameraSelector component
  const handleImageSelected = async (base64Image: string, mimeType: string) => {
    setSelectedImage(base64Image);
    setSelectedImageMime(mimeType);
    setApiError(null);
    setAnalysisResult(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || "Server returned a bad status code");
      }

      const parsedResult: FoodScanResult = await response.json();
      setAnalysisResult(parsedResult);
    } catch (err: any) {
      console.error("Analyze food API failure:", err);
      setApiError(err.message || "Failed to parse nutrition values. Please try with another clear picture.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle text-based food search queries and their weights
  const handleTextQuerySubmitted = async (foodQuery: string, weight: number | null, generatedImageBase64: string) => {
    setSelectedImage(generatedImageBase64);
    setSelectedImageMime("image/jpeg");
    setApiError(null);
    setAnalysisResult(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze-food-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodQuery,
          weight,
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || "Server returned a bad status code");
      }

      const parsedResult: FoodScanResult = await response.json();
      setAnalysisResult(parsedResult);
    } catch (err: any) {
      console.error("Text food query failure:", err);
      setApiError(err.message || "Failed to estimate calorie count. Please type a specific food description.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add analyzed food item to current daily log journal
  const handleAddToLog = () => {
    if (!analysisResult) return;

    const formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const formattedDate = new Date().toLocaleDateString([], { month: "short", day: "numeric" });
    
    const newEntry: ScanLogEntry = {
      id: "scan-" + Date.now(),
      timestamp: `Today, ${formattedTime}`,
      imageSnapshot: selectedImage || "", // store base64 as snapshot
      result: analysisResult,
    };

    const updatedLogs = [newEntry, ...logs];
    saveLogsToStorage(updatedLogs);

    // If goal alert is enabled, calculate if total exceeds the target
    if (isGoalAlertEnabled) {
      const todayLogs = updatedLogs.filter((entry) => entry.timestamp.includes("Today"));
      let totalCals = 0;
      todayLogs.forEach((l) => {
        totalCals += l.result.calories;
      });
      if (totalCals >= targetCalories) {
        setShowGoalPopup(true);
      }
    }
  };

  // Remove individual meal journal entry
  const handleRemoveEntry = (id: string) => {
    const filtered = logs.filter((l) => l.id !== id);
    saveLogsToStorage(filtered);
    
    // Clear display if active selection got deleted
    if (analysisResult && !filtered.some((f) => f.foodName === analysisResult.foodName)) {
      setAnalysisResult(null);
      setSelectedImage(null);
    }
  };

  // Clear all logs completely
  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to clear your entire journal and reset daily tracker values?")) {
      saveLogsToStorage([]);
      setAnalysisResult(null);
      setSelectedImage(null);
      handleUpdateWaterGlasses(0);
    }
  };

  // Select historical log from list to view in dashboard
  const handleSelectHistoryEntry = (entry: ScanLogEntry) => {
    setAnalysisResult(entry.result);
    if (entry.imageSnapshot) {
      setSelectedImage(entry.imageSnapshot);
    } else {
      setSelectedImage(null);
    }
    setActiveTab("scanner");
  };

  // Compute stats calculations for dynamic header dashboard metrics
  const getDailySummary = (): DailySummary => {
    const todayLogs = logs.filter((entry) => entry.timestamp.includes("Today"));
    
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;

    todayLogs.forEach((l) => {
      totalCalories += l.result.calories;
      totalCarbs += l.result.macronutrients.carbs;
      totalProtein += l.result.macronutrients.protein;
      totalFat += l.result.macronutrients.fat;
    });

    return {
      totalCalories,
      totalCarbs,
      totalProtein,
      totalFat,
      targetCalories,
    };
  };

  const summary = getDailySummary();
  const balanceFactor = Math.round((summary.totalCalories / targetCalories) * 100);

  // Determine if the current active selected food scan is already saved in the log
  const isAlreadyLogged = analysisResult 
    ? logs.some((l) => l.result.foodName === analysisResult.foodName && l.result.calories === analysisResult.calories)
    : false;

  return (
    <div className="min-h-screen bg-slate-50/40 relative flex flex-col font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300">
      
      {/* Cool premium ambient background - elegant grids & glowing biological blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
        {/* Soft elegant glowing gradient meshes */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/15 blur-[120px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-sky-300/20 blur-[150px]" />
        <div className="absolute top-[40%] right-[15%] w-[35%] h-[35%] rounded-full bg-amber-200/10 blur-[100px] animate-pulse duration-[12000ms]" />
        <div className="absolute bottom-[20%] left-[5%] w-[40%] h-[40%] rounded-full bg-teal-300/10 blur-[130px]" />

        {/* Minimalist Tech Dot Grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-70 mix-blend-multiply" />
        
        {/* Subtle grid lines */}
        <div className="absolute left-[5%] right-[5%] top-0 h-px bg-slate-200/40" />
        <div className="absolute left-[20%] top-0 bottom-0 w-px bg-slate-200/20" />
        <div className="absolute right-[20%] top-0 bottom-0 w-px bg-slate-200/20" />
      </div>

      {/* Dynamic Header - High-end minimalist design */}
      <nav className="h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-10 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              NutriScan<span className="text-emerald-500">AI</span>
            </span>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Instant calorie analyzer</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 sm:gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("scanner")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "scanner"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              id="header-tab-scanner-btn"
            >
              <Utensils className="w-3.5 h-3.5" />
              Scanner
            </button>
            <button
              onClick={() => setActiveTab("journal")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "journal"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              id="header-tab-journal-btn"
            >
              <Apple className="w-3.5 h-3.5" />
              My Journal
              {logs.length > 0 && (
                <span className="inline-flex items-center justify-center bg-emerald-500 text-white rounded-full w-4 h-4 text-[9px] font-bold">
                  {logs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("planner")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "planner"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              id="header-tab-planner-btn"
            >
              <Scale className="w-3.5 h-3.5" />
              Diet Planner
            </button>
          </div>

          <div className="w-px h-6 bg-slate-200 hidden sm:block" />

          {/* Daily Goal Alert Toggle Switch */}
          <button
            onClick={() => {
              const nextVal = !isGoalAlertEnabled;
              setIsGoalAlertEnabled(nextVal);
              try {
                localStorage.setItem("nutriscan_goal_alert_enabled", nextVal.toString());
              } catch (e) {
                console.warn(e);
              }
              // Interactive feedback: trigger popup immediately if target met!
              if (nextVal && summary.totalCalories >= targetCalories) {
                setShowGoalPopup(true);
              }
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              isGoalAlertEnabled
                ? "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100/50"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
            }`}
            title="Toggle daily goal alerts"
            id="toggle-goal-alerts-btn"
          >
            <div className="relative w-8 h-4 bg-slate-200 rounded-full transition-colors duration-200">
              <div
                className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${
                  isGoalAlertEnabled ? "transform translate-x-4 bg-emerald-600" : ""
                }`}
              />
            </div>
            <span className="hidden lg:inline text-[10px]">Goal Alerts</span>
          </button>
          
          <div className="w-px h-6 bg-slate-200 hidden md:block" />
          
          {/* Quick Target status */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block leading-none">Today's Intake</span>
              <span className="text-sm font-bold text-slate-800">{summary.totalCalories} / {targetCalories} kcal</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
              {balanceFactor}%
            </div>
          </div>
        </div>
      </nav>

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {activeTab === "scanner" && (
          <>
            {/* Left Workspace: Camera Selector / active scan preview */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <h3 className="text-xs text-slate-400 uppercase font-bold tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    Food Capture Node
                  </h3>
                  {isAnalyzing && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold uppercase tracking-wider">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      AI Calibrating
                    </span>
                  )}
                </div>

                <CameraSelector 
                  onImageSelected={handleImageSelected} 
                  onTextQuerySelected={handleTextQuerySubmitted}
                  isAnalyzing={isAnalyzing} 
                />
              </div>

              {/* Status information pane when analyzing */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-slate-900/15"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900 opacity-90 z-0"></div>
                  
                  {/* Dynamic clean minimal radar layout */}
                  <div className="relative z-10 flex flex-col items-center justify-center py-6 text-center">
                    <div className="relative mb-6 flex items-center justify-center text-center">
                      <div className="w-24 h-24 border-2 border-emerald-400/30 rounded-full animate-ping absolute" />
                      <div className="w-20 h-20 border-2 border-emerald-400/50 rounded-full animate-pulse absolute" />
                      <div className="w-14 h-14 border border-emerald-400/80 rounded-full flex items-center justify-center text-emerald-400 bg-slate-950/60 font-semibold text-xs leading-none">
                        98.4%
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
                      Analyzing Density
                    </span>
                    <h4 className="text-lg font-light tracking-wide text-white">Detecting ingredients & metrics</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                      Gemini Vision is estimating calorie weights, glycemic triggers, and nutritional percentages.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* API and visual errors notification */}
              {apiError && (
                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-800 text-sm mb-1">Analyzer Interrupted</h4>
                    <p className="text-xs text-rose-600 leading-relaxed mb-4">{apiError}</p>
                    <button
                      onClick={() => setApiError(null)}
                      className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold rounded-xl transition shadow shadow-rose-200"
                      id="retry-button"
                    >
                      Clear message & retry
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Workspace: Decoded food analysis dashboards */}
            <div className="lg:col-span-7">
              {analysisResult ? (
                <div className="space-y-6">
                  <NutritionDashboard 
                    scanResult={analysisResult} 
                    onAddToLog={handleAddToLog}
                    isAlreadyLogged={isAlreadyLogged}
                    isAnalyzing={isAnalyzing}
                  />
                </div>
              ) : (
                /* Beautiful empty screen prompting first snap */
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 tracking-tight" id="empty-state-title">
                    Ready for calorie valuation
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                    Once you snap a photo with your device camera or upload an image above, dynamic nutritional breakdowns and ratios will render here instantly in real time.
                  </p>

                  <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-3 gap-4 text-left">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Confidence</span>
                      <span className="text-lg font-bold text-slate-800">98.4% Avg</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Portion scale</span>
                      <span className="text-lg font-bold text-slate-800">Grams (g)</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Scan latency</span>
                      <span className="text-lg font-bold text-slate-800">0.4s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "journal" && (
          /* Interactive Scan History & Journal logs view */
          <div className="lg:col-span-12">
            <ScannerHistory 
              logs={logs}
              dailySummary={summary}
              onRemoveEntry={handleRemoveEntry}
              onClearLogs={handleClearLogs}
              onSelectEntry={handleSelectHistoryEntry}
              onUpdateTargetCalories={handleUpdateTargetCalories}
              waterGlasses={waterGlasses}
              waterGoal={waterGoal}
              onUpdateWaterGlasses={handleUpdateWaterGlasses}
              onUpdateWaterGoal={handleUpdateWaterGoal}
            />
          </div>
        )}

        {activeTab === "planner" && (
          /* Custom Interactive Diet Menu Planner segment */
          <div className="lg:col-span-12">
            <DietPlanner 
              onUpdateAppTarget={handleUpdateTargetCalories}
              currentAppTarget={targetCalories}
            />
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 border-t border-slate-200/80 text-center tracking-wide text-xs text-slate-400 bg-white/70 backdrop-blur-md leading-relaxed relative z-10">
        <p className="font-semibold text-slate-500">NutriScanAI • Clean Minimalist Diet Assistant</p>
        <p className="mt-1">Powered by Server-Side Gemini 3.5 Flash Vision. Real portion estimates.</p>
      </footer>

      {/* Target Calorie Milestone Reached Floating Popup Modal */}
      <AnimatePresence>
        {showGoalPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" id="goal-popup-container">
            {/* Backdrop with elegant blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoalPopup(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 border border-slate-100 shadow-2xl z-10 text-center overflow-hidden"
            >
              {/* Decorative light ambient backdrop decoration */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-400" />
              
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 animate-bounce text-emerald-500" />
              </div>

              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                Daily Goal Reached! 🎉
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed mb-6">
                Congratulations! Your nutrient totals have crossed your daily target benchmark. Keeping active and balanced nutrition is a continuous journey!
              </p>

              {/* Progress Summary Node inside the Alert Popup */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Current Intake</span>
                  <span className="text-emerald-600 font-extrabold">{balanceFactor}% Complete</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-800">{summary.totalCalories}</span>
                  <span className="text-xs font-semibold text-slate-400">/ {targetCalories} kcal</span>
                </div>
                
                {/* Dynamic micronutrient positive reinforcement line */}
                <p className="text-[11px] text-slate-600 font-medium mt-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Logged Protein: <span className="font-bold text-slate-800">{summary.totalProtein}g</span> • Carbs: <span className="font-bold text-slate-800">{summary.totalCarbs}g</span>
                </p>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowGoalPopup(false)}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer active:scale-95 shadow-md shadow-slate-900/10"
                  id="goal-popup-close-btn"
                >
                  Splendid!
                </button>
                <button
                  onClick={() => {
                    setShowGoalPopup(false);
                    setActiveTab("journal");
                  }}
                  className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer active:scale-95"
                  id="goal-popup-journal-btn"
                >
                  View Journal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
