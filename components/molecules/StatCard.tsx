import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: 'electric' | 'molten' | 'gravity' | 'safe';
  index?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, color = 'electric' }) => {
  const textColors = {
    electric: 'text-electric',
    molten: 'text-molten',
    gravity: 'text-gravity',
    safe: 'text-emerald-400'
  }

  // Map safe to electric/gravity for the card gradient logic as Card only supports specific theme colors
  const cardGradient = color === 'safe' ? 'electric' : color;

  return (
    <Card gradientColor={cardGradient as any} className="h-full">
      <div className="flex flex-col h-full justify-between relative z-20">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 text-xs font-mono uppercase tracking-widest font-semibold opacity-70">{label}</h3>
            {icon && <span className={`opacity-50 group-hover:opacity-100 transition-opacity ${textColors[color]}`}>{icon}</span>}
          </div>
          
          <div>
            <div className={`text-4xl font-display font-bold tracking-tight mb-2 ${textColors[color]}`}>
                {value}
            </div>
            {trend && (
                <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${color === 'molten' ? 'bg-molten' : 'bg-electric'} animate-pulse shadow-[0_0_8px_currentColor]`}></span>
                    <span className="text-xs text-gray-500 font-mono tracking-tight group-hover:text-gray-300 transition-colors">{trend}</span>
                </div>
            )}
          </div>
      </div>
      
      {/* Decorative Blur blob inside the card */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40 ${color === 'molten' ? 'bg-molten' : 'bg-electric'}`}></div>
    </Card>
  );
};