import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import AssetMarker from "./AssetMarker";
import MissionZone from "./MissionZone";
import DrawingTools from "./DrawingTools";
import AssetTrail from "./AssetTrail";
import { usePermissions } from "../../hooks/usePermissions";
import styles from "./MapView.module.css";

const GMAP_KEY = "AIzaSyCS5eYKop0r4csLVU66XfO5uxoC_Uxgrdk";
const MAP_ID = "82ce69bc983761c7ec6e85d5";

const ASSET_COLORS = {
  Vehicle: "#3b82f6",
  Personnel: "#10b981",
  UAV: "#8b5cf6",
  Equipment: "#f59e0b",
};

const filterByLocation = (items) =>
  items.filter((item) => item.location?.coordinates);
const filterMissionsByArea = (missions) =>
  missions.filter((m) => m.area?.coordinates?.[0]?.length);

// Marker clustering manager
const ClusterManager = ({ assets, showAssets }) => {
  const map = useMap();
  const markerLib = useMapsLibrary("marker");
  const clustererRef = useRef(null);
  const markersRef = useRef(new Map());

  useEffect(() => {
    if (!map || !markerLib) return;

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: [],
        renderer: {
          render({ count, position }) {
            const el = document.createElement("div");
            el.style.cssText = `
              width:36px;height:36px;border-radius:50%;
              background:rgba(59,130,246,0.85);border:2px solid rgba(255,255,255,0.4);
              display:flex;align-items:center;justify-content:center;
              font-size:13px;color:white;font-weight:700;
              box-shadow:0 0 16px rgba(59,130,246,0.5);
            `;
            el.textContent = count;
            return new google.maps.marker.AdvancedMarkerElement({
              position,
              content: el,
            });
          },
        },
      });
    }

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
    };
  }, [map, markerLib]);

  // Sync markers with clusterer
  useEffect(() => {
    if (!map || !markerLib || !clustererRef.current) return;

    const filtered = showAssets ? filterByLocation(assets) : [];
    const newMap = new Map();

    filtered.forEach((asset) => {
      const [lng, lat] = asset.location.coordinates;
      const color = ASSET_COLORS[asset.type] || "#6b7280";

      if (markersRef.current.has(asset._id)) {
        const existing = markersRef.current.get(asset._id);
        existing.position = { lat, lng };
        newMap.set(asset._id, existing);
      } else {
        const el = document.createElement("div");
        el.innerHTML = `
          <div style="
            width:32px;height:32px;border-radius:50%;
            background:${color};border:2px solid rgba(255,255,255,0.4);
            display:flex;align-items:center;justify-content:center;
            font-size:13px;color:white;font-weight:700;
            box-shadow:0 0 14px ${color}80;cursor:pointer;
          ">${asset.type.charAt(0)}</div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat, lng },
          content: el,
          title: asset.name,
        });
        newMap.set(asset._id, marker);
      }
    });

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!newMap.has(id)) {
        marker.map = null;
      }
    });

    markersRef.current = newMap;
    clustererRef.current.clearMarkers();
    clustererRef.current.addMarkers([...newMap.values()]);
  }, [map, markerLib, assets, showAssets]);

  return null;
};

const MapView = ({ assets = [], missions = [], onPolygonComplete }) => {
  const [showAssets, setShowAssets] = useState(true);
  const [showMissions, setShowMissions] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const { canDrawOnMap } = usePermissions();

  // Track position history for animated polylines
  const trailHistoryRef = useRef({});
  const [trailHistory, setTrailHistory] = useState({});

  useEffect(() => {
    assets.forEach((asset) => {
      if (!asset.location?.coordinates) return;
      const id = asset._id;
      const coords = asset.location.coordinates;
      const prev = trailHistoryRef.current[id] || [];
      const last = prev[prev.length - 1];
      if (!last || last[0] !== coords[0] || last[1] !== coords[1]) {
        const updated = [...prev, coords].slice(-20);
        trailHistoryRef.current[id] = updated;
      }
    });
    setTrailHistory({ ...trailHistoryRef.current });
  }, [assets]);

  const assetsWithLocation = useMemo(() => filterByLocation(assets), [assets]);
  const missionsWithLocation = useMemo(
    () => filterByLocation(missions),
    [missions],
  );
  const missionsWithArea = useMemo(
    () => filterMissionsByArea(missions),
    [missions],
  );

  const assetCounts = useMemo(
    () =>
      assets.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {}),
    [assets],
  );

  return (
    <div className={styles.mapWrap}>
      <APIProvider apiKey={GMAP_KEY}>
        <GoogleMap
          defaultCenter={{ lat: 32.08, lng: 34.78 }}
          defaultZoom={13}
          mapId={MAP_ID}
          disableDefaultUI={false}
          gestureHandling="greedy"
          tilt={45}
          heading={0}
          style={{ width: "100%", height: "100%" }}
          colorScheme="DARK"
        >
          {/* Marker clustering for assets */}
          <ClusterManager assets={assets} showAssets={showAssets} />

          {/* Mission zones */}
          {showZones &&
            missionsWithArea.map((mission) => (
              <MissionZone
                key={`zone-${mission._id}`}
                mission={mission}
                showMarker={false}
              />
            ))}

          {/* Mission markers */}
          {showMissions &&
            missionsWithLocation.map((mission) => (
              <MissionZone
                key={`marker-${mission._id}`}
                mission={mission}
                showZone={false}
              />
            ))}

          {/* Animated polylines for asset trails */}
          {showAssets &&
            assetsWithLocation.map((asset) =>
              trailHistory[asset._id]?.length >= 2 ? (
                <AssetTrail
                  key={`trail-${asset._id}`}
                  asset={asset}
                  history={trailHistory[asset._id]}
                />
              ) : null,
            )}

          {/* Drawing tools */}
          <DrawingTools
            onPolygonComplete={onPolygonComplete}
            enabled={canDrawOnMap}
          />
        </GoogleMap>
      </APIProvider>

      {/* Map controls */}
      <div className={styles.controls}>
        <button
          className={`${styles.controlBtn} ${showAssets ? styles.controlBtnActive : ""}`}
          onClick={() => setShowAssets(!showAssets)}
        >
          {showAssets ? "✓" : "○"} Assets
        </button>
        <button
          className={`${styles.controlBtn} ${showMissions ? styles.controlBtnActive : ""}`}
          onClick={() => setShowMissions(!showMissions)}
        >
          {showMissions ? "✓" : "○"} Missions
        </button>
        <button
          className={`${styles.controlBtn} ${showZones ? styles.controlBtnActive : ""}`}
          onClick={() => setShowZones(!showZones)}
        >
          {showZones ? "✓" : "○"} Zones
        </button>
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

      {/* Stats bar */}
      <div className={styles.statsBar}>
        {Object.entries(assetCounts).map(([type, count]) => (
          <div key={type} className={styles.statChip}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: ASSET_COLORS[type] || "#6b7280",
              }}
            />
            {type}: {count}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapView;
