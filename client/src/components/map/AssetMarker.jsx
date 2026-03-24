import { useEffect, useRef, useCallback } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

const ASSET_COLORS = {
  Vehicle: "#3b82f6",
  Personnel: "#10b981",
  UAV: "#8b5cf6",
  Equipment: "#f59e0b",
};

const AssetMarker = ({ asset, onClick }) => {
  const map = useMap();
  const markerLib = useMapsLibrary("marker");
  const markerRef = useRef(null);
  const listenerRef = useRef(null);

  const handleClick = useCallback(() => {
    if (onClick) onClick(asset);
  }, [asset, onClick]);

  useEffect(() => {
    if (!map || !markerLib || !asset.location?.coordinates) return;

    const [lng, lat] = asset.location.coordinates;
    const color = ASSET_COLORS[asset.type] || "#6b7280";

    if (!markerRef.current) {
      const markerEl = document.createElement("div");
      markerEl.className = "aegis-asset-marker";
      markerEl.innerHTML = `
        <div style="
          display:flex;flex-direction:column;align-items:center;cursor:pointer;
          filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5));transition:transform 0.2s;
        ">
          <div style="
            width:32px;height:32px;border-radius:50%;
            background:${color};border:2px solid rgba(255,255,255,0.4);
            display:flex;align-items:center;justify-content:center;
            font-size:13px;color:white;font-weight:700;
            box-shadow:0 0 14px ${color}80;position:relative;
          ">
            <div style="
              position:absolute;inset:-6px;border-radius:50%;
              border:2px solid ${color}66;
              animation:markerPulseAnim 2s ease-in-out infinite;
            "></div>
            ${asset.type.charAt(0)}
          </div>
          <div style="
            width:0;height:0;border-left:4px solid transparent;
            border-right:4px solid transparent;border-top:8px solid ${color};
            margin-top:-1px;
          "></div>
        </div>
      `;
      markerEl.addEventListener("mouseenter", () => {
        markerEl.firstElementChild.style.transform =
          "scale(1.15) translateY(-2px)";
      });
      markerEl.addEventListener("mouseleave", () => {
        markerEl.firstElementChild.style.transform = "";
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat, lng },
        content: markerEl,
        title: asset.name,
      });

      listenerRef.current = marker.addListener("click", handleClick);
      markerRef.current = marker;
    } else {
      markerRef.current.position = { lat, lng };
    }

    return () => {};
  }, [map, markerLib, asset, handleClick]);

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        google.maps.event.removeListener(listenerRef.current);
      }
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
    };
  }, []);

  return null;
};

export default AssetMarker;
