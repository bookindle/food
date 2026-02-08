import type { UserProfile, WeeklyPlan, DailyPlan, MealItem, ShoppingItem, IngredientDetail, MealPools } from "./types";

// 基础代谢率 (BMR) 计算
export function calculateBMR(profile: UserProfile): number {
  const { weight, height, age, gender } = profile;
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "male") bmr += 5;
  else bmr -= 161;
  return bmr;
}

// TDEE 计算
export function calculateTDEE(bmr: number, activityLevel: UserProfile["activityLevel"]): number {
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  return Math.round(bmr * multipliers[activityLevel]);
}

// 目标热量
export function calculateTargetCalories(tdee: number, goal: UserProfile["goal"]): number {
  switch (goal) {
    case "lose": return Math.round(tdee - 500);
    case "gain": return Math.round(tdee + 500);
    default: return Math.round(tdee);
  }
}

// BMI
export function calculateBMI(height: number, weight: number): { bmi: number; status: WeeklyPlan["bmiStatus"] } {
  const heightM = height / 100;
  const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));
  let status: WeeklyPlan["bmiStatus"] = "normal";
  if (bmi < 18.5) status = "underweight";
  else if (bmi < 24) status = "normal";
  else if (bmi < 28) status = "overweight";
  else status = "obese";
  return { bmi, status };
}

// 地域与时令
const SEASONS = {
  spring: { name: "春季", months: [2, 3, 4], veggies: ["春笋", "菠菜", "韭菜", "香椿", "豌豆苗", "荠菜", "芦笋"] },
  summer: { name: "夏季", months: [5, 6, 7], veggies: ["黄瓜", "番茄", "苦瓜", "丝瓜", "冬瓜", "茄子", "空心菜", "苋菜"] },
  autumn: { name: "秋季", months: [8, 9, 10], veggies: ["莲藕", "南瓜", "红薯", "山药", "大白菜", "胡萝卜", "百合"] },
  winter: { name: "冬季", months: [11, 0, 1], veggies: ["白萝卜", "大葱", "胡萝卜", "西蓝花", "芹菜", "塌菜", "冬笋"] }
};

const PROVINCES = {
  henan: { name: "河南", cities: ["郑州", "洛阳", "开封", "新乡", "安阳", "许昌", "南阳"], staple: "烩面/馒头", flavor: "咸香", local: ["胡辣汤", "鲤鱼", "烩面", "道口烧鸡", "蒸菜"] },
  guangdong: { name: "广东", cities: ["广州", "深圳", "佛山", "东莞", "珠海"], staple: "米饭/河粉", flavor: "清淡/鲜美", local: ["早茶", "白切鸡", "清蒸鱼", "煲汤", "肠粉", "烧鹅"] },
  sichuan: { name: "四川", cities: ["成都", "绵阳", "德阳", "宜宾"], staple: "米饭", flavor: "麻辣", local: ["回锅肉", "麻婆豆腐", "宫保鸡丁", "鱼香肉丝", "水煮肉片"] },
  hunan: { name: "湖南", cities: ["长沙", "株洲", "湘潭"], staple: "米饭/米粉", flavor: "香辣", local: ["剁椒鱼头", "小炒肉", "外婆菜"] },
  jiangsu: { name: "江苏", cities: ["南京", "苏州", "无锡"], staple: "米饭", flavor: "甜润/清淡", local: ["盐水鸭", "松鼠桂鱼", "红烧狮子头"] },
  shandong: { name: "山东", cities: ["济南", "青岛", "烟台"], staple: "馒头/煎饼", flavor: "咸鲜/葱蒜", local: ["煎饼卷大葱", "葱烧海参", "四喜丸子"] },
};

const REGIONS = {
  north: { name: "北方地区", cities: ["北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江", "山东", "陕西", "甘肃", "宁夏", "青海", "新疆"], staple: "面食/杂粮", flavor: "咸鲜" },
  south: { name: "南方地区", cities: ["上海", "江苏", "浙江", "安徽", "福建", "江西", "湖北", "湖南", "广西", "海南", "重庆", "贵州", "云南", "西藏"], staple: "米饭", flavor: "清淡/鲜辣" },
};

function getSeason(): keyof typeof SEASONS {
  const month = new Date().getMonth();
  for (const [season, data] of Object.entries(SEASONS)) {
    if (data.months.includes(month)) return season as keyof typeof SEASONS;
  }
  return "spring";
}

function getRegion(city: string): { type: "north" | "south" | "general" | "specific", data: any } {
  if (!city) return { type: "general", data: null };
  for (const [key, data] of Object.entries(PROVINCES)) {
    for (const c of data.cities) if (city.includes(c)) return { type: "specific", data: { ...data, provinceKey: key } };
  }
  for (const c of REGIONS.north.cities) if (city.includes(c)) return { type: "north", data: REGIONS.north };
  for (const c of REGIONS.south.cities) if (city.includes(c)) return { type: "south", data: REGIONS.south };
  return { type: "general", data: null };
}

