import arenaBilLogo from "@/assets/arena-bil-logo.png";
import joelsBilLogo from "@/assets/joels-bil-logo.png";

const logos = [
  { src: arenaBilLogo, alt: "Arena Bil" },
  { src: joelsBilLogo, alt: "Joels Bil Lidköping" },
];

const LogoMarquee = () => {
  return (
    <div className="py-12">
      <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-widest">
        Företag som använder Luvero
      </p>
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling track */}
        <div className="flex animate-marquee">
          {[...Array(6)].map((_, setIndex) => (
            <div key={setIndex} className="flex shrink-0 items-center gap-16 px-8">
              {logos.map((logo, i) => (
                <img
                  key={`${setIndex}-${i}`}
                  src={logo.src}
                  alt={logo.alt}
                  className="h-10 md:h-12 w-auto opacity-70 hover:opacity-100 transition-opacity"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoMarquee;
