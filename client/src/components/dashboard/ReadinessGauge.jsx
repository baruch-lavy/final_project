import { motion } from "framer-motion";
import styles from "./ReadinessGauge.module.css";

const ReadinessGauge = ({ value = 100, label = "ASSET READINESS" }) => {
  const radius = 60;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color =
    value >= 80
      ? "var(--accent-green)"
      : value >= 50
        ? "var(--accent-orange)"
        : "var(--accent-red)";

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.35 }}
    >
      <div className={styles.title}>{label}</div>
      <div className={styles.gaugeWrap}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* bg ring */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={stroke}
          />
          {/* value ring */}
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        <div className={styles.gaugeCenter}>
          <div className={styles.gaugeValue} style={{ color }}>
            {value}%
          </div>
          <div className={styles.gaugeLabel}>READY</div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReadinessGauge;