// ----------------------------------------------------------------------
// AI-Enhanced Expanded Meal Database
// ----------------------------------------------------------------------
const BASE_MEAL_DB = {
  breakfast: [
    // 传统中式
    { name: "杂粮粥套餐", description: "杂粮粥1碗 + 水煮蛋1个 + 凉拌时蔬", calories: 350, tags: ["高纤维", "时令", "中式"], ingredients: ["小米", "红豆", "燕麦", "鸡蛋", "蔬菜"], recipe: ["小米、红豆、燕麦提前浸泡2小时。", "放入电饭煲煮成粥。", "鸡蛋冷水下锅煮8分钟。", "时蔬焯水后沥干，加少许生抽凉拌。"], ingredientDetails: [{ name: "小米", amount: 20, unit: "g", category: "主食" }, { name: "红豆", amount: 10, unit: "g", category: "主食" }, { name: "燕麦", amount: 10, unit: "g", category: "主食" }, { name: "鸡蛋", amount: 1, unit: "个", category: "肉蛋" }, { name: "时蔬", amount: 150, unit: "g", category: "蔬菜" }], prepTime: 30, complexity: "medium" },
    { name: "豆浆蔬食餐", description: "无糖豆浆1杯 + 菜包1个 + 蒸紫薯", calories: 380, tags: ["低脂", "传统", "植物蛋白"], ingredients: ["大豆", "面粉", "青菜", "紫薯"], recipe: ["黄豆提前泡发打成豆浆（或买成品）。", "紫薯蒸熟即可。", "菜包加热。"], ingredientDetails: [{ name: "豆浆", amount: 1, unit: "杯", category: "主食" }, { name: "菜包", amount: 1, unit: "个", category: "主食" }, { name: "紫薯", amount: 150, unit: "g", category: "主食" }], prepTime: 15, complexity: "easy" },
    { name: "中式暖胃餐", description: "小米粥 + 烫青菜 + 鸡蛋", calories: 400, tags: ["清淡", "养胃"], ingredients: ["小米", "青菜", "鸡蛋"], recipe: ["小米加水煮至粘稠。", "青菜沸水烫熟，滴少许香油。", "搭配水煮蛋。"], ingredientDetails: [{ name: "小米", amount: 40, unit: "g", category: "主食" }, { name: "青菜", amount: 200, unit: "g", category: "蔬菜" }, { name: "鸡蛋", amount: 1, unit: "个", category: "肉蛋" }], prepTime: 25, complexity: "medium" },
    { name: "豆腐脑套餐", description: "咸豆腐脑(少油) + 烧饼半个 + 茶叶蛋", calories: 420, tags: ["地方特色", "高蛋白"], ingredients: ["豆腐", "面粉", "鸡蛋"], recipe: ["内酯豆腐蒸热，浇卤汁。", "搭配少油烧饼和茶叶蛋。"], ingredientDetails: [{ name: "内酯豆腐", amount: 200, unit: "g", category: "肉蛋" }, { name: "烧饼", amount: 0.5, unit: "个", category: "主食" }, { name: "茶叶蛋", amount: 1, unit: "个", category: "肉蛋" }], prepTime: 10, complexity: "easy" },
    
    // 西式/快手
    { name: "全麦主食套餐", description: "全麦面包2片 + 纯牛奶1杯 + 圣女果", calories: 400, tags: ["补钙", "快捷", "西式"], ingredients: ["全麦粉", "牛奶", "番茄"], recipe: ["全麦面包可稍微烘烤。", "牛奶加热或常温饮用。", "圣女果洗净即可。"], ingredientDetails: [{ name: "全麦面包", amount: 2, unit: "片", category: "主食" }, { name: "纯牛奶", amount: 250, unit: "ml", category: "肉蛋" }, { name: "圣女果", amount: 10, unit: "个", category: "水果" }], prepTime: 5, complexity: "easy" },
    { name: "燕麦牛奶餐", description: "牛奶泡燕麦片 + 坚果一小把 + 苹果半个", calories: 420, tags: ["西式", "饱腹", "快捷"], ingredients: ["牛奶", "燕麦", "核桃", "杏仁", "苹果"], recipe: ["热牛奶冲泡即食燕麦片。", "撒上坚果碎。", "搭配切块苹果。"], ingredientDetails: [{ name: "牛奶", amount: 250, unit: "ml", category: "肉蛋" }, { name: "燕麦片", amount: 40, unit: "g", category: "主食" }, { name: "混合坚果", amount: 15, unit: "g", category: "其他" }, { name: "苹果", amount: 0.5, unit: "个", category: "水果" }], prepTime: 5, complexity: "easy" },
    { name: "牛油果吐司", description: "全麦吐司1片 + 牛油果半个 + 煎蛋", calories: 450, tags: ["优质脂肪", "网红"], ingredients: ["全麦粉", "牛油果", "鸡蛋"], recipe: ["牛油果捣泥涂抹吐司。", "煎一个太阳蛋铺在上面。", "撒少许黑胡椒。"], ingredientDetails: [{ name: "全麦吐司", amount: 1, unit: "片", category: "主食" }, { name: "牛油果", amount: 0.5, unit: "个", category: "水果" }, { name: "鸡蛋", amount: 1, unit: "个", category: "肉蛋" }], prepTime: 10, complexity: "medium" },
    { name: "酸奶水果碗", description: "希腊酸奶 + 蓝莓/草莓 + 奇亚籽", calories: 350, tags: ["低卡", "抗氧化"], ingredients: ["酸奶", "蓝莓", "草莓", "奇亚籽"], recipe: ["无糖酸奶倒入碗中。", "铺上水果和奇亚籽。", "可加少量蜂蜜调味。"], ingredientDetails: [{ name: "希腊酸奶", amount: 150, unit: "g", category: "肉蛋" }, { name: "混合浆果", amount: 100, unit: "g", category: "水果" }, { name: "奇亚籽", amount: 10, unit: "g", category: "其他" }], prepTime: 5, complexity: "easy" },

    // 地方特色
    { name: "胡辣汤套餐", description: "胡辣汤(少油) + 菜角 + 凉拌黄瓜", calories: 450, tags: ["地方特色", "重口", "河南"], ingredients: ["牛肉", "面筋", "海带", "粉条", "黄瓜"], recipe: ["牛肉切丁，面筋洗净。", "高汤煮沸加入胡椒粉等调料。", "搭配少油煎制的菜角和拍黄瓜。"], ingredientDetails: [{ name: "牛肉", amount: 50, unit: "g", category: "肉蛋" }, { name: "面筋", amount: 30, unit: "g", category: "主食" }, { name: "黄瓜", amount: 1, unit: "根", category: "蔬菜" }, { name: "菜角", amount: 1, unit: "个", category: "主食" }], prepTime: 40, complexity: "hard" },
    { name: "肠粉套餐", description: "瘦肉肠粉 + 烫生菜", calories: 380, tags: ["粤式", "清淡", "广东"], ingredients: ["大米", "猪肉", "生菜"], recipe: ["米浆蒸制成肠粉。", "加入瘦肉末蒸熟。", "淋上淡酱油，搭配烫生菜。"], ingredientDetails: [{ name: "肠粉专用粉", amount: 50, unit: "g", category: "主食" }, { name: "瘦肉沫", amount: 30, unit: "g", category: "肉蛋" }, { name: "生菜", amount: 150, unit: "g", category: "蔬菜" }], prepTime: 20, complexity: "medium" },
    { name: "热干面(减脂版)", description: "碱水面(少酱) + 酸豆角 + 卤蛋", calories: 500, tags: ["地方特色", "湖北"], ingredients: ["面条", "芝麻酱", "豆角", "鸡蛋"], recipe: ["面条煮熟沥干。", "淋入一勺芝麻酱拌匀。", "加酸豆角和卤蛋。"], ingredientDetails: [{ name: "碱水面", amount: 100, unit: "g", category: "主食" }, { name: "芝麻酱", amount: 15, unit: "g", category: "其他" }, { name: "卤蛋", amount: 1, unit: "个", category: "肉蛋" }], prepTime: 15, complexity: "medium" },
    { name: "煎饼果子(自制)", description: "杂粮面皮 + 鸡蛋 + 生菜(无薄脆)", calories: 400, tags: ["地方特色", "山东"], ingredients: ["杂粮粉", "鸡蛋", "生菜"], recipe: ["绿豆面调糊摊饼。", "打入鸡蛋摊匀。", "卷入大量生菜，刷少许酱。"], ingredientDetails: [{ name: "绿豆面", amount: 50, unit: "g", category: "主食" }, { name: "鸡蛋", amount: 2, unit: "个", category: "肉蛋" }, { name: "生菜", amount: 100, unit: "g", category: "蔬菜" }], prepTime: 20, complexity: "medium" }
  ],
  lunch: [
    // 家常快手
    { name: "虾仁豆腐餐", description: "主食 + 虾仁豆腐 + 炒时蔬", calories: 580, tags: ["易消化", "补钙", "快捷"], ingredients: ["虾", "豆腐", "蔬菜", "大米"], recipe: ["虾仁去线，豆腐切块。", "锅中少油翻炒虾仁，加入豆腐焖煮。", "时蔬清炒。"], ingredientDetails: [{ name: "鲜虾", amount: 150, unit: "g", category: "肉蛋" }, { name: "嫩豆腐", amount: 200, unit: "g", category: "肉蛋" }, { name: "时蔬", amount: 200, unit: "g", category: "蔬菜" }, { name: "大米", amount: 80, unit: "g", category: "主食" }], prepTime: 15, complexity: "easy" },
    { name: "瘦肉炒三丝", description: "主食 + 瘦肉炒三丝(胡萝卜/青椒/肉丝)", calories: 620, tags: ["控糖", "丰富", "快捷"], ingredients: ["猪肉", "胡萝卜", "青椒", "大米"], recipe: ["瘦肉、胡萝卜、青椒切丝。", "热锅凉油，先炒肉丝至变色。", "加入菜丝大火快炒。"], ingredientDetails: [{ name: "瘦猪肉", amount: 100, unit: "g", category: "肉蛋" }, { name: "胡萝卜", amount: 1, unit: "根", category: "蔬菜" }, { name: "青椒", amount: 1, unit: "个", category: "蔬菜" }, { name: "大米", amount: 80, unit: "g", category: "主食" }], prepTime: 15, complexity: "easy" },
    { name: "番茄牛腩饭", description: "番茄炖牛腩 + 杂粮饭 + 西兰花", calories: 650, tags: ["开胃", "高蛋白"], ingredients: ["牛肉", "番茄", "西兰花", "大米"], recipe: ["牛腩冷水焯水。", "炒香番茄块加水炖煮牛腩1.5小时。", "收汁淋在饭上，配焯水西兰花。"], ingredientDetails: [{ name: "牛腩", amount: 150, unit: "g", category: "肉蛋" }, { name: "番茄", amount: 2, unit: "个", category: "蔬菜" }, { name: "西兰花", amount: 150, unit: "g", category: "蔬菜" }, { name: "杂粮米", amount: 80, unit: "g", category: "主食" }], prepTime: 100, complexity: "hard" },
    { name: "香煎巴沙鱼", description: "黑椒煎鱼排 + 玉米粒 + 芦笋", calories: 550, tags: ["低脂", "西式"], ingredients: ["巴沙鱼", "玉米", "芦笋"], recipe: ["鱼排吸干水分撒盐腌制。", "平底锅少油煎至两面金黄。", "配菜焯水。"], ingredientDetails: [{ name: "巴沙鱼柳", amount: 200, unit: "g", category: "肉蛋" }, { name: "甜玉米粒", amount: 100, unit: "g", category: "主食" }, { name: "芦笋", amount: 150, unit: "g", category: "蔬菜" }], prepTime: 15, complexity: "easy" },

    // 经典中式
    { name: "清蒸鱼套餐", description: "主食 + 清蒸鲈鱼 + 蒜蓉时蔬", calories: 600, tags: ["高蛋白", "时令", "粤式"], ingredients: ["鱼肉", "蔬菜", "大米"], recipe: ["鲈鱼处理干净，铺姜葱蒸8-10分钟。", "淋上蒸鱼豉油。", "时蔬加蒜末炒熟。"], ingredientDetails: [{ name: "鲈鱼", amount: 1, unit: "条", category: "肉蛋" }, { name: "时蔬", amount: 200, unit: "g", category: "蔬菜" }, { name: "大米", amount: 80, unit: "g", category: "主食" }], prepTime: 20, complexity: "medium" },
    { name: "宫保鸡丁餐", description: "宫保鸡丁 + 米饭 + 炒凤尾", calories: 700, tags: ["川味", "开胃", "四川"], ingredients: ["鸡肉", "花生", "辣椒", "大米", "莴笋"], recipe: ["鸡胸肉切丁腌制。", "锅中爆香干辣椒花椒，下鸡丁滑炒。", "加入花生米和葱段调味。"], ingredientDetails: [{ name: "鸡胸肉", amount: 150, unit: "g", category: "肉蛋" }, { name: "花生米", amount: 20, unit: "g", category: "其他" }, { name: "莴笋尖", amount: 200, unit: "g", category: "蔬菜" }, { name: "大米", amount: 80, unit: "g", category: "主食" }], prepTime: 25, complexity: "medium" },
    { name: "白切鸡饭", description: "白切鸡 + 油饭(少油) + 炒菜心", calories: 680, tags: ["粤式", "经典", "广东"], ingredients: ["鸡肉", "大米", "菜心"], recipe: ["整鸡浸煮至熟，斩件。", "米饭加少许鸡油蒸熟。", "菜心白灼或蒜蓉炒。"], ingredientDetails: [{ name: "白切鸡", amount: 150, unit: "g", category: "肉蛋" }, { name: "大米", amount: 80, unit: "g", category: "主食" }, { name: "菜心", amount: 200, unit: "g", category: "蔬菜" }], prepTime: 40, complexity: "medium" },
    { name: "回锅肉(瘦肉版)", description: "二刀肉炒蒜苗 + 米饭 + 紫菜汤", calories: 750, tags: ["川味", "下饭", "四川"], ingredients: ["猪肉", "蒜苗", "豆豉", "大米"], recipe: ["五花肉煮至八成熟切片。", "煸炒出油，加豆瓣酱和蒜苗。", "配清淡汤解腻。"], ingredientDetails: [{ name: "五花肉", amount: 100, unit: "g", category: "肉蛋" }, { name: "蒜苗", amount: 100, unit: "g", category: "蔬菜" }, { name: "大米", amount: 80, unit: "g", category: "主食" }], prepTime: 40, complexity: "medium" },
    { name: "小炒黄牛肉", description: "芹菜炒牛肉 + 米饭 + 凉拌木耳", calories: 680, tags: ["湘菜", "香辣", "湖南"], ingredients: ["牛肉", "芹菜", "辣椒", "大米"], recipe: ["牛肉逆纹切片腌制。", "热锅急火快炒变色盛出。", "炒香配料回锅牛肉。"], ingredientDetails: [{ name: "牛里脊", amount: 150, unit: "g", category: "肉蛋" }, { name: "芹菜", amount: 150, unit: "g", category: "蔬菜" }, { name: "大米", amount: 80, unit: "g", category: "主食" }], prepTime: 20, complexity: "medium" },
    { name: "红烧狮子头", description: "狮子头1个 + 秧草 + 米饭", calories: 720, tags: ["苏帮菜", "经典", "江苏"], ingredients: ["猪肉", "马蹄", "青菜", "大米"], recipe: ["肥瘦猪肉切粒拌摔上劲。", "炸定型后小火炖煮2小时。", "配焯水青菜。"], ingredientDetails: [{ name: "五花肉", amount: 100, unit: "g", category: "肉蛋" }, { name: "马蹄", amount: 50, unit: "g", category: "蔬菜" }, { name: "青菜", amount: 100, unit: "g", category: "蔬菜" }, { name: "大米", amount: 80, unit: "g", category: "主食" }], prepTime: 120, complexity: "hard" },

    // 备餐友好
    { name: "去皮鸡腿餐", description: "二米饭 + 卤鸡腿(去皮) + 凉拌木耳", calories: 650, tags: ["家常", "低卡", "可备餐"], ingredients: ["鸡肉", "大米", "糙米", "木耳"], recipe: ["鸡腿焯水后加香料卤煮（可一次卤多只），吃时去皮。", "大米掺入糙米蒸饭。", "木耳泡发焯水凉拌。"], ingredientDetails: [{ name: "鸡全腿", amount: 1, unit: "个", category: "肉蛋" }, { name: "大米", amount: 50, unit: "g", category: "主食" }, { name: "糙米", amount: 30, unit: "g", category: "主食" }, { name: "干木耳", amount: 10, unit: "g", category: "蔬菜" }], prepTime: 40, complexity: "medium" },
    { name: "咖喱鸡肉饭", description: "土豆胡萝卜咖喱鸡 + 糙米饭", calories: 700, tags: ["一锅出", "可备餐"], ingredients: ["鸡肉", "土豆", "胡萝卜", "咖喱块"], recipe: ["食材切块。", "炒香洋葱和鸡肉，加水煮蔬菜。", "关火加咖喱块搅拌至浓稠。"], ingredientDetails: [{ name: "鸡腿肉", amount: 100, unit: "g", category: "肉蛋" }, { name: "土豆", amount: 1, unit: "个", category: "蔬菜" }, { name: "胡萝卜", amount: 0.5, unit: "根", category: "蔬菜" }, { name: "大米", amount: 80, unit: "g", category: "主食" }], prepTime: 30, complexity: "easy" },
    { name: "牛肉套餐", description: "土豆炖牛腩(少油) + 杂粮饭 + 蔬菜沙拉", calories: 700, tags: ["补铁", "能量", "费时"], ingredients: ["牛肉", "土豆", "大米", "蔬菜"], recipe: ["牛腩切块焯水，加土豆块炖煮1小时。", "杂粮饭蒸熟。", "蔬菜洗净淋低脂酱汁。"], ingredientDetails: [{ name: "牛腩", amount: 150, unit: "g", category: "肉蛋" }, { name: "土豆", amount: 1, unit: "个", category: "蔬菜" }, { name: "杂粮米", amount: 80, unit: "g", category: "主食" }, { name: "生菜", amount: 100, unit: "g", category: "蔬菜" }], prepTime: 90, complexity: "hard" },
    
    // 面食类
    { name: "烩面套餐", description: "羊肉烩面(小碗) + 凉拌豆腐皮", calories: 650, tags: ["地方特色", "面食", "河南"], ingredients: ["面粉", "羊肉", "豆腐皮", "香菜"], recipe: ["羊肉炖汤。", "面坯拉成宽条下锅。", "加入豆腐皮丝、海带丝，撒香菜。"], ingredientDetails: [{ name: "烩面坯", amount: 150, unit: "g", category: "主食" }, { name: "羊肉", amount: 50, unit: "g", category: "肉蛋" }, { name: "豆腐皮", amount: 50, unit: "g", category: "肉蛋" }, { name: "青菜", amount: 50, unit: "g", category: "蔬菜" }], prepTime: 45, complexity: "hard" },
    { name: "打卤面", description: "木耳黄花菜打卤面 + 拍黄瓜", calories: 600, tags: ["面食", "北方"], ingredients: ["面条", "木耳", "黄花菜", "鸡蛋"], recipe: ["木耳黄花菜煮汤，淋入蛋液勾芡。", "手擀面煮熟捞出。", "浇上卤汁。"], ingredientDetails: [{ name: "手擀面", amount: 150, unit: "g", category: "主食" }, { name: "鸡蛋", amount: 1, unit: "个", category: "肉蛋" }, { name: "干木耳", amount: 10, unit: "g", category: "蔬菜" }], prepTime: 30, complexity: "medium" }
  ],
  dinner: [
    // 轻食减脂
    { name: "白灼虾简餐", description: "玉米段1个 + 白灼虾8只 + 耗油生菜", calories: 450, tags: ["轻食", "低脂", "快捷"], ingredients: ["虾", "玉米", "生菜"], recipe: ["鲜虾沸水煮2分钟捞出。", "玉米蒸熟。", "生菜焯水淋少许蚝油。"], ingredientDetails: [{ name: "鲜虾", amount: 200, unit: "g", category: "肉蛋" }, { name: "甜玉米", amount: 1, unit: "根", category: "主食" }, { name: "生菜", amount: 200, unit: "g", category: "蔬菜" }], prepTime: 10, complexity: "easy" },
    { name: "鸡胸肉沙拉", description: "煎鸡胸肉 + 混合时蔬 + 蒸南瓜", calories: 400, tags: ["减脂", "高纤", "快捷"], ingredients: ["鸡肉", "蔬菜", "南瓜"], recipe: ["鸡胸肉撒黑胡椒煎熟。", "时蔬切块作为底。", "南瓜蒸熟切块。"], ingredientDetails: [{ name: "鸡胸肉", amount: 150, unit: "g", category: "肉蛋" }, { name: "混合时蔬", amount: 200, unit: "g", category: "蔬菜" }, { name: "南瓜", amount: 150, unit: "g", category: "主食" }], prepTime: 15, complexity: "easy" },
    { name: "魔芋丝拌菜", description: "魔芋丝 + 鸡丝 + 黄瓜丝 + 荞麦面", calories: 350, tags: ["超低卡", "饱腹"], ingredients: ["魔芋", "鸡肉", "黄瓜", "荞麦面"], recipe: ["魔芋丝、荞麦面煮熟过凉水。", "鸡胸肉煮熟撕丝。", "加低脂油醋汁拌匀。"], ingredientDetails: [{ name: "魔芋丝", amount: 100, unit: "g", category: "蔬菜" }, { name: "鸡胸肉", amount: 100, unit: "g", category: "肉蛋" }, { name: "荞麦面", amount: 30, unit: "g", category: "主食" }], prepTime: 20, complexity: "easy" },
    
    // 家常晚餐
    { name: "冬瓜肉丸汤", description: "花卷1个 + 冬瓜瘦肉丸汤 + 凉拌黄瓜", calories: 480, tags: ["清淡", "利尿"], ingredients: ["猪肉", "冬瓜", "黄瓜", "面粉"], recipe: ["瘦肉剁泥调味搓成丸子。", "水开下丸子和冬瓜片煮熟。", "黄瓜拍碎凉拌。"], ingredientDetails: [{ name: "瘦猪肉", amount: 100, unit: "g", category: "肉蛋" }, { name: "冬瓜", amount: 200, unit: "g", category: "蔬菜" }, { name: "花卷", amount: 1, unit: "个", category: "主食" }, { name: "黄瓜", amount: 1, unit: "根", category: "蔬菜" }], prepTime: 30, complexity: "medium" },
    { name: "番茄炒蛋餐", description: "糙米饭半碗 + 番茄炒蛋 + 菌菇汤", calories: 500, tags: ["经典", "维生素", "快捷"], ingredients: ["鸡蛋", "番茄", "蘑菇", "糙米"], recipe: ["鸡蛋炒熟盛出，番茄炒出汁。", "混合翻炒加少许盐。", "菌菇加水煮汤。"], ingredientDetails: [{ name: "鸡蛋", amount: 2, unit: "个", category: "肉蛋" }, { name: "大番茄", amount: 2, unit: "个", category: "蔬菜" }, { name: "菌菇", amount: 100, unit: "g", category: "蔬菜" }, { name: "糙米", amount: 50, unit: "g", category: "主食" }], prepTime: 15, complexity: "easy" },
    { name: "豆腐鱼汤餐", description: "鲫鱼豆腐汤 + 馒头半个 + 炒时蔬", calories: 460, tags: ["滋补", "易吸收"], ingredients: ["鱼肉", "豆腐", "面粉", "蔬菜"], recipe: ["鲫鱼煎至两面金黄，加开水炖白。", "加入豆腐块煮10分钟。", "时蔬清炒。"], ingredientDetails: [{ name: "鲫鱼", amount: 1, unit: "条", category: "肉蛋" }, { name: "豆腐", amount: 100, unit: "g", category: "肉蛋" }, { name: "馒头", amount: 0.5, unit: "个", category: "主食" }, { name: "时蔬", amount: 200, unit: "g", category: "蔬菜" }], prepTime: 30, complexity: "medium" },
    { name: "蒜泥白肉(减油)", description: "瘦肉片 + 黄瓜片 + 杂粮粥", calories: 550, tags: ["川味", "经典"], ingredients: ["猪肉", "黄瓜", "大蒜"], recipe: ["带皮后腿肉煮熟切薄片。", "卷上黄瓜片摆盘。", "淋入蒜泥酱汁（少红油）。"], ingredientDetails: [{ name: "后腿肉", amount: 100, unit: "g", category: "肉蛋" }, { name: "黄瓜", amount: 1, unit: "根", category: "蔬菜" }, { name: "杂粮粥", amount: 1, unit: "碗", category: "主食" }], prepTime: 40, complexity: "medium" },
    
    // 地方特色
    { name: "鲤鱼焙面", description: "红烧鲤鱼(去糖醋) + 焙面少许 + 青菜", calories: 550, tags: ["地方特色", "河南"], ingredients: ["鲤鱼", "面粉", "青菜"], recipe: ["鲤鱼红烧（少糖）。", "细面条油炸至酥脆，盖在鱼身上。", "烫青菜佐餐。"], ingredientDetails: [{ name: "鲤鱼", amount: 1, unit: "条", category: "肉蛋" }, { name: "龙须面", amount: 50, unit: "g", category: "主食" }, { name: "青菜", amount: 200, unit: "g", category: "蔬菜" }], prepTime: 50, complexity: "hard" },
    { name: "上汤娃娃菜", description: "皮蛋瘦肉烩娃娃菜 + 馒头", calories: 420, tags: ["粤式", "清淡"], ingredients: ["娃娃菜", "皮蛋", "瘦肉", "面粉"], recipe: ["皮蛋切丁，瘦肉切丝。", "高汤煮沸下配料。", "放入娃娃菜煮软。"], ingredientDetails: [{ name: "娃娃菜", amount: 200, unit: "g", category: "蔬菜" }, { name: "皮蛋", amount: 0.5, unit: "个", category: "肉蛋" }, { name: "馒头", amount: 1, unit: "个", category: "主食" }], prepTime: 15, complexity: "easy" },
    { name: "西红柿鸡蛋面", description: "西红柿鸡蛋卤 + 手擀面 + 青菜", calories: 500, tags: ["家常", "北方"], ingredients: ["面条", "番茄", "鸡蛋"], recipe: ["炒鸡蛋盛出，炒番茄出汁混合。", "面条煮熟。", "浇卤汁，配烫青菜。"], ingredientDetails: [{ name: "手擀面", amount: 100, unit: "g", category: "主食" }, { name: "番茄", amount: 2, unit: "个", category: "蔬菜" }, { name: "鸡蛋", amount: 1, unit: "个", category: "肉蛋" }], prepTime: 15, complexity: "easy" }
  ],
  snacks: [
    { name: "原味坚果", description: "核桃/杏仁/腰果 (10g)", calories: 60, tags: ["好脂肪"], ingredients: ["核桃", "杏仁", "腰果"], recipe: ["直接食用。"], ingredientDetails: [{ name: "混合坚果", amount: 10, unit: "g", category: "其他" }], prepTime: 0, complexity: "easy" as const },
    { name: "低脂酸奶", description: "无糖/低脂酸奶1杯", calories: 80, tags: ["益生菌"], ingredients: ["牛奶"], recipe: ["开盖即食。"], ingredientDetails: [{ name: "无糖酸奶", amount: 1, unit: "杯", category: "肉蛋" }], prepTime: 0, complexity: "easy" as const },
    { name: "时令水果", description: "时令水果 (200g)", calories: 90, tags: ["维生素"], ingredients: ["水果"], recipe: ["洗净切块。"], ingredientDetails: [{ name: "时令水果", amount: 200, unit: "g", category: "水果" }], prepTime: 5, complexity: "easy" as const },
    { name: "全麦饼干", description: "无糖全麦饼干 2片", calories: 70, tags: ["饱腹"], ingredients: ["全麦粉"], recipe: ["直接食用。"], ingredientDetails: [{ name: "全麦饼干", amount: 20, unit: "g", category: "主食" }], prepTime: 0, complexity: "easy" as const },
    { name: "煮玉米", description: "甜玉米段 1个", calories: 100, tags: ["粗粮"], ingredients: ["玉米"], recipe: ["水煮10分钟。"], ingredientDetails: [{ name: "玉米", amount: 150, unit: "g", category: "主食" }], prepTime: 10, complexity: "easy" as const },
    { name: "小番茄", description: "圣女果 15个", calories: 40, tags: ["低卡"], ingredients: ["番茄"], recipe: ["洗净即食。"], ingredientDetails: [{ name: "圣女果", amount: 150, unit: "g", category: "水果" }], prepTime: 0, complexity: "easy" as const }
  ]
};

