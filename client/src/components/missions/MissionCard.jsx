import { motion } from "framer-motion";
import { HiOutlineUsers, HiOutlineClock } from "react-icons/hi";
import Badge from "../ui/Badge";
import styles from "./MissionCard.module.css";

const MissionCard = ({ mission, onClick }) => (
  <motion.div
    className={styles.card}
    onClick={onClick}
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    layout
  >
    <div className={styles.cardHeader}>
      <span className={styles.cardTitle}>{mission.title}</span>
      <Badge variant={mission.priority}>{mission.priority}</Badge>
    </div>
    <div className={styles.cardDesc}>{mission.description}</div>
    <div className={styles.cardMeta}>
      <Badge variant={mission.status}>{mission.status}</Badge>
      <span className={styles.cardMetaItem}>
        <HiOutlineUsers /> {mission.assignedTo?.length || 0}
      </span>
      <span className={styles.cardMetaItem}>
        <HiOutlineClock /> {new Date(mission.createdAt).toLocaleDateString()}
      </span>
    </div>
  </motion.div>
);

export default MissionCard;
