import { motion } from "framer-motion";

type AnimatedCardProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

export default function AnimatedCard({
  children,
  delay = 0,
  className = "",
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 50,
        }}

        animate={{
        opacity: 1,
        y: 0,
        }}

        transition={{
        duration: 0.8,
        delay,
        ease: "easeOut",
        }}
      className={className}
    >
      {children}
    </motion.div>
  );
}