import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./EditTeam.module.scss";
import { apiFetch, apiUpload } from "../../api/api";

const FLASH_KEY = "teamFlash";

const hardGoTeamMe = (flash) => {
  try {
    if (flash) sessionStorage.setItem(FLASH_KEY, flash);
  } catch {}
  window.location.replace("/team/me");
};

const normalizeMembers = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((m) => String(m?.fullName || "").trim())
    .filter(Boolean);

export default function EditTeam() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);

  const [description, setDescription] = useState("");
  const [members, setMembers] = useState([{ fullName: "" }]);

  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // snapshot początkowych danych
  const initialDescRef = useRef("");
  const initialMembersRef = useRef([]);

  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : ""),
    [logoFile]
  );
  const bannerPreview = useMemo(
    () => (bannerFile ? URL.createObjectURL(bannerFile) : ""),
    [bannerFile]
  );

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [logoPreview, bannerPreview]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const data = await apiFetch("/api/team/me");
        if (!data) {
          navigate("/team/create", { replace: true });
          return;
        }

        setTeam(data);

        const desc = data.description || "";
        const mems =
          Array.isArray(data.members) && data.members.length
            ? data.members.map((m) => ({ fullName: m.fullName || "" }))
            : [{ fullName: "" }];

        setDescription(desc);
        setMembers(mems);

        setLogoUrl(data.logoUrl || "");
        setBannerUrl(data.bannerUrl || "");

        initialDescRef.current = String(desc || "").trim();
        initialMembersRef.current = normalizeMembers(data.members);
      } catch (e) {
        setMsg(`❌ ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const isPending = team?.status === "pending";
  const lockTextFields = isPending;

  const membersCount = useMemo(() => normalizeMembers(members).length, [members]);

  const updateMember = (idx, value) => {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { fullName: value } : m)));
  };

  const addMember = () => {
    if (lockTextFields) return;
    setMembers((prev) => (prev.length >= 10 ? prev : [...prev, { fullName: "" }]));
  };

  const removeMember = (idx) => {
    if (lockTextFields) return;
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateMembers = () => {
    const normalized = normalizeMembers(members);

    if (normalized.length === 0)
      return { ok: false, message: "❌ Dodaj przynajmniej jednego zawodnika" };
    if (normalized.length > 10)
      return { ok: false, message: "❌ Maksymalnie 10 zawodników" };

    const invalidIdx = normalized.findIndex((v) => v.length < 3);
    if (invalidIdx !== -1)
      return { ok: false, message: `❌ Zawodnik #${invalidIdx + 1} min. 3 znaki` };

    return { ok: true, members: normalized.map((fullName) => ({ fullName })) };
  };

  const uploadImage = async (kind, file) => {
    const form = new FormData();
    form.append(kind, file);
    return await apiUpload(`/api/team/upload/${kind}`, form);
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    setMsg("");

    const didUploadLogo = !!logoFile;
    const didUploadBanner = !!bannerFile;

    const nextDescTrim = String(description || "").trim();
    const nextMembersNorm = normalizeMembers(members);

    const didTextChange =
      !lockTextFields &&
      (nextDescTrim !== initialDescRef.current ||
        JSON.stringify(nextMembersNorm) !== JSON.stringify(initialMembersRef.current));

    if (lockTextFields && !didUploadLogo && !didUploadBanner) {
      setMsg("❌ Drużyna jest w trakcie rozpatrywania – możesz zmienić tylko logo i banner");
      return;
    }

    try {
      setSaving(true);

      // 1) teksty
      if (didTextChange) {
        const membersRes = validateMembers();
        if (!membersRes.ok) throw new Error(membersRes.message);

        await apiFetch("/api/team/me", {
          method: "PATCH",
          body: {
            description: nextDescTrim,
            members: membersRes.members,
          },
        });
      }

      // 2) uploady
      if (didUploadLogo) await uploadImage("logo", logoFile);
      if (didUploadBanner) await uploadImage("banner", bannerFile);

      const didAnyUpload = didUploadLogo || didUploadBanner;
      const didAnyChange = didTextChange || didAnyUpload;

      if (!didAnyChange) {
        hardGoTeamMe("ℹ️ Brak zmian do zapisania.");
        return;
      }

      hardGoTeamMe(
        "✅ Zapisano zmiany. Drużyna została wysłana do weryfikacji (status: ROZPATRYWANIE)."
      );
    } catch (err) {
      setMsg(`❌ ${err.message}`);
      setSaving(false);
    }
  };

  const bannerToShow = bannerPreview || bannerUrl;
  const logoToShow = logoPreview || logoUrl;

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.bgGlow} aria-hidden="true" />
        <div className={styles.container}>
          <button className={styles.backModern} onClick={() => navigate("/team/me")} type="button">
            <span className={styles.backIcon}>←</span>
            <span>Wróć</span>
          </button>
          <div className={styles.msg}>Ładowanie...</div>
        </div>
      </section>
    );
  }

  if (!team) {
    return (
      <section className={styles.section}>
        <div className={styles.bgGlow} aria-hidden="true" />
        <div className={styles.container}>
          <button className={styles.backModern} onClick={() => navigate("/teams")} type="button">
            <span className={styles.backIcon}>←</span>
            <span>Wróć</span>
          </button>
          <div className={styles.msg}>Nie masz drużyny.</div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.bgGlow} aria-hidden="true" />
      <div className={styles.container}>
        <button className={styles.backModern} onClick={() => navigate("/team/me")} type="button">
          <span className={styles.backIcon}>←</span>
          <span>Wróć</span>
        </button>

        {msg && <div className={styles.msg}>{msg}</div>}

        <div className={styles.detailsCard}>
          {/* HEADER jak TeamDetails/MyTeam */}
          <div className={styles.top}>
            <div className={styles.media}>
              {bannerToShow ? (
                <img className={styles.banner} src={bannerToShow} alt="Banner drużyny" />
              ) : (
                <div className={styles.bannerFallback} />
              )}

              <div className={styles.mediaOverlay} />

              <div className={styles.coverBar}>
                <div className={styles.logoWrap}>
                  {logoToShow ? (
                    <img className={styles.logo} src={logoToShow} alt="Logo drużyny" />
                  ) : (
                    <div className={styles.logoFallback}>
                      {String(team.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className={styles.headerText}>
                  <h1 className={styles.teamName}>Edytuj: {team.name}</h1>

                  <div className={styles.pills}>
                    <span className={`${styles.pillSoft} ${styles.pillOk}`}>
                      <span className={styles.dot} />
                      {lockTextFields ? "Rozpatrywanie" : "Edycja"}
                    </span>

                    <span className={styles.pillSoft}>{membersCount} zawodników</span>
                  </div>
                </div>

                {/* puste actions (layout jak reszta) */}
                <div className={styles.headerActions} aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* INFO */}
          <div className={styles.block}>
            <div className={styles.blockHead}>
              <div className={styles.blockTitle}>
                <h2>Ustawienia</h2>
                <span className={styles.blockSub}>
                  {lockTextFields
                    ? "Drużyna w rozpatrywaniu — możesz zmienić tylko logo/banner."
                    : "Możesz edytować dane i grafiki. Po zapisie drużyna wraca do moderacji."}
                </span>
              </div>
              <span className={styles.blockBadge}>EDYCJA</span>
            </div>

            <form onSubmit={onSave} className={styles.form}>
              {/* PODSTAWOWE */}
              <div className={styles.grid}>
                <div className={styles.field}>
                  <span>Nazwa</span>
                  <input value={team.name} disabled />
                </div>

                <label className={styles.field}>
                  <span>Logo</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    disabled={saving}
                  />
                  {logoToShow && (
                    <img className={styles.preview} src={logoToShow} alt="logo" />
                  )}
                </label>

                <label className={styles.field}>
                  <span>Banner</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                    disabled={saving}
                  />
                  {bannerToShow && (
                    <img className={styles.previewBanner} src={bannerToShow} alt="banner" />
                  )}
                </label>

                <label className={`${styles.field} ${styles.full}`}>
                  <span>Opis</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    maxLength={2000}
                    disabled={saving || lockTextFields}
                  />
                  {lockTextFields && (
                    <small className={styles.hint}>
                      Edycja opisu zablokowana w trakcie rozpatrywania.
                    </small>
                  )}
                </label>
              </div>

              {/* SKŁAD */}
              <div className={styles.blockInner}>
                <div className={styles.blockHead}>
                  <div className={styles.blockTitle}>
                    <h2>Skład</h2>
                    <span className={styles.blockSub}>Lista zawodników w drużynie</span>
                  </div>
                  <span className={styles.blockBadge}>{membersCount}</span>
                </div>

                <div className={styles.members}>
                  {members.map((m, idx) => (
                    <div className={styles.memberRow} key={idx}>
                      <input
                        className={styles.memberInput}
                        placeholder="Imię i nazwisko"
                        value={m.fullName}
                        onChange={(e) => updateMember(idx, e.target.value)}
                        maxLength={60}
                        disabled={saving || lockTextFields}
                      />

                      {members.length > 1 && (
                        <button
                          type="button"
                          className={styles.memberRemove}
                          onClick={() => removeMember(idx)}
                          disabled={saving || lockTextFields}
                        >
                          Usuń
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.addMember}
                  onClick={addMember}
                  disabled={saving || lockTextFields || members.length >= 10}
                >
                  + Dodaj zawodnika
                </button>
              </div>

              <div className={styles.actions}>
                <button className={styles.btnPrimary} disabled={saving} type="submit">
                  {saving ? "Zapisywanie..." : "Zapisz"}
                </button>
              </div>
            </form>
          </div>

          {/* pending info */}
          {isPending && (
            <div className={styles.pendingInfo}>
              ⏳ Drużyna jest w trakcie rozpatrywania. W tym czasie możesz zmienić tylko
              logo i banner.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
