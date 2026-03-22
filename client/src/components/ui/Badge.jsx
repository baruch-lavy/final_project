import styles from "./Badge.module.css";

const Badge = ({ children, variant, className = "" }) => (
  <span className={`${styles.badge} ${styles[variant] || ""} ${className}`}>
    {children}
  </span>
);

export default Badge;
