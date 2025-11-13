import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Plus, Search } from "lucide-react";
import luveroLogo from "@/assets/luvero-logo.png";
import CarCard from "@/components/CarCard";
import AddCarDialog from "@/components/AddCarDialog";
import { AiSettingsDialog } from "@/components/AiSettingsDialog";
import { useToast } from "@/hooks/use-toast";

interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  notes: string | null;
  photo_url?: string | null;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cars, setCars] = useState<CarData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check auth and set up listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
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
    }
  }, [user]);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("cars").select("*").order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch first photo for each car
      const carsWithPhotos = await Promise.all(
        (data || []).map(async (car) => {
          const { data: photos } = await supabase
            .from("photos")
            .select("url")
            .eq("car_id", car.id)
            .eq("photo_type", "main")
            .order("display_order", { ascending: true })
            .limit(1);

          return {
            ...car,
            photo_url: photos?.[0]?.url || null,
          };
        }),
      );

      setCars(carsWithPhotos);
    } catch (error: any) {
      toast({
        title: "Fel vid laddning av bilar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredCars = cars.filter((car) => {
    const query = searchQuery.toLowerCase();
    return (
      car.make.toLowerCase().includes(query) ||
      car.model.toLowerCase().includes(query) ||
      car.year.toString().includes(query) ||
      (car.vin && car.vin.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-10 shadow-card animate-fade-in">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={luveroLogo} alt="Luvero Orbit Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                LuBild AI ©
              </h1>
              <AiSettingsDialog />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-secondary hover:scale-110 transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 group animate-slide-in-right">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
            <Input
              placeholder="Sök på märke, modell, år eller regnr..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border focus:border-primary focus:shadow-glow transition-all duration-300"
            />
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-primary hover:bg-gradient-hover shadow-glow hover:shadow-intense hover:scale-105 transition-all duration-300 animate-scale-in"
          >
            <Plus className="w-5 h-5 mr-2" />
            Lägg till bil
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">Laddar bilar...</div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-12 animate-scale-in">
            <div>
              <img src={luveroLogo} alt="Luvero Orbit Logo" className="w-16 h-16 mx-auto mb-4 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Inga bilar hittades</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Prova en annan sökning" : "Kom igång genom att lägga till din första bil"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-primary hover:bg-gradient-hover shadow-glow hover:shadow-intense hover:scale-105 transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Lägg till din första bil
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => (
              <CarCard key={car.id} car={car} onUpdate={fetchCars} />
            ))}
          </div>
        )}
      </main>

      <AddCarDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onCarAdded={fetchCars} />
    </div>
  );
};

export default Dashboard;
