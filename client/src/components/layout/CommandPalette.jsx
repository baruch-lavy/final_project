import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineSearch,
  HiOutlineMap,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineChatAlt2,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import styles from "./CommandPalette.module.css";

const ROUTES = [
  {
    id: "dash",
    label: "Dashboard",
    path: "/",
    icon: HiOutlineChartBar,
    keywords: "dashboard home overview stats",
  },
  {
    id: "map",
    label: "Tactical Map",
    path: "/map",
    icon: HiOutlineMap,
    keywords: "map tactical gps location",
  },
  {
    id: "missions",
    label: "Mission Control",
    path: "/missions",
    icon: HiOutlineShieldCheck,
    keywords: "missions tasks operations kanban",
  },
  {
    id: "assets",
    label: "Asset Management",
    path: "/assets",
    icon: HiOutlineTruck,
    keywords: "assets vehicles equipment drones",
  },
  {
    id: "personnel",
    label: "Personnel",
    path: "/personnel",
    icon: HiOutlineUserGroup,
    keywords: "personnel team people staff",
  },
  {
    id: "events",
    label: "Activity Log",
    path: "/events",
    icon: HiOutlineClock,
    keywords: "events log activity history",
  },
  {
    id: "chat",
    label: "Operations Chat",
    path: "/chat",
    icon: HiOutlineChatAlt2,
    keywords: "chat messages communication",
  },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setSelected(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return ROUTES;
    const q = query.toLowerCase();
    return ROUTES.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.keywords.includes(q) ||
        r.path.includes(q),
    );
  }, [query]);

  const execute = (item) => {
    navigate(item.path);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && filtered[selected]) {
      execute(filtered[selected]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className={styles.palette}
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className={styles.header}>
              <HiOutlineLightningBolt className={styles.searchIcon} />
              <input
                ref={inputRef}
                className={styles.input}
                placeholder="Navigate to..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(0);
                }}
                onKeyDown={handleKeyDown}
              />
              <kbd className={styles.kbd}>ESC</kbd>
            </div>
            <div className={styles.list}>
              {filtered.length === 0 && (
                <div className={styles.empty}>No results found</div>
              )}
              {filtered.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`${styles.item} ${
                      i === selected ? styles.itemActive : ""
                    }`}
                    onClick={() => execute(item)}
                    onMouseEnter={() => setSelected(i)}
                  >
                    <Icon className={styles.itemIcon} />
                    <span className={styles.itemLabel}>{item.label}</span>
                    <span className={styles.itemPath}>{item.path}</span>
                  </button>
                );
              })}
            </div>
            <div className={styles.footer}>
              <span>
                <kbd className={styles.kbdSm}>↑↓</kbd> navigate
              </span>
              <span>
                <kbd className={styles.kbdSm}>↵</kbd> open
              </span>
              <span>
                <kbd className={styles.kbdSm}>esc</kbd> close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