// 过滤逻辑
function filterMeals(meals: any[], allergies: string[], dislikes: string): any[] {
  return meals.filter(meal => {
    const hasAllergen = allergies.some(allergen => {
      const allergenKeywords = allergen === "海鲜" ? ["虾", "鱼", "蟹", "贝", "鱿鱼"] :
                               allergen === "坚果" ? ["核桃", "杏仁", "腰果", "花生", "芝麻"] :
                               [allergen];
      return meal.ingredients?.some((ing: string) => allergenKeywords.some(k => ing.includes(k))) || 
             allergenKeywords.some(k => meal.name.includes(k) || meal.description.includes(k));
    });
    if (hasAllergen) return false;

    if (dislikes) {
      const dislikeKeywords = dislikes.split(/[,，\s]+/).filter(k => k.length > 0);
      const hasDislike = dislikeKeywords.some(k => 
        meal.ingredients?.some((ing: string) => ing.includes(k)) || 
        meal.name.includes(k) || 
        meal.description.includes(k)
      );
      if (hasDislike) return false;
    }
    return true;
  });
}

// 购物清单
function generateShoppingList(dailyPlans: DailyPlan[]): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  dailyPlans.forEach(day => {
    const meals = [...day.breakfast, ...day.lunch, ...day.dinner, ...(day.snacks || [])];
    meals.forEach(meal => {
      if (meal.ingredientDetails) {
        meal.ingredientDetails.forEach(ing => {
          // Normalize names
          let name = ing.name;
          if (name === "牛奶") name = "纯牛奶";
          
          const key = `${name}_${ing.unit}`;
          if (map.has(key)) {
            map.get(key)!.amount += ing.amount;
          } else {
            map.set(key, { ...ing, name, category: ing.category || "其他" });
          }
        });
      }
    });
  });
  return Array.from(map.values()).sort((a, b) => {
    const order = ["蔬菜", "肉蛋", "水果", "主食", "其他"];
    return order.indexOf(a.category) - order.indexOf(b.category);
  });
}

