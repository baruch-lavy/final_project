import { useActionState } from "react";
import { useCreateAsset } from "../../hooks/useAssets";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input, Select } from "../ui/Input";
import styles from "./AssetForm.module.css";

const AssetForm = ({ isOpen, onClose }) => {
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

export default AssetForm;
