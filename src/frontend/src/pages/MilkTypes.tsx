import type { MilkType } from "@/backend.d";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateMilkType,
  useDeleteMilkType,
  useMilkTypes,
  useUpdateMilkType,
} from "@/hooks/useQueries";
import { Check, Loader2, Milk, Pencil, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const SAMPLE_TYPES = [
  "Full Cream Milk",
  "Toned Milk",
  "Double Toned Milk",
  "Skimmed Milk",
  "Buffalo Milk",
  "A2 Cow Milk",
];

export function MilkTypes() {
  const [newName, setNewName] = useState("");
  const [editingType, setEditingType] = useState<MilkType | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const { data: milkTypes, isLoading } = useMilkTypes();
  const createMilkType = useCreateMilkType();
  const updateMilkType = useUpdateMilkType();
  const deleteMilkType = useDeleteMilkType();

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    try {
      await createMilkType.mutateAsync(trimmed);
      setNewName("");
      toast.success("Milk type added");
    } catch {
      toast.error("Failed to add milk type");
    }
  }

  function startEdit(mt: MilkType) {
    setEditingType(mt);
    setEditName(mt.name);
  }

  async function handleUpdate() {
    if (!editingType) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    try {
      await updateMilkType.mutateAsync({ id: editingType.id, name: trimmed });
      setEditingType(null);
      setEditName("");
      toast.success("Milk type updated");
    } catch {
      toast.error("Failed to update milk type");
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteMilkType.mutateAsync(deletingId);
      toast.success("Milk type deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete milk type");
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-display font-bold text-foreground">
          Milk Types
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configure the types of milk you deliver
        </p>
      </motion.div>

      {/* Add form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card mb-6">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Add Milk Type
            </p>
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Full Cream Milk"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="text-sm"
              />
              <Button
                onClick={handleCreate}
                disabled={createMilkType.isPending}
                className="gap-2 shrink-0"
              >
                {createMilkType.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                Add
              </Button>
            </div>

            {/* Quick-add suggestions */}
            {!milkTypes?.length && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Quick add common types:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_TYPES.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNewName(name)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {["s1", "s2", "s3", "s4"].map((k) => (
            <Skeleton key={k} className="h-14 w-full" />
          ))}
        </div>
      ) : !milkTypes?.length ? (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center">
            <Milk size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-display font-semibold text-foreground mb-1">
              No Milk Types
            </p>
            <p className="text-muted-foreground text-sm">
              Add your first milk type above to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="space-y-2"
        >
          <AnimatePresence>
            {milkTypes.map((mt, idx) => (
              <motion.div
                key={mt.id.toString()}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="shadow-xs">
                  <CardContent className="py-2.5 px-4">
                    <div className="flex items-center justify-between gap-3">
                      {editingType?.id === mt.id ? (
                        // Inline edit
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdate();
                              if (e.key === "Escape") {
                                setEditingType(null);
                                setEditName("");
                              }
                            }}
                            autoFocus
                            className="h-8 text-sm"
                          />
                          <Button
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleUpdate}
                            disabled={updateMilkType.isPending}
                          >
                            {updateMilkType.isPending ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Check size={12} />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingType(null);
                              setEditName("");
                            }}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ) : (
                        // Display
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-accent/60 flex items-center justify-center">
                            <Milk
                              size={14}
                              className="text-accent-foreground"
                            />
                          </div>
                          <span className="font-medium text-sm text-foreground">
                            {mt.name}
                          </span>
                        </div>
                      )}

                      {editingType?.id !== mt.id && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEdit(mt)}
                          >
                            <Pencil size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(mt.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milk Type?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this milk type. Existing delivery
              entries referencing it may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMilkType.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMilkType.isPending ? (
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
