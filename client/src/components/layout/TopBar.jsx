import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineChatAlt2,
  HiOutlineBell,
  HiOutlineX,
  HiOutlineSpeakerphone,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineInformationCircle,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import { useSocketStore } from "../../stores/socketStore";
import { useUIStore } from "../../stores/uiStore";
import { useAuthStore } from "../../stores/authStore";
import { useNotifications, useMarkRead, useMarkAllRead } from "../../hooks/useNotifications";
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

const typeIcons = {
  mission_assigned: HiOutlineShieldCheck,
  mission_status: HiOutlineInformationCircle,
  alert: HiOutlineExclamation,
  mention: HiOutlineChatAlt2,
  system: HiOutlineCheckCircle,
};

const typeColors = {
  mission_assigned: "var(--accent-blue)",
  mission_status: "var(--accent-cyan, #22d3ee)",
  alert: "var(--accent-red)",
  mention: "var(--accent-orange)",
  system: "var(--accent-green)",
};

const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const TopBar = () => {
  const { pathname } = useLocation();
  const connected = useSocketStore((s) => s.connected);
  const socket = useSocketStore((s) => s.socket);
  const toggleChat = useUIStore((s) => s.toggleChat);
  const user = useAuthStore((s) => s.user);
  const { notifications, unreadCount, loading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const [time, setTime] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const notifRef = useRef(null);
  const alertRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
      if (alertRef.current && !alertRef.current.contains(e.target))
        setAlertOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sendAlert = (e) => {
    e.preventDefault();
    if (!alertText.trim() || !socket) return;
    socket.emit("alert:broadcast", {
      message: alertText.trim(),
      from: user?.username,
    });
    setAlertText("");
    setAlertOpen(false);
  };

  const handleMarkRead = (id) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  const title = pageTitles[pathname] || "AEGIS";
  const isCommander = user?.role === "Commander";

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <span className={styles.pageSub}>AEGIS C2 PLATFORM</span>
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
            className={`${styles.statusDot} ${
              !connected ? styles.statusDotOff : ""
            }`}
          />
          {connected ? "CONNECTED" : "OFFLINE"}
        </div>

        {isCommander && (
          <div className={styles.alertWrap} ref={alertRef}>
            <button
              className={`${styles.iconBtn} ${
                alertOpen ? styles.iconBtnActive : ""
              }`}
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
                  <div className={styles.alertDropdownTitle}>
                    BROADCAST ALERT
                  </div>
                  <form onSubmit={sendAlert} className={styles.alertForm}>
                    <input
                      value={alertText}
                      onChange={(e) => setAlertText(e.target.value)}
                      placeholder="Alert message to all operators..."
                      className={styles.alertInput}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className={styles.alertSend}
                      disabled={!alertText.trim()}
                    >
                      TRANSMIT
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Notification Center */}
        <div className={styles.notifWrap} ref={notifRef}>
          <button
            className={`${styles.iconBtn} ${
              notifOpen ? styles.iconBtnActive : ""
            }`}
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
                  <span className={styles.notifHeaderTitle}>
                    NOTIFICATIONS
                    {unreadCount > 0 && (
                      <span className={styles.notifCountChip}>{unreadCount}</span>
                    )}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      className={styles.clearAllBtn}
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className={styles.notifList}>
                  {loading && (
                    <div className={styles.notifEmpty}>Loading...</div>
                  )}
                  {!loading && notifications.length === 0 && (
                    <div className={styles.notifEmpty}>
                      <HiOutlineBell style={{ fontSize: 24, marginBottom: 6 }} />
                      <div>No notifications</div>
                    </div>
                  )}
                  {notifications.map((n) => {
                    const Icon = typeIcons[n.type] || HiOutlineInformationCircle;
                    const color = typeColors[n.type] || "var(--text-secondary)";
                    return (
                      <motion.div
                        key={n._id}
                        className={`${styles.notifItem} ${
                          !n.read ? styles.notifItemUnread : ""
                        }`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => !n.read && handleMarkRead(n._id)}
                        style={{ cursor: n.read ? "default" : "pointer" }}
                      >
                        <div
                          className={styles.notifIcon}
                          style={{ color }}
                        >
                          <Icon />
                        </div>
                        <div className={styles.notifItemBody}>
                          {n.title && (
                            <div className={styles.notifItemTitle}>{n.title}</div>
                          )}
                          <div className={styles.notifItemMsg}>{n.body}</div>
                          <div className={styles.notifItemTime}>
                            {formatTimeAgo(n.createdAt)}
                          </div>
                        </div>
                        {!n.read && <span className={styles.unreadDot} />}
                      </motion.div>
                    );
                  })}
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
