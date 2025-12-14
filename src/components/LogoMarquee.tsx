import arenaBilLogo from "@/assets/arena-bil-logo.png";
import joelsBilLogo from "@/assets/joels-bil-logo.png";
import autoPerformanceLogo from "@/assets/auto-performance-logo.png";
import eliteMotorworksLogo from "@/assets/elite-motorworks-logo.png";
import vastronAutoLogo from "@/assets/vastron-auto-logo.png";

const logos = [{
  src: arenaBilLogo,
  alt: "Arena Bil"
}, {
  src: joelsBilLogo,
  alt: "Joels Bil Lidköping"
}, {
  src: autoPerformanceLogo,
  alt: "Auto Performance"
}, {
  src: eliteMotorworksLogo,
  alt: "Elite Motorworks"
}, {
  src: vastronAutoLogo,
  alt: "Vastron Auto"
}];
const LogoMarquee = () => {
  return <div className="bg-card/50 backdrop-blur-sm border-y border-border/50">
      {/* Top divider accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      <div className="py-10">
        <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-widest pb-[10px]">
          Bilhandlare som använder Luvero
        </p>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-card/50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-card/50 to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling track */}
          <div className="flex animate-marquee">
            {[0, 1].map(trackIndex => <div key={trackIndex} className="flex shrink-0 items-center gap-20 px-10">
                {[...Array(4)].map((_, setIndex) => logos.map((logo, i) => <img key={`${trackIndex}-${setIndex}-${i}`} src={logo.src} alt={logo.alt} className="h-16 md:h-20 w-auto opacity-60 hover:opacity-100 transition-opacity" />))}
              </div>)}
          </div>
        </div>
      </div>
      
      {/* Bottom divider accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </div>;
};
export default LogoMarquee;