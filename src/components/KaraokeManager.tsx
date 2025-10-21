import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  where,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Music, Users, Plus, SkipForward, LogIn, LogOut, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFirebase } from "../hooks/firebaseContext";
import { auth } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";

interface QueueItem {
  id?: string;
  name: string;
  nameSearch:string;
  song: string;
  band?: string;
  alreadySang: boolean;
  visitDate: string;
  onStage?: boolean;
  link?: string;
  addedAt: Date;
  restaurantId: string;
}

const KaraokeManager = () => {
  const { db } = useFirebase();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentSinger, setCurrentSinger] = useState<QueueItem | null>(null);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [song, setSong] = useState("");
  const [band, setBand] = useState("");
  const [link, setLink] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  let dateToday = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }).toString();
  dateToday = dateToday.replace(/\//g, ".");
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
      where("id", "==", currentUser.uid));
      
      onSnapshot(queryUser, (snapshot) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user: any = snapshot.docs.map((d) => ({
            id: d.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(d.data() as any),
          }));
      setUser(user[0]);
      //return user[0];
  })}}

  const fetchQueue = () => {
    const queryQueue = query(
      collection(db, 'queue'), 
      where("alreadySang", "==", false),
      where("restaurantId", "==", restaurantId), 
      orderBy("addedAt", "asc"));
    const unsubscribe = onSnapshot(queryQueue, (snapshot) => {
      const list: QueueItem[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as QueueItem),
          }));
      setQueue(list);
    });
  }

  const fetchOneSinger = async (name: string) => {
    const q = query(
          collection(db, "queue"),
          where("nameSearch", "==", name.trim().toLowerCase()),
          where("alreadySang", "==", false),
          where("restaurantId", "==", restaurantId)
        );

        const querySnapshot = await getDocs(q);

        return querySnapshot;
  }

  const fetchOnStageEngaged = async () => {
    const q = query(
          collection(db, `onStage`),
          where("onStage", "==", true),
          where("restaurantId", "==", restaurantId)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          return true
        } else {
          return false
        }

  }

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
  }
  
  const deleteSingerFromQueue = async (singer: QueueItem) => {
    if (!singer.id) return;
    const ref = doc(db, 'queue', singer.id);
    await updateDoc(ref, { alreadySang: true})
  };

  const deleteSingerFromStage = async (singer: QueueItem) => {
    if (!singer.id) return;
    const ref = doc(db, 'onStage', singer.id);
    await updateDoc(ref, { onStage: false});
  };

  const addToQueue =  async () => {
    if (!name.trim() || !surname.trim() || !song.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome completo do cantor e música são obrigatórios!",
        variant: "destructive",
      });
      return;
    }

    const newItem: QueueItem = {
      name: name.trim() + " " + surname.trim(),
      nameSearch: (name.trim() + " " + surname.trim()).toLowerCase(),
      song: song.trim(),
      band: band.trim(),
      alreadySang: false,
      link: link.trim() || null,
      visitDate: dateToday,
      addedAt: new Date(),
      restaurantId: restaurantId
    };

    const alreadyInQueue = await fetchOneSinger (newItem.name)

    if (!alreadyInQueue.empty) {
      toast({
        title: "Você já está na fila",
        description: "Espere sua vez! Após, é possível entrar novamente na fila. ",
        variant: "destructive",
      });
      return;
    }

    await addDoc(collection(db, 'queue'), newItem);

    setName("");
    setSurname("");
    setSong("");
    setLink("");
    
    toast({
      title: "Adicionado à fila!",
      description: `${newItem.name} foi adicionado para cantar "${newItem.song}"`,
    });
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
    //setCurrentSinger(next);
    //setQueue(prev => prev.slice(1));
    await addDoc(collection(db, `onStage`), nextSinger)
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
    // Atualiza status do cantor para já cantou 
    //const ref = doc(db, "onStage", currentSinger.id);
    //await updateDoc(ref, { onStage: false})
    deleteSingerFromStage(currentSinger);
    fetchOnStageSinger(); 
    //setCurrentSinger(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          {/* Mobile: Button on top, logo below | Desktop: All in one line */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 md:gap-3 md:relative">
            {/* Login/Logout Button - Top on mobile, right on desktop */}
            <div className="flex justify-end md:absolute md:right-0">
              {user ? (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/login")}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Entrar
                </Button>
              )}
            </div>
            
            {/* Logo - Below button on mobile, centered on desktop */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl">🎤</span>
              <h1 className="text-4xl font-bold">
                Karaoke<span className="bg-gradient-primary bg-clip-text text-transparent">Manager</span>
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Gerencie sua fila de karaoke de forma fácil e divertida!
          </p>
        </div>

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
                )}</p>
                {user && user.isAdmin && (
                  <p>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent("karaoke " + currentSinger.song + " " + (currentSinger.band || ""))}`}
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

        <div className="grid md:grid-cols-2 gap-8">
          {/* Add to Queue */}
          <Card className="bg-gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar à Fila
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Sobrenome *</Label>
                <Input
                  id="surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Seu sobrenome"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="song">Música *</Label>
                <Input
                  id="song"
                  value={song}
                  onChange={(e) => setSong(e.target.value)}
                  placeholder="Nome da música"
                  className="bg-background"
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="song">Cantor ou banda(opcional)</Label>
                <Input
                  id="band"
                  value={band}
                  onChange={(e) => setBand(e.target.value)}
                  placeholder="Nome da banda/artista"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link da música na versão karaoke (opcional)</Label>
                <Input
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="bg-background"
                />
              </div>
              <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent("karaoke " + song + (band || ""))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black inline-flex items-center w-full text-stage-foreground/80 hover:text-stage-foreground transition-colors"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-black"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Pesquisar música no youtube
                    </Button>
              </a>
              <Button onClick={addToQueue} className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar à Fila
              </Button>
            </CardContent>
          </Card>

          {/* Queue */}
          <Card className="bg-gradient-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Fila ({queue.length})
              </CardTitle>
              {queue.length > 0  && (
                user && user.isAdmin && (
                  <Button onClick={nextSinger} variant="default" size="sm">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Próximo
                </Button>
                )
              )}
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Fila vazia - vamos começar cantar?
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

export default KaraokeManager;