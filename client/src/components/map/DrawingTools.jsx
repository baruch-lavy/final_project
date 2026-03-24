import { useState, useEffect, useRef, useCallback } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import styles from "./DrawingTools.module.css";

const DrawingTools = ({ onPolygonComplete, enabled = true }) => {
  const map = useMap();
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const polylineRef = useRef(null);
  const previewPolygonRef = useRef(null);
  const clickListenerRef = useRef(null);
  const markersRef = useRef([]);

  const clearDrawing = useCallback(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (previewPolygonRef.current) {
      previewPolygonRef.current.setMap(null);
      previewPolygonRef.current = null;
    }
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];
    setPoints([]);
  }, []);

  const stopDrawing = useCallback(() => {
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }
    clearDrawing();
    setDrawing(false);
    if (map) map.setOptions({ draggableCursor: null });
  }, [map, clearDrawing]);

  const startDrawing = useCallback(() => {
    if (!map) return;
    clearDrawing();
    setDrawing(true);
    map.setOptions({ draggableCursor: "crosshair" });

    clickListenerRef.current = map.addListener("click", (e) => {
      const pt = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setPoints((prev) => [...prev, pt]);

      const el = document.createElement("div");
      el.style.cssText =
        "width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 0 6px #3b82f680;";
      const m = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: pt,
        content: el,
      });
      markersRef.current.push(m);
    });
  }, [map, clearDrawing]);

  // Update polyline / preview polygon as points change
  useEffect(() => {
    if (!map || !drawing) return;

    if (polylineRef.current) polylineRef.current.setMap(null);
    if (previewPolygonRef.current) previewPolygonRef.current.setMap(null);

    if (points.length >= 2) {
      polylineRef.current = new google.maps.Polyline({
        map,
        path: points,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
    }

    if (points.length >= 3) {
      previewPolygonRef.current = new google.maps.Polygon({
        map,
        paths: points,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: "#3b82f6",
        fillOpacity: 0.08,
      });
    }
  }, [map, points, drawing]);

  const finishDrawing = () => {
    if (points.length < 3) return;
    const coords = points.map((p) => [p.lng, p.lat]);
    coords.push(coords[0]); // close the ring
    if (onPolygonComplete) onPolygonComplete(coords);
    stopDrawing();
  };

  useEffect(() => {
    return () => stopDrawing();
  }, [stopDrawing]);

  if (!enabled) return null;

  return (
    <div className={styles.drawingTools}>
      {!drawing ? (
        <button className={styles.drawBtn} onClick={startDrawing}>
          ✏️ Draw Zone
        </button>
      ) : (
        <>
          <button
            className={styles.drawBtn}
            onClick={finishDrawing}
            disabled={points.length < 3}
          >
            ✓ Finish ({points.length} pts)
          </button>
          <button className={styles.cancelBtn} onClick={stopDrawing}>
            ✕ Cancel
          </button>
        </>
      )}
    </div>
  );
};

export default DrawingTools;
