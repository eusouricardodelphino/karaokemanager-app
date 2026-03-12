import { useTrial } from "@/hooks/useTrial";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface TrialGuardProps {
  storeId: string | undefined;
  children: React.ReactNode;
}

export function TrialGuard({ storeId, children }: TrialGuardProps) {
  const trial = useTrial(storeId);

  if (trial.status === "loading") return null;

  if (trial.status === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-card/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Período de teste encerrado</h1>
          <p className="text-muted-foreground mb-6">
            Seu trial de {trial.trialDays} dias expirou. Assine um plano para continuar usando o Karaokê Manager.
          </p>
          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            asChild
          >
            <Link to="/planos">Ver planos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {(trial.status === "active" || trial.status === "expiring_soon") && (
        <div
          className={`w-full text-center text-sm py-2 px-4 font-medium ${
            trial.status === "expiring_soon"
              ? "bg-red-500/90 text-white"
              : "bg-yellow-400/90 text-yellow-900"
          }`}
        >
          <AlertTriangle className="inline w-4 h-4 mr-1 -mt-0.5" />
          {trial.status === "expiring_soon"
            ? `Atenção: seu trial expira em ${trial.daysLeft} dia${trial.daysLeft !== 1 ? "s" : ""}. `
            : `Você está no período de teste — ${trial.daysLeft} dia${trial.daysLeft !== 1 ? "s" : ""} restante${trial.daysLeft !== 1 ? "s" : ""}. `}
          <Link to="/planos" className="underline font-semibold">
            Assinar agora
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
