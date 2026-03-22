import { useState, useActionState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlinePlus, HiOutlineLocationMarker } from "react-icons/hi";
import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from "../hooks/useAssets";
import { useAuthStore } from "../stores/authStore";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Input, Select } from "../components/ui/Input";
import { Spinner } from "../components/ui/Loader";
import styles from "./AssetsPage.module.css";

const ASSET_TYPES = ["All", "Vehicle", "Personnel", "Equipment", "UAV"];
const ASSET_ICONS = {
  Vehicle: "🚙",
  Personnel: "👤",
  Equipment: "📦",
  UAV: "✈️",
};

const AssetCard = ({ asset, onClick }) => (
  <motion.div
    className={styles.card}
    onClick={onClick}
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    layout
  >
    <div className={styles.cardHeader}>
      <span className={styles.icon}>{ASSET_ICONS[asset.type] || "📍"}</span>
      <Badge variant={asset.status}>{asset.status}</Badge>
    </div>
    <div className={styles.cardTitle}>{asset.name}</div>
    <div className={styles.cardMeta}>
      <Badge variant={asset.type}>{asset.type}</Badge>
      {asset.location?.coordinates && (
        <span className={styles.cardMetaItem}>
          <HiOutlineLocationMarker />
          {asset.location.coordinates[1]?.toFixed(3)},{" "}
          {asset.location.coordinates[0]?.toFixed(3)}
        </span>
      )}
    </div>
  </motion.div>
);

const CreateAssetModal = ({ isOpen, onClose }) => {
  const createAsset = useCreateAsset();

  const [error, submitAction, isPending] = useActionState(
    async (_prev, formData) => {
      try {
        await createAsset.mutateAsync({
          name: formData.get("name"),
          type: formData.get("type"),
          status: formData.get("status"),
          location: {
            type: "Point",
            coordinates: [
              parseFloat(formData.get("lng")) || 34.78,
              parseFloat(formData.get("lat")) || 32.08,
            ],
          },
        });
        onClose();
        return null;
      } catch (err) {
        return err.response?.data?.message || "Failed to create asset";
      }
    },
    null,
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Asset">
      <form action={submitAction} className={styles.formGrid}>
        {error && (
          <div style={{ color: "var(--accent-red)", fontSize: 13 }}>
            {error}
          </div>
        )}
        <Input
          name="name"
          label="Asset Name"
          placeholder="e.g. Hawk-1"
          required
        />
        <div className={styles.formRow}>
          <Select name="type" label="Type">
            <option value="Vehicle">Vehicle</option>
            <option value="Personnel">Personnel</option>
            <option value="Equipment">Equipment</option>
            <option value="UAV">UAV</option>
          </Select>
          <Select name="status" label="Status">
            <option value="Active">Active</option>
            <option value="Idle">Idle</option>
            <option value="Maintenance">Maintenance</option>
          </Select>
        </div>
        <div className={styles.formRow}>
          <Input
            name="lat"
            label="Latitude"
            type="number"
            step="any"
            defaultValue="32.08"
          />
          <Input
            name="lng"
            label="Longitude"
            type="number"
            step="any"
            defaultValue="34.78"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add Asset"}
        </Button>
      </form>
    </Modal>
  );
};

const AssetDetail = ({ asset, onClose }) => {
  const deleteAsset = useDeleteAsset();
  const updateAsset = useUpdateAsset();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === "Commander" || user?.role === "Operator";

  const [error, submitAction, isPending] = useActionState(
    async (_prev, formData) => {
      try {
        await updateAsset.mutateAsync({
          id: asset._id,
          data: {
            name: formData.get("name"),
            type: formData.get("type"),
            status: formData.get("status"),
          },
        });
        onClose();
        return null;
      } catch (err) {
        return err.response?.data?.message || "Failed to update asset";
      }
    },
    null,
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={asset.name}
      footer={
        canEdit && (
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              await deleteAsset.mutateAsync(asset._id);
              onClose();
            }}
          >
            Delete Asset
          </Button>
        )
      }
    >
      <div className={styles.detailSection}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Badge variant={asset.status}>{asset.status}</Badge>
          <Badge variant={asset.type}>{asset.type}</Badge>
        </div>
      </div>

      {asset.location?.coordinates && (
        <div className={styles.detailSection}>
          <div className={styles.detailLabel}>Location</div>
          <div className={styles.coordsRow}>
            <span>Lat: {asset.location.coordinates[1]?.toFixed(5)}</span>
            <span>Lng: {asset.location.coordinates[0]?.toFixed(5)}</span>
          </div>
        </div>
      )}

      {asset.assignedMission && (
        <div className={styles.detailSection}>
          <div className={styles.detailLabel}>Assigned Mission</div>
          <div className={styles.detailValue}>
            {asset.assignedMission.title || asset.assignedMission}
          </div>
        </div>
      )}

      {canEdit && (
        <div className={styles.detailSection}>
          <div className={styles.detailLabel}>Edit Asset</div>
          <form action={submitAction} className={styles.formGrid}>
            {error && (
              <div style={{ color: "var(--accent-red)", fontSize: 12 }}>
                {error}
              </div>
            )}
            <Input
              name="name"
              label="Name"
              defaultValue={asset.name}
              required
            />
            <div className={styles.formRow}>
              <Select name="type" label="Type" defaultValue={asset.type}>
                <option value="Vehicle">Vehicle</option>
                <option value="Personnel">Personnel</option>
                <option value="Equipment">Equipment</option>
                <option value="UAV">UAV</option>
              </Select>
              <Select name="status" label="Status" defaultValue={asset.status}>
                <option value="Active">Active</option>
                <option value="Idle">Idle</option>
                <option value="Maintenance">Maintenance</option>
              </Select>
            </div>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      )}
    </Modal>
  );
};

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

  if (loading) return <Spinner />;

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

      <CreateAssetModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      {selected && (
        <AssetDetail asset={selected} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
};

const AssetsPage = () => (
  <Suspense fallback={<Spinner />}>
    <AssetsContent />
  </Suspense>
);

export default AssetsPage;
