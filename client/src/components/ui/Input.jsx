import styles from "./Input.module.css";

export const Input = ({ label, className = "", ...props }) => (
  <div className={`${styles.inputGroup} ${className}`}>
    {label && <label className={styles.label}>{label}</label>}
    <input className={styles.input} {...props} />
  </div>
);

export const Select = ({ label, children, className = "", ...props }) => (
  <div className={`${styles.inputGroup} ${className}`}>
    {label && <label className={styles.label}>{label}</label>}
    <select className={styles.select} {...props}>
      {children}
    </select>
  </div>
);

export const Textarea = ({ label, className = "", ...props }) => (
  <div className={`${styles.inputGroup} ${className}`}>
    {label && <label className={styles.label}>{label}</label>}
    <textarea className={styles.textarea} {...props} />
  </div>
);
