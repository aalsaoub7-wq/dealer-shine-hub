import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Image, TrendingUp } from "lucide-react";
import { PRICES } from "@/lib/usageTracking";

interface UsageStats {
  generated_descriptions_count: number;
  generated_descriptions_cost: number;
  cars_with_edited_images_count: number;
  cars_with_edited_images_cost: number;
  total_cost: number;
}

interface UsageDashboardProps {
  showTotalCost?: boolean;
}

export const UsageDashboard = ({ showTotalCost = false }: UsageDashboardProps) => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyStats();
  }, []);

  const fetchMonthlyStats = async () => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      const { data, error } = await supabase.from("usage_stats").select("*").eq("month", firstDayOfMonth).maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      setStats(
        data || {
          generated_descriptions_count: 0,
          generated_descriptions_cost: 0,
          cars_with_edited_images_count: 0,
          cars_with_edited_images_cost: 0,
          total_cost: 0,
        },
      );
    } catch (error) {
      console.error("Error fetching usage stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-4 md:mb-6 animate-fade-in">
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground text-sm">Laddar statistik...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const monthName = new Date().toLocaleDateString("sv-SE", { month: "long", year: "numeric" });

  return (
    <Card className="mb-4 md:mb-6 animate-fade-in border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            Månatlig användning - {monthName}
          </div>
          {showTotalCost && (
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base text-muted-foreground">Totalt:</span>
              <span className="text-lg md:text-2xl font-bold text-primary">
                {stats.total_cost.toFixed(2)} kr
              </span>
            </div>
          )}
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">Översikt över din användning och kostnader</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {/* Generated Descriptions */}
          <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-secondary/30">
            <FileText className="w-8 h-8 text-primary" />
            <span className="text-xs md:text-sm font-medium text-muted-foreground">AI Beskrivningar</span>
            <span className="text-2xl md:text-3xl font-bold">{stats.generated_descriptions_count}</span>
            <p className="text-xs text-muted-foreground">
              {stats.generated_descriptions_cost.toFixed(2)} kr
              <br />
              <span className="text-[10px]">(à {PRICES.GENERATE_DESCRIPTION} kr)</span>
            </p>
          </div>

          {/* Cars with Edited Images */}
          <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-secondary/30">
            <Image className="w-8 h-8 text-primary" />
            <span className="text-xs md:text-sm font-medium text-muted-foreground">Bilar med Redigerade Bilder</span>
            <span className="text-2xl md:text-3xl font-bold">{stats.cars_with_edited_images_count}</span>
            <p className="text-xs text-muted-foreground">
              {stats.cars_with_edited_images_cost.toFixed(2)} kr
              <br />
              <span className="text-[10px]">(à {PRICES.CAR_WITH_EDITED_IMAGES} kr)</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
