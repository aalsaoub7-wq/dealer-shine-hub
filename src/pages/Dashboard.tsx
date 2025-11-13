import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, LogOut, Plus, Search } from "lucide-react";
import CarCard from "@/components/CarCard";
import AddCarDialog from "@/components/AddCarDialog";
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
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading cars",
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
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Car className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">CarPhoto Pro</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-secondary"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by make, model, year, or VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Car
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading cars...</div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No cars found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try a different search" : "Get started by adding your first car"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Car
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

      <AddCarDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onCarAdded={fetchCars}
      />
    </div>
  );
};

export default Dashboard;