import Hero from "../../components/Hero/Hero";
import Features from "../../components/Features/Features";
import HomeTournamentsPreview from "../../components/HomeTournamentsPreview/HomeTournamentsPreview";
import HomeTeamsPreview from "../../components/HomeTeamsPreview/HomeTeamsPreview";
import HomeStatsStrip from "../../components/HomeStatsStrip/HomeStatsStrip";

const Home = () => {
  return (
    <>
      <Hero />
      <Features />

      {/* fajny pasek statystyk (dynamiczny) */}
      <HomeStatsStrip />

      {/* preview turniejów */}
      <HomeTournamentsPreview limit={3} />

      {/* preview drużyn */}
      <HomeTeamsPreview limit={6} />
    </>
  );
};

export default Home;
