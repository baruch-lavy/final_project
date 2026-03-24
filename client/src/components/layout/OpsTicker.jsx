import { useState, useEffect, useRef } from "react";
import { useSocketStore } from "../../stores/socketStore";
import { useEvents } from "../../hooks/useEvents";
import styles from "./OpsTicker.module.css";

const typeLabels = {
  mission_created: "NEW MISSION",
  mission_updated: "MISSION UPDATE",
  asset_deployed: "ASSET DEPLOYED",
  asset_status: "ASSET STATUS",
  alert: "ALERT",
  personnel_update: "PERSONNEL",
  system: "SYSTEM",
};

const OpsTicker = () => {
  const { data: events } = useEvents();
  const socket = useSocketStore((s) => s.socket);
  const [flash, setFlash] = useState(null);
  const tickerRef = useRef(null);
  const animRef = useRef(null);

  const recentEvents = (events || []).slice(0, 20);

  useEffect(() => {
    if (!socket) return;
    const onAlert = (data) => {
      setFlash(data.message || "PRIORITY ALERT");
      setTimeout(() => setFlash(null), 6000);
    };
    socket.on("alert:new", onAlert);
    return () => socket.off("alert:new", onAlert);
  }, [socket]);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;
    let pos = 0;
    const speed = 0.5;
    const animate = () => {
      pos -= speed;
      if (pos <= -ticker.scrollWidth / 2) pos = 0;
      ticker.style.transform = `translateX(${pos}px)`;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [recentEvents.length]);

  const items = recentEvents.map((e) => {
    const label = typeLabels[e.type] || e.type?.toUpperCase() || "EVENT";
    const desc = e.description || e.details || "";
    return `[${label}] ${desc}`;
  });

  if (items.length === 0) {
    items.push("[SYSTEM] AEGIS C2 Platform operational — all systems nominal");
  }

  const tickerText = items.join("   ///   ");

  return (
    <div className={`${styles.ticker} ${flash ? styles.tickerFlash : ""}`}>
      <span className={styles.label}>OPS</span>
      {flash ? (
        <span className={styles.flashMsg}>{flash}</span>
      ) : (
        <div className={styles.scrollWrap}>
          <div className={styles.scrollTrack} ref={tickerRef}>
            <span className={styles.scrollText}>{tickerText}</span>
            <span className={styles.scrollText}>
              &nbsp;&nbsp;&nbsp;///&nbsp;&nbsp;&nbsp;{tickerText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpsTicker;
