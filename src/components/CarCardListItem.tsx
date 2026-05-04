import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import licensePlate from "@/assets/license-plate.png";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

interface CarCardListItemProps {
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

const CarCardListItem = ({ car }: CarCardListItemProps) => {
  const navigate = useNavigate();

  const formattedReg = car.registration_number
    ? (car.registration_number.length === 6
        ? `${car.registration_number.slice(0, 3)} ${car.registration_number.slice(3)}`
        : car.registration_number
      ).toUpperCase()
    : null;

  return (
    <Card
      className="bg-gradient-card border-border/50 shadow-card hover:shadow-intense transition-all duration-300 cursor-pointer group overflow-hidden animate-fade-in-up"
      onClick={() => navigate(`/car/${car.id}`)}
    >
      <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3">
        {/* Thumbnail */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
          {car.photo_url ? (
            <img
              src={getOptimizedImageUrl(car.photo_url, { width: 128, height: 128, quality: 60 })}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              Ingen bild
            </div>
          )}
        </div>

        {/* License plate */}
        {car.registration_number && (
          <div className="relative w-28 sm:w-36 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
            <img src={licensePlate} alt="Registreringsskylt" className="w-full h-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-extrabold text-black text-base sm:text-lg md:text-xl tracking-wide ml-2 sm:ml-3"
                style={{ fontFamily: "monospace" }}
              >
                {formattedReg}
              </span>
            </div>
          </div>
        )}

        {/* Car name */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold truncate group-hover:text-primary transition-colors duration-300">
            {car.make} {car.model}
          </h3>
        </div>
      </div>
    </Card>
  );
};

export default CarCardListItem;
