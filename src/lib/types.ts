export interface UserProfile {
  age: number;
  gender: "male" | "female";
  height: number;
  weight: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "lose" | "maintain" | "gain";
  city: string;
  allergies: string[];
  dislikes: string;
  cookingTime: "abundant" | "limited";
}

export interface IngredientDetail {
  name: string;
  amount: number;
  unit: string;
  category?: string;
}

export interface ShoppingItem {
  name: string;
  amount: number;
  unit: string;
  category: string;
}

export interface MealItem {
  name: string;
  description: string;
  calories: number;
  tags?: string[];
  ingredients?: string[];
  recipe?: string[];
  ingredientDetails?: IngredientDetail[];
  prepTime: number;
  complexity: "easy" | "medium" | "hard";
}

export interface DailyPlan {
  day: string;
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks?: MealItem[];
  totalCalories: number;
  tips: string;
  diversityCount: number;
}

export interface MealPools {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks: MealItem[];
}

export interface WeeklyPlan {
  userProfile: UserProfile;
  bmi: number;
  bmiStatus: "underweight" | "normal" | "overweight" | "obese";
  dailyCalorieTarget: number;
  dailyPlans: DailyPlan[];
  shoppingList: ShoppingItem[];
  nutritionSummary: {
    protein: string;
    fat: string;
    carbs: string;
  };
  disclaimer: string;
  sources: { title: string; url: string }[];
  seasonalAdvice?: {
    season: string;
    localVeggies: string[];
    tips: string;
  };
  weeklyDiversityCount: number;
  mealPools: MealPools; // New field for swapping meals
}
