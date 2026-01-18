import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./About.module.scss";
import {
  FaTrophy,
  FaUsers,
  FaClipboardList,
  FaChartLine,
  FaShieldAlt,
  FaBolt,
  FaRegQuestionCircle,
  FaArrowRight,
  FaCheckCircle,
  FaBuilding,
} from "react-icons/fa";

export default function About() {
  const navigate = useNavigate();

  const features = useMemo(
    () => [
      {
        icon: <FaClipboardList />,
        title: "Zapisy online i formularze",
        desc: "Zgłoszenie drużyny krok po kroku (prowadzenie „za rękę”), walidacje, limit miejsc, okno zapisów i potwierdzenia.",
        tone: "primary",
      },
      {
        icon: <FaUsers />,
        title: "Drużyny i składy",
        desc: "Publiczne profile drużyn: skład, opis, logo, status zgłoszenia oraz czytelne listy uczestników turniejów.",
        tone: "soft",
      },
      {
        icon: <FaTrophy />,
        title: "Turnieje publikowane przez SPIKEZONE",
        desc: "Przeglądasz nadchodzące / trwające / zakończone edycje i dołączasz do turniejów przygotowanych przez Zespół Organizacyjny SPIKEZONE.",
        tone: "primary",
      },
      {
        icon: <FaChartLine />,
        title: "Statystyki i wyniki",
        desc: "Wyniki i statystyki są prezentowane publicznie — od podstawowych informacji po rozwinięte tabele i klasyfikacje (w miarę rozwoju systemu).",
        tone: "soft",
      },
      {
        icon: <FaShieldAlt />,
        title: "Weryfikacja zgłoszeń przez Organizatora",
        desc: "Zgłoszenia drużyn są zatwierdzane przez Organizatora (Zespół Organizacyjny SPIKEZONE), dzięki czemu lista uczestników jest wiarygodna i uporządkowana.",
        tone: "neutral",
      },
      {
        icon: <FaBolt />,
        title: "Nowoczesny UX",
        desc: "Szybkie listy, przejrzyste karty, spójny design i pełna responsywność — od telefonu po duży ekran.",
        tone: "neutral",
      },
    ],
    []
  );

  const steps = useMemo(
    () => [
      {
        icon: <FaBuilding />,
        title: "1. Organizator publikuje turniej",
        desc: "Zespół Organizacyjny SPIKEZONE przygotowuje edycję: termin, miejsce, wpisowe, limit drużyn oraz okno zapisów.",
      },
      {
        icon: <FaRegQuestionCircle />,
        title: "2. Ty wybierasz turniej i dołączasz",
        desc: "Wybierasz turniej z listy i zgłaszasz drużynę przez formularz. System prowadzi Cię krok po kroku, żeby nic nie umknęło.",
      },
      {
        icon: <FaCheckCircle />,
        title: "3. Zgłoszenie trafia do weryfikacji",
        desc: "Organizator weryfikuje zgłoszenie i zatwierdza drużynę. Po akceptacji automatycznie pojawiasz się na liście drużyn.",
      },
      {
        icon: <FaChartLine />,
        title: "4. Informacje, wyniki i statystyki",
        desc: "Po turnieju (lub w trakcie) publikowane są wyniki i statystyki. To etap, który systematycznie rozwijamy o kolejne moduły.",
      },
    ],
    []
  );

  return (
    <section className={styles.section}>
      <div className={styles.bgGlow} aria-hidden="true" />

      {/* HERO */}
      <div className={styles.header}>
        <div className={styles.kicker}>
          <span className={styles.kickerPill}>
            <FaTrophy /> System turniejowy
          </span>
          <span className={`${styles.kickerPill} ${styles.kickerSoft}`}>
            <FaUsers /> Drużyny • Zapisy • Wyniki
          </span>
        </div>

        <h1>
          O nas <span>SPIKEZONE</span>
        </h1>

        <p className={styles.sub}>
          Tworzymy nowoczesną aplikację do obsługi turniejów online. Na ten moment możesz dołączać do turniejów
          publikowanych przez Zespół Organizacyjny SPIKEZONE — a my dbamy o przejrzystość zapisów, listy drużyn oraz
          komplet informacji turniejowych.
        </p>

        <div className={styles.ctaRow}>
          <button
            className={styles.ctaPrimary}
            onClick={() => navigate("/tournaments")}
            type="button"
          >
            Zobacz turnieje <FaArrowRight />
          </button>

          <button
            className={styles.ctaGhost}
            onClick={() => navigate("/teams")}
            type="button"
          >
            Zobacz drużyny <FaArrowRight />
          </button>
        </div>
      </div>

      <div className={styles.container}>
        {/* SEK: co robimy */}
        <div className={styles.block}>
          <div className={styles.blockHead}>
            <h2>Co dokładnie dostajesz?</h2>
            <p>
              Kompletny system do zapisów i prezentacji turnieju. Projektujemy go tak, żeby uczestnicy mogli szybko
              zgłosić drużynę, a Organizator miał pełną kontrolę nad przebiegiem zapisów.
            </p>
          </div>

          <div className={styles.grid}>
            {features.map((f) => (
              <div key={f.title} className={`${styles.card} ${styles[`tone_${f.tone}`]}`}>
                <div className={styles.cardTop}>
                  <div className={styles.icon}>{f.icon}</div>
                  <span className={styles.badge}>Moduł</span>
                </div>
                <div className={styles.title}>{f.title}</div>
                <div className={styles.desc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SEK: jak to działa */}
        <div className={styles.block}>
          <div className={styles.blockHead}>
            <h2>Jak to działa w praktyce?</h2>
            <p>
              Prosty proces: Organizator publikuje turniej, Ty zgłaszasz drużynę, a po weryfikacji pojawiasz się na
              liście uczestników.
            </p>
          </div>

          <div className={styles.steps}>
            {steps.map((s) => (
              <div key={s.title} className={styles.stepCard}>
                <div className={styles.stepIcon}>{s.icon}</div>
                <div className={styles.stepBody}>
                  <div className={styles.stepTitle}>{s.title}</div>
                  <div className={styles.stepDesc}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SEK: callout */}
        <div className={styles.callout}>
          <div className={styles.calloutLeft}>
            <div className={styles.calloutTitle}>Chcesz dołączyć do turnieju?</div>
            <div className={styles.calloutDesc}>
              Sprawdź aktualne edycje i zgłoś drużynę w czasie trwania zapisów. Jeśli nie widzisz zapisów — oznacza to,
              że okno zgłoszeń jeszcze się nie rozpoczęło lub zostało zamknięte.
            </div>
          </div>

          <div className={styles.calloutRight}>
            <button
              className={styles.ctaPrimary}
              onClick={() => navigate("/tournaments")}
              type="button"
            >
              Przejdź do turniejów <FaArrowRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
