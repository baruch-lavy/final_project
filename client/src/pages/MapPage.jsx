import { Suspense, useCallback, useState } from "react";
import { useMissions } from "../hooks/useMissions";
import { useAssets } from "../hooks/useAssets";
import MapView from "../components/map/MapView";
import MapLayerPanel from "../components/map/MapLayerPanel";
import { SkeletonMap } from "../components/ui/Skeleton";
import styles from "./MapPage.module.css";

const DEFAULT_LAYERS = ["missions", "assets"];

const MapContent = () => {
  const { missions } = useMissions();
  const { assets } = useAssets();
  const [layers, setLayers] = useState(DEFAULT_LAYERS);

  const toggleLayer = useCallback((id) => {
    setLayers((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }, []);

  const handlePolygonComplete = useCallback((coordinates) => {
    console.log("Polygon drawn:", coordinates);
  }, []);

  return (
    <div className={styles.mapContainer}>
      <MapLayerPanel activeLayers={layers} onToggle={toggleLayer} />
      <MapView
        assets={layers.includes("assets") ? assets : []}
        missions={layers.includes("missions") ? missions : []}
        onPolygonComplete={handlePolygonComplete}
        showTrails={layers.includes("trails")}
      />
    </div>
  );
};

const MapPage = () => (
  <Suspense fallback={<SkeletonMap />}>
    <MapContent />
  </Suspense>
);

export default MapPage;
