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
import { Loader } from "@googlemaps/js-api-loader";
import { useMissions } from "../hooks/useMissions";
import { useAssets } from "../hooks/useAssets";
import { Spinner } from "../components/ui/Loader";
import "leaflet/dist/leaflet.css";
import styles from "./MapPage.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "";

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

// ─── Google Maps 3D View ──────────────────────────────────────────────────────

const GMAP_LOADER = GOOGLE_MAPS_API_KEY
  ? new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["maps", "marker"],
    })
  : null;

const buildInfoContent = (title, rows) => {
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<div style="font-size:12px;color:#555;margin-top:2px"><b>${label}:</b> ${value}</div>`,
    )
    .join("");
  return `<div style="font-weight:600;font-size:14px;margin-bottom:4px">${title}</div>${rowsHtml}`;
};

const GoogleMap3D = ({ missions, assets, showMissions, showAssets }) => {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !GMAP_LOADER) return;

    let cancelled = false;

    GMAP_LOADER.importLibrary("maps")
      .then(async ({ Map, InfoWindow }) => {
        if (cancelled || !containerRef.current) return;

        const mapOptions = {
          center: { lat: 32.08, lng: 34.78 },
          zoom: 14,
          tilt: 45,
          heading: 0,
          mapTypeId: "satellite",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        };

        if (GOOGLE_MAPS_MAP_ID) {
          mapOptions.mapId = GOOGLE_MAPS_MAP_ID;
        }

        const gmap = new Map(containerRef.current, mapOptions);
        mapInstanceRef.current = gmap;

        infoWindowRef.current = new InfoWindow();

        const { AdvancedMarkerElement, PinElement } =
          await GMAP_LOADER.importLibrary("marker");

        if (cancelled) return;

        // Mission markers
        if (showMissions) {
          missions
            .filter((m) => m.location?.coordinates)
            .forEach((mission) => {
              const pin = new PinElement({
                background: STATUS_COLORS[mission.status] || "#6b7280",
                borderColor: "rgba(255,255,255,0.4)",
                glyphColor: "#fff",
                scale: 1.2,
              });

              const marker = new AdvancedMarkerElement({
                map: gmap,
                position: {
                  lat: mission.location.coordinates[1],
                  lng: mission.location.coordinates[0],
                },
                title: mission.title,
                content: pin.element,
              });

              const content = buildInfoContent(mission.title, [
                ["Status", mission.status],
                ["Priority", mission.priority],
                ["Description", mission.description || "—"],
              ]);

              marker.addListener("click", () => {
                infoWindowRef.current.setContent(content);
                infoWindowRef.current.open({
                  map: gmap,
                  anchor: marker,
                });
              });

              markersRef.current.push(marker);
            });
        }

        // Asset markers
        if (showAssets) {
          assets
            .filter((a) => a.location?.coordinates)
            .forEach((asset) => {
              const color = ASSET_COLORS[asset.type] || "#6b7280";
              const pin = new PinElement({
                background: color,
                borderColor: "rgba(255,255,255,0.3)",
                glyph: asset.type.charAt(0) || "?",
                glyphColor: "#fff",
              });

              const marker = new AdvancedMarkerElement({
                map: gmap,
                position: {
                  lat: asset.location.coordinates[1],
                  lng: asset.location.coordinates[0],
                },
                title: asset.name,
                content: pin.element,
              });

              const content = buildInfoContent(asset.name, [
                ["Type", asset.type],
                ["Status", asset.status],
                ...(asset.assignedMission
                  ? [["Mission", asset.assignedMission.title || "Assigned"]]
                  : []),
              ]);

              marker.addListener("click", () => {
                infoWindowRef.current.setContent(content);
                infoWindowRef.current.open({
                  map: gmap,
                  anchor: marker,
                });
              });

              markersRef.current.push(marker);
            });
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Failed to load Google Maps");
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => (m.map = null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [missions, assets, showMissions, showAssets]);

  if (!GMAP_LOADER) {
    return (
      <div className={styles.gmapPlaceholder}>
        <div className={styles.gmapPlaceholderIcon}>🌍</div>
        <div className={styles.gmapPlaceholderTitle}>Google Maps 3D</div>
        <div className={styles.gmapPlaceholderText}>
          Add{" "}
          <code className={styles.gmapCode}>VITE_GOOGLE_MAPS_API_KEY</code> to
          your <code className={styles.gmapCode}>.env</code> file to enable the
          3D satellite view.
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.gmapPlaceholder}>
        <div className={styles.gmapPlaceholderIcon}>⚠️</div>
        <div className={styles.gmapPlaceholderTitle}>Map load error</div>
        <div className={styles.gmapPlaceholderText}>{loadError}</div>
      </div>
    );
  }

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
  return trails;
};

// ─── Leaflet 2D View ──────────────────────────────────────────────────────────

const LeafletMap = ({
  missions,
  assets,
  showAssets,
  showMissions,
  showZones,
  useSatellite,
}) => {
  const center = [32.08, 34.78];

  return (
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
        missions
          .filter((m) => m.area?.coordinates?.[0]?.length)
          .map((mission) => (
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
                dashArray:
                  mission.status === "Planning" ? "8 4" : undefined,
              }}
            >
              <Popup>
                <div className={styles.popupTitle}>{mission.title}</div>
                <div className={styles.popupRow}>Status: {mission.status}</div>
                <div className={styles.popupRow}>
                  Priority: {mission.priority}
                </div>
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
              position={[
                mission.location.coordinates[1],
                mission.location.coordinates[0],
              ]}
              icon={createMissionIcon()}
            >
              <Popup>
                <div className={styles.popupTitle}>{mission.title}</div>
                <div className={styles.popupRow}>Status: {mission.status}</div>
                <div className={styles.popupRow}>
                  Priority: {mission.priority}
                </div>
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
  );
};

// ─── Main map content with view toggle ───────────────────────────────────────

const MapContent = () => {
  const { missions } = useMissions();
  const { assets } = useAssets();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [showAssets, setShowAssets] = useState(true);
  const [showMissions, setShowMissions] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [show3D, setShow3D] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [useSatellite, setUseSatellite] = useState(false);
  const [use3D, setUse3D] = useState(false);

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
  return (
    <div className={styles.mapWrap}>
      {use3D ? (
        <GoogleMap3D
          missions={missions}
          assets={assets}
          showMissions={showMissions}
          showAssets={showAssets}
        />
      ) : (
        <LeafletMap
          missions={missions}
          assets={assets}
          showAssets={showAssets}
          showMissions={showMissions}
          showZones={showZones}
          useSatellite={useSatellite}
        />
      )}

      {/* Map controls */}
      <div className={styles.controls}>
        <button
          className={`${styles.controlBtn} ${use3D ? styles.controlBtnActive : ""}`}
          onClick={() => setUse3D(!use3D)}
          title="Toggle Google Maps 3D view"
        >
          🌍 {use3D ? "2D View" : "3D View"}
        </button>

        <button
          className={`${styles.controlBtn} ${showAssets ? styles.controlBtnActive : ""}`}
          onClick={() => setShowAssets(!showAssets)}
        >
          {showAssets ? "✓" : "○"} Assets
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
        {!use3D && (
          <>
            <button
              className={`${styles.controlBtn} ${showZones ? styles.controlBtnActive : ""}`}
              onClick={() => setShowZones(!showZones)}
            >
              {showZones ? "✓" : "○"} Zones
            </button>
            <button
              className={`${styles.controlBtn} ${useSatellite ? styles.controlBtnActive : ""}`}
              onClick={() => setUseSatellite(!useSatellite)}
            >
              🛰️ {useSatellite ? "Dark" : "Satellite"}
            </button>
          </>
        )}
        <button className={`${styles.controlBtn} ${showZones ? styles.controlBtnActive : ""}`} onClick={() => setShowZones(!showZones)}>
          ▣ Zones
        </button>
        <button className={`${styles.controlBtn} ${showTrails ? styles.controlBtnActive : ""}`} onClick={() => setShowTrails(!showTrails)}>
          ～ Trails
        </button>
        <button className={`${styles.controlBtn} ${useSatellite ? styles.controlBtnActive : ""}`} onClick={() => setUseSatellite(!useSatellite)}>
          🛰 {useSatellite ? "Dark" : "Satellite"}
        </button>
        <button className={styles.controlBtn} onClick={resetView} title="Reset view">
          ⊕ Reset
        </button>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
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
          <div
            className={styles.legendDot}
            style={{ background: "#ef4444", borderRadius: 2, transform: "rotate(45deg)" }}
          />
          <div className={styles.legendDot} style={{ background: "#ef4444", borderRadius: 2, transform: "rotate(45deg)" }} />
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
