import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMissions } from "../hooks/useMissions";
import { useAssets } from "../hooks/useAssets";
import styles from "./MapPage.module.css";

// ─── Map style URLs (no API key required) ────────────────────────────────────
const DARK_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const SAT_STYLE = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, Maxar, GeoEye, Earthstar Geographics",
    },
  },
  layers: [
    { id: "satellite-bg", type: "raster", source: "satellite", minzoom: 0, maxzoom: 20 },
  ],
};

// ─── Tactical colour palette ─────────────────────────────────────────────────
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
const ASSET_ICONS = {
  Vehicle: "🚗",
  Personnel: "👤",
  UAV: "🚁",
  Equipment: "⚙️",
};

// ─── Asset / Mission marker HTML ─────────────────────────────────────────────
const assetMarkerEl = (type, status) => {
  const color = ASSET_COLORS[type] || "#6b7280";
  const pulse = status === "Active";
  const el = document.createElement("div");
  el.className = styles.marker3d;
  el.innerHTML = `
    <div class="${styles.markerRing}" style="--mc:${color}">
      ${pulse ? `<div class="${styles.markerPulse}" style="--mc:${color}"></div>` : ""}
      <div class="${styles.markerInner}" style="background:${color}">
        <span style="font-size:12px">${ASSET_ICONS[type] || "●"}</span>
      </div>
    </div>
    <div class="${styles.markerStem}" style="border-top-color:${color}"></div>
  `;
  return el;
};

const missionMarkerEl = (priority, status) => {
  const color = STATUS_COLORS[status] || "#6b7280";
  const el = document.createElement("div");
  el.className = styles.marker3d;
  el.innerHTML = `
    <div class="${styles.missionRing}" style="--mc:${color}">
      <div class="${styles.missionInner}" style="background:${color}">
        <span style="font-size:10px;font-weight:700;color:#fff">${priority?.charAt(0) || "M"}</span>
      </div>
    </div>
    <div class="${styles.markerStem}" style="border-top-color:${color}"></div>
  `;
  return el;
};

// ─── Layer/source configuration constants ────────────────────────────────────
const ZONE_LAYERS = [
  {
    id: "mission-zone-fill",
    type: "fill",
    source: "missions-zones",
    paint: { "fill-color": ["get", "color"], "fill-opacity": 0.08 },
  },
  {
    id: "mission-zone-line",
    type: "line",
    source: "missions-zones",
    paint: {
      "line-color": ["get", "color"],
      "line-width": 2,
      "line-dasharray": [
        "case",
        ["==", ["get", "status"], "Planning"],
        ["literal", [6, 4]],
        ["literal", [1, 0]],
      ],
      "line-opacity": 0.7,
    },
  },
  {
    id: "mission-zone-extrude",
    type: "fill-extrusion",
    source: "missions-zones",
    paint: {
      "fill-extrusion-color": ["get", "color"],
      "fill-extrusion-height": 60,
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.06,
    },
  },
];

