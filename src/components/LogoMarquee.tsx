import arenaBilLogo from "@/assets/arena-bil-logo.png";
import joelsBilLogo from "@/assets/joels-bil-logo.png";
const logos = [{
  src: arenaBilLogo,
  alt: "Arena Bil"
}, {
  src: joelsBilLogo,
  alt: "Joels Bil Lidköping"
}];
const LogoMarquee = () => {
  return <div className="py-8">
      {/* Top divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-8" />
      
      <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-widest">
        Bilhandlare som använder Luvero
      </p>
      <div className="relative overflow-hidden">
        {/* Fade edges - transparent fades */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050814] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#1b0f16] to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling track - two identical sets for seamless loop */}
        <div className="flex animate-marquee">
          {[0, 1].map(trackIndex => <div key={trackIndex} className="flex shrink-0 items-center gap-20 px-10">
              {[...Array(4)].map((_, setIndex) => logos.map((logo, i) => <img key={`${trackIndex}-${setIndex}-${i}`} src={logo.src} alt={logo.alt} className="h-10 md:h-12 w-auto opacity-60 hover:opacity-100 transition-opacity" />))}
            </div>)}
        </div>
      </div>
      
      {/* Bottom divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-8" />
    </div>;
};
export default LogoMarquee;