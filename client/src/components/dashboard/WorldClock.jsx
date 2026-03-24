import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./WorldClock.module.css";

const ZONES = [
  { label: "LOCAL", tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { label: "UTC", tz: "UTC" },
  { label: "EST", tz: "America/New_York" },
  { label: "GST", tz: "Asia/Dubai" },
  { label: "IST", tz: "Asia/Kolkata" },
];

const formatTime = (tz) =>
  new Date().toLocaleTimeString("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const formatDate = (tz) =>
  new Date().toLocaleDateString("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

const WorldClock = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className={styles.title}>WORLD CLOCK</div>
      <div className={styles.clocks}>
        {ZONES.map((z) => (
          <div key={z.label} className={styles.zone}>
            <div className={styles.zoneLabel}>{z.label}</div>
            <div className={styles.zoneTime}>{formatTime(z.tz)}</div>
            <div className={styles.zoneDate}>{formatDate(z.tz)}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default WorldClock;
