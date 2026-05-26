import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Info, Loader2, X } from 'lucide-react';

interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'saving';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    if (type === 'saving') {
      // Auto-dismiss saving after a longer time just in case
      const timer = setTimeout(onClose, 10000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  const icons = {
    success: <Check className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    saving: <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />,
  };

  const bgs = {
    success: 'bg-zinc-900 border-green-500/20',
    error: 'bg-zinc-900 border-red-500/20',
    info: 'bg-zinc-900 border-blue-500/20',
    saving: 'bg-zinc-900 border-zinc-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 
        rounded-xl border shadow-xl backdrop-blur-md min-w-[300px]
        ${bgs[type]}
      `}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium text-white flex-1">{message}</p>
      <button 
        onClick={onClose}
        className="text-zinc-500 hover:text-white transition-colors shrink-0 ml-4"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
