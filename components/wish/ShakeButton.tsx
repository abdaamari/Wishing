import { motion } from 'framer-motion';

export default function ShakeButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const shake = {
    animate: { rotate: [0, -10, 10, -10, 10, 0] },
    transition: { duration: 0.5 },
  };

  return (
    <motion.button
      whileTap={shake.animate}
      transition={shake.transition}
      onClick={onClick}
      className="px-6 py-3 bg-peach text-primary rounded-full shadow hover:scale-105"
    >
      {children}
    </motion.button>
  );
}
