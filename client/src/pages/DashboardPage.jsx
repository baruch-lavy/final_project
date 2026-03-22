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
} from "recharts";
import {
  HiOutlineFlag,
  HiOutlineTruck,
  HiOutlineStatusOnline,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import { useDashboardStats } from "../hooks/useEvents";
import { useEvents } from "../hooks/useEvents";
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

const anim = (i) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.3 },
});

const DashboardContent = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { events } = useEvents(15);

  if (isLoading) return <Spinner />;
  if (!stats) return null;

  const missionStatusData = (stats.missionsByStatus || []).map(
    ({ _id, count }) => ({
      name: _id,
      value: count,
    }),
  );
  const assetTypeData = (stats.assetsByType || []).map(({ _id, count }) => ({
    name: _id,
    value: count,
  }));
  const assetStatusData = (stats.assetsByStatus || []).map(
    ({ _id, count }) => ({
      name: _id,
      value: count,
    }),
  );

  return (
    <>
      {/* Stat cards */}
      <div className={styles.grid}>
        {[
          {
            icon: <HiOutlineFlag />,
            value: stats.activeMissions,
            label: "Active Missions",
            color: "Blue",
          },
          {
            icon: <HiOutlineFlag />,
            value: stats.totalMissions,
            label: "Total Missions",
            color: "Green",
          },
          {
            icon: <HiOutlineTruck />,
            value: stats.totalAssets,
            label: "Total Assets",
            color: "Orange",
          },
          {
            icon: <HiOutlineStatusOnline />,
            value: stats.onlineUsers,
            label: "Online Personnel",
            color: "Purple",
          },
        ].map((s, i) => (
          <motion.div key={s.label} className={styles.statCard} {...anim(i)}>
            <div
              className={`${styles.statIcon} ${styles[`statIcon${s.color}`]}`}
            >
              {s.icon}
            </div>
            <div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className={styles.chartsRow}>
        <motion.div className={styles.panel} {...anim(4)}>
          <div className={styles.panelTitle}>Missions by Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={missionStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={4}
              >
                {missionStatusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] || "#6b7280"}
                  />
                ))}
              </Pie>
              <Legend
                formatter={(v) => (
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>{v}</span>
                )}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a2332",
                  border: "1px solid rgba(75,85,99,0.4)",
                  borderRadius: 8,
                  color: "#e5e7eb",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className={styles.panel} {...anim(5)}>
          <div className={styles.panelTitle}>Assets by Type</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={assetTypeData}>
              <XAxis
                dataKey="name"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a2332",
                  border: "1px solid rgba(75,85,99,0.4)",
                  borderRadius: 8,
                  color: "#e5e7eb",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {assetTypeData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={TYPE_COLORS[entry.name] || "#6b7280"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className={styles.panel} {...anim(6)}>
          <div className={styles.panelTitle}>Asset Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={assetStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={4}
              >
                {assetStatusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] || "#6b7280"}
                  />
                ))}
              </Pie>
              <Legend
                formatter={(v) => (
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>{v}</span>
                )}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a2332",
                  border: "1px solid rgba(75,85,99,0.4)",
                  borderRadius: 8,
                  color: "#e5e7eb",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div className={styles.panel} {...anim(7)}>
        <div className={styles.panelTitle}>
          <HiOutlineLightningBolt
            style={{ verticalAlign: "middle", marginRight: 6 }}
          />
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
              <div
                className={styles.eventDot}
                style={{ background: EVENT_COLORS[event.type] || "#6b7280" }}
              />
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
            </motion.div>
          ))}
          {events.length === 0 && (
            <div
              style={{ color: "var(--text-muted)", fontSize: 13, padding: 10 }}
            >
              No recent activity
            </div>
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
