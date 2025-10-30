import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  where,
  query,
  updateDoc,
  doc,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Users, SkipForward, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFirebase } from "@/hooks/firebaseContext";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";

interface QueueItem {
  id?: string;
  name: string;
  nameSearch: string;
  song: string;
  band?: string;
  alreadySang: boolean;
  visitDate: string;
  onStage?: boolean;
  link?: string;
  addedAt: Date;
  restaurantId: string;
}

const Home = () => {
  const { db } = useFirebase();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentSinger, setCurrentSinger] = useState<QueueItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const { restaurantId } = useParams();

  useEffect(() => {
    fetchQueue();
    fetchOnStageSinger();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setUser(null);
        return;
      }
      fetchUser(currentUser);
    });
    return () => unsubscribe();
  }, [db]);

  const fetchUser = (currentUser) => {
    if (currentUser) {
      const queryUser = query(
        collection(db, `users`),
        where("id", "==", currentUser.uid)
      );

      onSnapshot(queryUser, (snapshot) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user: any = snapshot.docs.map((d) => ({
          id: d.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(d.data() as any),
        }));
        setUser(user[0]);
      });
    }
  };

  const fetchQueue = () => {
    const queryQueue = query(
      collection(db, "queue"),
      where("alreadySang", "==", false),
      where("restaurantId", "==", restaurantId),
      orderBy("addedAt", "asc")
    );
    const unsubscribe = onSnapshot(queryQueue, (snapshot) => {
      const list: QueueItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as QueueItem),
      }));
      setQueue(list);
    });
  };

  const fetchOnStageEngaged = async () => {
    const q = query(
      collection(db, `onStage`),
      where("onStage", "==", true),
      where("restaurantId", "==", restaurantId)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return true;
    } else {
      return false;
    }
  };

  const fetchOnStageSinger = () => {
    const querySinger = query(
      collection(db, `onStage`),
      where("onStage", "==", true),
      where("restaurantId", "==", restaurantId)
    );
    const unsubscribe = onSnapshot(querySinger, (snapshot) => {
      const singer: QueueItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as QueueItem),
      }));
      setCurrentSinger(singer[0]);
    });
    return () => unsubscribe();
  };

  const deleteSingerFromQueue = async (singer: QueueItem) => {
    if (!singer.id) return;
    const ref = doc(db, "queue", singer.id);
    await updateDoc(ref, { alreadySang: true });
  };

  const deleteSingerFromStage = async (singer: QueueItem) => {
    if (!singer.id) return;
    const ref = doc(db, "onStage", singer.id);
    await updateDoc(ref, { onStage: false });
  };

  const nextSinger = async () => {
    if (queue.length === 0) return;

    if (await fetchOnStageEngaged()) {
      toast({
        title: "Palco ocupado",
        description: `Aguarde o cantor atual finalizar sua performance.`,
        variant: "destructive",
      });
      return;
    }

    const next = queue[0];
    next.onStage = true;
    const { id, ...nextSinger } = next;
    await addDoc(collection(db, `onStage`), nextSinger);
    await deleteSingerFromQueue(next);
    fetchOnStageSinger();

    toast({
      title: "Próximo no palco!",
      description: `${next.name} está subindo para cantar "${next.song}"`,
    });
  };

  const finishSinging = async () => {
    if (!currentSinger) return;

    toast({
      title: "Performance finalizada!",
      description: `Obrigado ${currentSinger.name}! 👏`,
    });
    deleteSingerFromStage(currentSinger);
    fetchOnStageSinger();
  };


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Current Singer */}
          <Card className="bg-gradient-stage border-0 shadow-2xl animate-pulse-glow">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-stage-foreground flex items-center justify-center gap-2">
                <span className="text-2xl">🎤</span>
                No Palco Agora
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {currentSinger ? (
                <div className="space-y-4 animate-bounce-in">
                  <div className="text-3xl font-bold text-stage-foreground">
                    {currentSinger.name}
                  </div>
                  <div className="text-xl text-stage-foreground/90">
                    cantando "{currentSinger.song}"
                  </div>
                  <p>
                    {currentSinger.link && (
                      <a
                        href={currentSinger.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-stage-foreground/80 hover:text-stage-foreground transition-colors"
                      >
                        <Music className="h-4 w-4" />
                        Ver música
                      </a>
                    )}
                  </p>
                  {user && user.isAdmin && (
                    <p>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                          "karaoke " +
                            currentSinger.song +
                            " " +
                            (currentSinger.band || "")
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-stage-foreground/80 hover:text-stage-foreground transition-colors"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Pesquisar música
                      </a>
                    </p>
                  )}
                  {user && user.isAdmin && (
                    <Button
                      onClick={finishSinging}
                      variant="secondary"
                      size="lg"
                      className="mt-4"
                    >
                      Finalizar Performance
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-stage-foreground/70 text-xl py-8">
                  Palco vazio - aguardando próximo cantor!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queue */}
          <Card className="bg-gradient-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Fila ({queue.length})
              </CardTitle>
              {queue.length > 0 && user && user.isAdmin && (
                <Button onClick={nextSinger} variant="default" size="sm">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Próximo
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Fila vazia - vamos começar a cantar?
                </div>
              ) : (
                <div className="space-y-3">
                  {queue.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-queue border border-border"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {item.song}
                        </div>
                      </div>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-music hover:text-music/80 transition-colors"
                        >
                          <Music className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
