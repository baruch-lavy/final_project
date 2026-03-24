import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineGlobe, HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import styles from "./MapLayerPanel.module.css";

const LAYERS = [
  { id: "missions", label: "Mission Zones", color: "#3b82f6", defaultOn: true },
  { id: "assets", label: "Asset Markers", color: "#10b981", defaultOn: true },
  { id: "trails", label: "Asset Trails", color: "#f59e0b", defaultOn: false },
  {
    id: "heatmap",
    label: "Activity Heatmap",
    color: "#ef4444",
    defaultOn: false,
  },
];

const MapLayerPanel = ({ activeLayers, onToggle }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrap}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        title="Map Layers"
      >
        <HiOutlineGlobe />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className={styles.panelTitle}>LAYERS</div>
            {LAYERS.map((layer) => {
              const isOn = activeLayers.includes(layer.id);
              return (
                <button
                  key={layer.id}
                  className={`${styles.layerRow} ${isOn ? styles.layerRowOn : ""}`}
                  onClick={() => onToggle(layer.id)}
                >
                  <span
                    className={styles.layerDot}
                    style={{
                      background: isOn ? layer.color : "rgba(255,255,255,0.1)",
                    }}
                  />
                  <span className={styles.layerLabel}>{layer.label}</span>
                  {isOn ? <HiOutlineEye /> : <HiOutlineEyeOff />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { LAYERS };
export default MapLayerPanel;
