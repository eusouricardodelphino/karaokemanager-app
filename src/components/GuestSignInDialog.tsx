import { useState } from "react";
import { Link } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Music, Mic } from "lucide-react";
import type { AppUser } from "@/types/user";

interface GuestSignInDialogProps {
  open: boolean;
  redirectPath: string;
  /** Se fornecido, o dialog pode ser fechado sem login. Se omitido, o fechamento é bloqueado. */
  onClose?: () => void;
}

const GuestSignInDialog = ({ open, redirectPath, onClose }: GuestSignInDialogProps) => {
  const dismissable = !!onClose;
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGuestSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await signInAnonymously(auth);
      const userData: AppUser = {
        id: user.uid,
        name: name.trim(),
        role: "singer",
        isAnonymous: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", user.uid), userData);
      toast({ title: "Bem-vindo!", description: `Entrando como ${name.trim()}` });
      // Dialog closes automatically as useCurrentUser detects the new auth state
    } catch (error: unknown) {
      toast({
        title: "Erro ao entrar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={dismissable ? onClose : () => {}}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => { if (!dismissable) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (!dismissable) e.preventDefault(); }}
      >
        <DialogHeader className="text-center items-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-2">
            <Music className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Entre e comece a cantar
          </DialogTitle>
          <DialogDescription>
            Sem cadastro, só informe seu nome
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGuestSignIn} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="guest-name" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Nome
            </Label>
            <Input
              id="guest-name"
              type="text"
              placeholder="Como quer ser chamado?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="bg-background/50"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={loading || name.trim() === ""}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GuestSignInDialog;
