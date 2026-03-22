import styles from "./Loader.module.css";

export const Spinner = () => (
  <div className={styles.loader}>
    <div className={styles.spinner} />
  </div>
);

export const Skeleton = ({ width = "100%", height = "20px", style = {} }) => (
  <div className={styles.skeleton} style={{ width, height, ...style }} />
);
