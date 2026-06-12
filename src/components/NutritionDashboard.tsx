import { FoodScanResult } from "../types";
import { Sparkles, Plus, CheckCircle2, ChevronRight, Flame, Scale, ShieldAlert, Award, Footprints } from "lucide-react";
import { motion } from "motion/react";

interface NutritionDashboardProps {
  scanResult: FoodScanResult;
  onAddToLog: () => void;
  isAlreadyLogged: boolean;
  isAnalyzing: boolean;
}

export default function NutritionDashboard({
  scanResult,
  onAddToLog,
  isAlreadyLogged,
  isAnalyzing,
}: NutritionDashboardProps) {
  const {
    foodName,
    itemsIdentified,
    portionSize,
    calories,
    macronutrients,
    micronutrients,
    healthinessScore,
    glycemicIndex,
    insights,
    allergens,
  } = scanResult;

  // Calculate macronutrient calorie ratios
  // Carb: 4 kcal/g, Protein: 4 kcal/g, Fat: 9 kcal/g
  const carbKcal = macronutrients.carbs * 4;
  const proteinKcal = macronutrients.protein * 4;
  const fatKcal = macronutrients.fat * 9;
  const totalCalculatedKcal = carbKcal + proteinKcal + fatKcal || 1;

  const carbPct = Math.round((carbKcal / totalCalculatedKcal) * 100);
  const proteinPct = Math.round((proteinKcal / totalCalculatedKcal) * 100);
  const fatPct = Math.round((fatKcal / totalCalculatedKcal) * 100);

  // Healthiness badge configuration
  const getHealthScoreColor = (score: number) => {
    if (score >= 8) return { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" };
    if (score >= 5) return { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", ring: "ring-amber-200" };
    return { bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-700", ring: "ring-rose-200" };
  };

  const scoreDesign = getHealthScoreColor(healthinessScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Prime Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              Scanned Successfully
            </span>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight" id="food-title">
              {foodName}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2" id="food-portion-size">
              <Scale className="w-4 h-4 text-slate-400" />
              Estimated portion size: <span className="font-medium text-slate-700">{portionSize}</span>
            </p>
          </div>

          {!isAlreadyLogged ? (
            <button
              onClick={onAddToLog}
              disabled={isAnalyzing}
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-95 disabled:opacity-50 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-slate-900/15 transition-all text-sm group shrink-0"
              id="log-meal-btn"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              Log as Today's Meal
            </button>
          ) : (
            <div
              className="px-5 py-3.5 bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold rounded-2xl flex items-center justify-center gap-2 text-sm shrink-0"
              id="logged-meal-badge"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Saved to Daily Log
            </div>
          )}
        </div>

        {/* Display identified ingredient tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {itemsIdentified.map((item, i) => (
            <span
              key={i}
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-medium transition cursor-default"
            >
              {item}
            </span>
          ))}
        </div>

        {/* Major Calories Indicator + Healthiness Index Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-50 pt-5">
          {/* Calories Large Node */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50/30 border border-orange-100/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-1 text-orange-600">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-3xl font-extrabold text-slate-800 leading-tight">
              {calories}
            </span>
            <span className="text-xs font-semibold text-orange-700 uppercase tracking-wider mt-0.5">
              Calories (kcal)
            </span>
          </div>

          {/* Health Score Node */}
          <div className={`border ${scoreDesign.border} ${scoreDesign.bg} rounded-2xl p-4 flex flex-col items-center justify-center text-center`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ring-4 ${scoreDesign.ring} bg-white font-bold text-base ${scoreDesign.text}`}>
              {healthinessScore}
            </div>
            <span className={`text-base font-bold ${scoreDesign.text}`}>
              {healthinessScore >= 8 ? "Very Nutritious" : healthinessScore >= 5 ? "Balanced Choice" : "Indulgent"}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Healthiness Score
            </span>
          </div>

          {/* Glycemic Index Node */}
          <div className="bg-sky-50/50 border border-sky-100/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 bg-sky-100 font-bold text-sm text-sky-700`}>
              {glycemicIndex.charAt(0)}
            </div>
            <span className="text-base font-bold text-sky-800">
              {glycemicIndex} GI
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Glycemic Index
            </span>
          </div>
        </div>

        {/* Potential allergens flag */}
        {allergens && allergens.length > 0 && allergens[0].toLowerCase() !== "none" && (
          <div className="mt-4 flex items-center gap-2 bg-rose-50/50 border border-rose-100/40 p-3.5 rounded-2xl text-xs text-rose-800 font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Potential Allergens Detected: </span>
              {allergens.join(", ")}
            </div>
          </div>
        )}
      </div>

      {/* Macronutrient Ratios & Graph Indicator */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/50">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600" />
          Macronutrient Breakdown
        </h3>

        {/* Ratio bar representing parts */}
        <div className="h-6 w-full rounded-full bg-slate-100 overflow-hidden flex mb-5 shadow-inner">
          <div
            style={{ width: `${carbPct}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Carbs: ${carbPct}%`}
          />
          <div
            style={{ width: `${proteinPct}%` }}
            className="bg-sky-500 h-full transition-all duration-500"
            title={`Protein: ${proteinPct}%`}
          />
          <div
            style={{ width: `${fatPct}%` }}
            className="bg-amber-500 h-full transition-all duration-500"
            title={`Fat: ${fatPct}%`}
          />
        </div>

        {/* Detailed Macronutrient details card layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Carbohydrates */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Carbohydrates</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{macronutrients.carbs}g</span>
              <span className="text-xs font-medium text-slate-500">{carbPct}% kcal</span>
            </div>
          </div>

          {/* Protein */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Protein</span>
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{macronutrients.protein}g</span>
              <span className="text-xs font-medium text-slate-500">{proteinPct}% kcal</span>
            </div>
          </div>

          {/* Fats */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Fat</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{macronutrients.fat}g</span>
              <span className="text-xs font-medium text-slate-500">{fatPct}% kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Micronutrients and Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Micronutrients checklist slider */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Footprints className="w-4 h-4 text-emerald-600" />
              Micronutrients & Daily value
            </h3>
            <div className="space-y-4">
              {micronutrients.map((micro, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{micro.name}</span>
                    <span className="text-slate-500">
                      {micro.amount} <span className="text-emerald-600 ml-1">({micro.percentDailyValue}% DV)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(micro.percentDailyValue, 100)}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart dietary insights */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/50">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            AI Nutritional Insights
          </h3>
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex gap-3 text-xs leading-relaxed text-slate-600">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="flex-1 font-medium">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
