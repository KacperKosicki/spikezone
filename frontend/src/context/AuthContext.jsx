import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API = "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);
  const [myTeam, setMyTeam] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [backendDown, setBackendDown] = useState(false);
  const [mongoSyncLoading, setMongoSyncLoading] = useState(false);

  const intervalRef = useRef(null);

  const syncMongo = async (user) => {
    const token = await user.getIdToken();

    const res = await fetch(`${API}/api/auth/me`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) throw new Error("Mongo sync failed");
    return res.json();
  };

  const fetchMyTeam = useCallback(async (user) => {
    const token = await user.getIdToken();
    const res = await fetch(`${API}/api/team/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // jeśli endpoint nie istnieje / backend padł — nie rozwalaj
    if (!res.ok) return null;
    return res.json();
  }, []);

  const refreshMyTeam = useCallback(async () => {
    if (!firebaseUser || backendDown) return;
    try {
      const team = await fetchMyTeam(firebaseUser);
      setMyTeam(team);
    } catch (e) {
      // ignoruj
    }
  }, [firebaseUser, backendDown, fetchMyTeam]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);

      // wyczyść polling zawsze przy zmianie usera
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (!user) {
        setFirebaseUser(null);
        setMongoUser(null);
        setMyTeam(null);
        setMongoSyncLoading(false);
        setBackendDown(false);
        setAuthLoading(false);
        return;
      }

      setFirebaseUser(user);
      setMongoSyncLoading(true);
      setBackendDown(false);

      try {
        const data = await syncMongo(user);
        setMongoUser(data);
        setBackendDown(false);

        const team = await fetchMyTeam(user);
        setMyTeam(team);
      } catch (err) {
        console.error("❌ Backend/Mongo OFF:", err);
        setMongoUser(null);
        setMyTeam(null);
        setBackendDown(true);

        try {
          await signOut(auth);
        } catch (e) {}

        setFirebaseUser(null);
      } finally {
        setMongoSyncLoading(false);
        setAuthLoading(false);
      }
    });

    return () => unsub();
  }, [fetchMyTeam]);

  // ✅ polling statusu drużyny co 10s (prawie realtime)
  useEffect(() => {
    if (!firebaseUser || backendDown) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      refreshMyTeam();
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [firebaseUser, backendDown, refreshMyTeam]);

  // ✅ odśwież, gdy wrócisz do karty / okna
  useEffect(() => {
    if (!firebaseUser) return;

    const onFocus = () => refreshMyTeam();
    const onVis = () => {
      if (document.visibilityState === "visible") refreshMyTeam();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [firebaseUser, refreshMyTeam]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        mongoUser,
        myTeam,
        setMyTeam,
        refreshMyTeam, // ✅ możesz wywołać po create/edit
        authLoading,
        backendDown,
        mongoSyncLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
