import arenaBilLogo from "@/assets/arena-bil-logo.png";
import joelsBilLogo from "@/assets/joels-bil-logo.png";
import carcenterLogo from "@/assets/carcenter-logo.png";
import sabilLogo from "@/assets/sabil-logo.png";
import gbmLogo from "@/assets/gbm-logo.png";
const logos = [{
  src: arenaBilLogo,
  alt: "Arena Bil"
}, {
  src: joelsBilLogo,
  alt: "Joels Bil Lidköping"
}, {
  src: carcenterLogo,
  alt: "Car Center"
}, {
  src: sabilLogo,
  alt: "SA Bil"
}, {
  src: gbmLogo,
  alt: "GBM"
}];
const LogoMarquee = () => {
  return <div className="bg-card/50 backdrop-blur-sm border-y border-border/50">
      {/* Top divider accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      <div className="py-10">
        <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-widest pb-[10px]" style={{ fontFamily: "'Quattrocento', serif", fontWeight: 400 }}>LUVERO ANVÄNDS VÄRLDEN ÖVER </p>
        <div className="relative overflow-hidden">
          {/* Scrolling track */}
          <div className="flex animate-marquee">
            {[0, 1].map(trackIndex => <div key={trackIndex} className="flex shrink-0 items-center gap-20 px-10">
                {[...Array(4)].map((_, setIndex) => logos.map((logo, i) => <img key={`${trackIndex}-${setIndex}-${i}`} src={logo.src} alt="" loading="lazy" decoding="async" fetchPriority="low" width={80} height={64} className="h-16 md:h-20 w-auto opacity-60 hover:opacity-100 transition-opacity" />))}
              </div>)}
          </div>
        </div>
      </div>
      
      {/* Bottom divider accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </div>;
};
export default LogoMarquee;