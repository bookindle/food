import { useState, useRef } from "react";
import type { WeeklyPlan, DailyPlan, MealItem, ShoppingItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { Printer, Calendar, MapPin, AlertTriangle, ShieldCheck, ShoppingCart, BookOpen, Utensils, Info, Clock, CheckCircle2, RefreshCw, Share2, FileDown, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import pagodaImg from "@/assets/pagoda.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface ResultSectionProps {
  plan: WeeklyPlan;
  onReset: () => void;
}

export function ResultSection({ plan: initialPlan, onReset }: ResultSectionProps) {
  const [plan, setPlan] = useState<WeeklyPlan>(initialPlan);
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const getBmiColor = (status: string) => {
    switch (status) {
      case "underweight": return "text-blue-500";
      case "normal": return "text-green-500";
      case "overweight": return "text-yellow-500";
      case "obese": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getBmiLabel = (status: string) => {
    switch (status) {
      case "underweight": return "偏瘦";
      case "normal": return "正常";
      case "overweight": return "超重";
      case "obese": return "肥胖";
      default: return "未知";
    }
  };

  const handleSwap = (dayIndex: number) => {
    const newPlan = { ...plan };
    const currentDay = newPlan.dailyPlans[dayIndex];
    
    const getRandom = (pool: MealItem[], current: MealItem) => {
      if (pool.length <= 1) return current;
      let next;
      do {
        next = pool[Math.floor(Math.random() * pool.length)];
      } while (next.name === current.name);
      return next;
    };

    newPlan.dailyPlans[dayIndex] = {
      ...currentDay,
      breakfast: [getRandom(plan.mealPools.breakfast, currentDay.breakfast[0])],
      lunch: [getRandom(plan.mealPools.lunch, currentDay.lunch[0])],
      dinner: [getRandom(plan.mealPools.dinner, currentDay.dinner[0])],
    };

    setPlan(newPlan);
    toast.success(`已更新 ${currentDay.day} 的食谱`);
  };

  const handleCopyLink = async () => {
    try {
      const jsonStr = JSON.stringify(plan.userProfile);
      const base64Str = btoa(jsonStr);
      const url = `${window.location.origin}${window.location.pathname}?plan=${base64Str}`;
      
      await navigator.clipboard.writeText(url);
      toast.success("分享链接已复制到剪贴板！");
    } catch (err) {
      console.error("Failed to copy link", err);
      toast.error("复制链接失败");
    }
  };

  const prepareForCapture = (element: HTMLElement) => {
    // Store original styles
    const originalBackground = element.style.background;
    const originalBoxShadow = element.style.boxShadow;
    const originalBorderRadius = element.style.borderRadius;
    const originalPadding = element.style.padding;

    // Apply capture-friendly styles: Opaque white, no shadow, clean look
    element.style.background = "#ffffff";
    element.style.boxShadow = "none";
    element.style.borderRadius = "0"; // Flatten corners for PDF/Image potentially
    // Ensure padding is sufficient
    if (!element.style.padding) {
       // Keep existing class padding mostly, but ensure background covers it
    }

    return () => {
      // Restore
      element.style.background = originalBackground;
      element.style.boxShadow = originalBoxShadow;
      element.style.borderRadius = originalBorderRadius;
      element.style.padding = originalPadding;
    };
  };

  const handleExportImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading("正在生成长图，请稍候...");
    
    try {
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 500)); 
      
      const canvas = await html2canvas(exportRef.current, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        windowWidth: 1000,
      });
      
      const link = document.createElement('a');
      link.download = `diet-plan-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("图片导出成功！", { id: toastId });
    } catch (err: any) {
      console.error("Export failed", err);
      toast.error(`导出失败: ${err.message || "未知错误"}`, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading("正在生成PDF，请稍候...");
    
    try {
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 500)); 

      const canvas = await html2canvas(exportRef.current, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        windowWidth: 1000,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`diet-plan-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF导出成功！", { id: toastId });
    } catch (err: any) {
      console.error("Export failed", err);
      toast.error(`导出失败: ${err.message || "未知错误"}`, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-6xl mx-auto pb-12"
    >
      <div ref={captureRef} className="space-y-8 bg-white/50 p-4 sm:p-8 rounded-xl backdrop-blur-sm transition-colors duration-200">
        {/* 结果概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-none shadow-md bg-gradient-to-br from-green-50/50 to-orange-50/50 dark:from-green-950/20 dark:to-orange-950/20">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <span>您的健康概览</span>
                <Badge variant="outline" className={`${getBmiColor(plan.bmiStatus)} border-current`}>
                  BMI: {plan.bmi} ({getBmiLabel(plan.bmiStatus)})
                </Badge>
              </CardTitle>
              <CardDescription>
                基于您的身体数据计算得出的营养目标
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                {plan.seasonalAdvice && (
                  <div className="flex flex-col sm:flex-row gap-4 border-b border-primary/10 pb-4 mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0"><Calendar className="w-5 h-5" /></div>
                      <div>
                        <h4 className="font-semibold text-primary mb-1">当季饮食 ({plan.seasonalAdvice.season})</h4>
                        <p className="text-sm text-muted-foreground">{plan.seasonalAdvice.tips}</p>
                      </div>
                    </div>
                    {plan.userProfile.city && (
                      <div className="flex items-start gap-3 flex-1 sm:border-l sm:pl-4 border-primary/10">
                        <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0"><MapPin className="w-5 h-5" /></div>
                        <div>
                          <h4 className="font-semibold text-primary mb-1">本地化 ({plan.userProfile.city})</h4>
                          <p className="text-sm text-muted-foreground">推荐本地蔬菜: {plan.seasonalAdvice.localVeggies.join("、")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full shrink-0 ${plan.weeklyDiversityCount >= 25 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100">本周食物多样性</h4>
                      <span className={`text-sm font-bold ${plan.weeklyDiversityCount >= 25 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {plan.weeklyDiversityCount} / 25 种
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div className={`h-2 rounded-full ${plan.weeklyDiversityCount >= 25 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(100, (plan.weeklyDiversityCount/25)*100)}%` }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">根据《中国居民膳食指南(2022)》，建议每周摄入至少25种食物。</p>
                  </div>
                </div>
                
                {(plan.userProfile.allergies?.length > 0 || plan.userProfile.dislikes) && (
                  <div className="flex items-start gap-3 pt-2 border-t border-primary/10 mt-2">
                    <div className="p-2 bg-orange-100 rounded-full text-orange-600 shrink-0"><ShieldCheck className="w-5 h-5" /></div>
                    <div>
                      <h4 className="font-semibold text-orange-700 mb-1 flex items-center gap-2">已启用饮食过滤保护</h4>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {plan.userProfile.allergies?.length > 0 && <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-500" /> 已排除过敏: <span className="font-medium text-orange-600">{plan.userProfile.allergies.join("、")}</span></span>}
                        {plan.userProfile.dislikes && <span className="flex items-center gap-1 before:content-['|'] before:mx-2 before:text-gray-300">已过滤忌口: <span className="font-medium text-gray-700">{plan.userProfile.dislikes}</span></span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">每日推荐热量</p>
                  <p className="text-4xl font-bold text-primary">{plan.dailyCalorieTarget} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
                </div>
                <div className="h-12 w-px bg-border hidden sm:block"></div>
                <div className="grid grid-cols-3 gap-8 text-center w-full sm:w-auto">
                  <div><p className="text-sm text-muted-foreground mb-1">蛋白质</p><p className="text-lg font-semibold">{plan.nutritionSummary.protein}</p></div>
                  <div><p className="text-sm text-muted-foreground mb-1">脂肪</p><p className="text-lg font-semibold">{plan.nutritionSummary.fat}</p></div>
                  <div><p className="text-sm text-muted-foreground mb-1">碳水</p><p className="text-lg font-semibold">{plan.nutritionSummary.carbs}</p></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-md relative group hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10 pointer-events-none group-hover:to-black/40 transition-all"></div>
            {/* Ignore image during export to prevent taint/CORS issues */}
            <img 
              src={pagodaImg} 
              alt="中国居民平衡膳食宝塔" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              data-html2canvas-ignore="true"
            />
            <div className="absolute bottom-4 left-4 z-20 text-white">
              <h3 className="font-bold text-lg mb-1">中国居民平衡膳食宝塔 (2022)</h3>
              <p className="text-xs opacity-90">遵循官方权威指导</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center" data-html2canvas-ignore>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">为您定制的一周食谱</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> 打印</Button>
              <Button variant="outline" size="sm" onClick={onReset}>重新测评</Button>
            </div>
          </div>

          <Tabs defaultValue="第1天" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50 rounded-xl mb-6 no-scrollbar snap-x" data-html2canvas-ignore>
              {plan.dailyPlans.map((day) => (
                <TabsTrigger key={day.day} value={day.day} className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all shrink-0 snap-start">
                  {day.day}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {plan.dailyPlans.map((day, idx) => (
              <TabsContent key={day.day} value={day.day} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <DailyPlanCard dayPlan={day} onShowRecipe={setSelectedMeal} onSwap={() => handleSwap(idx)} />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <ShoppingListCard shoppingList={plan.shoppingList} />

        <footer className="mt-4 pt-8 text-sm text-muted-foreground space-y-4 border-t">
          <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-100 dark:border-orange-900/50">
            <h4 className="font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2 mb-2"><Info className="w-4 h-4" /> 免责声明</h4>
            <p className="leading-relaxed">{plan.disclaimer}</p>
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center pt-4">
            <span className="font-medium">数据来源:</span>
            {plan.sources.map((source, idx) => (<a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4 transition-colors">{source.title}</a>))}
          </div>
        </footer>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 py-8 border-t border-dashed bg-white/30 rounded-xl backdrop-blur-sm mt-8">
        <h3 className="text-lg font-semibold text-muted-foreground">分享您的健康计划</h3>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="gap-2 shadow-lg bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-600/90 text-white border-0">
              <Share2 className="w-5 h-5" />
              分享给家人朋友
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56 p-2">
            <DropdownMenuLabel>选择分享方式</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2 py-3">
              <LinkIcon className="w-4 h-4 text-blue-500" />
              <span>复制分享链接</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportImage} disabled={isExporting} className="cursor-pointer gap-2 py-3">
              <ImageIcon className="w-4 h-4 text-purple-500" />
              <span>保存为长图</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting} className="cursor-pointer gap-2 py-3">
              <FileDown className="w-4 h-4 text-red-500" />
              <span>导出为 PDF</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <p className="text-xs text-muted-foreground">支持以图片、PDF文件或网页链接形式分享</p>
      </div>

      <RecipeDialog meal={selectedMeal} open={!!selectedMeal} onOpenChange={(open) => !open && setSelectedMeal(null)} />
      
      {/* Hidden Export Layout */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <div ref={exportRef}>
          <ExportLayout plan={plan} />
        </div>
      </div>
    </motion.div>
  );
}

function DailyPlanCard({ dayPlan, onShowRecipe, onSwap }: { dayPlan: DailyPlan, onShowRecipe: (meal: MealItem) => void, onSwap: () => void }) {
  return (
    <Card className="border-none shadow-lg bg-white/80 dark:bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2 border-b bg-muted/20">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="text-xl flex items-center gap-2">
            {dayPlan.day} 膳食安排
            <Badge variant="secondary" className="font-normal text-xs">约 {dayPlan.totalCalories} kcal</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${dayPlan.diversityCount >= 12 ? 'border-green-200 bg-green-50 text-green-700' : 'border-yellow-200 bg-yellow-50 text-yellow-700'}`}>
              今日食材: {dayPlan.diversityCount}种
            </span>
            <Button variant="ghost" size="sm" onClick={onSwap} className="text-primary hover:text-primary/80 hover:bg-primary/10 h-8 px-2" title="换一种搭配" data-html2canvas-ignore>
              <RefreshCw className="w-4 h-4 mr-1" />
              换一种
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full text-primary font-medium mt-2">💡 {dayPlan.tips}</div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <MealSection title="早餐 🌅" meals={dayPlan.breakfast} color="bg-orange-50 dark:bg-orange-950/20" onShowRecipe={onShowRecipe} />
          <MealSection title="午餐 ☀️" meals={dayPlan.lunch} color="bg-green-50 dark:bg-green-950/20" onShowRecipe={onShowRecipe} />
          <MealSection title="晚餐 🌙" meals={dayPlan.dinner} color="bg-blue-50 dark:bg-blue-950/20" onShowRecipe={onShowRecipe} />
        </div>
        {dayPlan.snacks && dayPlan.snacks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-dashed">
             <MealSection title="加餐/零食 🍎" meals={dayPlan.snacks} color="bg-purple-50 dark:bg-purple-950/20" horizontal onShowRecipe={onShowRecipe} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MealSection({ title, meals, color, horizontal = false, onShowRecipe }: { title: string, meals: MealItem[], color: string, horizontal?: boolean, onShowRecipe: (meal: MealItem) => void }) {
  return (
    <div className={`rounded-xl p-4 ${color} transition-all hover:shadow-md h-full flex flex-col`}>
      <h4 className="font-semibold text-lg mb-3 opacity-90">{title}</h4>
      <div className={`space-y-3 ${horizontal ? 'grid grid-cols-1 sm:grid-cols-3 gap-4 space-y-0' : ''}`}>
        {meals.map((meal, idx) => (
          <div key={idx} className="bg-white dark:bg-card rounded-lg p-3 shadow-sm border border-border/50">
            <div className="flex justify-between items-start mb-1 gap-2">
              <span className="font-medium text-base truncate flex-1">{meal.name}</span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Clock className="w-3 h-3" /> {meal.prepTime}分
                </span>
                {meal.recipe && meal.recipe.length > 0 && (
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:text-primary/80 hover:bg-primary/10" onClick={() => onShowRecipe(meal)} data-html2canvas-ignore>
                     <BookOpen className="w-3.5 h-3.5" />
                   </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2 leading-snug line-clamp-2">{meal.description}</p>
            {meal.tags && (
              <div className="flex flex-wrap gap-1">
                {meal.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-sm font-medium">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShoppingListCard({ shoppingList }: { shoppingList: ShoppingItem[] }) {
  const categories = Array.from(new Set(shoppingList.map(item => item.category)));

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ShoppingCart className="w-6 h-6 text-primary" />
          本周采购清单
        </CardTitle>
        <CardDescription>根据您的周计划自动生成的食材用量总表 (约7天量)</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category} className="space-y-3">
              <h4 className="font-semibold text-primary flex items-center gap-2 border-b border-primary/20 pb-1 mb-2">
                <Utensils className="w-4 h-4" />
                {category}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {shoppingList.filter(item => item.category === category).map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row justify-between items-center p-2 rounded-md bg-white/60 dark:bg-black/20 border border-transparent hover:border-primary/10 transition-colors">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center sm:text-left">{item.name}</span>
                    <Badge variant="secondary" className="mt-1 sm:mt-0 ml-0 sm:ml-2 font-mono text-xs whitespace-nowrap bg-white/80 dark:bg-white/10">
                      {item.amount}{item.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-xs text-muted-foreground text-center border-t border-dashed pt-4">
          注：采购量为估算净重，实际购买时建议预留损耗 (如蔬菜去根、肉类去骨等)。
        </div>
      </CardContent>
    </Card>
  );
}

function RecipeDialog({ meal, open, onOpenChange }: { meal: MealItem | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  if (!meal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
            {meal.name}
            <Badge variant="outline" className="text-sm font-normal text-muted-foreground border-primary/20">{meal.calories} kcal</Badge>
            <Badge variant="outline" className="text-sm font-normal text-muted-foreground border-primary/20 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {meal.prepTime}分
            </Badge>
          </DialogTitle>
          <DialogDescription>{meal.description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6 pt-2">
          <div className="space-y-6">
            {meal.ingredientDetails && meal.ingredientDetails.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><span className="w-1.5 h-6 bg-primary rounded-full"></span>所需食材</h4>
                <div className="grid grid-cols-2 gap-3">
                  {meal.ingredientDetails.map((ing, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-muted/30 p-2 rounded border border-muted">
                      <span className="text-sm font-medium">{ing.name}</span>
                      <span className="text-xs text-muted-foreground bg-white dark:bg-black/20 px-1.5 py-0.5 rounded shadow-sm">{ing.amount}{ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {meal.recipe && meal.recipe.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><span className="w-1.5 h-6 bg-orange-400 rounded-full"></span>烹饪步骤</h4>
                <div className="space-y-4">
                  {meal.recipe.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs mt-0.5">{idx + 1}</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
// A dedicated component for high-quality export (Image/PDF)
// This renders the full weekly plan linearly, suitable for A4 printing
export function ExportLayout({ plan }: { plan: WeeklyPlan }) {
  return (
    <div className="w-[800px] bg-white text-gray-900 p-8 font-sans">
      {/* Header */}
      <div className="border-b-2 border-primary/20 pb-6 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">专属膳食计划</h1>
            <p className="text-sm text-gray-500">基于《中国居民膳食指南 (2022)》生成</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">生成日期</div>
            <div className="text-lg font-medium">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div> 身体数据概览
          </h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">BMI 指数:</span>
            <span className="font-medium">{plan.bmi} ({plan.bmiStatus === 'normal' ? '正常' : '非正常'})</span>
            <span className="text-gray-500">目标热量:</span>
            <span className="font-medium">{plan.dailyCalorieTarget} kcal/天</span>
            <span className="text-gray-500">营养配比:</span>
            <span className="font-medium">碳水{plan.nutritionSummary.carbs} / 蛋白{plan.nutritionSummary.protein}</span>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div> 膳食建议
          </h3>
          <div className="text-sm text-gray-700 leading-relaxed">
            <p className="mb-2"><strong>当季 ({plan.seasonalAdvice?.season || "春季"}):</strong> {plan.seasonalAdvice?.tips || "建议多吃时令蔬菜"}</p>
            <p><strong>推荐食材:</strong> {plan.seasonalAdvice?.localVeggies?.slice(0, 5).join("、") || "时令蔬菜"}</p>
          </div>
        </div>
      </div>

      {/* Weekly Plan (Linear) */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary rounded-full"></span>
          本周食谱安排
        </h2>
        
        <div className="space-y-6">
          {plan.dailyPlans.map((day) => (
            <div key={day.day} className="border border-gray-200 rounded-lg overflow-hidden break-inside-avoid">
              <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b border-gray-200">
                <span className="font-bold text-gray-800">{day.day}</span>
                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {day.totalCalories} kcal • {day.diversityCount}种食材
                </span>
              </div>
              <div className="grid grid-cols-4 divide-x divide-gray-100">
                <ExportMealCell label="早餐" meals={day.breakfast} />
                <ExportMealCell label="午餐" meals={day.lunch} />
                <ExportMealCell label="晚餐" meals={day.dinner} />
                <ExportMealCell label="加餐" meals={day.snacks || []} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping List */}
      <div className="mb-8 break-inside-avoid">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
          采购清单 (约7天量)
        </h2>
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {Array.from(new Set(plan.shoppingList.map(i => i.category))).map(cat => (
              <div key={cat} className="text-sm">
                <div className="font-bold text-gray-700 mb-1 border-b border-gray-200 pb-1">{cat}</div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-gray-600">
                  {plan.shoppingList.filter(i => i.category === cat).map((item, i) => (
                    <span key={i}>{item.name}<span className="text-gray-400 text-xs ml-0.5">{item.amount}{item.unit}</span></span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 border-t pt-4">
        <p>{plan.disclaimer}</p>
        <p className="mt-1">DietGuide - 您的智能膳食管家</p>
      </div>
    </div>
  );
}

function ExportMealCell({ label, meals }: { label: string, meals: MealItem[] }) {
  if (!meals || meals.length === 0) return <div className="p-3 text-center text-xs text-gray-300">-</div>;
  
  return (
    <div className="p-3">
      <div className="text-[10px] text-gray-400 font-bold mb-1">{label}</div>
      {meals.map((m, i) => (
        <div key={i} className="mb-2 last:mb-0">
          <div className="text-sm font-medium text-gray-800 leading-tight mb-0.5">{m.name}</div>
          <div className="text-[10px] text-gray-500 leading-tight">{(m.ingredients || []).slice(0,3).join("、")}</div>
        </div>
      ))}
    </div>
  );
}
