import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineChatAlt2,
  HiOutlineBell,
  HiOutlineX,
  HiOutlineSpeakerphone,
} from "react-icons/hi";
import { useSocketStore } from "../../stores/socketStore";
import { useUIStore } from "../../stores/uiStore";
import { useAuthStore } from "../../stores/authStore";
import styles from "./TopBar.module.css";

const pageTitles = {
  "/": "Dashboard",
  "/map": "Tactical Map",
  "/missions": "Mission Control",
  "/assets": "Asset Management",
  "/personnel": "Personnel",
  "/events": "Activity Log",
  "/chat": "Operations Chat",
};

const TopBar = () => {
  const { pathname } = useLocation();
  const connected = useSocketStore((s) => s.connected);
  const socket = useSocketStore((s) => s.socket);
  const toggleChat = useUIStore((s) => s.toggleChat);
  const notifications = useUIStore((s) => s.notifications);
  const clearNotification = useUIStore((s) => s.clearNotification);
  const user = useAuthStore((s) => s.user);
  const [time, setTime] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const notifRef = useRef(null);
  const alertRef = useRef(null);
  const unreadCount = notifications.length;

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (alertRef.current && !alertRef.current.contains(e.target)) {
        setAlertOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sendAlert = (e) => {
    e.preventDefault();
    if (!alertText.trim() || !socket) return;
    socket.emit("alert:broadcast", { message: alertText.trim(), from: user?.username });
    setAlertText("");
    setAlertOpen(false);
  };

  const title = pageTitles[pathname] || "AEGIS";
  const isCommander = user?.role === "Commander";

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
          <span className={`${styles.statusDot} ${!connected ? styles.statusDotOff : ""}`} />
          {connected ? "CONNECTED" : "OFFLINE"}
        </div>

        {/* Commander Alert Broadcast */}
        {isCommander && (
          <div className={styles.alertWrap} ref={alertRef}>
            <button
              className={`${styles.iconBtn} ${alertOpen ? styles.iconBtnActive : ""}`}
              onClick={() => setAlertOpen((o) => !o)}
              title="Broadcast Alert"
            >
              <HiOutlineSpeakerphone />
            </button>
            <AnimatePresence>
              {alertOpen && (
                <motion.div
                  className={styles.alertDropdown}
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className={styles.alertDropdownTitle}>⚠ Broadcast Alert</div>
                  <form onSubmit={sendAlert} className={styles.alertForm}>
                    <input
                      value={alertText}
                      onChange={(e) => setAlertText(e.target.value)}
                      placeholder="Alert message to all operators..."
                      className={styles.alertInput}
                      autoFocus
                    />
                    <button type="submit" className={styles.alertSend} disabled={!alertText.trim()}>
                      Send
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Notification Bell */}
        <div className={styles.notifWrap} ref={notifRef}>
          <button
            className={`${styles.iconBtn} ${notifOpen ? styles.iconBtnActive : ""}`}
            onClick={() => setNotifOpen((o) => !o)}
            title="Notifications"
          >
            <HiOutlineBell />
            {unreadCount > 0 && (
              <motion.span
                className={styles.notifBadge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={unreadCount}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                className={styles.notifDropdown}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <div className={styles.notifHeader}>
                  <span>Notifications ({unreadCount})</span>
                  {unreadCount > 0 && (
                    <button
                      className={styles.clearAllBtn}
                      onClick={() => notifications.forEach((n) => clearNotification(n.id))}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className={styles.notifList}>
                  {notifications.length === 0 && (
                    <div className={styles.notifEmpty}>No notifications</div>
                  )}
                  {notifications.map((n) => (
                    <div key={n.id} className={`${styles.notifItem} ${styles[`notifItem_${n.type}`]}`}>
                      <div className={styles.notifItemBody}>
                        {n.title && <div className={styles.notifItemTitle}>{n.title}</div>}
                        <div className={styles.notifItemMsg}>{n.message}</div>
                      </div>
                      <button className={styles.notifItemClose} onClick={() => clearNotification(n.id)}>
                        <HiOutlineX />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className={styles.chatBtn} onClick={toggleChat}>
          <HiOutlineChatAlt2 /> Ops Chat
        </button>
      </div>
    </header>
  );
};

export default TopBar;
