import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useLang, t } from "@/lib/i18n";

export function useConfirm() {
  const [promise, setPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { lang } = useLang();

  const confirm = useCallback((msg: string) => {
    setMessage(msg);
    return new Promise<boolean>((resolve) => {
      setPromise({ resolve });
    });
  }, []);

  const handleClose = () => {
    setPromise(null);
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  };

  const ConfirmDialog = () => (
    <AlertDialog open={promise !== null} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bestätigung</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Bestätigen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return [ConfirmDialog, confirm] as const;
}
