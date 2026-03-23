import { NavLink } from "react-router";
import { motion } from "framer-motion";
import { useAuthStore } from "../../stores/authStore";
import { useSocketStore } from "../../stores/socketStore";
import {
  HiOutlineViewGrid,
  HiOutlineMap,
  HiOutlineFlag,
  HiOutlineTruck,
  HiOutlineChatAlt2,
  HiOutlineLogout,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import styles from "./Sidebar.module.css";

const navItems = [
  { to: "/", icon: <HiOutlineViewGrid />, label: "Dashboard" },
  { to: "/map", icon: <HiOutlineMap />, label: "Tactical Map" },
  { to: "/missions", icon: <HiOutlineFlag />, label: "Missions" },
  { to: "/assets", icon: <HiOutlineTruck />, label: "Assets" },
  { to: "/personnel", icon: <HiOutlineUsers />, label: "Personnel" },
  { to: "/events", icon: <HiOutlineClipboardList />, label: "Activity Log" },
];

const Sidebar = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const connected = useSocketStore((s) => s.connected);

  const roleColor = {
    Commander: "#ef4444",
    Operator: "#3b82f6",
    Analyst: "#8b5cf6",
  }[user?.role] || "#6b7280";

  return (
    <aside className={styles.sidebar}>
      {/* Scanline overlay */}
      <div className={styles.scanline} />

      <div className={styles.logo}>
        <motion.div
          className={styles.logoIcon}
          animate={{
            boxShadow: [
              "0 0 10px rgba(59,130,246,0.3)",
              "0 0 25px rgba(59,130,246,0.6)",
              "0 0 10px rgba(59,130,246,0.3)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <HiOutlineShieldCheck />
        </motion.div>
        <div>
          <div className={styles.logoText}>AEGIS</div>
          <div className={styles.logoSub}>Command Center</div>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>Operations</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className={styles.navSection}>Communication</div>
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
          }
        >
          <span className={styles.navIcon}><HiOutlineChatAlt2 /></span>
          Ops Chat
        </NavLink>
      </nav>

      {/* Connection indicator */}
      <div className={styles.connStatus}>
        <div className={`${styles.connDot} ${connected ? styles.connDotOk : styles.connDotOff}`} />
        <span className={styles.connLabel}>{connected ? "Network Online" : "Disconnected"}</span>
      </div>

      <div className={styles.userSection}>
        <div className={styles.userCard} style={{ borderColor: `${roleColor}33` }}>
          <div className={styles.userAvatar} style={{ background: `${roleColor}22`, color: roleColor, border: `1.5px solid ${roleColor}44` }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={styles.userName}>{user?.username}</div>
            <div className={styles.userRole} style={{ color: roleColor }}>{user?.role}</div>
          </div>
          <button onClick={logout} className={styles.logoutBtn} title="Logout">
            <HiOutlineLogout />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
