import { motion } from "framer-motion";
import styles from "./ActivityFeed.module.css";

const EVENT_COLORS = {
  mission_created: "#3b82f6",
  mission_updated: "#06b6d4",
  mission_status_changed: "#10b981",
  mission_deleted: "#ef4444",
  asset_created: "#8b5cf6",
  asset_moved: "#f59e0b",
  asset_status_changed: "#f59e0b",
  alert: "#ef4444",
  user_login: "#10b981",
};

const EVENT_ICONS = {
  mission_created: "🚩",
  mission_updated: "✏️",
  mission_status_changed: "🔄",
  mission_deleted: "🗑️",
  asset_created: "📦",
  asset_moved: "📍",
  alert: "⚠️",
  user_login: "👤",
};

const ActivityFeed = ({ events, index = 10 }) => (
  <motion.div
    className={styles.panel}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
  >
    <div className={styles.panelTitle}>Live Activity Feed</div>
    <div className={styles.eventList}>
      {events.map((event, i) => (
        <motion.div
          key={event._id || i}
          className={styles.eventItem}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <div className={styles.eventIcon}>
            {EVENT_ICONS[event.type] || "●"}
          </div>
          <div>
            <div className={styles.eventDesc}>{event.description}</div>
            <div className={styles.eventTime}>
              {event.createdBy?.username && (
                <>{event.createdBy.username} &bull; </>
              )}
              {new Date(event.createdAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div
            className={styles.eventDot}
            style={{ background: EVENT_COLORS[event.type] || "#6b7280" }}
          />
        </motion.div>
      ))}
      {events.length === 0 && (
        <div style={{ color: "var(--text-muted)", fontSize: 13, padding: 10 }}>
          No recent activity
        </div>
      )}
    </div>
  </motion.div>
);

export default ActivityFeed;
