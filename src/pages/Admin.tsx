import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, ArrowLeft } from "lucide-react";

const ADMIN_EMAIL = "aalsaoub7@gmail.com";

interface Customer {
  id: string;
  name: string;
  stripe_customer_id: string | null;
  signup_code: string | null;
  created_at: string;
}

const Admin = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  
  // Create customer form
  const [companyName, setCompanyName] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [pricePerImage, setPricePerImage] = useState("");
  const [creating, setCreating] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [copied, setCopied] = useState(false);
  
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

  // Fetch customers
  useEffect(() => {
    if (!isAuthorized) return;
    
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      
      // Get companies with their signup codes
      const { data: companies, error: companiesError } = await supabase
        .from("companies")
        .select("id, name, stripe_customer_id, created_at")
        .order("created_at", { ascending: false });
      
      if (companiesError) {
        console.error("Error fetching companies:", companiesError);
        setCustomersLoading(false);
        return;
      }
      
      // Get signup codes
      const { data: signupCodes, error: codesError } = await supabase
        .from("signup_codes")
        .select("code, stripe_customer_id");
      
      if (codesError) {
        console.error("Error fetching signup codes:", codesError);
      }
      
      // Map codes to companies by stripe_customer_id
      const codeMap = new Map<string, string>();
      signupCodes?.forEach(sc => {
        if (sc.stripe_customer_id) {
          codeMap.set(sc.stripe_customer_id, sc.code);
        }
      });
      
      const customersWithCodes: Customer[] = (companies || []).map(company => ({
        id: company.id,
        name: company.name,
        stripe_customer_id: company.stripe_customer_id,
        signup_code: company.stripe_customer_id ? codeMap.get(company.stripe_customer_id) || null : null,
        created_at: company.created_at
      }));
      
      setCustomers(customersWithCodes);
      setCustomersLoading(false);
    };
    
    fetchCustomers();
  }, [isAuthorized]);

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
        toast({
          title: "Checkout-länk skapad!",
          description: "Kopiera länken och skicka till kunden"
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
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium text-green-600">✓ Checkout-länk skapad!</p>
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
                    <TableHead>Stripe ID</TableHead>
                    <TableHead>Signup-kod</TableHead>
                    <TableHead>Skapad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {customer.stripe_customer_id || "—"}
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
      </div>
    </div>
  );
};

export default Admin;
