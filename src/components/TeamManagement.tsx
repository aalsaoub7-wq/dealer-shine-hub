import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, Check, X } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface InviteCode {
  id: string;
  code: string;
  created_at: string;
  used_at: string | null;
  used_by: string | null;
  expires_at: string;
}

export const TeamManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: userRole } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      return data?.role;
    },
  });

  const { data: inviteCodes, isLoading } = useQuery({
    queryKey: ["inviteCodes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: userCompanies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!userCompanies) throw new Error("No company found");

      const { data, error } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("company_id", userCompanies.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InviteCode[];
    },
    enabled: userRole === "admin",
  });

  const generateCode = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: userCompanies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!userCompanies) throw new Error("No company found");

      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { error } = await supabase
        .from("invite_codes")
        .insert({
          code,
          company_id: userCompanies.company_id,
          created_by: user.id,
        });

      if (error) throw error;
      return code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inviteCodes"] });
      toast({
        title: "Inbjudningskod skapad",
        description: "Den nya koden är nu tillgänglig.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa inbjudningskod.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Kopierad",
      description: "Inbjudningskoden har kopierats.",
    });
  };

  if (userRole !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Åtkomst nekad</CardTitle>
          <CardDescription>
            Endast administratörer kan hantera teaminbjudningar.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inbjudningskoder</CardTitle>
          <CardDescription>
            Skapa engångskoder för att bjuda in anställda till ditt företag.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => generateCode.mutate()}
            disabled={generateCode.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Skapa ny kod
          </Button>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Laddar...</p>
          ) : (
            <div className="space-y-2">
              {inviteCodes?.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-mono font-bold">
                        {invite.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(invite.code)}
                      >
                        {copiedCode === invite.code ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Skapad: {format(new Date(invite.created_at), "d MMM yyyy", { locale: sv })}
                    </p>
                    {invite.used_at && (
                      <p className="text-sm text-muted-foreground">
                        Använd: {format(new Date(invite.used_at), "d MMM yyyy", { locale: sv })}
                      </p>
                    )}
                  </div>
                  <div>
                    {invite.used_at ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                        <X className="w-3 h-3" />
                        Använd
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        <Check className="w-3 h-3" />
                        Tillgänglig
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {inviteCodes?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Inga inbjudningskoder skapade ännu.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
