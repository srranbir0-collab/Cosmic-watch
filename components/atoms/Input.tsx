import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', type = 'text', ...props }) => {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState(props.value || '');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (props.onChange) props.onChange(e);
  };

  const isFilled = value !== '';
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  // Password Strength Calc
  const getStrength = (val: string) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  };

  const strength = type === 'password' ? getStrength(value as string) : 0;
  const strengthColors = ['bg-void-700', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className={`relative mb-6 ${className}`}>
      <div className={`
        relative group rounded-lg bg-void-900 border transition-all duration-300
        ${error ? 'border-molten shadow-[0_0_10px_rgba(255,61,0,0.2)]' : focused ? 'border-electric shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'border-void-700 hover:border-gray-600'}
      `}>
        
        {/* Icon Prefix */}
        {icon && (
            <div className={`absolute left-4 top-4 transition-colors duration-300 ${focused ? 'text-electric' : 'text-gray-500'}`}>
                {icon}
            </div>
        )}

        <input
          {...props}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={(e) => { setFocused(true); if(props.onFocus) props.onFocus(e); }}
          onBlur={(e) => { setFocused(false); if(props.onBlur) props.onBlur(e); }}
          className={`
            w-full bg-transparent text-white font-sans text-base px-4 py-4 rounded-lg outline-none
            ${icon ? 'pl-12' : ''}
            placeholder-transparent z-10 relative
          `}
          placeholder={label}
        />

        {/* Floating Label */}
        <motion.label
          initial={false}
          animate={{
            y: focused || isFilled ? -28 : 0,
            scale: focused || isFilled ? 0.85 : 1,
            x: focused || isFilled ? (icon ? -30 : -10) : (icon ? 36 : 0),
            color: error ? '#FF3D00' : focused ? '#00F0FF' : '#9CA3AF'
          }}
          className={`absolute left-4 top-4 pointer-events-none origin-left font-mono tracking-wide uppercase transition-colors duration-200 z-0`}
        >
          {label}
        </motion.label>

        {/* Password Toggle */}
        {type === 'password' && (
            <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors z-20"
            >
                {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.414-1.414A9 9 0 0010 3C5.522 3 1.732 5.943.458 10a9.081 9.081 0 002.665 3.513L3.707 2.293zm-1.03 2.873A8.963 8.963 0 0110 5c4.478 0 8.268 2.943 9.542 7a8.96 8.96 0 01-1.782 3.19l-1.353-1.352A5.002 5.002 0 0014 10a4 4 0 00-4-4 4.96 4.96 0 00-2.816.88L2.677 5.166z" clipRule="evenodd" /><path d="M7.172 8.586a2 2 0 012.828 2.828l-2.828-2.828z" /></svg>
                )}
            </button>
        )}
      </div>

      {/* Password Strength Meter */}
      {type === 'password' && focused && (
          <div className="flex h-1 mt-2 gap-1 overflow-hidden rounded-full">
              {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={step} 
                    className={`flex-1 transition-colors duration-300 ${strength >= step ? strengthColors[strength] : 'bg-void-800'}`} 
                  />
              ))}
          </div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-molten text-xs font-mono mt-2 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};