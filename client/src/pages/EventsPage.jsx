import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import {
  HiOutlineLightningBolt,
  HiOutlineTruck,
  HiOutlineExclamation,
  HiOutlineCog,
} from "react-icons/hi";
import { useEvents } from "../hooks/useEvents";
import Badge from "../components/ui/Badge";
import { Spinner } from "../components/ui/Loader";
import styles from "./EventsPage.module.css";

const FILTERS = ["All", "Mission", "Asset", "Alert", "System"];

const getEventCategory = (type) => {
  if (type?.startsWith("mission")) return "Mission";
  if (type?.startsWith("asset")) return "Asset";
  if (type?.includes("alert")) return "Alert";
  return "System";
};

const ICONS = {
  Mission: HiOutlineLightningBolt,
  Asset: HiOutlineTruck,
  Alert: HiOutlineExclamation,
  System: HiOutlineCog,
};

const EventRow = ({ event, index }) => {
  const cat = getEventCategory(event.type);
  const Icon = ICONS[cat] || HiOutlineCog;

  return (
    <motion.div
      className={styles.eventRow}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className={`${styles.eventIcon} ${styles[cat.toLowerCase()]}`}>
        <Icon />
      </div>
      <div className={styles.eventBody}>
        <div className={styles.eventDesc}>{event.description}</div>
        <div className={styles.eventMeta}>
          <Badge variant={cat}>{event.type?.replace(/_/g, " ")}</Badge>
          {event.createdBy?.username && <span>{event.createdBy.username}</span>}
        </div>
      </div>
      <div className={styles.eventTime}>
        {new Date(event.createdAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </motion.div>
  );
};

const EventsContent = () => {
  const { events, loading } = useEvents();
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All"
      ? events
      : events.filter((e) => getEventCategory(e.type) === filter);

  if (loading) return <Spinner />;

  return (
    <>
      <div className={styles.header}>
        <span className={styles.title}>
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        <AnimatePresence>
          {filtered.map((event, i) => (
            <EventRow key={event._id} event={event} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            padding: 40,
            fontSize: 14,
          }}
        >
          No events recorded
        </div>
      )}
    </>
  );
};

const EventsPage = () => (
  <Suspense fallback={<Spinner />}>
    <EventsContent />
  </Suspense>
);

export default EventsPage;
