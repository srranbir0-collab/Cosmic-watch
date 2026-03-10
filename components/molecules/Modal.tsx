import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 sm:p-0">
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-void-950/80"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-void-900 rounded-2xl overflow-hidden border border-void-700 shadow-2xl shadow-black"
          >
            {/* Layered Gradient Backgrounds */}
            <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-electric/10 blur-[100px]" />
            <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] rounded-full bg-molten/5 blur-[100px]" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-2xl font-display font-bold text-white tracking-wide">{title}</h2>
              <button 
                onClick={onClose}
                className="group relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <div className="absolute w-5 h-[2px] bg-gray-400 rotate-45 group-hover:bg-white group-hover:rotate-90 transition-all duration-300" />
                <div className="absolute w-5 h-[2px] bg-gray-400 -rotate-45 group-hover:bg-white group-hover:-rotate-90 transition-all duration-300" />
              </button>
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {children}
            </div>

            {/* Footer Actions if needed could go here */}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};