import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import optimaLogo from "@/assets/optima-logo.png";

const authSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type AuthForm = z.infer<typeof authSchema>;

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Try to set up as admin if first user
        await supabase.rpc("setup_first_admin");
        
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin");

        if (roles && roles.length > 0) {
          navigate("/admin/dashboard");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: AuthForm) => {
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw new Error(
          authError.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect"
            : authError.message
        );
      }

      if (!authData.user) {
        throw new Error("Erreur d'authentification");
      }

      // Try to set up as admin if first user
      await supabase.rpc("setup_first_admin");

      // Check if user has admin role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin");

      if (rolesError) {
        throw new Error("Erreur lors de la vérification des droits");
      }

      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        throw new Error("Accès non autorisé. Vous n'êtes pas administrateur.");
      }

      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans le tableau de bord",
      });

      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: AuthForm) => {
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new Error("Cet email est déjà utilisé. Essayez de vous connecter.");
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Erreur lors de la création du compte");
      }

      // Try to set up as admin (will work if first user)
      await supabase.rpc("setup_first_admin");

      toast({
        title: "Compte créé avec succès!",
        description: "Vous êtes maintenant connecté en tant qu'administrateur.",
      });

      // Check admin status and redirect
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin");

      if (roles && roles.length > 0) {
        navigate("/admin/dashboard");
      } else {
        setActiveTab("login");
        toast({
          title: "Compte créé",
          description: "Veuillez contacter l'administrateur pour obtenir les droits d'accès.",
        });
      }

    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Erreur d'inscription",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: AuthForm) => {
    if (activeTab === "login") {
      handleLogin(data);
    } else {
      handleSignup(data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img src={optimaLogo} alt="Optima Optique" className="h-16 w-auto mx-auto" />
          </div>
          <CardTitle className="text-2xl">Administration</CardTitle>
          <CardDescription>
            Gérez votre boutique Optima Optique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@optima-optique.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <TabsContent value="login" className="mt-0 pt-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="mt-0 pt-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer mon compte admin"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Le premier compte créé devient automatiquement administrateur.
                  </p>
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
