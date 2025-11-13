import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Palette } from "lucide-react";
import licensePlate from "@/assets/license-plate.png";

interface CarCardProps {
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string | null;
    vin: string | null;
  };
  onUpdate: () => void;
}

const CarCard = ({ car }: CarCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="bg-gradient-card border-border/50 shadow-card hover:shadow-intense transition-all duration-500 cursor-pointer group overflow-hidden relative animate-fade-in-up"
      onClick={() => navigate(`/car/${car.id}`)}
    >
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-glow">
            <Car className="w-6 h-6 text-primary-foreground" />
          </div>
          <Badge
            variant="secondary"
            className="bg-secondary/50 group-hover:bg-primary/20 transition-colors duration-300"
          >
            {car.year}
          </Badge>
        </div>

        <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-all duration-300 group-hover:translate-x-1">
          {car.make} {car.model}
        </h3>

        {car.vin && (
          <div className="relative mb-3 w-48 group-hover:scale-105 transition-transform duration-300 -ml-4">
            <img src={licensePlate} alt="Registreringsskylt" className="w-full h-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-bold text-black text-sm tracking-widest" style={{ fontFamily: "monospace" }}>
                {car.vin}
              </span>
            </div>
          </div>
        )}

        {car.color && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            <Palette className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span>{car.color}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CarCard;
