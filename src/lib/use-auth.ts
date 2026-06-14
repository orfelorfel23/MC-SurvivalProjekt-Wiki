import { useEffect, useState } from "react";
import { authClient } from "./auth-client";
import { getUserRoles } from "@/server/functions";

export function useAuth() {
  const { data, isPending } = authClient.useSession();
  const user = data?.user ?? null;

  const [isEditor, setIsEditor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsEditor(false);
      setIsAdmin(false);
      return;
    }
    getUserRoles({ data: { userId: user.id } })
      .then((roles) => {
        setIsAdmin(roles.includes("ADMIN"));
        setIsEditor(roles.includes("ADMIN") || roles.includes("EDITOR"));
      })
      .catch(console.error);
  }, [user]);

  return { user, isEditor, isAdmin, loading: isPending };
}
