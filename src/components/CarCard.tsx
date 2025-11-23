import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import licensePlate from "@/assets/license-plate.png";

interface CarCardProps {
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    registration_number: string | null;
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
        <div className="relative w-full h-32 sm:h-40 md:h-48 overflow-hidden">
          <img
            src={car.photo_url}
            alt={`${car.make} ${car.model}`}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      <CardContent className="p-3 sm:p-4 md:p-6 relative">
        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 group-hover:text-primary transition-all duration-300 group-hover:translate-x-1">
          {car.make} {car.model}
        </h3>

        {car.registration_number && (
          <div className="relative mb-2 sm:mb-3 w-32 sm:w-40 md:w-48 group-hover:scale-105 transition-transform duration-300 -ml-2 sm:-ml-3 md:-ml-4">
            <img src={licensePlate} alt="Registreringsskylt" className="w-full h-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-extrabold text-black text-xl sm:text-2xl md:text-3xl tracking-wide ml-2 sm:ml-3 md:ml-4"
                style={{ fontFamily: "monospace" }}
              >
                {(car.registration_number.length === 6 ? `${car.registration_number.slice(0, 3)} ${car.registration_number.slice(3)}` : car.registration_number).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CarCard;
