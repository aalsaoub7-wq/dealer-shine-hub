import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCw, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export const TeamManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedCode, setCopiedCode] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

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

  const { data: companyData, isLoading } = useQuery({
    queryKey: ["companyInviteCode"],
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
        .from("companies")
        .select("id, employee_invite_code")
        .eq("id", userCompanies.company_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: userRole === "admin",
  });

  const { data: teamMembers } = useQuery({
    queryKey: ["teamMembers"],
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
        .from("user_roles")
        .select("user_id, role, created_at")
        .eq("company_id", userCompanies.company_id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: userRole === "admin",
  });

  const regenerateCode = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: userCompanies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!userCompanies) throw new Error("No company found");

      const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { error } = await supabase
        .from("companies")
        .update({ employee_invite_code: newCode })
        .eq("id", userCompanies.company_id);

      if (error) throw error;
      return newCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyInviteCode"] });
      setShowRegenerateDialog(false);
      toast({
        title: "Kod uppdaterad",
        description: "En ny inbjudningskod har skapats.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera inbjudningskod.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Inbjudningskod</CardTitle>
            <CardDescription>
              Dela denna permanenta kod med anställda för att ge dem åtkomst till ditt företag.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Laddar...</p>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <code className="text-2xl font-mono font-bold">
                      {companyData?.employee_invite_code}
                    </code>
                    <p className="text-xs text-muted-foreground">
                      Permanent inbjudningskod för ditt företag
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(companyData?.employee_invite_code || "")}
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowRegenerateDialog(true)}
                  disabled={regenerateCode.isPending}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generera ny kod
                </Button>
                <p className="text-xs text-muted-foreground">
                  Om du genererar en ny kod kommer den gamla koden att sluta fungera för nya registreringar. 
                  Befintliga anställda påverkas inte.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teammedlemmar</CardTitle>
            <CardDescription>
              Alla användare som har åtkomst till ditt företag
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers && teamMembers.length > 0 ? (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div key={member.user_id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{member.user_id}</p>
                      <p className="text-xs text-muted-foreground">
                        Gick med: {new Date(member.created_at).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role === 'admin' ? 'Admin' : 'Anställd'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Inga teammedlemmar än.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generera ny inbjudningskod?</AlertDialogTitle>
            <AlertDialogDescription>
              Detta kommer att skapa en ny permanent kod. Den gamla koden kommer att sluta fungera 
              för nya registreringar, men befintliga anställda påverkas inte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={() => regenerateCode.mutate()}>
              Generera ny kod
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
