import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Trash2, LogOut } from "lucide-react";

export const AccountSettings = () => {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;

      await supabase.auth.signOut();
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Fel vid radering",
        description: err.message || "Kunde inte radera kontot",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Kontohantering</h3>
        <p className="text-sm text-muted-foreground">
          Hantera ditt konto och inloggning
        </p>
      </div>

      {/* Logga ut */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium">Logga ut</h4>
            <p className="text-sm text-muted-foreground">
              Logga ut från ditt konto på denna enhet
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logga ut
          </Button>
        </div>
      </div>

      {/* Radera konto */}
      <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-destructive">Radera konto</h4>
            <p className="text-sm text-muted-foreground">
              Detta kommer permanent radera ditt konto och all tillhörande data.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Radera
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Är du helt säker?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta kan inte ångras. Ditt konto och all tillhörande data
                  (bilar, foton, inställningar) kommer att raderas permanent.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Raderar..." : "Ja, radera mitt konto"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
