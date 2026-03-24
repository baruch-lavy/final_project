import styles from "./PageWrapper.module.css";

const PageWrapper = ({ children, noPadding = false }) => (
  <div className={`${styles.wrapper} ${noPadding ? styles.noPadding : ""}`}>
    {children}
  </div>
);

export default PageWrapper;
