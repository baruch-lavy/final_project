import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

const STATUS_COLORS = {
  Active: "#10b981",
  Planning: "#3b82f6",
  Completed: "#6b7280",
  Aborted: "#ef4444",
};

const MissionZone = ({ mission, showZone = true, showMarker = true }) => {
  const map = useMap();
  const markerLib = useMapsLibrary("marker");
  const polygonRef = useRef(null);
  const markerRef = useRef(null);
  const infoRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const color = STATUS_COLORS[mission.status] || "#6b7280";

    // Draw polygon zone
    if (showZone && mission.area?.coordinates?.[0]?.length) {
      const path = mission.area.coordinates[0].map(([lng, lat]) => ({
        lat,
        lng,
      }));

      if (!polygonRef.current) {
        polygonRef.current = new google.maps.Polygon({
          map,
          paths: path,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.1,
          ...(mission.status === "Planning" && {
            strokeOpacity: 0.6,
            strokeWeight: 2,
          }),
        });

        infoRef.current = new google.maps.InfoWindow({
          content: `
            <div class="aegis-popup">
              <div class="aegis-popup-title">${mission.title}</div>
              <div class="aegis-popup-row">
                <span class="aegis-popup-key">Status</span>
                <span class="aegis-popup-status">${mission.status}</span>
              </div>
              <div class="aegis-popup-row">
                <span class="aegis-popup-key">Priority</span>
                <span class="aegis-popup-status">${mission.priority}</span>
              </div>
            </div>
          `,
        });

        polygonRef.current.addListener("click", (e) => {
          infoRef.current.setPosition(e.latLng);
          infoRef.current.open(map);
        });
      } else {
        polygonRef.current.setPaths(path);
        polygonRef.current.setOptions({ strokeColor: color, fillColor: color });
      }
    }

    // Draw mission marker if it has a point location
    if (showMarker && markerLib && mission.location?.coordinates) {
      const [lng, lat] = mission.location.coordinates;

      if (!markerRef.current) {
        const el = document.createElement("div");
        el.innerHTML = `
          <div style="
            width:22px;height:22px;border-radius:4px;transform:rotate(45deg);
            background:${color};border:2px solid rgba(255,255,255,0.4);
            box-shadow:0 0 12px ${color}80;cursor:pointer;
          "></div>
        `;

        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat, lng },
          content: el,
          title: mission.title,
        });
      } else {
        markerRef.current.position = { lat, lng };
      }
    }

    return () => {};
  }, [map, markerLib, mission, showZone, showMarker]);

  useEffect(() => {
    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
      if (infoRef.current) {
        infoRef.current.close();
        infoRef.current = null;
      }
    };
  }, []);

  return null;
};

export default MissionZone;
