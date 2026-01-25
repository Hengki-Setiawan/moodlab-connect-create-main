import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MotionSectionProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export const MotionSection = ({ children, className = "", delay = 0 }: MotionSectionProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
