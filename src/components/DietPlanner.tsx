import React, { useState, useEffect } from "react";
import { DietMenuPlan, Meal } from "../types";
import { 
  Scale, 
  Ruler, 
  Sparkles, 
  Clock, 
  Activity, 
  Flame, 
  User, 
  Utensils, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  Award, 
  HeartPulse, 
  ListOrdered,
  Apple,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DietPlannerProps {
  onUpdateAppTarget: (calories: number) => void;
  currentAppTarget: number;
}

export default function DietPlanner({ onUpdateAppTarget, currentAppTarget }: DietPlannerProps) {
  // Input fields loaded from localStorage or set to defaults
  const [gender, setGender] = useState<string>("male");
  const [weight, setWeight] = useState<string>("70");
  const [height, setHeight] = useState<string>("175");
  const [age, setAge] = useState<string>("28");
  const [activityLevel, setActivityLevel] = useState<string>("moderate");
  const [goal, setGoal] = useState<string>("weight-loss");
  const [preference, setPreference] = useState<string>("balanced");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [menuPlan, setMenuPlan] = useState<DietMenuPlan | null>(null);
  const [activeMealDetail, setActiveMealDetail] = useState<"breakfast" | "lunch" | "snack" | "dinner">("breakfast");
  const [applyState, setApplyState] = useState<"idle" | "applied">("idle");

  // Load state from local storage on mount
  useEffect(() => {
    try {
      const savedGender = localStorage.getItem("nutriscan_diet_gender");
      if (savedGender) setGender(savedGender);

      const savedWeight = localStorage.getItem("nutriscan_diet_weight");
      if (savedWeight) setWeight(savedWeight);

      const savedHeight = localStorage.getItem("nutriscan_diet_height");
      if (savedHeight) setHeight(savedHeight);

      const savedAge = localStorage.getItem("nutriscan_diet_age");
      if (savedAge) setAge(savedAge);

      const savedActivity = localStorage.getItem("nutriscan_diet_activity");
      if (savedActivity) setActivityLevel(savedActivity);

      const savedGoal = localStorage.getItem("nutriscan_diet_goal");
      if (savedGoal) setGoal(savedGoal);

      const savedPreference = localStorage.getItem("nutriscan_diet_preference");
      if (savedPreference) setPreference(savedPreference);

      const savedPlan = localStorage.getItem("nutriscan_diet_menu_plan");
      if (savedPlan) {
        setMenuPlan(JSON.parse(savedPlan));
      }
    } catch (e) {
      console.warn("Could not load from localStorage in DietPlanner", e);
    }
  }, []);

  // Sync state changes to local storage
  const handleSaveInputs = (
    newGender: string,
    newWeight: string,
    newHeight: string,
    newAge: string,
    newActivity: string,
    newGoal: string,
    newPref: string
  ) => {
    try {
      localStorage.setItem("nutriscan_diet_gender", newGender);
      localStorage.setItem("nutriscan_diet_weight", newWeight);
      localStorage.setItem("nutriscan_diet_height", newHeight);
      localStorage.setItem("nutriscan_diet_age", newAge);
      localStorage.setItem("nutriscan_diet_activity", newActivity);
      localStorage.setItem("nutriscan_diet_goal", newGoal);
      localStorage.setItem("nutriscan_diet_preference", newPref);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setApplyState("idle");

    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);

    if (isNaN(w) || w <= 10 || w >= 300) {
      setError("Please suggest a realistic weight, e.g. 30kg - 250kg");
      setIsLoading(false);
      return;
    }
    if (isNaN(h) || h <= 50 || h >= 260) {
      setError("Please suggest a realistic height, e.g. 100cm - 240cm");
      setIsLoading(false);
      return;
    }
    if (isNaN(a) || a <= 5 || a >= 110) {
      setError("Please suggest an age between 10 and 100");
      setIsLoading(false);
      return;
    }

    // Save inputs locally
    handleSaveInputs(gender, weight, height, age, activityLevel, goal, preference);

    try {
      const response = await fetch("/api/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: w,
          height: h,
          age: a,
          gender,
          activityLevel,
          goal,
          preference,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to formulate a menu plan. Please verify server connection.");
      }

      const data: DietMenuPlan = await response.json();
      setMenuPlan(data);
      
      try {
        localStorage.setItem("nutriscan_diet_menu_plan", JSON.stringify(data));
      } catch (e) {
        console.warn("Could not save plan in local storage", e);
      }
    } catch (err: any) {
      setError(err.message || "Failed to organize your physical menu. Please click again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyBudgetToTracker = () => {
    if (!menuPlan) return;
    onUpdateAppTarget(menuPlan.recommendedTargetCalories);
    setApplyState("applied");
    // Auto reset after some feedback
    setTimeout(() => {
      setApplyState("idle");
    }, 4500);
  };

  const activeMeal: Meal | undefined = menuPlan ? menuPlan.menu[activeMealDetail] : undefined;

  return (
    <div className="space-y-8" id="diet-planner-wrapper">
      
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-400/20 text-[10px] font-black uppercase tracking-widest rounded-full">
              Interactive clinical feature
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800">Dietary Menu Planner</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Input weight, height, age, and activity parameters to calculate your biological TDEE, optimal daily targets, and design a customized 1-day step-by-step diet menu curated by our deep AI clinical dietitian.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 shrink-0 self-start md:self-center font-semibold text-slate-600">
          <HeartPulse className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Biological metrics active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Parameters Formulator */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Physical Parameters</h3>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide">Tell us about your metabolism</p>
            </div>
          </div>

          <form onSubmit={handleGenerateMenu} className="space-y-5">
            {/* Gender Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Biological Gender</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`py-2 text-xs font-bold tracking-wider rounded-lg transition-all ${
                    gender === "male"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  id="metric-gender-male-btn"
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`py-2 text-xs font-bold tracking-wider rounded-lg transition-all ${
                    gender === "female"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  id="metric-gender-female-btn"
                >
                  Female
                </button>
              </div>
            </div>

            {/* Weight / Height / Age Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                  <Scale className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Weight</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="300"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2.5 text-slate-800 font-bold focus:outline-none focus:border-slate-400 text-sm pr-6"
                    id="metric-weight-input"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">kg</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Height</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="260"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2.5 text-slate-800 font-bold focus:outline-none focus:border-slate-400 text-sm pr-8"
                    id="metric-height-input"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">cm</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Age</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="110"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2.5 text-slate-800 font-bold focus:outline-none focus:border-slate-400 text-sm pr-8"
                    id="metric-age-input"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">yrs</span>
                </div>
              </div>
            </div>

            {/* Activity Level Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Daily Physical Activity</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-slate-400"
                id="metric-activity-level"
              >
                <option value="sedentary">Sedentary (Little or no workout/desk job)</option>
                <option value="light">Lightly Active (Easy exercise 1-3 days/week)</option>
                <option value="moderate">Moderately Active (Moderate workout 3-5 days/week)</option>
                <option value="active">Active (Heavy physical activity 6-7 days/week)</option>
                <option value="very-active">Extremely Active (Athletic/hard labor daily)</option>
              </select>
            </div>

            {/* Goal Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Primary Health & Fitness Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-slate-400"
                id="metric-dietary-goal"
              >
                <option value="weight-loss">Weight Loss (Caloric Deficit -500 kcal)</option>
                <option value="maintain">Body Weight Maintenance (Sustained Metabolism)</option>
                <option value="muscle-gain">Lean Muscle Gain (Caloric Surplus +300 kcal)</option>
                <option value="keto">Keto Conditioning (High Fat / Low Carbohydrates)</option>
                <option value="diabetic-friendly">Diabetic Friendly (Flat insulin, Low GL)</option>
              </select>
            </div>

            {/* Dietary Preference Toggle Card Grid */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Meal Type Preference</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "balanced", label: "Balanced Food" },
                  { value: "vegetarian", label: "Vegetarian" },
                  { value: "vegan", label: "Vegan Plan" },
                  { value: "low-carb", label: "Low Carb / Keto" }
                ].map((p) => {
                  const isSel = preference === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPreference(p.value)}
                      className={`py-2 px-3 border rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isSel
                          ? "bg-slate-900 border-slate-950 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                      }`}
                      id={`pref-btn-${p.value}`}
                    >
                      {isSel && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-2 text-rose-600 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-2xl text-xs uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg ${
                isLoading
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-white shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 cursor-pointer"
              }`}
              id="generate-diet-plan-btn"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dietitian Calibrating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Synthesize Diet Menu</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Diet Plan Visualizer */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {menuPlan ? (
              <motion.div
                key="results-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
                id="generated-menu-results"
              >
                
                {/* Meta Targets Board (TDEE & Recommended Intake) */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-slate-900/15">
                  <div className="absolute inset-0 bg-radial-gradient from-slate-800 to-slate-900 opacity-90 z-0"></div>
                  
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-6">
                      <span className="px-2 py-0.5 bg-slate-800 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest rounded-lg">
                        Daily Energy Target
                      </span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-black text-emerald-400">{menuPlan.recommendedTargetCalories}</span>
                        <span className="text-sm font-semibold text-slate-400">kcal / day</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1">
                        Computed TDEE: <span className="font-bold text-white">{menuPlan.dailyTdeeEstimate} kcal</span>
                      </div>
                    </div>

                    <div className="md:col-span-5">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Target Macronutrients split</span>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-rose-400">Protein</span>
                            <span className="text-slate-300">{menuPlan.recommendedTargetMacros.protein}g</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: "35%" }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-amber-400">Carbs</span>
                            <span className="text-slate-300">{menuPlan.recommendedTargetMacros.carbs}g</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: "45%" }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-sky-400">Fat Lipids</span>
                            <span className="text-slate-300">{menuPlan.recommendedTargetMacros.fat}g</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500 rounded-full" style={{ width: "20%" }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-3 flex md:justify-end">
                      {applyState === "applied" ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl px-4 py-3 text-center w-full shadow-sm animate-pulse">
                          <Check className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                          <div className="text-[10px] font-black uppercase tracking-wider">Target synced!</div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyBudgetToTracker}
                          className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 border border-emerald-600"
                          id="sync-calorie-target-btn"
                          title="Click here to apply these calories to the daily app tracker"
                        >
                          <Flame className="w-5 h-5 text-emerald-100" />
                          <span>Push as Active Goal</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>

                {/* Four meals selection grid */}
                <div>
                  <h4 className="text-xs text-slate-400 uppercase font-black tracking-widest mb-3">Daily Meal Rotation</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {(["breakfast", "lunch", "snack", "dinner"] as const).map((mealType) => {
                      const m = menuPlan.menu[mealType];
                      const isAct = activeMealDetail === mealType;
                      let badgeColor = "bg-rose-50 text-rose-600 border-rose-100";
                      if (mealType === "lunch") badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                      if (mealType === "snack") badgeColor = "bg-amber-50 text-amber-600 border-amber-100";
                      if (mealType === "dinner") badgeColor = "bg-sky-50 text-sky-600 border-sky-100";
                      
                      return (
                        <button
                          key={mealType}
                          type="button"
                          onClick={() => setActiveMealDetail(mealType)}
                          className={`p-3 sm:p-4 border rounded-2xl text-left transition-all duration-300 group cursor-pointer relative ${
                            isAct 
                              ? "bg-slate-900 border-slate-950 text-white shadow-md shadow-slate-900/10 scale-[1.02] z-10" 
                              : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:scale-[1.01]"
                          }`}
                          id={`meal-tab-${mealType}-btn`}
                        >
                          <div className={`p-1.5 w-6 h-6 rounded-lg border text-[8px] font-black uppercase text-center flex items-center justify-center mb-2.5 ${
                            isAct ? "bg-slate-800 border-slate-700 text-emerald-400" : badgeColor
                          }`}>
                            {mealType.slice(0, 2)}
                          </div>
                          <span className={`block font-black text-xs uppercase tracking-wider ${isAct ? "text-white" : "text-slate-800"}`}>
                            {mealType}
                          </span>
                          <span className="block text-[9.5px] font-semibold text-slate-400 truncate mt-0.5 leading-none max-w-full">
                            {m.calorieEstimate} kcal
                          </span>
                          {isAct && (
                            <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Meal Details Panel */}
                <AnimatePresence mode="wait">
                  {activeMeal && (
                    <motion.div
                      key={activeMealDetail}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm"
                      id="selected-meal-detail-panel"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            {activeMealDetail} selection
                          </span>
                          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-1">
                            {activeMeal.mealName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-center">
                          <Clock className="w-3.5 h-3.5 text-slate-400 fill-slate-100 shrink-0" />
                          <span>{activeMeal.cookingMinutes} minutes cooking</span>
                        </div>
                      </div>

                      {/* Nutrient breakdown row */}
                      <div className="grid grid-cols-4 gap-2 py-5 border-b border-slate-100 text-center">
                        <div className="bg-rose-50/40 border border-rose-100/50 rounded-2xl p-3">
                          <span className="block text-[9px] font-bold text-rose-500 uppercase tracking-widest">Calories</span>
                          <span className="text-lg font-black text-slate-800 leading-none block mt-1">{activeMeal.calorieEstimate}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">kcal</span>
                        </div>
                        <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-3">
                          <span className="block text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Protein</span>
                          <span className="text-lg font-black text-slate-800 leading-none block mt-1">{activeMeal.protein}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">grams</span>
                        </div>
                        <div className="bg-amber-50/40 border border-amber-100/50 rounded-2xl p-3">
                          <span className="block text-[9px] font-bold text-amber-500 uppercase tracking-widest">Carbs</span>
                          <span className="text-lg font-black text-slate-800 leading-none block mt-1">{activeMeal.carbs}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">grams</span>
                        </div>
                        <div className="bg-sky-50/40 border border-sky-100/50 rounded-2xl p-3">
                          <span className="block text-[9px] font-bold text-sky-500 uppercase tracking-widest">Lipids Fat</span>
                          <span className="text-lg font-black text-slate-800 leading-none block mt-1">{activeMeal.fat}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">grams</span>
                        </div>
                      </div>

                      {/* Chef Preparation steps */}
                      <div className="pt-5 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <ListOrdered className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Preparation & culinary steps</span>
                        </h4>
                        <ol className="space-y-3">
                          {activeMeal.preparationSteps.map((step, idx) => (
                            <li key={idx} className="flex gap-4 items-start">
                              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold shrink-0 flex items-center justify-center mt-0.5">
                                {idx + 1}
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                {step}
                              </p>
                            </li>
                          ))}
                        </ol>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expert Insights section */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <h4 className="text-xs text-slate-400 uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-500" />
                    Custom Clinical Diet Recommendations
                  </h4>
                  <div className="space-y-4">
                    {menuPlan.expertTips.map((tip, index) => (
                      <div key={index} className="flex gap-4 items-start bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
                        <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                          {index + 1}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              /* High-fidelity empty prompt */
              <motion.div
                key="empty-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm h-full flex flex-col justify-center items-center py-20"
                id="generated-menu-empty-state"
              >
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Utensils className="w-8 h-8 text-emerald-500" />
                </div>

                <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                  Design suitable, clinically optimized meal plans
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed">
                  Provide your daily physical profile and preferences on the left pane and run the menu generator. A complete macro budget and step-by-step breakfast, lunch, snack, and dinner meal plans will synthesize here immediately.
                </p>

                <div className="mt-8 pt-6 border-t border-slate-100 w-full max-w-md grid grid-cols-3 gap-2 text-left">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Deficit targets</span>
                    <span className="text-xs font-bold text-slate-700">Weight Loss -500g</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Surplus bulk</span>
                    <span className="text-xs font-bold text-slate-700">Muscle Gain +300g</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Macro ratios</span>
                    <span className="text-xs font-bold text-slate-700">Low Carb / Green</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
