import { ScanLogEntry, DailySummary } from "../types";
import { Trash2, CalendarCheck2, Flame, Award, Apple, ClipboardList, Target, Edit, Droplet, Plus, Minus } from "lucide-react";
import React, { useState, useEffect } from "react";

interface ScannerHistoryProps {
  logs: ScanLogEntry[];
  dailySummary: DailySummary;
  onRemoveEntry: (id: string) => void;
  onClearLogs: () => void;
  onSelectEntry: (entry: ScanLogEntry) => void;
  onUpdateTargetCalories: (target: number) => void;
  waterGlasses: number;
  waterGoal: number;
  onUpdateWaterGlasses: (glasses: number) => void;
  onUpdateWaterGoal: (goal: number) => void;
}

export default function ScannerHistory({
  logs,
  dailySummary,
  onRemoveEntry,
  onClearLogs,
  onSelectEntry,
  onUpdateTargetCalories,
  waterGlasses,
  waterGoal,
  onUpdateWaterGlasses,
  onUpdateWaterGoal,
}: ScannerHistoryProps) {
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(dailySummary.targetCalories.toString());

  const [isEditingWaterGoal, setIsEditingWaterGoal] = useState(false);
  const [waterGoalInput, setWaterGoalInput] = useState(waterGoal.toString());

  useEffect(() => {
    setWaterGoalInput(waterGoal.toString());
  }, [waterGoal]);

  const handleWaterGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(waterGoalInput, 10);
    if (!isNaN(val) && val > 0 && val <= 30) {
      onUpdateWaterGoal(val);
      setIsEditingWaterGoal(false);
    }
  };

  const handleTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(targetInput, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateTargetCalories(val);
      setIsEditingTarget(false);
    }
  };

  // Calculate percentages
  const calPercent = Math.min(Math.round((dailySummary.totalCalories / dailySummary.targetCalories) * 100), 100);
  
  const getProgressColor = (percent: number) => {
    if (percent > 100) return "bg-red-500";
    if (percent > 85) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-6">
      {/* Daily Progress Widget */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Today's Daily Totals</h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Target className="w-3.5 h-3.5" />
            {isEditingTarget ? (
              <form onSubmit={handleTargetSubmit} className="flex items-center gap-1">
                <input
                  type="number"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-16 border border-slate-200 rounded px-1.5 py-0.5 text-slate-800 font-semibold focus:outline-none focus:border-slate-400 text-center"
                  id="target-calorie-input"
                />
                <button type="submit" className="text-emerald-600 font-bold hover:underline" id="save-target-btn">
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1 font-semibold text-slate-700">
                Target: {dailySummary.targetCalories} kcal
                <button
                  onClick={() => setIsEditingTarget(true)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  title="Edit target calories"
                  id="edit-target-btn"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calories Progress and Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          {/* Main Calories Ring/Gauge Summary */}
          <div className="md:col-span-2 bg-slate-50/50 border border-slate-50 rounded-2xl p-4 flex flex-col justify-center">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Calories Intake</span>
              <span className="text-xs font-bold text-slate-700">
                {calPercent}% of limit
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-black text-slate-800">
                {dailySummary.totalCalories}
              </span>
              <span className="text-xs font-medium text-slate-500">
                / {dailySummary.targetCalories} kcal
              </span>
            </div>
            {/* ProgressBar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${calPercent}%` }}
                className={`h-full transition-all duration-500 ${getProgressColor(calPercent)}`}
              />
            </div>
          </div>

          {/* Mini macro totals */}
          <div className="border border-slate-50 rounded-2xl p-4 flex flex-col justify-center">
            <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Carbs</div>
            <div className="text-xl font-bold text-slate-700">{dailySummary.totalCarbs}g</div>
            <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div style={{ width: `${Math.min(dailySummary.totalCarbs, 100)}%` }} className="h-full bg-emerald-500" />
            </div>
          </div>

          <div className="border border-slate-50 rounded-2xl p-4 flex flex-col justify-center">
            <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Protein</div>
            <div className="text-xl font-bold text-slate-700">{dailySummary.totalProtein}g</div>
            <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div style={{ width: `${Math.min(dailySummary.totalProtein, 100)}%` }} className="h-full bg-sky-500" />
            </div>
          </div>
        </div>

        {/* Divider and Hydration Tracker */}
        <div className="h-px bg-slate-100 my-5" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Droplet className="w-4 h-4 fill-blue-500" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Hydration Tracker</h4>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Track progress towards your daily water goal</p>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            {isEditingWaterGoal ? (
              <form onSubmit={handleWaterGoalSubmit} className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={waterGoalInput}
                  onChange={(e) => setWaterGoalInput(e.target.value)}
                  className="w-12 border border-slate-200 rounded px-1.5 py-0.5 text-slate-800 font-semibold focus:outline-none focus:border-slate-400 text-center"
                  id="target-water-input"
                />
                <button type="submit" className="text-blue-600 font-bold hover:underline" id="save-water-goal-btn">
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1 font-semibold text-slate-700">
                Goal: {waterGoal} glasses
                <button
                  onClick={() => setIsEditingWaterGoal(true)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  title="Edit water goal"
                  id="edit-water-goal-btn"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-blue-50/20 border border-blue-50/50 rounded-2xl p-4">
          <div className="md:col-span-4 select-none">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Hydration level</span>
              {waterGlasses >= waterGoal && (
                <span className="text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse uppercase tracking-wider">Goal met!</span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-800">{waterGlasses}</span>
              <span className="text-xs font-semibold text-slate-400">/ {waterGoal} glasses</span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-1">
              Approx. {waterGlasses * 250} ml / {waterGoal * 250} ml (250ml per glass)
            </div>
          </div>

          <div className="md:col-span-5 flex flex-wrap gap-1.5 justify-center md:justify-start">
            {Array.from({ length: Math.min(waterGoal, 16) }).map((_, i) => {
              const isFilled = i < waterGlasses;
              return (
                <button
                  key={i}
                  onClick={() => onUpdateWaterGlasses(isFilled && i === waterGlasses - 1 ? i : i + 1)}
                  className={`p-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-100 hover:scale-105 active:scale-95 ${
                    isFilled
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-300 hover:text-slate-400"
                  }`}
                  title={`Click to set water intake to ${i + 1} glasses`}
                  type="button"
                  id={`water-cup-${i}`}
                >
                  <Droplet className={`w-4 h-4 ${isFilled ? "fill-white text-white" : "text-slate-300"}`} />
                </button>
              );
            })}
          </div>

          <div className="md:col-span-3 flex justify-center md:justify-end">
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onUpdateWaterGlasses(Math.max(0, waterGlasses - 1))}
                className="w-10 h-10 border border-slate-100 rounded-xl bg-white hover:bg-slate-50 text-slate-500 font-bold transition flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                title="Remove 1 glass"
                id="water-minus-btn"
                type="button"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="bg-blue-500 border border-blue-600 rounded-xl px-3 py-1.5 text-center min-w-[65px] select-none shadow-sm shadow-blue-500/10">
                <div className="text-sm font-black text-white leading-none">{waterGlasses}</div>
                <div className="text-[8px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">Glasses</div>
              </div>
              <button
                onClick={() => onUpdateWaterGlasses(waterGlasses + 1)}
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-md shadow-blue-500/10"
                title="Add 1 glass"
                id="water-plus-btn"
                type="button"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scanned Log Listing */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/50">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-800 text-sm">Meal Journal ({logs.length})</h3>
          </div>

          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1"
              id="clear-all-logs-btn"
            >
              Clear Log
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-10 px-4 border border-slate-50 rounded-2xl bg-slate-50/20">
            <Apple className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Your journal is currently empty</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
              Snap photos of your breakfast, dinner, or snacks, and they will accumulate here automatically!
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {logs.map((entry) => (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="group flex items-center justify-between p-3.5 border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 rounded-2xl transition cursor-pointer"
                id={`history-entry-${entry.id}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Snapshot box */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-100/50 shrink-0 select-none">
                    <img
                      src={`data:image/jpeg;base64,${entry.imageSnapshot}`}
                      referrerPolicy="no-referrer"
                      alt={entry.result.foodName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-800 text-sm truncate group-hover:text-emerald-700 transition">
                      {entry.result.foodName}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-medium">{entry.result.portionSize}</span>
                      <span>•</span>
                      <span>{entry.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Right side metrics and deletion */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800 flex items-center justify-end gap-0.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      {entry.result.calories}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">kcal</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Stop parent click trigger
                      onRemoveEntry(entry.id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-55 rounded-xl transition duration-150"
                    title="Remove entry"
                    id={`delete-entry-${entry.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
