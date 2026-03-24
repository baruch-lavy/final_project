import styles from "./Skeleton.module.css";

export const SkeletonCard = ({ count = 1 }) =>
  Array.from({ length: count }, (_, i) => (
    <div key={i} className={styles.card}>
      <div className={`${styles.line} ${styles.lineShort}`} />
      <div className={styles.line} />
      <div className={`${styles.line} ${styles.lineMedium}`} />
    </div>
  ));

export const SkeletonRow = ({ count = 1 }) =>
  Array.from({ length: count }, (_, i) => (
    <div key={i} className={styles.row}>
      <div className={styles.circle} />
      <div className={styles.rowLines}>
        <div className={styles.line} />
        <div className={`${styles.line} ${styles.lineShort}`} />
      </div>
    </div>
  ));

export const SkeletonText = ({ lines = 3 }) =>
  Array.from({ length: lines }, (_, i) => (
    <div
      key={i}
      className={styles.line}
      style={{ width: i === lines - 1 ? "60%" : "100%" }}
    />
  ));

export const SkeletonChart = () => (
  <div className={styles.chart}>
    <div className={`${styles.line} ${styles.lineShort}`} />
    <div className={styles.chartArea} />
  </div>
);

export const SkeletonMap = () => (
  <div className={styles.map}>
    <div className={styles.mapPulse} />
    <span className={styles.mapLabel}>Loading map…</span>
  </div>
);
