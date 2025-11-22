import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import luveroLogo from "@/assets/luvero-logo.png";
import { Sparkles, TrendingUp, Share2 } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Hero Section */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="animate-fade-in space-y-8 max-w-4xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src={luveroLogo} 
              alt="LuFlow Logo" 
              className="w-24 h-24 md:w-32 md:h-32 animate-float" 
            />
          </div>

          {/* Brand Name */}
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6">
            LuFlow ©
          </h1>

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Professionell bilredigering för återförsäljare
          </h2>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
            AI-driven bildredigering som gör dina fordon redo för försäljning på sekunder. 
            Transparent prissättning, enkel hantering.
          </p>

          {/* CTA Button */}
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
            onClick={() => navigate("/auth")}
          >
            Kom igång
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature 1 */}
            <div className="text-center space-y-4 p-6 rounded-lg bg-card/10 backdrop-blur-sm border border-border/20 hover:border-primary/50 transition-all duration-300 hover:scale-105">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">AI-drivna bildredigeringar</h3>
              <p className="text-gray-400">
                Automatisk bakgrundsredigering och professionell bildbehandling med AI-teknik
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center space-y-4 p-6 rounded-lg bg-card/10 backdrop-blur-sm border border-border/20 hover:border-primary/50 transition-all duration-300 hover:scale-105">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">Transparent prismodell</h3>
              <p className="text-gray-400">
                Betala endast 4,95 kr per redigerad bild. Ingen månadskostnad, inga dolda avgifter
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center space-y-4 p-6 rounded-lg bg-card/10 backdrop-blur-sm border border-border/20 hover:border-primary/50 transition-all duration-300 hover:scale-105">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <Share2 className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">Enkel delning och export</h3>
              <p className="text-gray-400">
                Skapa anpassade landningssidor och dela dina bilder direkt med kunder
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 border-t border-border/10">
        <p>© 2024 LuFlow. Alla rättigheter förbehållna.</p>
      </footer>
    </div>
  );
};

export default Landing;
