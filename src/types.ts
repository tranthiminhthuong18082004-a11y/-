export interface Macronutrients {
  carbs: number;    // grams
  protein: number;  // grams
  fat: number;      // grams
}

export interface Micronutrient {
  name: string;
  amount: string;
  percentDailyValue: number;
}

export interface FoodScanResult {
  foodName: string;
  itemsIdentified: string[];
  portionSize: string;
  calories: number;
  macronutrients: Macronutrients;
  micronutrients: Micronutrient[];
  healthinessScore: number; // 1 to 10
  glycemicIndex: string;    // 'Low' | 'Medium' | 'High'
  insights: string[];       // strictly 3 health/dietary tips or recommendations
  allergens: string[];      // potential allergens detected
}

export interface ScanLogEntry {
  id: string;
  timestamp: string;
  imageSnapshot: string; // Base64 representation of the processed picture
  result: FoodScanResult;
}

export interface DailySummary {
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  targetCalories: number;
}

export interface Meal {
  mealName: string;
  calorieEstimate: number;
  carbs: number;
  protein: number;
  fat: number;
  cookingMinutes: number;
  preparationSteps: string[];
}

export interface DietMenuPlan {
  dailyTdeeEstimate: number;
  recommendedTargetCalories: number;
  recommendedTargetMacros: {
    carbs: number;
    protein: number;
    fat: number;
  };
  menu: {
    breakfast: Meal;
    lunch: Meal;
    snack: Meal;
    dinner: Meal;
  };
  expertTips: string[];
}

