/**
 * pages/Home.jsx
 * --------------
 * Főoldal: Hero + top játékok slider + hírek + diagram + quick links
 */
window.NGH = window.NGH || {};
window.NGH.pages = window.NGH.pages || {};

window.NGH.pages.Home = function Home(){
  const Hero = window.NGH.components.Hero;
  const TopGamesCarousel = window.NGH.components.TopGamesCarousel;
  const NewsPanel = window.NGH.components.NewsPanel;
  const AnimatedChart = window.NGH.components.AnimatedChart;
  const QuickLinks = window.NGH.components.QuickLinks;

  return (
    <div>
      <Hero />
      <div className="row g-4">
        <div className="col-lg-7"><TopGamesCarousel /></div>
        <div className="col-lg-5"><NewsPanel /></div>
      </div>
      <div className="row g-4 mt-1">
        <div className="col-lg-6"><AnimatedChart /></div>
        <div className="col-lg-6"><QuickLinks /></div>
      </div>
    </div>
  );
};
