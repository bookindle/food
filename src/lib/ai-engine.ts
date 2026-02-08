import type { UserProfile, WeeklyPlan } from "./types";
import { generateWeeklyPlan as generateLocalPlan } from "./diet-engine";

/**
 * Call DeepSeek API to generate a diet plan
 */
export async function generatePlanWithAI(profile: UserProfile, apiKey: string): Promise<WeeklyPlan> {
  const PROMPT_SYSTEM = `
你是一位专业的中国注册营养师。请根据用户的身体数据和偏好，生成一份详细的《基于中国居民膳食指南(2022)的一周健康饮食计划》。

【输出格式要求】
必须严格输出标准的 JSON 格式，不要包含 markdown 代码块标记，不要包含任何解释性文字。
JSON 结构必须完全符合以下 TypeScript 接口定义：

interface WeeklyPlan {
  userProfile: UserProfile; // 原样返回输入的用户数据
  bmi: number; // 计算得出的BMI
  bmiStatus: "underweight" | "normal" | "overweight" | "obese";
  dailyCalorieTarget: number; // 每日目标热量 (kcal)
  nutritionSummary: { // 宏观营养素供能比建议
    protein: string; // e.g., "15%-20%"
    fat: string; // e.g., "25%-30%"
    carbs: string; // e.g., "50%-60%"
  };
  seasonalAdvice: {
    season: string; // 当前季节
    localVeggies: string[]; // 推荐的当季/当地蔬菜列表(5-8种)
    tips: string; // 结合季节和用户城市的简短饮食建议
  };
  dailyPlans: Array<{
    day: string; // "第1天", "第2天" ... "第7天"
    tips: string; // 当日的健康小贴士
    diversityCount: number; // 当日食材种类数量(估算)
    totalCalories: number; // 当日总热量
    breakfast: MealItem[]; // 早餐 (通常1个套餐)
    lunch: MealItem[];     // 午餐 (通常1个套餐)
    dinner: MealItem[];    // 晚餐 (通常1个套餐)
    snacks: MealItem[];    // 加餐 (0-2个)
  }>;
  shoppingList: Array<{ // 汇总一周所需的食材
    name: string;
    amount: number;
    unit: string;
    category: "蔬菜" | "肉蛋" | "水果" | "主食" | "其他";
  }>;
  disclaimer: string; // 免责声明
  sources: Array<{ title: string; url: string }>;
  weeklyDiversityCount: number; // 一周总食材种类数
}

interface MealItem {
  name: string; // 菜品/套餐名称
  description: string; // 简短描述 (如: "全麦面包 + 牛奶")
  calories: number; // 估算热量
  tags: string[]; // 标签 (e.g., "低脂", "快手", "高蛋白")
  ingredients: string[]; // 包含的主要食材名称列表
  recipe: string[]; // 简略的烹饪步骤 (3-4步)
  ingredientDetails: Array<{ // 食材详细用量
    name: string;
    amount: number;
    unit: string;
    category: string;
  }>;
  prepTime: number; // 准备时间(分钟)
  complexity: "easy" | "medium" | "hard";
}

【生成逻辑要求】
1. **计算准确**：请准确计算用户的BMI (体重kg/身高m^2) 和 BMR/TDEE。
2. **个性化**：
   - 必须严格遵守用户的"过敏"(allergies)和"忌口"(dislikes)。
   - 如果用户"cookingTime"为"limited"(时间紧张)，请推荐"prepTime"短、"complexity"为"easy"的食谱，并允许食材在周内重复使用以方便备餐。
   - 如果用户"cookingTime"为"abundant"(时间充裕)，请推荐多样化、精致的食谱。
   - 结合用户所在的"city"推荐当地特色或当季食材。
3. **符合指南**：
   - 保证每天至少12种食材，每周25种以上。
   - 早餐要丰富，午餐要吃饱，晚餐要清淡。
4. **语言**：简体中文。

【用户输入数据】
${JSON.stringify(profile)}
`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: PROMPT_SYSTEM },
          { role: "user", content: "请生成一周饮食计划 JSON。" }
        ],
        temperature: 1.1, // 增加创造性
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON strictly
    const plan = JSON.parse(content) as WeeklyPlan;
    
    // Post-processing to ensure data integrity (optional fallback for missing fields)
    if (!plan.dailyPlans || plan.dailyPlans.length === 0) {
       throw new Error("AI 生成的数据格式不正确");
    }

    return plan;

  } catch (error) {
    console.error("DeepSeek API Call Failed:", error);
    throw error;
  }
}
