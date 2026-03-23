import { useState, useEffect, useRef, Suspense } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { useMissions } from "../hooks/useMissions";
import { useAssets } from "../hooks/useAssets";
import { Spinner } from "../components/ui/Loader";
import Badge from "../components/ui/Badge";
import "leaflet/dist/leaflet.css";
import styles from "./MapPage.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ASSET_COLORS = {
  Vehicle: "#3b82f6",
  Personnel: "#10b981",
  UAV: "#8b5cf6",
  Equipment: "#f59e0b",
};

const ASSET_EMOJIS = {
  Vehicle: "🚙",
  Personnel: "👤",
  UAV: "✈",
  Equipment: "📦",
};

const STATUS_COLORS = {
  Active: "#10b981",
  Planning: "#3b82f6",
  Completed: "#6b7280",
  Aborted: "#ef4444",
};

const createAssetIcon = (type, status) => {
  const color = ASSET_COLORS[type] || "#6b7280";
  const isActive = status === "Active";
  const emoji = ASSET_EMOJIS[type] || "●";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:36px;height:36px;">
        ${isActive ? `
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:${color};opacity:0.3;
            animation:assetPulse 2s ease-out infinite;
          "></div>
          <div style="
            position:absolute;inset:4px;border-radius:50%;
            background:${color};opacity:0.2;
            animation:assetPulse 2s ease-out infinite 0.5s;
          "></div>
        ` : ''}
        <div style="
          position:absolute;inset:4px;border-radius:50%;
          background:${color};border:2px solid rgba(255,255,255,0.4);
          display:flex;align-items:center;justify-content:center;
          font-size:11px;
          box-shadow:0 0 12px ${color}80;
          z-index:1;
        ">${emoji}</div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const createMissionIcon = (status) => {
  const color = STATUS_COLORS[status] || "#ef4444";
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:20px;height:20px;border-radius:3px;
        background:${color};border:2px solid rgba(255,255,255,0.5);
        box-shadow:0 0 10px ${color}80;
        transform:rotate(45deg);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const SAT_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

// Track asset location history for trails
const useAssetTrails = (assets) => {
  const trailsRef = useRef({});
  const [trails, setTrails] = useState({});

  useEffect(() => {
    let changed = false;
    assets.forEach((asset) => {
      if (!asset.location?.coordinates) return;
      const [lng, lat] = asset.location.coordinates;
      const trail = trailsRef.current[asset._id] || [];
      const last = trail[trail.length - 1];
      if (!last || last[0] !== lat || last[1] !== lng) {
        trailsRef.current[asset._id] = [...trail, [lat, lng]].slice(-8);
        changed = true;
      }
    });
    if (changed) setTrails({ ...trailsRef.current });
  }, [assets]);

  return trails;
};

const MapContent = () => {
  const { missions } = useMissions();
  const { assets } = useAssets();
  const [showAssets, setShowAssets] = useState(true);
  const [showMissions, setShowMissions] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [useSatellite, setUseSatellite] = useState(false);
  const trails = useAssetTrails(assets);

  const center = [32.08, 34.78];

  const assetCounts = assets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.mapWrap}>
      <style>{`
        @keyframes assetPulse {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

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

        {/* Asset trails */}
        {showTrails && showAssets &&
          Object.entries(trails).map(([assetId, positions]) => {
            if (positions.length < 2) return null;
            const asset = assets.find((a) => a._id === assetId);
            if (!asset) return null;
            const color = ASSET_COLORS[asset.type] || "#6b7280";
            return (
              <Polyline
                key={`trail-${assetId}`}
                positions={positions}
                pathOptions={{ color, weight: 2, opacity: 0.5, dashArray: "6 4" }}
              />
            );
          })
        }

        {/* Mission zones */}
        {showZones &&
          missions
            .filter((m) => m.area?.coordinates?.[0]?.length)
            .map((mission) => (
              <Polygon
                key={`zone-${mission._id}`}
                positions={mission.area.coordinates[0].map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: STATUS_COLORS[mission.status] || "#6b7280",
                  fillColor: STATUS_COLORS[mission.status] || "#6b7280",
                  fillOpacity: 0.12,
                  weight: 2,
                  dashArray: mission.status === "Planning" ? "8 4" : undefined,
                }}
              >
                <Popup>
                  <div className={styles.popupTitle}>{mission.title}</div>
                  <div className={styles.popupRow}>Status: {mission.status}</div>
                  <div className={styles.popupRow}>Priority: {mission.priority}</div>
                </Popup>
              </Polygon>
            ))}

        {/* Mission markers */}
        {showMissions &&
          missions
            .filter((m) => m.location?.coordinates)
            .map((mission) => (
              <Marker
                key={`mission-${mission._id}`}
                position={[mission.location.coordinates[1], mission.location.coordinates[0]]}
                icon={createMissionIcon(mission.status)}
              >
                <Popup>
                  <div className={styles.popupTitle}>{mission.title}</div>
                  <div className={styles.popupRow}>Status: {mission.status}</div>
                  <div className={styles.popupRow}>Priority: {mission.priority}</div>
                  <div className={styles.popupRow}>{mission.description}</div>
                </Popup>
              </Marker>
            ))}

        {/* Asset markers */}
        {showAssets &&
          assets
            .filter((a) => a.location?.coordinates)
            .map((asset) => (
              <Marker
                key={`asset-${asset._id}`}
                position={[asset.location.coordinates[1], asset.location.coordinates[0]]}
                icon={createAssetIcon(asset.type, asset.status)}
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
                  <div className={styles.popupRow} style={{ color: "#9ca3af", fontSize: 11 }}>
                    {asset.location.coordinates[1]?.toFixed(4)}, {asset.location.coordinates[0]?.toFixed(4)}
                  </div>
                </Popup>
              </Marker>
            ))}
      </MapContainer>

      {/* Map controls */}
      <div className={styles.controls}>
        <button className={`${styles.controlBtn} ${showAssets ? styles.controlBtnActive : ""}`} onClick={() => setShowAssets(!showAssets)}>
          ● Assets
        </button>
        <button className={`${styles.controlBtn} ${showMissions ? styles.controlBtnActive : ""}`} onClick={() => setShowMissions(!showMissions)}>
          ◆ Missions
        </button>
        <button className={`${styles.controlBtn} ${showZones ? styles.controlBtnActive : ""}`} onClick={() => setShowZones(!showZones)}>
          ▣ Zones
        </button>
        <button className={`${styles.controlBtn} ${showTrails ? styles.controlBtnActive : ""}`} onClick={() => setShowTrails(!showTrails)}>
          ～ Trails
        </button>
        <button className={`${styles.controlBtn} ${useSatellite ? styles.controlBtnActive : ""}`} onClick={() => setUseSatellite(!useSatellite)}>
          🛰 {useSatellite ? "Dark" : "Satellite"}
        </button>
      </div>

      {/* Asset summary panel */}
      <div className={styles.assetPanel}>
        <div className={styles.assetPanelTitle}>ASSETS</div>
        {Object.entries(ASSET_COLORS).map(([type, color]) => (
          <div key={type} className={styles.assetPanelRow}>
            <div className={styles.assetPanelDot} style={{ background: color }} />
            <span className={styles.assetPanelType}>{type}</span>
            <span className={styles.assetPanelCount}>{assetCounts[type] || 0}</span>
          </div>
        ))}
        <div className={styles.assetPanelDivider} />
        <div className={styles.assetPanelRow}>
          <span className={styles.assetPanelType} style={{ color: "var(--text-secondary)" }}>Total</span>
          <span className={styles.assetPanelCount}>{assets.length}</span>
        </div>
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
          <div className={styles.legendDot} style={{ background: "#ef4444", borderRadius: 2, transform: "rotate(45deg)" }} />
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
