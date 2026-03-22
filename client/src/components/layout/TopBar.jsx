import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { HiOutlineChatAlt2 } from "react-icons/hi";
import { useSocketStore } from "../../stores/socketStore";
import { useUIStore } from "../../stores/uiStore";
import styles from "./TopBar.module.css";

const pageTitles = {
  "/": "Dashboard",
  "/map": "Tactical Map",
  "/missions": "Mission Control",
  "/assets": "Asset Management",
  "/events": "Activity Log",
  "/chat": "Operations Chat",
};

const TopBar = () => {
  const { pathname } = useLocation();
  const connected = useSocketStore((s) => s.connected);
  const toggleChat = useUIStore((s) => s.toggleChat);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const title = pageTitles[pathname] || "AEGIS";

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
      <div className={styles.right}>
        <span className={styles.time}>
          {time.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
        <div className={styles.statusBadge}>
          <span
            className={`${styles.statusDot} ${!connected ? styles.statusDotOff : ""}`}
          />
          {connected ? "CONNECTED" : "OFFLINE"}
        </div>
        <button className={styles.chatBtn} onClick={toggleChat}>
          <HiOutlineChatAlt2 /> Ops Chat
        </button>
      </div>
    </header>
  );
};

export default TopBar;
