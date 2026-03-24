import { useActionState } from "react";
import { useDeleteAsset, useUpdateAsset } from "../../hooks/useAssets";
import { usePermissions } from "../../hooks/usePermissions";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { Input, Select } from "../ui/Input";
import styles from "./AssetDetail.module.css";

const AssetDetail = ({ asset, onClose }) => {
  const deleteAsset = useDeleteAsset();
  const updateAsset = useUpdateAsset();
  const { canEditAsset, canDeleteAsset } = usePermissions();

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
        canDeleteAsset && (
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

      {canEditAsset && (
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

export default AssetDetail;
