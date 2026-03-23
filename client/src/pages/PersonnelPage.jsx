import { Suspense } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineEye,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import { usePersonnel } from "../hooks/usePersonnel";
import { Spinner } from "../components/ui/Loader";
import Badge from "../components/ui/Badge";
import styles from "./PersonnelPage.module.css";

const ROLE_ICONS = {
  Commander: <HiOutlineShieldCheck />,
  Operator: <HiOutlineLightningBolt />,
  Analyst: <HiOutlineEye />,
};

const ROLE_COLORS = {
  Commander: "#ef4444",
  Operator: "#3b82f6",
  Analyst: "#8b5cf6",
};

const anim = (i) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.3 },
});

const PersonnelCard = ({ user, index }) => {
  const isOnline = user.status === "online";
  const color = ROLE_COLORS[user.role] || "#6b7280";

  return (
    <motion.div className={styles.card} {...anim(index)}>
      <div className={styles.avatarWrap}>
        <div className={styles.avatar} style={{ background: `${color}22`, border: `2px solid ${color}44` }}>
          <span style={{ color }}>{user.username.charAt(0).toUpperCase()}</span>
        </div>
        <div className={`${styles.statusDot} ${isOnline ? styles.statusOnline : styles.statusOffline}`} />
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{user.username}</div>
        <div className={styles.email}>{user.email}</div>
        <div className={styles.meta}>
          <Badge variant={user.role}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {ROLE_ICONS[user.role]} {user.role}
            </span>
          </Badge>
          <span className={`${styles.onlineLabel} ${isOnline ? styles.onlineLabelActive : ""}`}>
            {isOnline ? "● ONLINE" : "○ OFFLINE"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const PersonnelContent = () => {
  const { personnel, loading } = usePersonnel();

  if (loading) return <Spinner />;

  const online = personnel.filter((u) => u.status === "online");
  const offline = personnel.filter((u) => u.status === "offline");

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerStats}>
          <div className={styles.statBadge}>
            <span className={styles.statDotGreen} />
            {online.length} Online
          </div>
          <div className={styles.statBadge}>
            <span className={styles.statDotGray} />
            {offline.length} Offline
          </div>
          <div className={styles.statBadge}>
            <HiOutlineUser />
            {personnel.length} Total
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Online Personnel</div>
        {online.length === 0 && (
          <div className={styles.empty}>No personnel online</div>
        )}
        <div className={styles.grid}>
          {online.map((user, i) => (
            <PersonnelCard key={user._id} user={user} index={i} />
          ))}
        </div>
      </div>

      {offline.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Offline Personnel</div>
          <div className={styles.grid}>
            {offline.map((user, i) => (
              <PersonnelCard key={user._id} user={user} index={online.length + i} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const PersonnelPage = () => (
  <Suspense fallback={<Spinner />}>
    <PersonnelContent />
  </Suspense>
);

export default PersonnelPage;
