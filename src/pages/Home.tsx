import { useState, useRef, useEffect } from "react";
import { SurveyForm } from "@/components/SurveyForm";
import { ResultSection } from "@/components/ResultSection";
import { generateWeeklyPlan } from "@/lib/diet-engine";
import { generatePlanWithAI } from "@/lib/ai-engine";
import { decodePlanData } from "@/lib/utils";
import type { UserProfile, WeeklyPlan } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Loader2, Sparkles, Database } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface HomeProps {
  targetSection?: string;
}

export default function Home({ targetSection }: HomeProps) {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Initialize from URL search params & LocalStorage
  useEffect(() => {
    // Load API Key
    const storedKey = localStorage.getItem("deepseek_api_key");
    if (storedKey) {
      setApiKey(storedKey);
      setUseAI(true);
    }

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const sharedData = searchParams.get('plan');
      
      if (sharedData) {
        // Use robust decode function handles Unicode
        const profile = decodePlanData(sharedData) as UserProfile;
        
        if (!profile) throw new Error("Decoded profile is null");

        // Auto-generate plan (default to local for shared links to ensure consistency, or maybe AI?)
        // For shared links, we regenerate based on profile. Local is safer/faster.
        const plan = generateWeeklyPlan(profile);
        setWeeklyPlan(plan);
        
        // Clean URL without refresh
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', newUrl);
        
        toast.success("已加载分享的饮食计划");
        
        // Scroll to result after render
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 500);
      }
    } catch (e) {
      console.error("Failed to parse shared plan", e);
      toast.error("加载分享链接失败，数据可能已损坏");
    }
  }, []);

  const handleSaveSettings = () => {
    if (apiKey.trim()) {
      localStorage.setItem("deepseek_api_key", apiKey.trim());
      setUseAI(true);
      toast.success("API Key 已保存，将使用 DeepSeek 生成食谱");
    } else {
      localStorage.removeItem("deepseek_api_key");
      setUseAI(false);
      toast.info("已切换回本地数据库模式");
    }
    setIsSettingsOpen(false);
  };

  const handleSurveySubmit = async (profile: UserProfile) => {
    setIsLoading(true);
    try {
      let plan: WeeklyPlan;

      if (useAI && apiKey) {
        // Use AI Generation
        toast.loading("DeepSeek 正在为您定制食谱，请稍候... (约10-20秒)");
        plan = await generatePlanWithAI(profile, apiKey);
        toast.dismiss();
        toast.success("AI 生成成功！");
      } else {
        // Use Local Generation
        // Simulate delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        plan = generateWeeklyPlan(profile);
      }

      setWeeklyPlan(plan);
      
      // Auto scroll
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

    } catch (error: any) {
      console.error("Generation failed:", error);
      toast.dismiss();
      toast.error(`生成失败: ${error.message || "未知错误"}`);
      // Fallback hint
      if (useAI) {
        toast.info("您可以尝试关闭 AI 模式使用本地数据库生成。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWeeklyPlan(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-background">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-auto" />
            <span className="font-bold text-xl tracking-tight text-primary">DietGuide</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
              当前模式: 
              {useAI ? (
                <span className="flex items-center gap-1 ml-1 text-purple-600"><Sparkles className="w-3 h-3" /> DeepSeek AI</span>
              ) : (
                <span className="flex items-center gap-1 ml-1 text-green-600"><Database className="w-3 h-3" /> 本地数据库</span>
              )}
            </div>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>设置数据源</DialogTitle>
                  <DialogDescription>
                    默认使用内置数据库生成。配置 DeepSeek API Key 后可启用 AI 智能生成。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ai-mode" className="flex flex-col gap-1">
                      <span>启用 AI 生成</span>
                      <span className="font-normal text-xs text-muted-foreground">使用 DeepSeek 模型生成更个性化的食谱</span>
                    </Label>
                    <Switch 
                      id="ai-mode" 
                      checked={useAI} 
                      onCheckedChange={(checked) => {
                        setUseAI(checked);
                        if (checked && !apiKey) {
                          toast.warning("请先输入 API Key");
                        }
                      }} 
                    />
                  </div>
                  
                  {useAI && (
                    <div className="space-y-2">
                      <Label htmlFor="api-key">DeepSeek API Key</Label>
                      <Input 
                        id="api-key" 
                        type="password" 
                        placeholder="sk-..." 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)} 
                      />
                      <p className="text-xs text-muted-foreground">
                        您的 Key 仅存储在本地浏览器中，直接请求 DeepSeek 接口，不经过任何中间服务器。
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveSettings}>保存设置</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      {/* Hero 区域 */}
      <section className="relative pt-20 pb-8 lg:pt-28 lg:pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Healthy Food Background" 
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/60 to-background"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-600">
              科学膳食，健康生活
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 max-w-2xl mx-auto">
              {useAI ? "DeepSeek AI 驱动，为您定制专属的个性化一周饮食计划。" : "只需几步，为您生成基于权威指南的个性化一周饮食计划。"}
            </p>
          </motion.div>

          {/* 调查表单区域 */}
          <AnimatePresence mode="wait">
            {!weeklyPlan && (
              <div id="survey-form" className="relative">
                {isLoading && (
                  <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-lg font-medium text-primary animate-pulse">
                      {useAI ? "DeepSeek 正在思考食谱..." : "正在生成计划..."}
                    </p>
                  </div>
                )}
                <SurveyForm onSubmit={handleSurveySubmit} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 结果展示区域 */}
      <AnimatePresence>
        {weeklyPlan && (
          <motion.section 
            ref={resultRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow py-12 bg-secondary/30 relative"
          >
             <div className="container mx-auto px-4">
               <ResultSection plan={weeklyPlan} onReset={handleReset} />
             </div>
          </motion.section>
        )}
      </AnimatePresence>
      
      {/* 页脚 */}
      <footer className="py-8 bg-white border-t border-border mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 DietGuide. All rights reserved.</p>
          <p className="mt-2">本站内容依据《中国居民膳食指南 (2022)》生成，仅供参考。</p>
        </div>
      </footer>
    </div>
  );
}
