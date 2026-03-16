import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Music, MapPin } from "lucide-react";
import { useFirebase } from "@/hooks/firebaseContext";
import { getStores } from "@/services/storeService";
import type { Store } from "@/types/store";

const StoreList = () => {
  const { db } = useFirebase();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStores(db)
      .then(setStores)
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, [db]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex flex-col items-center p-4 pt-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Karaoke Manager</h1>
          <p className="text-white/80 mt-2">Escolha uma loja para entrar na fila</p>
        </div>

        <div className="bg-card/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground" data-testid="loading">
              Carregando lojas...
            </div>
          ) : stores.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground" data-testid="empty">
              Nenhuma loja disponível no momento.
            </div>
          ) : (
            <ul data-testid="store-list">
              {stores.map((store, index) => (
                <li key={store.id}>
                  <Link
                    to={`/${store.id}`}
                    className={`flex items-center gap-3 px-6 py-4 hover:bg-muted/50 transition-colors ${
                      index < stores.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex-shrink-0 w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{store.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreList;
