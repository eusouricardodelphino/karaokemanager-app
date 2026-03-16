import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Music, MapPin, Phone } from "lucide-react";
import { useFirebase } from "@/hooks/firebaseContext";
import { getStores } from "@/services/storeService";
import type { Store } from "@/types/store";

const WhatsAppIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5 fill-green-500 flex-shrink-0"
    aria-label="WhatsApp"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const StoreLogo = ({ store }: { store: Store }) => {
  if (store.logoUrl) {
    return (
      <img
        src={store.logoUrl}
        alt={store.name}
        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <span className="text-primary font-bold text-lg">
        {store.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

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
                    className={`flex items-center gap-4 px-5 py-5 md:py-4 hover:bg-muted/50 transition-colors ${
                      index < stores.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <StoreLogo store={store} />

                    <div className="flex-1 min-w-0">
                      <span className="font-semibold block truncate text-sm md:text-base">{store.name}</span>

                      {store.address && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {store.address}
                        </span>
                      )}

                      {store.phones && store.phones.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          {store.phones.map((p, i) => (
                            p.whatsapp ? (
                              <a
                                key={i}
                                href={`https://wa.me/55${p.ddd}${p.number}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-500 transition-colors"
                              >
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                ({p.ddd}) {p.number}
                                <WhatsAppIcon />
                              </a>
                            ) : (
                              <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                ({p.ddd}) {p.number}
                              </span>
                            )
                          ))}
                        </div>
                      )}
                    </div>
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
