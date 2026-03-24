import { useState, Suspense } from "react";
import { AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import { HiOutlinePlus } from "react-icons/hi";
import { useAssets } from "../hooks/useAssets";
import { useAuthStore } from "../stores/authStore";
import Button from "../components/ui/Button";
import { SkeletonCard } from "../components/ui/Skeleton";
import AssetCard from "../components/assets/AssetCard";
import AssetDetail from "../components/assets/AssetDetail";
import AssetForm from "../components/assets/AssetForm";
import styles from "./AssetsPage.module.css";

const ASSET_TYPES = ["All", "Vehicle", "Personnel", "Equipment", "UAV"];

const AssetsContent = () => {
  const { assets, loading } = useAssets();
  const [filter, setFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.role === "Commander" || user?.role === "Operator";

  const filtered =
    filter === "All" ? assets : assets.filter((a) => a.type === filter);
  const selected = assets.find((a) => a._id === selectedId);

  if (loading)
    return (
      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );

  return (
    <>
      <div className={styles.header}>
        <span className={styles.title}>
          {filtered.length} asset{filtered.length !== 1 ? "s" : ""}
        </span>
        {canCreate && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <HiOutlinePlus /> Add Asset
          </Button>
        )}
      </div>

      <div className={styles.filters}>
        {ASSET_TYPES.map((t) => (
          <button
            key={t}
            className={`${styles.filterBtn} ${filter === t ? styles.filterBtnActive : ""}`}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <AnimatePresence mode="popLayout">
          {filtered.map((asset) => (
            <AssetCard
              key={asset._id}
              asset={asset}
              onClick={() => setSelectedId(asset._id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            padding: 40,
            fontSize: 14,
          }}
        >
          No assets found
        </div>
      )}

      <AssetForm isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      {selected && (
        <AssetDetail asset={selected} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
};

const AssetsPage = () => (
  <Suspense fallback={<SkeletonCard />}>
    <AssetsContent />
  </Suspense>
);

export default AssetsPage;
