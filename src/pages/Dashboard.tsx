import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Plus, Search, Sparkles } from "lucide-react";
import luveroLogo from "@/assets/luvero-logo.png";
import luveroLogoText from "@/assets/luvero-logo-text.png";
import CarCard from "@/components/CarCard";
import AddCarDialog from "@/components/AddCarDialog";
import { AiSettingsDialog } from "@/components/AiSettingsDialog";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { useHaptics } from "@/hooks/useHaptics";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { isNativeApp } from "@/lib/utils";
import { openExternalUrl } from "@/lib/nativeCapabilities";
interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  registration_number: string | null;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  notes: string | null;
  photo_url?: string | null;
  deleted_at?: string | null;
}
const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cars, setCars] = useState<CarData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    lightImpact
  } = useHaptics();
  const {
    isOnline
  } = useNetworkStatus();
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    // Check auth and set up listener
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  useEffect(() => {
    if (user) {
      fetchCars();
      // Auto-reconcile billing on dashboard load (scoped to user's company)
      supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.company_id) {
            import("@/lib/usageTracking").then(({ triggerReconciliation }) => {
              triggerReconciliation(data.company_id).catch(() => {});
            });
          }
        });
    }
  }, [user]);
  const openSettingsDialog = (tab: string) => {
    setSettingsOpen(true);
    setTimeout(() => {
      if ((window as any).openSettingsDialog) {
        (window as any).openSettingsDialog(tab);
      }
    }, 100);
  };
  const openCustomerPortal = async () => {
    if (isNativeApp()) {
      // Native app: Open website in external browser (Apple IAP rules)
      await openExternalUrl("https://luvero.se/dashboard");
      return;
    }

    // Web app: Open Stripe Customer Portal directly
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Fel",
        description: "Kunde inte öppna betalningssidan. Försök igen.",
        variant: "destructive"
      });
    }
  };
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    lightImpact();
    try {
      await fetchCars();
    } finally {
      setRefreshing(false);
    }
  }, [lightImpact]);
  const fetchCars = async () => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from("cars").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;

      // Fetch first photo for each car
      const carsWithPhotos = await Promise.all((data || []).map(async car => {
        const {
          data: photos
        } = await supabase.from("photos").select("url").eq("car_id", car.id).eq("photo_type", "main").order("display_order", {
          ascending: true
        }).limit(1);
        return {
          ...car,
          photo_url: photos?.[0]?.url || null
        };
      }));
      setCars(carsWithPhotos);
    } catch (error: any) {
      toast({
        title: "Fel vid laddning av bilar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  // Determine if we should show archived cars
  const isArchiveSearch = searchQuery.toLowerCase().includes("arkiv");
  
  // First filter by archive status
  const baseCars = isArchiveSearch 
    ? cars.filter(car => car.deleted_at !== null)
    : cars.filter(car => car.deleted_at === null);
  
  // Then filter by search query (skip "arkiv" keyword for actual filtering)
  const filteredCars = baseCars.filter(car => {
    const query = searchQuery.toLowerCase().replace("arkiv", "").trim();
    if (!query) return true; // If only "arkiv" was searched, show all archived
    return car.make.toLowerCase().includes(query) || car.model.toLowerCase().includes(query) || car.year.toString().includes(query) || car.vin && car.vin.toLowerCase().includes(query) || car.registration_number && car.registration_number.toLowerCase().includes(query);
  });
  if (loading) {
    return <DashboardSkeleton />;
  }
  return <div className={`bg-gradient-to-br from-background via-card to-background ${isNativeApp() ? 'h-full overflow-y-auto' : 'min-h-screen'}`} style={isNativeApp() ? {
    touchAction: 'pan-y',
    overscrollBehavior: 'contain',
    paddingBottom: 'env(safe-area-inset-bottom)'
  } : undefined}>
      {/* Offline indicator (Native only) */}
      {isNativeApp() && !isOnline && <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm">
          Ingen internetanslutning
        </div>}

      {/* Refreshing indicator */}
      {refreshing && <div className="fixed top-0 left-0 right-0 bg-primary/10 text-center py-2 z-50">
          <p className="text-sm">Uppdaterar...</p>
        </div>}

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-10 shadow-card animate-fade-in">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3">
              <img src={luveroLogo} alt="Luvero Orbit Logo" className="w-8 h-8" />
              <img src={luveroLogoText} alt="Luvero" className="h-5 object-contain" />
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <AiSettingsDialog />
              <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-secondary hover:scale-110 transition-all duration-300 h-8 w-8 md:h-10 md:w-10">
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4 md:mb-8">
          <div className="relative flex-1 group animate-slide-in-right">
            <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 md:pl-10 text-base h-9 md:h-10 bg-secondary border-border focus:border-primary focus:shadow-glow transition-all duration-300" placeholder="Sök på namn eller på reg. nr...." />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full md:w-auto bg-gradient-button hover:bg-gradient-hover shadow-glow hover:shadow-intense hover:scale-105 transition-all duration-300 animate-scale-in h-9 md:h-10 text-sm md:text-base">
            <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
            <span className="hidden xs:inline">Lägg till bil</span>
            <span className="xs:hidden">Ny bil</span>
          </Button>
        </div>

        {loading ? <div className="text-center py-8 md:py-12 text-muted-foreground animate-fade-in text-sm md:text-base">
            Laddar bilar...
          </div> : filteredCars.length === 0 ? <div className="text-center py-8 md:py-12 px-4 animate-scale-in">
            <div>
              <img src={luveroLogo} alt="Luvero Orbit Logo" className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 opacity-50" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">Inga bilar hittades</h3>
            <p className="text-muted-foreground text-sm md:text-base mb-3 md:mb-4">
              {searchQuery ? "Prova en annan sökning" : "Kom igång genom att lägga till din första bil"}
            </p>
            {!searchQuery && <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-button hover:bg-gradient-hover shadow-glow hover:shadow-intense hover:scale-105 transition-all duration-300 h-9 md:h-10 text-sm md:text-base">
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                Lägg till din första bil
              </Button>}
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredCars.map(car => <CarCard key={car.id} car={car} onUpdate={fetchCars} />)}
          </div>}
      </main>

      <AddCarDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onCarAdded={fetchCars} />
    </div>;
};
export default Dashboard;