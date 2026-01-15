import styles from './Hero.module.scss';
import logo from '../../assets/images/spikezone-logo.png';
import { useNavigate } from "react-router-dom";

const Hero = ({
  title = <>Nowa era turniejów <span>siatkarskich</span></>,
  subtitle = "SPIKEZONE to nowoczesna platforma turniejowa – drużyny, edycje, zapisy, rankingi i społeczność w jednym miejscu.",
  showLogo = true,
  showActions = true,
  primaryText = "Przeglądaj turnieje",
  secondaryText = "Dołącz do społeczności",
  onPrimary,
  onSecondary,
}) => {
  const navigate = useNavigate();

  const handlePrimary = () => {
    if (onPrimary) return onPrimary();
    navigate("/tournaments");
  };

  const handleSecondary = () => {
    if (onSecondary) return onSecondary();
    navigate("/contact"); // zmień jak chcesz
  };

  return (
    <section className={styles.hero}>
      <div className={`${styles.inner} ${!showLogo ? styles.noLogo : ""}`}>
        {/* LEWA – LOGO */}
        {showLogo && (
          <div className={styles.left}>
            <img
              src={logo}
              alt="SPIKEZONE logo"
              className={styles.logo}
              draggable="false"
            />
          </div>
        )}

        {/* PRAWA – TEKST */}
        <div className={styles.right}>
          <h1>{title}</h1>

          <p>{subtitle}</p>

          {showActions && (
            <div className={styles.actions}>
              <button onClick={handlePrimary}>{primaryText}</button>
              <button className={styles.outline} onClick={handleSecondary}>
                {secondaryText}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WAVE */}
      <div className={styles.wave}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,72 C220,20 520,120 740,70 C980,10 1220,95 1440,40 L1440,120 L0,120 Z"
            fill="#f6f7fb"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
