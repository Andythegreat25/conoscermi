import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 12 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.16, 1, 0.3, 1] 
        }}
        className="w-24 h-24 bg-gradient-to-br from-primary to-primary-container rounded-[2rem] flex items-center justify-center shadow-2xl mb-8"
      >
        <Leaf className="text-white" size={48} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-black tracking-tighter text-primary">Conoscermi</h1>
        <p className="text-on-surface-variant font-medium tracking-wide opacity-80 uppercase text-[10px]">
          Il tuo spazio di riflessione
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ 
          delay: 1, 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-12"
      >
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
        </div>
      </motion.div>
    </div>
  );
}
