import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, ArrowLeft, Trash2 } from "lucide-react";

const ADMIN_EMAIL = "aalsaoub7@gmail.com";

interface Customer {
  id: string;
  name: string;
  stripe_customer_id: string | null;
  signup_code: string | null;
  created_at: string;
  monthlyFee: number | null;
  pricePerImage: number | null;
}

interface Lead {
  id: string;
  email: string;
  created_at: string;
}

interface LockedBackground {
  id: string;
  template_id: string;
  name: string;
  unlock_code: string;
  is_active: boolean;
  display_order: number;
}

const Admin = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  const [lockedBackgrounds, setLockedBackgrounds] = useState<LockedBackground[]>([]);
  const [backgroundsLoading, setBackgroundsLoading] = useState(true);
  
  // Create customer form
  const [companyName, setCompanyName] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [pricePerImage, setPricePerImage] = useState("");
  const [creating, setCreating] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check admin access
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }
      
      if (user.email !== ADMIN_EMAIL) {
        toast({
          title: "Åtkomst nekad",
          description: "Du har inte behörighet att se denna sida",
          variant: "destructive"
        });
        navigate("/dashboard");
        return;
      }
      
      setIsAuthorized(true);
      setLoading(false);
    };
    
    checkAccess();
  }, [navigate, toast]);

  // Fetch customers with pricing from Stripe
  useEffect(() => {
    if (!isAuthorized) return;
    
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      
      try {
        const { data, error } = await supabase.functions.invoke("get-admin-customers");
        
        if (error) {
          console.error("Error fetching customers:", error);
          return;
        }
        
        setCustomers(data?.customers || []);
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setCustomersLoading(false);
      }
    };
    
    fetchCustomers();
  }, [isAuthorized]);

  // Fetch leads
  useEffect(() => {
    if (!isAuthorized) return;
    
    const fetchLeads = async () => {
      setLeadsLoading(true);
      
      try {
        const { data, error } = await supabase.functions.invoke("manage-leads", {
          method: "GET"
        });
        
        if (error) {
          console.error("Error fetching leads:", error);
          return;
        }
        
        setLeads(data?.leads || []);
      } catch (err) {
        console.error("Error fetching leads:", err);
      } finally {
        setLeadsLoading(false);
      }
    };
    
    fetchLeads();
  }, [isAuthorized]);

  // Fetch locked backgrounds
  useEffect(() => {
    if (!isAuthorized) return;
    
    const fetchLockedBackgrounds = async () => {
      setBackgroundsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("background_templates")
          .select("id, template_id, name, unlock_code, is_active, display_order")
          .not("unlock_code", "is", null)
          .order("display_order", { ascending: true });
        
        if (error) {
          console.error("Error fetching locked backgrounds:", error);
          return;
        }
        
        setLockedBackgrounds((data || []) as LockedBackground[]);
      } catch (err) {
        console.error("Error fetching locked backgrounds:", err);
      } finally {
        setBackgroundsLoading(false);
      }
    };
    
    fetchLockedBackgrounds();
  }, [isAuthorized]);

  const handleDeleteLead = async (id: string) => {
    setDeletingLeadId(id);
    
    try {
      const { error } = await supabase.functions.invoke("manage-leads", {
        body: { id }
      });
      
      if (error) throw error;
      
      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast({
        title: "Lead raderad",
        description: "Leaden har tagits bort"
      });
    } catch (err) {
      console.error("Error deleting lead:", err);
      toast({
        title: "Fel",
        description: "Kunde inte radera lead",
        variant: "destructive"
      });
    } finally {
      setDeletingLeadId(null);
    }
  };

  const handleCreateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast({
        title: "Fel",
        description: "Företagsnamn krävs",
        variant: "destructive"
      });
      return;
    }
    
    const monthlyFeeNum = parseFloat(monthlyFee);
    const pricePerImageNum = parseFloat(pricePerImage);
    
    if (isNaN(monthlyFeeNum) || monthlyFeeNum <= 0) {
      toast({
        title: "Fel",
        description: "Ange en giltig månadsavgift",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(pricePerImageNum) || pricePerImageNum <= 0) {
      toast({
        title: "Fel",
        description: "Ange ett giltigt pris per bild",
        variant: "destructive"
      });
      return;
    }
    
    setCreating(true);
    setCheckoutUrl("");
    setSignupCode("");
    
    try {
      const { data, error } = await supabase.functions.invoke("create-customer-checkout", {
        body: {
          companyName: companyName.trim(),
          monthlyFee: Math.round(monthlyFeeNum * 100), // Convert kr to öre
          pricePerImage: Math.round(pricePerImageNum * 100) // Convert kr to öre
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        setCheckoutUrl(data.url);
        setSignupCode(data.signupCode || "");
        toast({
          title: "Checkout-länk skapad!",
          description: "Kopiera länken och signup-koden"
        });
      } else {
        throw new Error("Ingen URL returnerades");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa checkout-länk",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const copySignupCode = async () => {
    try {
      await navigator.clipboard.writeText(signupCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Admin</h1>
        </div>

        {/* Create Customer Card */}
        <Card>
          <CardHeader>
            <CardTitle>Skapa ny kund</CardTitle>
            <CardDescription>
              Generera en checkout-länk för en ny kund med anpassad prissättning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCheckout} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="companyName" className="text-sm font-medium">
                    Företagsnamn
                  </label>
                  <Input
                    id="companyName"
                    placeholder="Arena Bil AB"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="monthlyFee" className="text-sm font-medium">
                    Månadsavgift (kr)
                  </label>
                  <Input
                    id="monthlyFee"
                    type="number"
                    step="0.01"
                    placeholder="299.00"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="pricePerImage" className="text-sm font-medium">
                    Pris per bild (kr)
                  </label>
                  <Input
                    id="pricePerImage"
                    type="number"
                    step="0.01"
                    placeholder="4.95"
                    value={pricePerImage}
                    onChange={(e) => setPricePerImage(e.target.value)}
                    disabled={creating}
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Skapar...
                  </>
                ) : (
                  "Skapa checkout-länk"
                )}
              </Button>
            </form>
            
            {checkoutUrl && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                <p className="text-sm font-medium text-green-600">✓ Checkout-länk skapad!</p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Checkout URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={checkoutUrl}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {signupCode && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Signup-kod (delas efter betalning)</label>
                    <div className="flex gap-2 items-center">
                      <code className="px-3 py-2 bg-primary/10 rounded font-mono text-sm flex-1">
                        {signupCode}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copySignupCode}
                      >
                        {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Customers Card */}
        <Card>
          <CardHeader>
            <CardTitle>Befintliga kunder</CardTitle>
            <CardDescription>
              Alla registrerade företag och deras inbjudningskoder
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : customers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Inga kunder registrerade ännu
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Företag</TableHead>
                    <TableHead>Månadsavgift</TableHead>
                    <TableHead>Pris/bild</TableHead>
                    <TableHead>Signup-kod</TableHead>
                    <TableHead>Skapad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        {customer.monthlyFee !== null ? (
                          <span>{customer.monthlyFee.toLocaleString("sv-SE")} kr</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.pricePerImage !== null ? (
                          <span>{customer.pricePerImage.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.signup_code ? (
                          <code className="px-2 py-1 bg-muted rounded text-sm">
                            {customer.signup_code}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(customer.created_at).toLocaleDateString("sv-SE")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        {/* Leads Card */}
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
            <CardDescription>
              Användare som försökt registrera sig utan giltig kod
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : leads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Inga leads ännu
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-post</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="w-20">Åtgärd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString("sv-SE")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLead(lead.id)}
                          disabled={deletingLeadId === lead.id}
                        >
                          {deletingLeadId === lead.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Locked Backgrounds Card */}
        <Card>
          <CardHeader>
            <CardTitle>Låsta bakgrunder</CardTitle>
            <CardDescription>
              Bakgrundsmallar som kräver upplåsningskod
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backgroundsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : lockedBackgrounds.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Inga låsta bakgrunder
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>Template ID</TableHead>
                    <TableHead>Upplåsningskod</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lockedBackgrounds.map((bg) => (
                    <TableRow key={bg.id}>
                      <TableCell className="font-medium">{bg.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {bg.template_id}
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-primary/10 rounded text-sm">
                          {bg.unlock_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        {bg.is_active ? (
                          <span className="text-green-600">Aktiv</span>
                        ) : (
                          <span className="text-muted-foreground">Inaktiv</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
