import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import styles from "./StatCard.module.css";

const anim = (i) => ({
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" },
});

const AnimatedCounter = ({ value }) => {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to = typeof value === "number" ? value : parseInt(value) || 0;
    prev.current = to;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const duration = 600;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(from + (to - from) * ease));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <span>{display}</span>;
};

const StatCard = ({ icon, value, label, color, index = 0, suffix }) => (
  <motion.div
    className={styles.statCard}
    {...anim(index)}
    whileHover={{ y: -2 }}
  >
    <div className={styles.hudTL} />
    <div className={styles.hudBR} />
    <div className={`${styles.statIcon} ${styles[`statIcon${color}`]}`}>
      {icon}
    </div>
    <div>
      <div className={styles.statValue}>
        <AnimatedCounter value={value} />
        {suffix && <span className={styles.statSuffix}>{suffix}</span>}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
    <div className={styles.glowLine} />
  </motion.div>
);

export default StatCard;
