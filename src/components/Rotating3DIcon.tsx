import { LucideIcon } from 'lucide-react';

interface Rotating3DIconProps {
  icon: LucideIcon;
  className?: string;
  color?: 'primary' | 'accent';
}

export const Rotating3DIcon = ({ icon: Icon, className = '', color = 'primary' }: Rotating3DIconProps) => {
  const colorClass = color === 'primary' ? 'text-primary' : 'text-accent';
  
  return (
    <div 
      className={`relative ${className}`}
      style={{ perspective: '200px' }}
    >
      <div 
        className="animate-spin-slow-y"
        style={{ 
          transformStyle: 'preserve-3d',
        }}
      >
        <Icon className={`h-8 w-8 ${colorClass} drop-shadow-lg`} strokeWidth={1.5} />
      </div>
    </div>
  );
};
