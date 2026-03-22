import { NavLink } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import {
  HiOutlineViewGrid,
  HiOutlineMap,
  HiOutlineFlag,
  HiOutlineTruck,
  HiOutlineChatAlt2,
  HiOutlineLogout,
  HiOutlineClipboardList,
} from "react-icons/hi";
import styles from "./Sidebar.module.css";

const navItems = [
  { to: "/", icon: <HiOutlineViewGrid />, label: "Dashboard" },
  { to: "/map", icon: <HiOutlineMap />, label: "Tactical Map" },
  { to: "/missions", icon: <HiOutlineFlag />, label: "Missions" },
  { to: "/assets", icon: <HiOutlineTruck />, label: "Assets" },
  { to: "/events", icon: <HiOutlineClipboardList />, label: "Activity Log" },
];

const Sidebar = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>A</div>
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
          <span className={styles.navIcon}>
            <HiOutlineChatAlt2 />
          </span>
          Ops Chat
        </NavLink>
      </nav>

      <div className={styles.userSection}>
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={styles.userName}>{user?.username}</div>
            <div className={styles.userRole}>{user?.role}</div>
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
