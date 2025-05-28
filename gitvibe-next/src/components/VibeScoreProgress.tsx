'use client';

import { motion } from 'framer-motion';

interface VibeScoreProgressProps {
  score: number;
}

export default function VibeScoreProgress({ score }: VibeScoreProgressProps) {
  const getVibeColor = (score: number) => {
    if (score >= 80) return '#10B981'; // green-500
    if (score >= 60) return '#3B82F6'; // blue-500
    if (score >= 40) return '#F59E0B'; // yellow-500
    if (score >= 20) return '#F97316'; // orange-500
    return '#EF4444'; // red-500
  };

  return (
    <div className="relative w-100 h-3 bg-[var(--muted)]/20 rounded-full overflow-hidden mt-3">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{
          duration: 1.5,
          ease: "easeOut",
          delay: 0.2
        }}
        style={{
          backgroundColor: getVibeColor(score),
        }}
        className="absolute top-0 left-0 h-full rounded-full"
      />
    </div>
  );
}
