import { use, Suspense } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  HiOutlineFlag,
  HiOutlineTruck,
  HiOutlineStatusOnline,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineClipboardList,
} from "react-icons/hi";
import { useDashboardStats } from "../hooks/useEvents";
import { useEvents } from "../hooks/useEvents";
import { useMissions } from "../hooks/useMissions";
import { Spinner } from "../components/ui/Loader";
import styles from "./DashboardPage.module.css";

const STATUS_COLORS = {
  Active: "#10b981",
  Planning: "#3b82f6",
  Completed: "#6b7280",
  Aborted: "#ef4444",
};
const TYPE_COLORS = {
  Vehicle: "#3b82f6",
  Personnel: "#10b981",
  UAV: "#8b5cf6",
  Equipment: "#f59e0b",
};
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

const TOOLTIP_STYLE = {
  background: "#1a2332",
  border: "1px solid rgba(75,85,99,0.4)",
  borderRadius: 8,
  color: "#e5e7eb",
};

const anim = (i) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.3 },
});

// Animated counter
const AnimatedValue = ({ value }) => (
  <motion.span
    key={value}
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", damping: 12, stiffness: 200 }}
  >
    {value}
  </motion.span>
);

// Threat Level calculator
const getThreatLevel = (missions = []) => {
  const active = missions.filter((m) => m.status === "Active");
  if (active.length === 0) return { level: "LOW", color: "#10b981", value: 15 };
  const criticalCount = active.filter((m) => m.priority === "Critical").length;
  const highCount = active.filter((m) => m.priority === "High").length;
  const score = criticalCount * 40 + highCount * 20 + active.length * 5;
  if (score >= 60) return { level: "CRITICAL", color: "#ef4444", value: 95 };
  if (score >= 40) return { level: "HIGH", color: "#f59e0b", value: 72 };
  if (score >= 20) return { level: "ELEVATED", color: "#3b82f6", value: 48 };
  return { level: "LOW", color: "#10b981", value: 20 };
};

// Generate fake trend data for the last 7 days
const generateTrendData = (totalMissions = 0) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
  const base = Math.max(1, totalMissions - 6);
  return days.map((day, i) => ({
    day,
    missions: base + i + Math.floor(Math.random() * 2),
    active: Math.floor((base + i) * 0.4),
  }));
};

const DashboardContent = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { events } = useEvents(15);
  const { missions } = useMissions();

  if (isLoading) return <Spinner />;
  if (!stats) return null;

  const missionStatusData = (stats.missionsByStatus || []).map(({ _id, count }) => ({ name: _id, value: count }));
  const assetTypeData = (stats.assetsByType || []).map(({ _id, count }) => ({ name: _id, value: count }));
  const assetStatusData = (stats.assetsByStatus || []).map(({ _id, count }) => ({ name: _id, value: count }));
  const trendData = generateTrendData(stats.totalMissions);
  const threat = getThreatLevel(missions);

  return (
    <>
      {/* Stat cards */}
      <div className={styles.grid}>
        {[
          { icon: <HiOutlineFlag />, value: stats.activeMissions, label: "Active Missions", color: "Blue" },
          { icon: <HiOutlineFlag />, value: stats.totalMissions, label: "Total Missions", color: "Green" },
          { icon: <HiOutlineTruck />, value: stats.totalAssets, label: "Total Assets", color: "Orange" },
          { icon: <HiOutlineStatusOnline />, value: stats.onlineUsers, label: "Online Personnel", color: "Purple" },
        ].map((s, i) => (
          <motion.div key={s.label} className={styles.statCard} {...anim(i)}>
            <div className={`${styles.statIcon} ${styles[`statIcon${s.color}`]}`}>{s.icon}</div>
            <div>
              <div className={styles.statValue}><AnimatedValue value={s.value} /></div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Threat Level + System Status row */}
      <div className={styles.threatRow}>
        <motion.div className={styles.threatPanel} {...anim(4)}>
          <div className={styles.panelTitle}>
            <HiOutlineShieldCheck style={{ verticalAlign: "middle", marginRight: 6 }} />
            Threat Level
          </div>
          <div className={styles.threatContent}>
            <div className={styles.threatLevel} style={{ color: threat.color }}>
              {threat.level}
            </div>
            <div className={styles.threatBar}>
              <motion.div
                className={styles.threatBarFill}
                style={{ background: threat.color }}
                initial={{ width: 0 }}
                animate={{ width: `${threat.value}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              />
            </div>
            <div className={styles.threatSub}>
              {missions.filter((m) => m.status === "Active").length} active ops &bull;{" "}
              {missions.filter((m) => m.priority === "Critical" && m.status === "Active").length} critical
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.sysPanel} {...anim(5)}>
          <div className={styles.panelTitle}>System Status</div>
          <div className={styles.sysList}>
            {[
              { label: "Command Network", ok: true },
              { label: "Satellite Uplink", ok: true },
              { label: "Asset Tracking", ok: true },
              { label: "Comms Relay", ok: stats.onlineUsers > 0 },
            ].map((item) => (
              <div key={item.label} className={styles.sysItem}>
                <div className={`${styles.sysDot} ${item.ok ? styles.sysDotOk : styles.sysDotWarn}`} />
                <span className={styles.sysLabel}>{item.label}</span>
                <span className={item.ok ? styles.sysOk : styles.sysWarn}>
                  {item.ok ? "OPERATIONAL" : "DEGRADED"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mission Trend */}
        <motion.div className={styles.panel} {...anim(6)}>
          <div className={styles.panelTitle}>
            <HiOutlineClipboardList style={{ verticalAlign: "middle", marginRight: 6 }} />
            Mission Trend (7d)
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="missionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="missions" stroke="#3b82f6" fill="url(#missionGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts */}
      <div className={styles.chartsRow}>
        <motion.div className={styles.panel} {...anim(7)}>
          <div className={styles.panelTitle}>Missions by Status</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={missionStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={4}>
                {missionStatusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
                ))}
              </Pie>
              <Legend formatter={(v) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{v}</span>} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className={styles.panel} {...anim(8)}>
          <div className={styles.panelTitle}>Assets by Type</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={assetTypeData}>
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {assetTypeData.map((entry) => (
                  <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className={styles.panel} {...anim(9)}>
          <div className={styles.panelTitle}>Asset Status</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={assetStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={4}>
                {assetStatusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
                ))}
              </Pie>
              <Legend formatter={(v) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{v}</span>} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div className={styles.panel} {...anim(10)}>
        <div className={styles.panelTitle}>
          <HiOutlineLightningBolt style={{ verticalAlign: "middle", marginRight: 6 }} />
          Live Activity Feed
        </div>
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
                  {event.createdBy?.username && <>{event.createdBy.username} &bull; </>}
                  {new Date(event.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div className={styles.eventDot} style={{ background: EVENT_COLORS[event.type] || "#6b7280" }} />
            </motion.div>
          ))}
          {events.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: 10 }}>No recent activity</div>
          )}
        </div>
      </motion.div>
    </>
  );
};

const DashboardPage = () => (
  <Suspense fallback={<Spinner />}>
    <DashboardContent />
  </Suspense>
);

export default DashboardPage;
