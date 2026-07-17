import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function computeDiffLines(oldStr: string, newStr: string) {
  // Very simplistic diff for JSON lines
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");

  const diff: any[] = [];
  let i = 0,
    j = 0;

  // A naive approach: just show both if they differ, but we can do a simple alignment
  // For a reliable diff without a library, we can just show changes in keys.

  const allKeys = Array.from(new Set([...oldLines, ...newLines]));
  // Actually, let's just do a simple unified-ish output:
  // Since objects can be out of order, let's parse them and compare keys.
  return diff;
}

export function DiffModal({
  isOpen,
  onClose,
  onConfirm,
  oldData,
  newData,
  title = "Änderungen überprüfen",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  oldData: any;
  newData: any;
  title?: string;
}) {
  const getChanges = () => {
    const changes: { key: string; oldVal: string; newVal: string }[] = [];
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

    allKeys.forEach((key) => {
      // Ignore complex nested objects for a simple diff, or stringify them
      const oldValStr =
        typeof oldData[key] === "object"
          ? JSON.stringify(oldData[key])
          : String(oldData[key] ?? "");
      const newValStr =
        typeof newData[key] === "object"
          ? JSON.stringify(newData[key])
          : String(newData[key] ?? "");

      if (oldValStr !== newValStr) {
        changes.push({ key, oldVal: oldValStr, newVal: newValStr });
      }
    });

    return changes;
  };

  const changes = getChanges();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {changes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">Keine Änderungen erkannt.</div>
        ) : (
          <div className="grid gap-4 py-4">
            {changes.map((c) => (
              <div key={c.key} className="border border-border rounded p-3 text-sm">
                <div className="font-bold text-accent mb-2">{c.key}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-500/10 p-2 rounded border border-red-500/20 text-red-200 break-all whitespace-pre-wrap">
                    <div className="text-xs font-bold text-red-500 mb-1">ALT</div>
                    {c.oldVal}
                  </div>
                  <div className="bg-green-500/10 p-2 rounded border border-green-500/20 text-green-200 break-all whitespace-pre-wrap">
                    <div className="text-xs font-bold text-green-500 mb-1">NEU</div>
                    {c.newVal}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Änderungen speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
