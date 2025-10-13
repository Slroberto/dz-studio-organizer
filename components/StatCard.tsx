
import React from 'react';

// Custom Hook for count-up animation
const useCountUp = (end: number, isCurrency = false, duration = 1500) => {
    const [count, setCount] = React.useState(0);
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);
    
    React.useEffect(() => {
        let frame = 0;
        const counter = setInterval(() => {
            frame++;
            const progress = (frame / totalFrames);
            const currentCount = end * progress;
            setCount(currentCount);

            if (frame === totalFrames) {
                clearInterval(counter);
                 setCount(end); // Ensure final value is exact
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [end, duration, totalFrames]);
    
    if (isCurrency) {
        return count.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'});
    }
    return Math.round(count);
};


interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    valueColor?: string;
    bgColor?: string;
    iconContainerClass?: string;
    isCurrency?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    icon, 
    valueColor = 'text-white',
    bgColor = 'bg-black/20',
    iconContainerClass = 'bg-granite-gray/20 text-granite-gray-light',
    isCurrency = false 
}) => {
    const numericValue = typeof value === 'string' ? parseFloat(value.replace('%', '').replace(' dias', '')) || 0 : value;
    const animatedValue = useCountUp(numericValue, isCurrency);
    const suffix = typeof value === 'string' && (value.includes('%') || value.includes('dias')) 
        ? value.substring(value.search(/%|dias/))
        : '';

    return (
        <div className={`px-4 py-3 rounded-2xl flex items-center gap-4 shadow-md shadow-black/30 hover:shadow-lg hover:shadow-black/40 transition-all duration-300 card-enter-animation border border-granite-gray/20 ${bgColor}`}>
            <div className={`p-3 rounded-xl ${iconContainerClass}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-400 truncate">{title}</h3>
                <p className={`text-xl font-bold truncate ${valueColor}`}>
                    {animatedValue}{suffix}
                </p>
            </div>
        </div>
    );
};
