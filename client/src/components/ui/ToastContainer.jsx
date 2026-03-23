import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineX,
  HiOutlineBell,
} from "react-icons/hi";
import { useUIStore } from "../../stores/uiStore";
import styles from "./ToastContainer.module.css";

const ICONS = {
  success: <HiOutlineCheckCircle />,
  error: <HiOutlineExclamationCircle />,
  info: <HiOutlineInformationCircle />,
  warning: <HiOutlineExclamationCircle />,
  alert: <HiOutlineBell />,
};

const Toast = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.duration !== 0) {
      const timer = setTimeout(() => onClose(notification.id), notification.duration ?? 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`${styles.toast} ${styles[`toast_${notification.type || "info"}`]}`}
    >
      <div className={styles.toastIcon}>
        {ICONS[notification.type || "info"]}
      </div>
      <div className={styles.toastBody}>
        {notification.title && <div className={styles.toastTitle}>{notification.title}</div>}
        <div className={styles.toastMsg}>{notification.message}</div>
      </div>
      <button className={styles.toastClose} onClick={() => onClose(notification.id)}>
        <HiOutlineX />
      </button>
    </motion.div>
  );
};

const ToastContainer = () => {
  const notifications = useUIStore((s) => s.notifications);
  const clearNotification = useUIStore((s) => s.clearNotification);

  return (
    <div className={styles.container}>
      <AnimatePresence mode="popLayout">
        {notifications.slice(0, 5).map((n) => (
          <Toast key={n.id} notification={n} onClose={clearNotification} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
