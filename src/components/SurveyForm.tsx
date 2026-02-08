import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserProfile } from "@/lib/types";
import { motion } from "framer-motion";
import { Clock, Timer } from "lucide-react";

// Zod Schema for manual validation
const formSchema = z.object({
  age: z.coerce.number().min(10, "年龄必须在10-100岁之间").max(100),
  gender: z.enum(["male", "female"]),
  height: z.coerce.number().min(100, "身高必须在100-250cm之间").max(250),
  weight: z.coerce.number().min(30, "体重必须在30-200kg之间").max(200),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal: z.enum(["lose", "maintain", "gain"]),
  city: z.string().min(2, "请输入有效的城市名称"),
  cookingTime: z.enum(["abundant", "limited"]),
  allergies: z.array(z.string()).default([]),
  dislikes: z.string().optional(),
});

interface SurveyFormProps {
  onSubmit: (data: UserProfile) => void;
}

const ALLERGY_OPTIONS = [
  { id: "seafood", label: "海鲜 (虾/蟹/贝类)" },
  { id: "peanut", label: "花生/坚果" },
  { id: "egg", label: "鸡蛋" },
  { id: "milk", label: "牛奶/乳制品" },
  { id: "gluten", label: "麸质 (面食)" },
];

export function SurveyForm({ onSubmit }: SurveyFormProps) {
  const formConfig: any = {
    defaultValues: {
      age: 30,
      gender: "male",
      height: 170,
      weight: 65,
      activityLevel: "light",
      goal: "maintain",
      city: "",
      cookingTime: "limited", // Default to limited time as it's a common need
      allergies: [],
      dislikes: "",
    },
  };
  
  const form = useForm(formConfig);

  const onSubmitHandler = (values: any) => {
    // Manual validation
    const result = formSchema.safeParse(values);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path) {
          form.setError(path as any, {
            type: "manual",
            message: issue.message,
          });
        }
      });
      return;
    }

    const validData = result.data;
    const mappedAllergies = (validData.allergies || []).map((id: string) => {
      if (id === 'seafood') return '海鲜';
      if (id === 'peanut') return '坚果';
      if (id === 'egg') return '鸡蛋';
      if (id === 'milk') return '牛奶';
      if (id === 'gluten') return '面粉'; 
      return id;
    });
    
    onSubmit({
      ...validData,
      allergies: mappedAllergies,
      dislikes: validData.dislikes || ""
    } as UserProfile);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm p-5 sm:p-8 rounded-xl shadow-lg border border-border"
    >
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">定制您的专属饮食方案</h2>
        <p className="text-muted-foreground text-sm">
          只需1分钟，结合地域、时令与个人偏好，为您生成科学食谱
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-8">
          
          {/* 基础信息 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">1. 基础信息</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>年龄 (岁)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="例如: 30" {...field} value={field.value} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>性别</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4 h-10 items-center">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <label htmlFor="male" className="cursor-pointer">男</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <label htmlFor="female" className="cursor-pointer">女</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>身高 (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="例如: 175" {...field} value={field.value} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>体重 (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="例如: 70" {...field} value={field.value} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 地域与目标 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">2. 地域与生活方式</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所在城市 (推荐本地时令食材)</FormLabel>
                    <FormControl>
                      <Input placeholder="例如: 洛阳、广州、成都" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>日常活动水平</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="选择活动强度" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sedentary">久坐不动 (办公室工作)</SelectItem>
                        <SelectItem value="light">轻度活动 (每周1-3次运动)</SelectItem>
                        <SelectItem value="moderate">中度活动 (每周3-5次运动)</SelectItem>
                        <SelectItem value="active">活跃 (每周6-7次运动)</SelectItem>
                        <SelectItem value="very_active">极度活跃 (体力工作)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 新增：做饭时间偏好 */}
            <FormField
              control={form.control}
              name="cookingTime"
              render={({ field }) => (
                <FormItem className="bg-muted/30 p-4 rounded-lg border border-border/50">
                  <FormLabel className="mb-2 block font-semibold text-primary">做饭可支配时间</FormLabel>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                    <div>
                      <RadioGroupItem value="limited" id="limited" className="peer sr-only" />
                      <label htmlFor="limited" className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-white dark:bg-card p-4 hover:bg-accent cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary">
                        <Timer className="w-6 h-6 mb-2 text-orange-500" />
                        <span className="font-semibold">时间紧张</span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">快捷简单，适合上班族</span>
                      </label>
                    </div>
                    <div>
                      <RadioGroupItem value="abundant" id="abundant" className="peer sr-only" />
                      <label htmlFor="abundant" className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-white dark:bg-card p-4 hover:bg-accent cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary">
                        <Clock className="w-6 h-6 mb-2 text-green-500" />
                        <span className="font-semibold">时间充裕</span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">精致多样，享受烹饪乐趣</span>
                      </label>
                    </div>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>您的目标</FormLabel>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-4">
                    {["lose", "maintain", "gain"].map((val) => (
                      <div key={val}>
                        <RadioGroupItem value={val} id={val} className="peer sr-only" />
                        <label htmlFor={val} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all">
                          <span className="font-semibold">{val === "lose" ? "减重" : val === "maintain" ? "维持" : "增重"}</span>
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 饮食偏好 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">3. 饮食禁忌</h3>
            <FormField
              control={form.control}
              name="allergies"
              render={() => (
                <FormItem>
                  <div className="mb-4"><FormLabel className="text-base">食物过敏</FormLabel></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {ALLERGY_OPTIONS.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="allergies"
                        render={({ field }) => (
                          <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  return checked ? field.onChange([...currentValues, item.id]) : field.onChange(currentValues.filter((value: any) => value !== item.id))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">{item.label}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dislikes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>其他忌口 (选填)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="请输入您不喜欢或不能吃的食物，用逗号分隔。例如：香菜，羊肉，辣椒" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" size="lg" className="w-full text-lg mt-6 bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-600/90 shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
            生成我的专属饮食计划
          </Button>
        </form>
      </Form>
    </motion.div>
  );
}
