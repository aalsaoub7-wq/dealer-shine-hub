import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, ArrowLeft, Trash2, Upload, Plus, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  image_url: string | null;
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
  
  // Search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [backgroundSearch, setBackgroundSearch] = useState("");
  
  // Create customer form
  const [companyName, setCompanyName] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [pricePerImage, setPricePerImage] = useState("");
  const [creating, setCreating] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Create background form
  const [newBgName, setNewBgName] = useState("");
  const [newBgDescription, setNewBgDescription] = useState("");
  const [newBgUnlockCode, setNewBgUnlockCode] = useState("");
  const [newBgFile, setNewBgFile] = useState<File | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [copiedUnlockCode, setCopiedUnlockCode] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filtered data
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.signup_code?.toLowerCase().includes(search)
    );
  }, [customers, customerSearch]);

  const filteredLeads = useMemo(() => {
    if (!leadSearch.trim()) return leads;
    const search = leadSearch.toLowerCase();
    return leads.filter(l =>
      l.email.toLowerCase().includes(search)
    );
  }, [leads, leadSearch]);

  const filteredBackgrounds = useMemo(() => {
    if (!backgroundSearch.trim()) return lockedBackgrounds;
    const search = backgroundSearch.toLowerCase();
    return lockedBackgrounds.filter(bg =>
      bg.name.toLowerCase().includes(search) ||
      bg.template_id.toLowerCase().includes(search) ||
      bg.unlock_code.toLowerCase().includes(search)
    );
  }, [lockedBackgrounds, backgroundSearch]);

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
          .select("id, template_id, name, unlock_code, image_url, is_active, display_order")
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

  const copyUnlockCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedUnlockCode(code);
      setTimeout(() => setCopiedUnlockCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCreateBackground = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBgFile || !newBgName.trim() || !newBgUnlockCode.trim()) {
      toast({
        title: "Fel",
        description: "Namn, bild och upplåsningskod krävs",
        variant: "destructive"
      });
      return;
    }
    
    setUploadingBg(true);
    
    try {
      // Generate template_id from name
      const templateId = newBgName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');
      
      const fileExt = newBgFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${templateId}.${fileExt}`;
      
      console.log('Uploading background:', { templateId, fileName });
      
      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('car-photos')
        .upload(`backgrounds/${fileName}`, newBgFile, { 
          upsert: true,
          contentType: newBgFile.type 
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Uppladdningsfel",
          description: "Kunde inte ladda upp bilden: " + uploadError.message,
          variant: "destructive"
        });
        return;
      }
      
      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('car-photos')
        .getPublicUrl(`backgrounds/${fileName}`);
      
      console.log('Image URL:', urlData.publicUrl);
      
      // 3. Create database entry via edge function
      const { data, error: dbError } = await supabase.functions.invoke('create-background-template', {
        body: {
          template_id: templateId,
          name: newBgName.trim(),
          description: newBgDescription.trim() || null,
          image_url: urlData.publicUrl,
          unlock_code: newBgUnlockCode.trim()
        }
      });
      
      if (dbError) {
        console.error('Database error:', dbError);
        toast({
          title: "Databasfel",
          description: "Kunde inte skapa bakgrundsmall",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Bakgrund skapad!",
        description: `"${newBgName}" har lagts till med koden ${newBgUnlockCode}`
      });
      
      // Reset form
      setNewBgName("");
      setNewBgDescription("");
      setNewBgUnlockCode("");
      setNewBgFile(null);
      
      // Refresh backgrounds list
      const { data: refreshedData } = await supabase
        .from("background_templates")
        .select("id, template_id, name, unlock_code, image_url, is_active, display_order")
        .not("unlock_code", "is", null)
        .order("display_order", { ascending: true });
      
      if (refreshedData) {
        setLockedBackgrounds(refreshedData as LockedBackground[]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Fel",
        description: "Ett oväntat fel uppstod",
        variant: "destructive"
      });
    } finally {
      setUploadingBg(false);
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Admin</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
            <TabsTrigger value="customers">Kunder</TabsTrigger>
            <TabsTrigger value="leads">
              Leads {leads.length > 0 && `(${leads.length})`}
            </TabsTrigger>
            <TabsTrigger value="backgrounds">Bakgrunder</TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6 mt-6">
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
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Sök kunder..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {customersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {customers.length === 0 ? "Inga kunder registrerade ännu" : "Inga kunder matchar sökningen"}
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
                      {filteredCustomers.map((customer) => (
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
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Leads</CardTitle>
                <CardDescription>
                  Användare som försökt registrera sig utan giltig kod
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Sök leads..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {leadsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {leads.length === 0 ? "Inga leads ännu" : "Inga leads matchar sökningen"}
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
                      {filteredLeads.map((lead) => (
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
          </TabsContent>

          {/* Backgrounds Tab */}
          <TabsContent value="backgrounds" className="space-y-6 mt-6">
            {/* Create Background Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Skapa ny låst bakgrund
                </CardTitle>
                <CardDescription>
                  Ladda upp en bakgrundsbild och sätt en upplåsningskod
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateBackground} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bgName">Namn *</Label>
                      <Input
                        id="bgName"
                        placeholder="Premium Studio"
                        value={newBgName}
                        onChange={(e) => setNewBgName(e.target.value)}
                        disabled={uploadingBg}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bgUnlockCode">Upplåsningskod *</Label>
                      <Input
                        id="bgUnlockCode"
                        placeholder="PREMIUM2024"
                        value={newBgUnlockCode}
                        onChange={(e) => setNewBgUnlockCode(e.target.value.toUpperCase())}
                        disabled={uploadingBg}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bgDescription">Beskrivning (valfritt)</Label>
                    <Textarea
                      id="bgDescription"
                      placeholder="En exklusiv studiobakgrund..."
                      value={newBgDescription}
                      onChange={(e) => setNewBgDescription(e.target.value)}
                      disabled={uploadingBg}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bgFile">Bakgrundsbild *</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="bgFile"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewBgFile(e.target.files?.[0] || null)}
                        disabled={uploadingBg}
                        className="flex-1"
                      />
                      {newBgFile && (
                        <span className="text-sm text-muted-foreground">
                          {newBgFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={uploadingBg || !newBgFile || !newBgName || !newBgUnlockCode}>
                    {uploadingBg ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Skapar...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Skapa bakgrund
                      </>
                    )}
                  </Button>
                </form>
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
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Sök bakgrunder..."
                    value={backgroundSearch}
                    onChange={(e) => setBackgroundSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {backgroundsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredBackgrounds.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {lockedBackgrounds.length === 0 ? "Inga låsta bakgrunder" : "Inga bakgrunder matchar sökningen"}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Bild</TableHead>
                        <TableHead>Namn</TableHead>
                        <TableHead>Template ID</TableHead>
                        <TableHead>Upplåsningskod</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBackgrounds.map((bg) => (
                        <TableRow key={bg.id}>
                          <TableCell>
                            {bg.image_url ? (
                              <img 
                                src={bg.image_url} 
                                alt={bg.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">—</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{bg.name}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {bg.template_id}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-1 bg-primary/10 rounded text-sm">
                                {bg.unlock_code}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyUnlockCode(bg.unlock_code)}
                              >
                                {copiedUnlockCode === bg.unlock_code ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
