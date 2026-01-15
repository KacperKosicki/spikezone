import { useEffect, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.scss";

const Login = () => {
  const { firebaseUser, mongoUser, authLoading, backendDown, mongoSyncLoading } = useAuth();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setMessage("");
      setLoading(true);

      // tu tylko odpalamy Firebase login
      await signInWithPopup(auth, googleProvider);

      // nie mówimy jeszcze "zalogowano" — czekamy na mongo sync w AuthContext
      setMessage("Łączenie z serwerem...");
    } catch (e) {
      console.error(e);
      setMessage("❌ Błąd logowania");
      setLoading(false);
    }
  };

  // jeśli backend padł -> idź na ekran offline
  useEffect(() => {
    if (backendDown) {
      setLoading(false);
      setMessage("⚠️ Serwer offline. Spróbuj później.");
      navigate("/backend-offline", { replace: true });
    }
  }, [backendDown, navigate]);

  // jeśli mamy firebase + mongo -> sukces i przekierowanie
  useEffect(() => {
    if (!authLoading && firebaseUser && mongoUser) {
      setMessage("✅ Zalogowano. Przekierowanie...");
      setTimeout(() => navigate("/", { replace: true }), 900);
    }
  }, [firebaseUser, mongoUser, authLoading, navigate]);

  // kończymy loading gdy AuthContext skończy sync
  useEffect(() => {
    if (!mongoSyncLoading) setLoading(false);
  }, [mongoSyncLoading]);

  return (
    <section className={styles.loginPage}>
      <div className={styles.card}>
        <h1>Logowanie — SPIKEZONE</h1>
        <p className={styles.subtitle}>Dołącz do nowej ery turniejów siatkarskich</p>

        {!firebaseUser && (
          <button
            onClick={handleGoogleLogin}
            disabled={loading || backendDown}
            className={styles.googleBtn}
          >
            {backendDown ? "Serwer offline" : loading ? "Łączenie..." : "Zaloguj się przez Google"}
          </button>
        )}

        {message && <div className={styles.message}>{message}</div>}
      </div>
    </section>
  );
};

export default Login;
