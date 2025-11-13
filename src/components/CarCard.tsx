import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette } from "lucide-react";
import licensePlate from "@/assets/license-plate.png";

interface CarCardProps {
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string | null;
    vin: string | null;
    photo_url?: string | null;
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

      {/* BILD ÖVER HELA ÖVRE DELEN */}
      {car.photo_url && (
        <div className="relative w-full h-40 md:h-48 overflow-hidden">
          <img
            src={car.photo_url}
            alt={`${car.make} ${car.model}`}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
          {/* ÅRTALET PÅ BILDEN NERE HÖGER */}
          <div className="absolute bottom-3 right-3">
            <Badge
              variant="secondary"
              className="bg-secondary/70 group-hover:bg-primary/80 transition-colors duration-300"
            >
              {car.year}
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="p-6 relative">
        <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-all duration-300 group-hover:translate-x-1">
          {car.make} {car.model}
        </h3>

        {car.vin && (
          <div className="relative mb-3 w-48 group-hover:scale-105 transition-transform duration-300 -ml-4">
            <img src={licensePlate} alt="Registreringsskylt" className="w-full h-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-extrabold text-black text-3xl tracking-wide ml-4"
                style={{ fontFamily: "monospace" }}
              >
                {(car.vin.length === 6 ? `${car.vin.slice(0, 3)} ${car.vin.slice(3)}` : car.vin).toUpperCase()}
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
