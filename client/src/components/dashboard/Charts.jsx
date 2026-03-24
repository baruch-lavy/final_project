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
  AreaChart,
  Area,
} from "recharts";
import styles from "./Charts.module.css";

const TOOLTIP_STYLE = {
  background: "#1a2332",
  border: "1px solid rgba(75,85,99,0.4)",
  borderRadius: 8,
  color: "#e5e7eb",
};

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

const anim = (i) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.3 },
});

export const ThreatPanel = ({ threat, missions, index = 4 }) => (
  <motion.div className={styles.threatPanel} {...anim(index)}>
    <div className={styles.panelTitle}>Threat Level</div>
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
        {
          missions.filter(
            (m) => m.priority === "Critical" && m.status === "Active",
          ).length
        }{" "}
        critical
      </div>
    </div>
  </motion.div>
);

export const SystemStatusPanel = ({ onlineUsers, index = 5 }) => (
  <motion.div className={styles.sysPanel} {...anim(index)}>
    <div className={styles.panelTitle}>System Status</div>
    <div className={styles.sysList}>
      {[
        { label: "Command Network", ok: true },
        { label: "Satellite Uplink", ok: true },
        { label: "Asset Tracking", ok: true },
        { label: "Comms Relay", ok: onlineUsers > 0 },
      ].map((item) => (
        <div key={item.label} className={styles.sysItem}>
          <div
            className={`${styles.sysDot} ${item.ok ? styles.sysDotOk : styles.sysDotWarn}`}
          />
          <span className={styles.sysLabel}>{item.label}</span>
          <span className={item.ok ? styles.sysOk : styles.sysWarn}>
            {item.ok ? "OPERATIONAL" : "DEGRADED"}
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);

export const MissionTrendChart = ({ trendData, index = 6 }) => (
  <motion.div className={styles.panel} {...anim(index)}>
    <div className={styles.panelTitle}>Mission Trend (7d)</div>
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={trendData}>
        <defs>
          <linearGradient id="missionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="day"
          tick={{ fill: "#9ca3af", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#9ca3af", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area
          type="monotone"
          dataKey="missions"
          stroke="#3b82f6"
          fill="url(#missionGrad)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
);

export const MissionStatusChart = ({ data, index = 7 }) => (
  <motion.div className={styles.panel} {...anim(index)}>
    <div className={styles.panelTitle}>Missions by Status</div>
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={75}
          dataKey="value"
          paddingAngle={4}
        >
          {data.map((entry) => (
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
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  </motion.div>
);

export const AssetTypeChart = ({ data, index = 8 }) => (
  <motion.div className={styles.panel} {...anim(index)}>
    <div className={styles.panelTitle}>Assets by Type</div>
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
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
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={TYPE_COLORS[entry.name] || "#6b7280"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

export const AssetStatusChart = ({ data, index = 9 }) => (
  <motion.div className={styles.panel} {...anim(index)}>
    <div className={styles.panelTitle}>Asset Status</div>
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={75}
          dataKey="value"
          paddingAngle={4}
        >
          {data.map((entry) => (
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
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  </motion.div>
);
