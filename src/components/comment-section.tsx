import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getComments, postComment, deleteComment } from "@/server/functions";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useLang, t } from "@/lib/i18n";

export function CommentSection({ recipeId }: { recipeId: string }) {
  const { user, isModerator } = useAuth();
  const { lang } = useLang();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", recipeId],
    queryFn: () => getComments({ data: { recipeId } }),
  });

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!user) {
      toast.error(t("mustBeLoggedIn", lang));
      return;
    }

    setSubmitting(true);
    try {
      await postComment({ data: { recipeId, content: content.trim(), authorId: user.id } });
      setContent("");
      toast.success(t("commentSent", lang));
      qc.invalidateQueries({ queryKey: ["comments", recipeId] });
    } catch (e) {
      toast.error(t("commentSendError", lang));
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm(t("confirmDeleteComment", lang))) return;
    try {
      await deleteComment({ data: { commentId } });
      toast.success(t("commentDeleted", lang));
      qc.invalidateQueries({ queryKey: ["comments", recipeId] });
    } catch (e) {
      toast.error(t("deleteError", lang));
    }
  };

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h3 className="text-lg font-bold text-primary mb-4">{t("commentsTitle", lang)}</h3>

      {user ? (
        <div className="mb-6 flex flex-col gap-2">
          <Textarea
            placeholder={t("writeComment", lang)}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <Button
            className="self-end"
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
          >
            {t("send", lang)}
          </Button>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-muted text-sm text-muted-foreground rounded">
          {t("loginToComment", lang)}
        </div>
      )}

      {isLoading ? (
        <div className="text-muted-foreground text-sm">{t("loadingComments", lang)}</div>
      ) : comments?.length === 0 ? (
        <div className="text-muted-foreground text-sm">{t("noCommentsYet", lang)}</div>
      ) : (
        <div className="flex flex-col gap-4">
          {comments?.map((c) => (
            <div key={c.id} className="mc-panel p-4 flex gap-4">
              <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                {c.author.image ? (
                  <img
                    src={c.author.image}
                    alt={c.author.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-accent font-bold">
                    {c.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="font-bold text-sm text-primary">{c.author.name}</span>
                    {c.author.roles?.some((r) => r.role === "MODERATOR" || r.role === "ADMIN") && (
                      <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/50">
                        TEAM
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(c.createdAt).toLocaleDateString(lang === "de" ? "de-DE" : "en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {isModerator && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="text-sm whitespace-pre-wrap">{c.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
