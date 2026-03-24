import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";

const ASSET_COLORS = {
  Vehicle: "#3b82f6",
  Personnel: "#10b981",
  UAV: "#8b5cf6",
  Equipment: "#f59e0b",
};

const MAX_TRAIL_POINTS = 20;

const AssetTrail = ({ asset, history }) => {
  const map = useMap();
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !history || history.length < 2) return;

    const path = history
      .slice(-MAX_TRAIL_POINTS)
      .map(([lng, lat]) => ({ lat, lng }));
    const color = ASSET_COLORS[asset.type] || "#6b7280";

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        map,
        path,
        strokeColor: color,
        strokeOpacity: 0.6,
        strokeWeight: 2,
        icons: [
          {
            icon: {
              path: "M 0,-1 0,1",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              scale: 3,
            },
            offset: "0",
            repeat: "16px",
          },
        ],
      });
    } else {
      polylineRef.current.setPath(path);
    }

    return () => {};
  }, [map, asset, history]);

  useEffect(() => {
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, []);

  return null;
};

export default AssetTrail;
