import React from 'react';

export const getRatingColor = (score: number, max: number = 90) => {
    const percentage = (score / max) * 100;
    if (score <= 45) return "bg-[#ff4d4d] text-black";
    if (score <= 74) return "bg-neo-yellow text-black";
    return "bg-neo-green text-black";
};

export const getRatingColorHex = (score: number) => {
    if (score <= 45) return "#ff4d4d";
    if (score <= 74) return "#ffc900";
    return "#00e054";
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'magic' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "px-6 py-3 rounded-none font-bold text-sm uppercase tracking-wide transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-black";
  
  const variants = {
    primary: "bg-black text-white shadow-neo hover:bg-gray-800",
    secondary: "bg-neo-yellow text-black shadow-neo hover:bg-yellow-400",
    outline: "bg-transparent text-black shadow-neo hover:bg-white",
    ghost: "border-transparent shadow-none hover:bg-black/5 !border-0",
    magic: "bg-gradient-to-r from-purple-400 to-neo-blue text-white shadow-neo hover:brightness-110 border-black"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Avatar: React.FC<{ src: string; alt: string; size?: 'sm' | 'md' | 'lg' | 'xl'; onClick?: (e?: React.MouseEvent) => void }> = ({ src, alt, size = 'md', onClick }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };
  
  return (
    <div 
        onClick={onClick}
        className={`relative ${sizes[size]} border-2 border-black rounded-full overflow-hidden bg-white ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    >
        <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover" 
        />
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`inline-flex items-center px-2 py-1 text-[10px] font-mono font-bold uppercase border border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${className ?? ''}`}>
    {children}
  </span>
);

export const RatingCircle: React.FC<{ rating: number; size?: 'sm' | 'lg'; showMax?: boolean }> = ({ rating, size = 'sm', showMax = false }) => {
  const sizeClass = size === 'lg' ? "text-5xl" : "text-xl";
  const colorClass = getRatingColor(rating).split(' ')[0];

  return (
    <div className="relative inline-block">
        <div className={`font-black italic ${sizeClass} text-black relative z-10 flex items-baseline`}>
            {rating}
            {showMax && <span className="text-sm text-gray-400 not-italic ml-1">/90</span>}
        </div>
        <div className={`absolute -bottom-1 -right-1 w-full h-2 ${colorClass} -z-0`}></div>
    </div>
  );
};

export const ScoreDisplay: React.FC<{ score: number; max?: number }> = ({ score, max = 90 }) => {
    const barColor = getRatingColorHex(score);
    const percentage = Math.min(100, Math.max(0, (score / max) * 100));

    return (
        <div className="bg-black w-48 h-48 flex flex-col justify-end p-6 relative shadow-neo-lg">
             <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                 <span className="text-white text-7xl font-black tracking-tighter italic">{score}</span>
             </div>
             <div className="relative z-10 w-full">
                 <div className="h-2 w-full bg-gray-800 mb-2 overflow-hidden">
                     <div className="h-full transition-all duration-500 ease-out" style={{ width: `${percentage}%`, backgroundColor: barColor }}></div>
                 </div>
                 <div className="text-gray-500 font-bold text-xs uppercase tracking-widest text-center">Total Score</div>
             </div>
        </div>
    );
};

export const ProgressBar: React.FC<{ value: number; max: number; label?: string; showValue?: boolean }> = ({ value, max, label, showValue }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const colorClass = getRatingColor(value, max).split(' ')[0];

    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold uppercase">{label}</span>
                    {showValue && <span className="text-xs font-mono font-bold">{value}/{max}</span>}
                </div>
            )}
            <div className="h-4 w-full bg-white border-2 border-black relative">
                <div 
                    className={`h-full ${colorClass} transition-all duration-500`} 
                    style={{ width: `${percentage}%` }}
                ></div>
                <div className="absolute inset-0 flex justify-between px-1">
                    {[...Array(5)].map((_, i) => <div key={i} className="w-[1px] h-full bg-black/10"></div>)}
                </div>
            </div>
        </div>
    );
};

export const UnifiedCard: React.FC<{
  image: string;
  title: string;
  subtitle?: string;
  badge?: string;
  metrics?: { value: number | string; type: 'filled' | 'dim' | 'outline'; label?: string }[];
  onClick?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  secondaryIcon?: React.ReactNode;
}> = ({ image, title, subtitle, badge, metrics, onClick, onAction, actionLabel, secondaryIcon }) => {
  return (
    <div 
      className="bg-white border-2 border-black shadow-neo hover:shadow-neo-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full flex flex-col relative group"
      onClick={onClick}
    >
      <div className="aspect-[4/5] relative overflow-hidden border-b-2 border-black">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        
        {badge && (
          <div className="absolute top-2 left-2 bg-neo-pink text-black border-2 border-black text-xs font-bold px-2 py-1 uppercase shadow-neo-sm">
            {badge}
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-1 bg-white">
        {subtitle && <div className="text-xs font-mono font-bold text-gray-500 uppercase mb-1">{subtitle}</div>}
        <div className="text-lg font-bold text-black mb-4 leading-tight group-hover:underline decoration-2 decoration-neo-blue underline-offset-2">{title}</div>
        
        <div className="mt-auto">
          {metrics && metrics.length > 0 && (
            <div className="flex gap-4 mb-4 pb-4 border-b-2 border-black border-dashed">
              {metrics.map((m, i) => (
                  <div key={i} className="flex flex-col">
                      <span className="font-black text-2xl leading-none">{m.value}</span>
                      {m.label && <span className="text-[10px] uppercase font-bold bg-neo-green inline-block px-1 mt-1 border border-black">{m.label}</span>}
                  </div>
              ))}
            </div>
          )}

          {(onAction || secondaryIcon) && (
              <div className="flex justify-between items-center pt-2">
                  {onAction && (
                      <button onClick={(e) => { e.stopPropagation(); onAction(); }} className="text-xs font-black uppercase tracking-wider flex items-center gap-1 hover:bg-black hover:text-white px-2 py-1 transition-colors -ml-2">
                          {actionLabel || 'Check It'} →
                      </button>
                  )}
                  {secondaryIcon && <div className="text-black">{secondaryIcon}</div>}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CrystalSlider: React.FC<{
  label: string;
  value: number;
  max?: number;
  onChange: (val: number) => void;
  multiplier?: number;
}> = ({ label, value, onChange, max = 10, multiplier = 1 }) => {
    
    const getSliderColor = (val: number, maximum: number) => {
        const ratio = val / maximum;
        if (ratio <= 0.5) return "bg-[#ff4d4d]"; 
        if (ratio <= 0.82) return "bg-neo-yellow";
        return "bg-neo-green";
    };

    const color = getSliderColor(value, max);

    return (
        <div className="mb-6 select-none">
            <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-bold text-black bg-white border border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
                    {label} <span className="text-gray-500 text-[10px] ml-1">x{multiplier} weight</span>
                </label>
                <div className="flex items-baseline gap-1">
                    <span className="font-mono text-xl font-bold text-black">{value}</span>
                    <span className="font-mono text-xs text-gray-500">/ {max}</span>
                </div>
            </div>
            <div className="relative h-8 bg-white border-2 border-black cursor-pointer touch-none group hover:shadow-neo-sm transition-shadow"
                 onClick={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const x = e.clientX - rect.left;
                     const width = rect.width;
                     const rawValue = (x / width) * max;
                     const newValue = Math.round(rawValue);
                     onChange(Math.max(1, Math.min(max, newValue || 1)));
                 }}
            >
                <div className="absolute inset-0 flex">
                    {[...Array(max)].map((_, i) => (
                        <div key={i} className="flex-1 border-r border-black/10 last:border-0"></div>
                    ))}
                </div>

                <div 
                    className={`absolute top-0 left-0 h-full ${color} border-r-2 border-black transition-all duration-100`}
                    style={{ width: `${(value / max) * 100}%` }}
                ></div>
                
                <div 
                    className="absolute top-0 h-full w-0.5 bg-black z-10 transition-all duration-100"
                    style={{ left: `${(value / max) * 100}%` }}
                >
                </div>
            </div>
        </div>
    );
};

export const Lightbox: React.FC<{ src: string; alt: string; onClose: () => void }> = ({ src, alt, onClose }) => {
    return (
        <div 
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
            onClick={onClose}
        >
             <div className="relative max-w-6xl w-full max-h-full flex items-center justify-center">
                 <button className="absolute top-0 right-0 text-white font-black text-xl hover:text-neo-yellow p-4" onClick={onClose}>
                     [CLOSE]
                 </button>
                 <img src={src} alt={alt} className="max-w-full max-h-[90vh] object-contain border-2 border-white shadow-neo-lg" />
             </div>
        </div>
    );
};

export const ToastContainer: React.FC<{ toasts: { id: string; message: string }[]; onRemove?: (id: string) => void }> = ({ toasts }) => {
    if (!toasts || toasts.length === 0) return null;
    return (
        <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="bg-black text-white px-6 py-4 border-2 border-white shadow-neo animate-slide-up flex items-center gap-3">
                    <div className="w-2 h-2 bg-neo-green rounded-full"></div>
                    <span className="font-bold text-sm uppercase tracking-wider">{toast.message}</span>
                </div>
            ))}
        </div>
    );
};
