import { motion } from "framer-motion";
import { HiOutlineLocationMarker } from "react-icons/hi";
import Badge from "../ui/Badge";
import styles from "./AssetCard.module.css";

const ASSET_ICONS = {
  Vehicle: "🚙",
  Personnel: "👤",
  Equipment: "📦",
  UAV: "✈️",
};

const AssetCard = ({ asset, onClick }) => (
  <motion.div
    className={styles.card}
    onClick={onClick}
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    layout
  >
    <div className={styles.cardHeader}>
      <span className={styles.icon}>{ASSET_ICONS[asset.type] || "📍"}</span>
      <Badge variant={asset.status}>{asset.status}</Badge>
    </div>
    <div className={styles.cardTitle}>{asset.name}</div>
    <div className={styles.cardMeta}>
      <Badge variant={asset.type}>{asset.type}</Badge>
      {asset.location?.coordinates && (
        <span className={styles.cardMetaItem}>
          <HiOutlineLocationMarker />
          {asset.location.coordinates[1]?.toFixed(3)},{" "}
          {asset.location.coordinates[0]?.toFixed(3)}
        </span>
      )}
    </div>
  </motion.div>
);

export default AssetCard;
