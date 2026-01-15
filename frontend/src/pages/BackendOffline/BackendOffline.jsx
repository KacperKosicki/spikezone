import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./BackendOffline.module.scss";

const API = "http://localhost:5000";

const BackendOffline = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  const check = async () => {
    try {
      const res = await fetch(`${API}/api/health`, { cache: "no-store" });
      if (res.ok) {
        // backend działa -> nie pokazujemy offline
        navigate("/", { replace: true });
        return;
      }
    } catch (e) {
      // backend padł -> zostajemy na stronie
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
    // opcjonalnie co 5s próbuj ponownie
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.box}>
        <h1>⚠️ Backend offline</h1>
        <p>Serwer jest aktualnie niedostępny. Spróbuj ponownie za chwilę.</p>

        <button className={styles.btn} onClick={check} disabled={checking}>
          {checking ? "Sprawdzam..." : "Spróbuj ponownie"}
        </button>
      </div>
    </section>
  );
};

export default BackendOffline;
