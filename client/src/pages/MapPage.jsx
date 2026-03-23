import { useState, Suspense, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useMissions } from "../hooks/useMissions";
import { useAssets } from "../hooks/useAssets";
import { Spinner } from "../components/ui/Loader";
import Badge from "../components/ui/Badge";
import "leaflet/dist/leaflet.css";
import styles from "./MapPage.module.css";

// Fix default marker icons for Leaflet in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ASSET_COLORS = {
  Vehicle: "#3b82f6",
  Personnel: "#10b981",
  UAV: "#8b5cf6",
  Equipment: "#f59e0b",
};
const STATUS_COLORS = {
  Active: "#10b981",
  Planning: "#3b82f6",
  Completed: "#6b7280",
  Aborted: "#ef4444",
};

const createAssetIcon = (type) => {
  const color = ASSET_COLORS[type] || "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:2px solid rgba(255,255,255,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;color:white;font-weight:700;
      box-shadow:0 0 12px ${color}80;
    ">${type.charAt(0)}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const createMissionIcon = () => {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:20px;height:20px;border-radius:4px;
      background:#ef4444;border:2px solid rgba(255,255,255,0.4);
      box-shadow:0 0 10px rgba(239,68,68,0.5);
      transform:rotate(45deg);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const DARK_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const SAT_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

// Utility functions for filtering
const filterByLocation = (items) => items.filter((item) => item.location?.coordinates);
const filterMissionsByArea = (missions) => missions.filter((m) => m.area?.coordinates?.[0]?.length);

// Control button configuration
const CONTROL_BUTTONS = [
  { key: "assets", label: "Assets", stateKey: "showAssets" },
  { key: "missions", label: "Missions", stateKey: "showMissions" },
  { key: "zones", label: "Zones", stateKey: "showZones" },
  { key: "satellite", label: "Satellite", stateKey: "useSatellite", icon: "🛰️" },
];

const ControlButton = ({ active, onClick, label, icon }) => (
  <button
    className={`${styles.controlBtn} ${active ? styles.controlBtnActive : ""}`}
    onClick={onClick}
  >
    {icon ? `${icon} ` : ""}{active ? "✓" : "○"} {label}
  </button>
);

const MapContent = () => {
  const { missions } = useMissions();
  const { assets } = useAssets();
  const [showAssets, setShowAssets] = useState(true);
  const [showMissions, setShowMissions] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [useSatellite, setUseSatellite] = useState(false);

  const center = [32.08, 34.78]; // Default center

  // Memoize filtered data to avoid unnecessary recalculations
  const assetsWithLocation = useMemo(() => filterByLocation(assets), [assets]);
  const missionsWithLocation = useMemo(() => filterByLocation(missions), [missions]);
  const missionsWithArea = useMemo(() => filterMissionsByArea(missions), [missions]);
  const assetCounts = useMemo(
    () => assets.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {}),
    [assets]
  );

  return (
    <div className={styles.mapWrap}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          key={useSatellite ? "sat" : "dark"}
          url={useSatellite ? SAT_TILES : DARK_TILES}
          attribution="&copy; CartoDB"
          maxZoom={19}
        />

        {/* Mission zones */}
        {showZones &&
          missionsWithArea.map((mission) => (
              <Polygon
                key={`zone-${mission._id}`}
                positions={mission.area.coordinates[0].map(([lng, lat]) => [
                  lat,
                  lng,
                ])}
                pathOptions={{
                  color: STATUS_COLORS[mission.status] || "#6b7280",
                  fillColor: STATUS_COLORS[mission.status] || "#6b7280",
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: mission.status === "Planning" ? "8 4" : undefined,
                }}
              >
                <Popup>
                  <div className={styles.popupTitle}>{mission.title}</div>
                  <div className={styles.popupRow}>
                    Status: {mission.status}
                  </div>
                  <div className={styles.popupRow}>
                    Priority: {mission.priority}
                  </div>
                </Popup>
              </Polygon>
            ))}

        {/* Mission markers */}
        {showMissions &&
          missionsWithLocation.map((mission) => (
              <Marker
                key={`mission-${mission._id}`}
                position={[
                  mission.location.coordinates[1],
                  mission.location.coordinates[0],
                ]}
                icon={createMissionIcon()}
              >
                <Popup>
                  <div className={styles.popupTitle}>{mission.title}</div>
                  <div className={styles.popupRow}>
                    Status: {mission.status}
                  </div>
                  <div className={styles.popupRow}>
                    Priority: {mission.priority}
                  </div>
                  <div className={styles.popupRow}>{mission.description}</div>
                </Popup>
              </Marker>
            ))}

        {/* Asset markers */}
        {showAssets &&
          assetsWithLocation.map((asset) => (
              <Marker
                key={`asset-${asset._id}`}
                position={[
                  asset.location.coordinates[1],
                  asset.location.coordinates[0],
                ]}
                icon={createAssetIcon(asset.type)}
              >
                <Popup>
                  <div className={styles.popupTitle}>{asset.name}</div>
                  <div className={styles.popupRow}>Type: {asset.type}</div>
                  <div className={styles.popupRow}>Status: {asset.status}</div>
                  {asset.assignedMission && (
                    <div className={styles.popupRow}>
                      Mission: {asset.assignedMission.title || "Assigned"}
                    </div>
                  )}
                </Popup>
              </Marker>
            ))}
      </MapContainer>

      {/* Map controls */}
      <div className={styles.controls}>
        <ControlButton
          active={showAssets}
          onClick={() => setShowAssets(!showAssets)}
          label="Assets"
        />
        <ControlButton
          active={showMissions}
          onClick={() => setShowMissions(!showMissions)}
          label="Missions"
        />
        <ControlButton
          active={showZones}
          onClick={() => setShowZones(!showZones)}
          label="Zones"
        />
        <ControlButton
          active={useSatellite}
          onClick={() => setUseSatellite(!useSatellite)}
          label="Satellite"
          icon="🛰️"
        />
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {Object.entries(ASSET_COLORS).map(([type, color]) => (
          <div key={type} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: color }} />
            {type}
          </div>
        ))}
        <div className={styles.legendItem}>
          <div
            className={styles.legendDot}
            style={{
              background: "#ef4444",
              borderRadius: 2,
              transform: "rotate(45deg)",
            }}
          />
          Mission
        </div>
      </div>
    </div>
  );
};

const MapPage = () => (
  <Suspense fallback={<Spinner />}>
    <MapContent />
  </Suspense>
);

export default MapPage;
