import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import {
  HiOutlineLightningBolt,
  HiOutlineTruck,
  HiOutlineExclamation,
  HiOutlineCog,
} from "react-icons/hi";
import { useEvents } from "../hooks/useEvents";
import { Spinner } from "../components/ui/Loader";
import styles from "./EventsPage.module.css";

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

const EVENT_LABELS = {
  mission_created: "Mission Created",
  mission_updated: "Mission Updated",
  mission_status_changed: "Status Change",
  mission_deleted: "Mission Deleted",
  asset_created: "Asset Added",
  asset_moved: "Asset Moved",
  asset_status_changed: "Asset Status",
  alert: "Alert",
  user_login: "User Login",
};

const EVENT_ICONS = {
  mission_created: "🚩",
  mission_updated: "✏️",
  mission_status_changed: "🔄",
  mission_deleted: "🗑️",
  asset_created: "📦",
  asset_moved: "📍",
  asset_status_changed: "⚡",
  alert: "⚠️",
  user_login: "👤",
};

const ALL_TYPES = ["All", ...Object.keys(EVENT_LABELS)];

const EventsContent = () => {
  const { events, loading } = useEvents(100);
  const [filter, setFilter] = useState("All");

  if (loading) return <Spinner />;

  const filtered = filter === "All" ? events : events.filter((e) => e.type === filter);

  return (
    <>
      <div className={styles.header}>
        <span className={styles.title}>{filtered.length} events</span>
        <div className={styles.liveIndicator}>
          <div className={styles.liveDot} />
          LIVE
        </div>
      </div>

      <div className={styles.filterScroll}>
        {ALL_TYPES.map((type) => (
          <button
            key={type}
            className={`${styles.filterBtn} ${filter === type ? styles.filterBtnActive : ""}`}
            onClick={() => setFilter(type)}
            style={filter === type && type !== "All" ? { borderColor: EVENT_COLORS[type], color: EVENT_COLORS[type] } : {}}
          >
            {type === "All" ? "All" : `${EVENT_ICONS[type] || "●"} ${EVENT_LABELS[type]}`}
          </button>
        ))}
      </div>

      <div className={styles.timeline}>
        <AnimatePresence mode="popLayout">
          {filtered.map((event, i) => {
            const color = EVENT_COLORS[event.type] || "#6b7280";
            return (
              <motion.div
                key={event._id || i}
                className={styles.timelineItem}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.02 }}
                layout
              >
                <div className={styles.timelineLine} style={{ background: color }} />
                <div className={styles.timelineDot} style={{ background: color, boxShadow: `0 0 8px ${color}80` }}>
                  <span className={styles.timelineDotIcon}>{EVENT_ICONS[event.type] || "●"}</span>
                </div>
                <div className={styles.timelineCard}>
                  <div className={styles.timelineCardHeader}>
                    <span className={styles.timelineType} style={{ color }}>
                      {EVENT_LABELS[event.type] || event.type}
                    </span>
                    <span className={styles.timelineTime}>
                      {new Date(event.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className={styles.timelineDesc}>{event.description}</div>
                  {event.createdBy?.username && (
                    <div className={styles.timelineBy}>by {event.createdBy.username}</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className={styles.empty}>No events found</div>
        )}
      </div>
    </>
  );
};

const EventsPage = () => (
  <Suspense fallback={<Spinner />}>
    <EventsContent />
  </Suspense>
);

export default EventsPage;
