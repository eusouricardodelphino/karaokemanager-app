import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebase } from "@/hooks/firebaseContext";
import { getStoreByCode } from "@/services/storeService";

const Landing = () => {
  const [barCode, setBarCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { db } = useFirebase();
  const navigate = useNavigate();

  const handleAccessQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const store = await getStoreByCode(db, barCode.trim());
      if (!store?.id) {
        setError("Código não encontrado. Verifique e tente novamente.");
        return;
      }
      navigate(`/${store.id}`);
    } catch {
      setError("Erro ao buscar o bar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
            🎤 KARAOKE MANAGER
          </h1>
          <h2 className="text-2xl font-semibold text-white/90 mt-3">
            Vamos Cantar?
          </h2>
          <p className="text-white/75 mt-2 text-sm leading-relaxed">
            Encontre seu bar e peça sua<br />música em segundos.
          </p>
        </div>

        {/* Card */}
        <div className="bg-card/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

          {/* QR Code section */}
          <div className="flex flex-col items-center px-8 pt-8 pb-6 gap-5">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center border border-purple-400/30">
              <QrCode className="w-16 h-16 text-purple-400" strokeWidth={1.5} />
            </div>

            <Button
              onClick={() => navigate("/scan")}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-sm tracking-wide h-12 rounded-xl shadow-lg shadow-purple-500/30 transition-all active:scale-95"
            >
              ESCANEAR QR CODE DO BAR
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Code input section */}
          <form onSubmit={handleAccessQueue} className="flex flex-col gap-3 px-8 pt-6 pb-8">
            <Input
              type="text"
              placeholder="Digite o Código do Bar (ex: 421)"
              value={barCode}
              onChange={(e) => { setBarCode(e.target.value); setError(""); }}
              className={`bg-background/50 text-center ${error ? "border-destructive" : ""}`}
            />
            {error && (
              <p className="text-destructive text-xs text-center -mt-1">{error}</p>
            )}
            <Button
              type="submit"
              variant="outline"
              className="w-full font-bold text-sm tracking-wide h-12 rounded-xl"
              disabled={loading || barCode.trim().length < 3}
            >
              {loading ? "Buscando..." : "ACESSAR FILA"}
            </Button>
          </form>
        </div>

        {/* Owner link */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-white/60 hover:text-white/90 text-sm transition-colors"
          >
            Sou Dono de Bar &rsaquo;
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Landing;
