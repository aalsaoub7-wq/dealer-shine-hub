import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, TrendingUp } from "lucide-react";

interface UsageStats {
  edited_images_count: number;
  edited_images_cost: number;
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
          edited_images_count: 0,
          edited_images_cost: 0,
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
  
  // Calculate price per image from stored data (avoids hardcoding)
  const pricePerImage = stats.edited_images_count > 0 
    ? (stats.edited_images_cost / stats.edited_images_count).toFixed(2)
    : "0.00";

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
      <CardContent>
        <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="p-3 rounded-full bg-primary/10">
            <Image className="w-10 h-10 md:w-12 md:h-12 text-primary" />
          </div>
          <span className="text-sm md:text-base font-medium text-muted-foreground">Redigerade Bilder</span>
          <span className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
            {stats.edited_images_count}
          </span>
          <div className="pt-2 border-t border-border/50 w-full">
            <p className="text-xs md:text-sm text-muted-foreground">
              <span className="text-base md:text-lg font-semibold text-foreground">{stats.edited_images_cost.toFixed(2)} kr</span>
              {stats.edited_images_count > 0 && (
                <>
                  <br />
                  <span className="text-[10px] md:text-xs opacity-70">(à {pricePerImage} kr per bild)</span>
                </>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
