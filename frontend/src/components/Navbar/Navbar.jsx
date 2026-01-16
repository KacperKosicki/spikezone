// Navbar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Navbar.module.scss";
import { useAuth } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

const links = [
  { label: "STRONA GŁÓWNA", href: "/" },
  { label: "TURNIEJE", href: "/tournaments" },
  { label: "DRUŻYNY", href: "/teams" },
  { label: "O NAS", href: "#onas" },
  { label: "KONTAKT", href: "#kontakt" },
];

const Navbar = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const { mongoUser, firebaseUser, authLoading, myTeam } = useAuth();
  const isLoggedIn = !!firebaseUser;
  const isAdmin = mongoUser?.role === "admin";

  // ✅ Tylko status/nazwa ma kolor, prefix zawsze neutralny
  const teamView = useMemo(() => {
    if (!myTeam) {
      return { mode: "none", text: "Stwórz drużynę", statusClass: styles.team_none };
    }

    if (myTeam.status === "pending") {
      return { mode: "has", text: "ROZPATRYWANIE", statusClass: styles.team_pending };
    }

    if (myTeam.status === "rejected") {
      return { mode: "has", text: "ODRZUCONA", statusClass: styles.team_rejected };
    }

    // approved
    return { mode: "has", text: myTeam.name, statusClass: styles.team_approved };
  }, [myTeam]);

  const teamHref = myTeam ? "/team/me" : "/team/create";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  useEffect(() => {
    const onDown = (e) => {
      if (!userMenuOpen) return;
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [userMenuOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const goTo = (href) => {
    setOpen(false);
    setUserMenuOpen(false);

    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    navigate(href);
  };

  const handleLogin = () => {
    setOpen(false);
    setUserMenuOpen(false);
    navigate("/login");
  };

  const toggleUserMenu = () => {
    setOpen(false);

    if (!isLoggedIn) {
      handleLogin();
      return;
    }
    setUserMenuOpen((v) => !v);
  };

  const handleLogout = async () => {
    try {
      setUserMenuOpen(false);
      setOpen(false);
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Logout error:", e);
      alert("Nie udało się wylogować");
    }
  };

  const label = authLoading
    ? "..."
    : mongoUser?.displayName ||
      firebaseUser?.displayName ||
      firebaseUser?.email ||
      "ZALOGUJ SIĘ";

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.left}>
          <div className={styles.logo} onClick={() => goTo("/")}>
            SPIKEZONE
          </div>

          <ul className={styles.links}>
            {links.map((l) => (
              <li key={l.label} onClick={() => goTo(l.href)}>
                {l.label}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.right}>
          <div className={styles.userBox} ref={userMenuRef}>
            <button className={styles.loginDesktop} onClick={toggleUserMenu}>
              {label}
            </button>

            {userMenuOpen && isLoggedIn && (
              <div className={styles.userMenu}>
                <button className={styles.userMenuItem} onClick={() => goTo("/account")}>
                  Konto (soon)
                </button>

                {/* ✅ DRUŻYNA */}
<button className={styles.userMenuItem} onClick={() => goTo(teamHref)}>
  {teamView.mode === "none" ? (
    <span className={styles.teamChipCol}>
      <span className={styles.teamLine2 + " " + teamView.statusClass}>
        {teamView.text}
      </span>
    </span>
  ) : (
    <span className={styles.teamChipCol}>
      <span className={styles.teamLine1}>Twoja drużyna</span>
      <span className={`${styles.teamLine2} ${teamView.statusClass}`}>
        {teamView.text}
      </span>
    </span>
  )}
</button>


                {isAdmin && (
                  <button className={styles.userMenuItem} onClick={() => goTo("/admin")}>
                    Panel admina
                  </button>
                )}

                <button className={styles.userMenuItem} onClick={handleLogout}>
                  Wyloguj
                </button>
              </div>
            )}
          </div>

          <button
            className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
            onClick={() => {
              setOpen((v) => !v);
              setUserMenuOpen(false);
            }}
            aria-label="Menu"
            aria-expanded={open}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div
        className={`${styles.overlay} ${open ? styles.show : ""}`}
        onClick={() => setOpen(false)}
      />

      <aside className={`${styles.drawer} ${open ? styles.open : ""}`}>
        <div className={styles.drawerHeader}>
          <button
            className={styles.drawerLoginTop}
            onClick={() => (isLoggedIn ? goTo("/account") : handleLogin())}
          >
            {label}
          </button>

          <button className={styles.close} onClick={() => setOpen(false)} aria-label="Zamknij">
            ✕
          </button>
        </div>

        {isLoggedIn && (
          <>
            <div className={styles.drawerUserSection}>
              <button className={styles.drawerActionPrimary} onClick={() => goTo("/account")}>
                Konto (soon)
              </button>

              {/* ✅ DRUŻYNA (mobile) */}
<button className={styles.drawerActionPrimary} onClick={() => goTo(teamHref)}>
  {teamView.mode === "none" ? (
    <span className={`${styles.teamChipRow} ${teamView.statusClass}`}>
      {teamView.text}
    </span>
  ) : (
    <span className={styles.teamChipRow}>
      <span className={styles.teamPrefix}>Twoja drużyna:</span>{" "}
      <span className={teamView.statusClass}>{teamView.text}</span>
    </span>
  )}
</button>


              {isAdmin && (
                <button className={styles.drawerActionPrimary} onClick={() => goTo("/admin")}>
                  Panel admina
                </button>
              )}

              <button className={styles.drawerActionDanger} onClick={handleLogout}>
                Wyloguj
              </button>
            </div>

            <div className={styles.drawerDivider} />
          </>
        )}

        <ul className={styles.drawerLinks}>
          {links.map((l) => (
            <li key={l.label} onClick={() => goTo(l.href)}>
              {l.label}
            </li>
          ))}
        </ul>

        <div className={styles.drawerBrand}>SPIKEZONE</div>
      </aside>
    </>
  );
};

export default Navbar;