/** Add the GeoJSON source and zone layers to a map instance. */
const addZoneLayers = (map) => {
  if (!map.getSource("missions-zones")) {
    map.addSource("missions-zones", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }
  ZONE_LAYERS.forEach((layer) => {
    if (!map.getLayer(layer.id)) {
      map.addLayer(layer);
    }
  });
};

// ─── Main component ───────────────────────────────────────────────────────────
const MapPage = () => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const popupRef = useRef(null);

  const { missions } = useMissions();
  const { assets } = useAssets();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [showAssets, setShowAssets] = useState(true);
  const [showMissions, setShowMissions] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [show3D, setShow3D] = useState(true);
  const [useSatellite, setUseSatellite] = useState(false);

  // ── Initialise map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [34.78, 32.08],
      zoom: 12,
      pitch: 45,
      bearing: -15,
      antialias: true,
    });

    // Navigation controls (zoom + compass + pitch indicator)
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "bottom-right",
    );

    // Fullscreen control
    map.addControl(new maplibregl.FullscreenControl(), "bottom-right");

    // Reusable popup
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 32,
      className: styles.mapPopup,
      maxWidth: "280px",
    });

    map.on("load", () => {
      // ── Sources + Layers ───────────────────────────────────────────────────
      addZoneLayers(map);

      // ── Try to add OSM 3-D buildings (CartoDB source exposes them) ─────────
      try {
        const existingLayers = map.getStyle().layers;
        const firstSymbol = existingLayers.find((l) => l.type === "symbol");

        if (!map.getLayer("3d-buildings")) {
          map.addLayer(
            {
              id: "3d-buildings",
              source: "carto",
              "source-layer": "building",
              type: "fill-extrusion",
              minzoom: 14,
              paint: {
                "fill-extrusion-color": "#1e2d40",
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  14,
                  0,
                  14.2,
                  ["coalesce", ["get", "render_height"], 10],
                ],
                "fill-extrusion-base": [
                  "coalesce",
                  ["get", "render_min_height"],
                  0,
                ],
                "fill-extrusion-opacity": 0.75,
              },
            },
            firstSymbol?.id,
          );
        }
      } catch {
        // Building layer not available in this style — that's fine
      }

      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // ── Update zone layer whenever missions change ──────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const src = map.getSource("missions-zones");
    if (!src) return;

    const features = missions
      .filter((m) => m.area?.coordinates?.[0]?.length)
      .map((m) => ({
        type: "Feature",
        properties: {
          id: m._id,
          title: m.title,
          status: m.status,
          priority: m.priority,
          color: STATUS_COLORS[m.status] || "#6b7280",
        },
        geometry: {
          type: "Polygon",
          coordinates: m.area.coordinates,
        },
      }));

    src.setData({ type: "FeatureCollection", features });

    // Toggle zone visibility
    ["mission-zone-fill", "mission-zone-line", "mission-zone-extrude"].forEach(
      (id) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(
            id,
            "visibility",
            showZones ? "visible" : "none",
          );
        }
      },
    );
  }, [missions, mapLoaded, showZones]);

  // ── Sync mission markers ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const seen = new Set();

    if (showMissions) {
      missions
        .filter((m) => m.location?.coordinates)
        .forEach((mission) => {
          const key = `mission-${mission._id}`;
          seen.add(key);

          if (markersRef.current[key]) {
            markersRef.current[key].setLngLat(mission.location.coordinates);
          } else {
            const el = missionMarkerEl(mission.priority, mission.status);
            el.addEventListener("click", (e) => {
              e.stopPropagation();
              popupRef.current
                .setLngLat(mission.location.coordinates)
                .setHTML(buildMissionPopup(mission))
                .addTo(map);
            });
            const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
              .setLngLat(mission.location.coordinates)
              .addTo(map);
            markersRef.current[key] = marker;
          }
        });
    }

    // Remove stale mission markers
    Object.keys(markersRef.current)
      .filter((k) => k.startsWith("mission-") && !seen.has(k))
      .forEach((k) => {
        markersRef.current[k].remove();
        delete markersRef.current[k];
      });

    if (!showMissions) {
      Object.keys(markersRef.current)
        .filter((k) => k.startsWith("mission-"))
        .forEach((k) => {
          markersRef.current[k].remove();
          delete markersRef.current[k];
        });
    }
  }, [missions, mapLoaded, showMissions]);

  // ── Sync asset markers ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const seen = new Set();

    if (showAssets) {
      assets
        .filter((a) => a.location?.coordinates)
        .forEach((asset) => {
          const key = `asset-${asset._id}`;
          seen.add(key);

          if (markersRef.current[key]) {
            markersRef.current[key].setLngLat(asset.location.coordinates);
          } else {
            const el = assetMarkerEl(asset.type, asset.status);
            el.addEventListener("click", (e) => {
              e.stopPropagation();
              popupRef.current
                .setLngLat(asset.location.coordinates)
                .setHTML(buildAssetPopup(asset))
                .addTo(map);
            });
            const marker = new maplibregl.Marker({
              element: el,
              anchor: "bottom",
            })
              .setLngLat(asset.location.coordinates)
              .addTo(map);
            markersRef.current[key] = marker;
          }
        });
    }

    // Remove stale asset markers
    Object.keys(markersRef.current)
      .filter((k) => k.startsWith("asset-") && !seen.has(k))
      .forEach((k) => {
        markersRef.current[k].remove();
        delete markersRef.current[k];
      });

    if (!showAssets) {
      Object.keys(markersRef.current)
        .filter((k) => k.startsWith("asset-"))
        .forEach((k) => {
          markersRef.current[k].remove();
          delete markersRef.current[k];
        });
    }
  }, [assets, mapLoaded, showAssets]);

  // ── Toggle 3-D pitch ────────────────────────────────────────────────────────
  const toggle3D = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const next = !show3D;
    setShow3D(next);
    map.easeTo({ pitch: next ? 45 : 0, bearing: next ? -15 : 0, duration: 600 });
  }, [show3D]);

  // ── Toggle map style ────────────────────────────────────────────────────────
  const toggleStyle = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const next = !useSatellite;
    setUseSatellite(next);
    // Clear markers so they re-draw after style switch
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};
    popupRef.current?.remove();
    setMapLoaded(false);

    map.setStyle(next ? SAT_STYLE : DARK_STYLE);
    map.once("styledata", () => {
      if (!next) {
        // Re-add sources and layers after switching back to dark vector style
        addZoneLayers(map);
      }
      setMapLoaded(true);
    });
  }, [useSatellite]);

  // ── Fly to reset ────────────────────────────────────────────────────────────
  const resetView = () => {
    mapRef.current?.flyTo({
      center: [34.78, 32.08],
      zoom: 12,
      pitch: show3D ? 45 : 0,
      bearing: show3D ? -15 : 0,
      duration: 1200,
    });
  };

  return (
    <div className={styles.mapWrap}>
      {/* MapLibre GL canvas */}
      <div ref={containerRef} className={styles.mapCanvas} />

      {/* ── Controls overlay ──────────────────────────────────────────────── */}
      <div className={styles.controls}>
        <button
          className={`${styles.controlBtn} ${showAssets ? styles.controlBtnActive : ""}`}
          onClick={() => setShowAssets((v) => !v)}
          title="Toggle asset markers"
        >
          {showAssets ? "✓" : "○"} Assets
        </button>
        <button
          className={`${styles.controlBtn} ${showMissions ? styles.controlBtnActive : ""}`}
          onClick={() => setShowMissions((v) => !v)}
          title="Toggle mission markers"
        >
          {showMissions ? "✓" : "○"} Missions
        </button>
        <button
          className={`${styles.controlBtn} ${showZones ? styles.controlBtnActive : ""}`}
          onClick={() => setShowZones((v) => !v)}
          title="Toggle mission zones"
        >
          {showZones ? "✓" : "○"} Zones
        </button>
        <div className={styles.controlDivider} />
        <button
          className={`${styles.controlBtn} ${show3D ? styles.controlBtnActive : ""}`}
          onClick={toggle3D}
          title="Toggle 3D perspective"
        >
          🏔️ {show3D ? "3D" : "2D"}
        </button>
        <button
          className={`${styles.controlBtn} ${useSatellite ? styles.controlBtnActive : ""}`}
          onClick={toggleStyle}
          title="Toggle satellite imagery"
        >
          🛰️ {useSatellite ? "Dark" : "Satellite"}
        </button>
        <button className={styles.controlBtn} onClick={resetView} title="Reset view">
          ⊕ Reset
        </button>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
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
            style={{ background: "#ef4444", borderRadius: 2, transform: "rotate(45deg)" }}
          />
          Mission
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <div className={styles.statsBar}>
        <span className={styles.statChip}>
          <span style={{ color: "#10b981" }}>●</span>{" "}
          {assets.filter((a) => a.status === "Active").length} Active Assets
        </span>
        <span className={styles.statChip}>
          <span style={{ color: "#3b82f6" }}>◆</span>{" "}
          {missions.filter((m) => m.status === "Active").length} Active Missions
        </span>
        <span className={styles.statChip}>
          <span style={{ color: "#8b5cf6" }}>▲</span>{" "}
          {assets.filter((a) => a.type === "UAV").length} UAVs
        </span>
      </div>
    </div>
  );
};

// ── Popup HTML builders ───────────────────────────────────────────────────────
const buildAssetPopup = (asset) => `
  <div class="aegis-popup">
    <div class="aegis-popup-title">${asset.name}</div>
    <div class="aegis-popup-row"><span class="aegis-popup-key">Type</span><span>${asset.type}</span></div>
    <div class="aegis-popup-row"><span class="aegis-popup-key">Status</span><span class="aegis-popup-status">${asset.status}</span></div>
    ${asset.assignedMission ? `<div class="aegis-popup-row"><span class="aegis-popup-key">Mission</span><span>${asset.assignedMission.title || "Assigned"}</span></div>` : ""}
  </div>
`;

const buildMissionPopup = (mission) => `
  <div class="aegis-popup">
    <div class="aegis-popup-title">${mission.title}</div>
    <div class="aegis-popup-row"><span class="aegis-popup-key">Status</span><span class="aegis-popup-status">${mission.status}</span></div>
    <div class="aegis-popup-row"><span class="aegis-popup-key">Priority</span><span>${mission.priority}</span></div>
    <div class="aegis-popup-desc">${mission.description || ""}</div>
  </div>
`;

export default MapPage;
