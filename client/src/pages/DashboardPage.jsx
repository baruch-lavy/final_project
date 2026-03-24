import { Suspense, useMemo } from "react";
import {
  HiOutlineFlag,
  HiOutlineTruck,
  HiOutlineStatusOnline,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineGlobe,
} from "react-icons/hi";
import { useDashboardStats, useEvents, useAnalytics } from "../hooks/useEvents";
import { useMissions } from "../hooks/useMissions";
import StatCard from "../components/dashboard/StatCard";
import {
  ThreatPanel,
  SystemStatusPanel,
  MissionTrendChart,
  MissionStatusChart,
  AssetTypeChart,
  AssetStatusChart,
} from "../components/dashboard/Charts";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import WorldClock from "../components/dashboard/WorldClock";
import ReadinessGauge from "../components/dashboard/ReadinessGauge";
import { SkeletonCard, SkeletonChart } from "../components/ui/Skeleton";
import styles from "./DashboardPage.module.css";

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

const generateTrendData = (totalMissions = 0) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
  const base = Math.max(1, totalMissions - 6);
  const offsets = [0, 1, 1, 2, 2, 3, 3];
  return days.map((day, i) => ({
    day,
    missions: base + i + offsets[i],
    active: Math.floor((base + i) * 0.4),
  }));
};

const DashboardContent = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: analytics } = useAnalytics();
  const { events } = useEvents(15);
  const { missions } = useMissions();
  const trendData = useMemo(
    () => generateTrendData(stats?.totalMissions),
    [stats?.totalMissions],
  );

  if (isLoading)
    return (
      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  if (!stats) return null;

  const overview = analytics?.overview ?? {};
  const missionStatusData = (
    stats.missionsByStatus ||
    analytics?.missionsByStatus ||
    []
  ).map(({ _id, count }) => ({ name: _id, value: count }));
  const assetTypeData = (
    stats.assetsByType ||
    analytics?.assetsByType ||
    []
  ).map(({ _id, count }) => ({
    name: _id,
    value: count,
  }));
  const assetStatusData = (
    stats.assetsByStatus ||
    analytics?.assetsByStatus ||
    []
  ).map(({ _id, count }) => ({ name: _id, value: count }));
  const threat = getThreatLevel(missions);
  const readiness = overview.readiness ?? 100;

  return (
    <>
      {/* ── World Clock ─────────────────────────────────────── */}
      <WorldClock />

      {/* ── Stat cards (6-column) ───────────────────────────── */}
      <div className={styles.statGrid}>
        <StatCard
          icon={<HiOutlineLightningBolt />}
          value={stats.activeMissions}
          label="Active Missions"
          color="Cyan"
          index={0}
        />
        <StatCard
          icon={<HiOutlineFlag />}
          value={stats.totalMissions}
          label="Total Missions"
          color="Blue"
          index={1}
        />
        <StatCard
          icon={<HiOutlineTruck />}
          value={stats.totalAssets}
          label="Total Assets"
          color="Orange"
          index={2}
        />
        <StatCard
          icon={<HiOutlineStatusOnline />}
          value={stats.onlineUsers}
          label="Online Personnel"
          color="Green"
          index={3}
        />
        <StatCard
          icon={<HiOutlineShieldCheck />}
          value={readiness}
          suffix="%"
          label="Readiness"
          color={readiness >= 80 ? "Green" : readiness >= 50 ? "Orange" : "Red"}
          index={4}
        />
        <StatCard
          icon={<HiOutlineGlobe />}
          value={overview.totalPersonnel ?? stats.onlineUsers}
          label="Total Personnel"
          color="Purple"
          index={5}
        />
      </div>

      {/* ── Threat + System + Readiness + Trend ─────────────── */}
      <div className={styles.intelRow}>
        <ThreatPanel threat={threat} missions={missions} />
        <SystemStatusPanel onlineUsers={stats.onlineUsers} />
        <ReadinessGauge value={readiness} />
        <MissionTrendChart trendData={trendData} />
      </div>

      {/* ── Charts ──────────────────────────────────────────── */}
      <div className={styles.chartsRow}>
        <MissionStatusChart data={missionStatusData} />
        <AssetTypeChart data={assetTypeData} />
        <AssetStatusChart data={assetStatusData} />
      </div>

      {/* ── Activity Feed ───────────────────────────────────── */}
      <ActivityFeed events={events} />
    </>
  );
};

const DashboardPage = () => (
  <Suspense fallback={<SkeletonChart />}>
    <DashboardContent />
  </Suspense>
);

export default DashboardPage;
