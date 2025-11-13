import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Calendar, Palette } from "lucide-react";

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
      className="bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/car/${car.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform">
            <Car className="w-6 h-6 text-primary-foreground" />
          </div>
          <Badge variant="secondary" className="bg-secondary/50">
            {car.year}
          </Badge>
        </div>
        
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
          {car.make} {car.model}
        </h3>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          {car.vin && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{car.vin}</span>
            </div>
          )}
          {car.color && (
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span>{car.color}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CarCard;