// 多样性统计
function countDiversity(meals: MealItem[]): Set<string> {
  const set = new Set<string>();
  meals.forEach(meal => {
    meal.ingredients?.forEach(i => set.add(i));
  });
  return set;
}

export function processMeal(base: any, index: number, currentSeason: any, stapleDesc: string): MealItem {
  let desc = base.description;
  let details = base.ingredientDetails ? [...base.ingredientDetails] : [];
  let recipe = base.recipe ? [...base.recipe] : [];
  
  if (desc.includes("时蔬") || desc.includes("蔬菜")) {
    const veggie = currentSeason.veggies[index % currentSeason.veggies.length];
    desc = desc.replace(/时蔬|蔬菜|凉拌菜/g, veggie);
    recipe = recipe.map((step: string) => step.replace(/时蔬|蔬菜/g, veggie));
    details = details.map((ing: IngredientDetail) => ({
      ...ing,
      name: (ing.name === "时蔬" || ing.name === "蔬菜" || ing.name === "混合时蔬") ? veggie : ing.name
    }));
  }
  if (desc.includes("主食")) desc = desc.replace("主食", stapleDesc);
  
  return { ...base, description: desc, recipe, ingredientDetails: details };
}

// 核心生成逻辑
export function generateWeeklyPlan(profile: UserProfile): WeeklyPlan {
  const { bmi, status } = calculateBMI(profile.height, profile.weight);
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const targetCalories = calculateTargetCalories(tdee, profile.goal);
  
  const seasonKey = getSeason();
  const currentSeason = SEASONS[seasonKey];
  const regionInfo = getRegion(profile.city);
  
  // 1. 基础过滤
  let safeBreakfasts = filterMeals(BASE_MEAL_DB.breakfast, profile.allergies, profile.dislikes || "");
  let safeLunches = filterMeals(BASE_MEAL_DB.lunch, profile.allergies, profile.dislikes || "");
  let safeDinners = filterMeals(BASE_MEAL_DB.dinner, profile.allergies, profile.dislikes || "");
  let safeSnacks = filterMeals(BASE_MEAL_DB.snacks, profile.allergies, profile.dislikes || "");

  // 1.5 区域偏好加权 (如果有特定区域，优先把特色菜排前面)
  if (regionInfo.type === 'specific') {
    const province = regionInfo.data.name;
    const sortByLocal = (a: any, b: any) => {
      const aIsLocal = a.tags?.includes(province) ? 1 : 0;
      const bIsLocal = b.tags?.includes(province) ? 1 : 0;
      return bIsLocal - aIsLocal;
    };
    safeBreakfasts.sort(sortByLocal);
    safeLunches.sort(sortByLocal);
    safeDinners.sort(sortByLocal);
  }

  // 2. 时间偏好过滤 & 排序
  if (profile.cookingTime === "limited") {
    const sortByTime = (a: any, b: any) => a.prepTime - b.prepTime;
    
    // 强制筛选简单食谱
    const easyBreakfasts = safeBreakfasts.filter((m: any) => m.complexity === "easy");
    if (easyBreakfasts.length >= 2) safeBreakfasts = easyBreakfasts.sort(sortByTime);
    
    const easyLunches = safeLunches.filter((m: any) => m.complexity === "easy" || m.tags.includes("可备餐"));
    if (easyLunches.length >= 4) safeLunches = easyLunches.sort(sortByTime);
    
    const easyDinners = safeDinners.filter((m: any) => m.prepTime <= 20);
    if (easyDinners.length >= 4) safeDinners = easyDinners.sort(sortByTime);
  } else {
    // 时间充裕，随机打乱以增加多样性
    safeBreakfasts.sort(() => Math.random() - 0.5);
    safeLunches.sort(() => Math.random() - 0.5);
    safeDinners.sort(() => Math.random() - 0.5);
  }

  // 3. 生成每日计划 (支持重复逻辑) - 使用 第1天 - 第7天
  const days = ["第1天", "第2天", "第3天", "第4天", "第5天", "第6天", "第7天"];
  const stapleDesc = (regionInfo.type === 'north' || (regionInfo.type === 'specific' && regionInfo.data.staple.includes('面'))) 
                     ? "杂粮馒头/全麦面" : "杂粮饭/糙米饭";

  const dailyPlans: DailyPlan[] = days.map((day, index) => {
    let breakfastBase, lunchBase, dinnerBase;

    // 智能选择算法
    if (profile.cookingTime === "limited") {
      // 循环利用：3种早餐，4种午餐，4种晚餐
      breakfastBase = safeBreakfasts[index % Math.min(3, safeBreakfasts.length)];
      lunchBase = safeLunches[index % Math.min(4, safeLunches.length)]; 
      dinnerBase = safeDinners[index % Math.min(4, safeDinners.length)];
    } else {
      // 尽可能不重复
      breakfastBase = safeBreakfasts[index % safeBreakfasts.length];
      lunchBase = safeLunches[index % safeLunches.length];
      dinnerBase = safeDinners[index % safeDinners.length];
    }

    const breakfast = processMeal(breakfastBase, index, currentSeason, stapleDesc);
    const lunch = processMeal(lunchBase, index, currentSeason, stapleDesc);
    const dinner = processMeal(dinnerBase, index, currentSeason, stapleDesc);
    const snacks = targetCalories > 1800 && safeSnacks.length > 0 ? [safeSnacks[index % safeSnacks.length]] : [];

    const dailyMeals = [breakfast, lunch, dinner, ...snacks];
    const diversityCount = countDiversity(dailyMeals).size;

    return {
      day,
      breakfast: [breakfast],
      lunch: [lunch],
      dinner: [dinner],
      snacks,
      totalCalories: breakfastBase.calories + lunchBase.calories + dinnerBase.calories + (snacks.length ? snacks[0].calories : 0),
      tips: getDailyTip(index, status, profile.cookingTime),
      diversityCount
    };
  });

  const allMeals = dailyPlans.flatMap(d => [...d.breakfast, ...d.lunch, ...d.dinner, ...(d.snacks || [])]);
  const weeklyDiversityCount = countDiversity(allMeals).size;

  const shoppingList = generateShoppingList(dailyPlans);
  
  let localTips = "";
  if (regionInfo.type === 'specific') {
    localTips = `针对${regionInfo.data.name}地区(${profile.city})，推荐尝试当地特色食材如${regionInfo.data.local.join('、')}。`;
  }

  // Return full pools processed for the season/region for swapping
  const mealPools: MealPools = {
    breakfast: safeBreakfasts.map((m: any, i: number) => processMeal(m, i, currentSeason, stapleDesc)),
    lunch: safeLunches.map((m: any, i: number) => processMeal(m, i, currentSeason, stapleDesc)),
    dinner: safeDinners.map((m: any, i: number) => processMeal(m, i, currentSeason, stapleDesc)),
    snacks: safeSnacks.map((m: any, i: number) => processMeal(m, i, currentSeason, stapleDesc)),
  };

  return {
    userProfile: profile,
    bmi,
    bmiStatus: status,
    dailyCalorieTarget: targetCalories,
    dailyPlans,
    shoppingList,
    nutritionSummary: { protein: "15%-20%", fat: "20%-30%", carbs: "50%-65%" },
    disclaimer: "本计划仅供参考。系统已根据您的过敏与忌口信息进行了初步筛选。AI 增强版数据库为您提供了多样化的选择。",
    sources: [{ title: "中国居民膳食指南 (2022)", url: "http://dg.cnsoc.org/" }],
    seasonalAdvice: {
      season: currentSeason.name,
      localVeggies: currentSeason.veggies,
      tips: `当前是${currentSeason.name}，建议多食用当季蔬菜如${currentSeason.veggies.join("、")}。${localTips}`
    },
    weeklyDiversityCount,
    mealPools
  };
}

function getDailyTip(dayIndex: number, bmiStatus: string, cookingTime: string): string {
  const baseTips = [
    "每天摄入12种以上食物，每周25种以上。",
    "每天喝水1500-1700ml，提倡喝白开水。",
    "吃动平衡，健康体重，每天活动6000步。",
    "少盐少油，控糖限酒，清淡饮食。",
    "多吃蔬果、奶类、全谷、大豆。",
    "早餐要吃好，午餐要吃饱，晚餐要吃少。",
    "适量吃鱼、禽、蛋、瘦肉。"
  ];

  const timeTips = [
    "时间紧张时，可一次备好两餐的量（如卤肉、炖菜）。",
    "利用周末提前清洗切配蔬菜，密封冷藏。",
    "善用电饭煲预约功能，早起就能喝粥。",
    "冷冻蔬菜和半成品（如免洗沙拉菜）也是好选择。"
  ];

  if (cookingTime === "limited") {
    return dayIndex % 2 === 0 ? baseTips[dayIndex % baseTips.length] : timeTips[dayIndex % timeTips.length];
  }
  
  return baseTips[dayIndex % baseTips.length];
}
