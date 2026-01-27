import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

const emailSchema = z.object({
  new_email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis pour confirmer"),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Mot de passe actuel requis"),
  new_password: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
  confirm_password: z.string().min(6, "Confirmation requise"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_password"],
});

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const AdminAccount = () => {
  const { toast } = useToast();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [pendingEmailChange, setPendingEmailChange] = useState<EmailForm | null>(null);

  // Get current user email
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentEmail(user.email);
      }
    };
    getCurrentUser();
  }, []);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      new_email: "",
      password: "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const handleEmailSubmit = async (data: EmailForm) => {
    setPendingEmailChange(data);
    setShowEmailDialog(true);
  };

  const confirmEmailChange = async () => {
    if (!pendingEmailChange) return;
    
    setIsLoadingEmail(true);
    try {
      // Verify current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: pendingEmailChange.password,
      });

      if (signInError) {
        throw new Error("Mot de passe incorrect");
      }

      // Update email
      const { error: updateError } = await supabase.auth.updateUser({
        email: pendingEmailChange.new_email,
      });

      if (updateError) throw updateError;

      toast({
        title: "Email mis à jour",
        description: "Un email de confirmation a été envoyé à votre nouvelle adresse. Veuillez vérifier votre boîte de réception.",
      });

      emailForm.reset();
      setShowEmailDialog(false);
      setPendingEmailChange(null);
    } catch (error) {
      console.error("Email update error:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour l'email",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordForm) => {
    setIsLoadingPassword(true);
    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: data.current_password,
      });

      if (signInError) {
        throw new Error("Mot de passe actuel incorrect");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.new_password,
      });

      if (updateError) throw updateError;

      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été changé avec succès",
      });

      passwordForm.reset();
    } catch (error) {
      console.error("Password update error:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour le mot de passe",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold mb-2">Paramètres du compte</h1>
          <p className="text-muted-foreground">
            Gérez vos informations de connexion
          </p>
        </div>

        {/* Current Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations actuelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email actuel:</span>
              <span className="font-medium">{currentEmail || "Chargement..."}</span>
            </div>
          </CardContent>
        </Card>

        {/* Change Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Changer l'adresse email
            </CardTitle>
            <CardDescription>
              Vous recevrez un email de confirmation à la nouvelle adresse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="new_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouvelle adresse email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="nouveau@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe actuel (pour confirmer)</FormLabel>
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

                <Button type="submit" disabled={isLoadingEmail}>
                  {isLoadingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    "Mettre à jour l'email"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Changer le mot de passe
            </CardTitle>
            <CardDescription>
              Choisissez un mot de passe fort pour sécuriser votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="current_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe actuel</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
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

                <FormField
                  control={passwordForm.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Minimum 6 caractères
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
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

                <Button type="submit" disabled={isLoadingPassword}>
                  {isLoadingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    "Mettre à jour le mot de passe"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Email Change Confirmation Dialog */}
        <AlertDialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer le changement d'email</AlertDialogTitle>
              <AlertDialogDescription>
                Vous êtes sur le point de changer votre adresse email de <strong>{currentEmail}</strong> à <strong>{pendingEmailChange?.new_email}</strong>.
                <br /><br />
                Un email de confirmation sera envoyé à la nouvelle adresse. Vous devrez cliquer sur le lien de confirmation pour finaliser le changement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingEmailChange(null)}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmEmailChange} disabled={isLoadingEmail}>
                {isLoadingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  "Confirmer"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminAccount;
