import type { Household } from "@/backend.d";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateHousehold,
  useDeleteHousehold,
  useHouseholds,
  useUpdateHousehold,
} from "@/hooks/useQueries";
import {
  Home,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface HouseholdFormData {
  name: string;
  address: string;
  contactPhone: string;
}

const emptyForm: HouseholdFormData = {
  name: "",
  address: "",
  contactPhone: "",
};

export function Households() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [form, setForm] = useState<HouseholdFormData>(emptyForm);

  const { data: households, isLoading } = useHouseholds();
  const createHousehold = useCreateHousehold();
  const updateHousehold = useUpdateHousehold();
  const deleteHousehold = useDeleteHousehold();

  function openAdd() {
    setForm(emptyForm);
    setShowAddModal(true);
  }

  function openEdit(h: Household) {
    setForm({ name: h.name, address: h.address, contactPhone: h.contactPhone });
    setEditingHousehold(h);
  }

  function closeDialogs() {
    setShowAddModal(false);
    setEditingHousehold(null);
    setDeletingId(null);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      if (editingHousehold) {
        await updateHousehold.mutateAsync({
          id: editingHousehold.id,
          name: form.name.trim(),
          address: form.address.trim(),
          contactPhone: form.contactPhone.trim(),
        });
        toast.success("Household updated");
      } else {
        await createHousehold.mutateAsync({
          name: form.name.trim(),
          address: form.address.trim(),
          contactPhone: form.contactPhone.trim(),
        });
        toast.success("Household added");
      }
      closeDialogs();
    } catch {
      toast.error("Failed to save household");
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteHousehold.mutateAsync(deletingId);
      toast.success("Household deleted");
      closeDialogs();
    } catch {
      toast.error("Failed to delete household");
    }
  }

  const isSaving = createHousehold.isPending || updateHousehold.isPending;
  const isDeleting = deleteHousehold.isPending;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Households
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage delivery households
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus size={15} />
          Add Household
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {["s1", "s2", "s3", "s4"].map((k) => (
            <Skeleton key={k} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : !households?.length ? (
        <Card className="shadow-card">
          <CardContent className="py-16 text-center">
            <Home size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-display font-semibold text-foreground mb-1">
              No Households Yet
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              Add your first delivery household to get started.
            </p>
            <Button onClick={openAdd} className="gap-2">
              <Plus size={14} />
              Add First Household
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <AnimatePresence>
            {households.map((h, idx) => (
              <motion.div
                key={h.id.toString()}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="shadow-xs hover:shadow-card transition-shadow">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                          <Home size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {h.name}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {h.address && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <MapPin size={10} />
                                {h.address}
                              </span>
                            )}
                            {h.contactPhone && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone size={10} />
                                {h.contactPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(h)}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingId(h.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddModal || !!editingHousehold}
        onOpenChange={(open) => {
          if (!open) closeDialogs();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingHousehold ? "Edit Household" : "Add Household"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="hh-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="hh-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. The Sharma Family"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hh-address">Address</Label>
              <Input
                id="hh-address"
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                placeholder="e.g. 42 Green Lane, Mumbai"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hh-phone">Contact Phone</Label>
              <Input
                id="hh-phone"
                value={form.contactPhone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactPhone: e.target.value }))
                }
                placeholder="e.g. +91 98765 43210"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              <X size={13} className="mr-1.5" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <Loader2 size={13} className="mr-1.5 animate-spin" />
              ) : null}
              {editingHousehold ? "Update" : "Add Household"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Household?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this household and all associated
              delivery records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 size={13} className="mr-1.5 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
