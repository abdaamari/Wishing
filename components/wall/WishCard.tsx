import { motion } from 'framer-motion';

export default function WishCard({ wish }: { wish: any }) {
  return (
    <motion.div
      className={`p-4 border rounded bg-${wish.color} text-primary`}
      whileHover={{ scale: 1.03 }}
      layout
    >
      <p className="font-serif">{wish.message}</p>
      <p className="text-sm mt-2">- {wish.name}</p>
    </motion.div>
  );
}
