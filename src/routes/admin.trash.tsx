import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDeletedItems, restoreItem } from "../server/functions";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/admin/trash")({
  component: AdminTrashPage,
});

function AdminTrashPage() {
  const queryClient = useQueryClient();
  const { user, isModerator, isAdmin, loading } = useAuth();

  const { data: items, isLoading } = useQuery({
    queryKey: ["deletedItems"],
    queryFn: () => getDeletedItems(),
    enabled: isModerator || isAdmin,
  });

  const restoreMutation = useMutation({
    mutationFn: (vars: { kindId: string; id: string }) => restoreItem({ data: vars }),
    onSuccess: () => {
      toast.success("Eintrag erfolgreich wiederhergestellt.");
      queryClient.invalidateQueries({ queryKey: ["deletedItems"] });
    },
    onError: () => {
      toast.error("Fehler beim Wiederherstellen.");
    },
  });

  if (loading) return <div className="p-8">...</div>;
  if (!user || (!isModerator && !isAdmin))
    return <div className="p-8 container mx-auto">Kein Zugriff. Nur Moderatoren und Admins können den Papierkorb einsehen.</div>;

  if (isLoading) return <div className="p-8">Lade Papierkorb...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Papierkorb</h1>
      <p className="text-muted-foreground mb-8">
        Hier siehst du alle gelöschten Einträge der letzten 30 Tage.
      </p>

      {items?.length === 0 ? (
        <div className="text-center p-12 border rounded-md bg-muted/20">
          Der Papierkorb ist leer.
        </div>
      ) : (
        <div className="border rounded-md divide-y">
          {items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-background">
              <div>
                <div className="font-semibold text-lg">{item.nameDe || item.titleDe}</div>
                <div className="text-sm text-muted-foreground flex gap-3">
                  <span>Modul: {item._kind}</span>
                  <span>Slug: {item.slug}</span>
                  <span>
                    Gelöscht am:{" "}
                    {item.deletedAt ? format(new Date(item.deletedAt), "dd.MM.yyyy HH:mm") : "-"}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Diesen Eintrag wirklich wiederherstellen?")) {
                    restoreMutation.mutate({ kindId: item._kind, id: item.id });
                  }
                }}
                disabled={restoreMutation.isPending}
              >
                Wiederherstellen
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
