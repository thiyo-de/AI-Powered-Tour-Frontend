import React, { useState, useEffect, useRef } from 'react';
import MagicRings from './MagicRings';
import './MagicRings.css';

export default function LoadingScreen() {
  const [palette, setPalette] = useState({ color: '#a855f7', colorTwo: '#6366f1' });
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const krceRef = useRef(null);
  const krctRef = useRef(null);

  const scrollTo = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          if (entry.target.id === 'section-krce') {
            setPalette({ color: '#F47C20', colorTwo: '#2F5E8E' });
          } else if (entry.target.id === 'section-krct') {
            setPalette({ color: '#38bdf8', colorTwo: '#1d4ed8' });
          } else if (entry.target.id === 'section-hero') {
            setPalette({ color: '#a855f7', colorTwo: '#6366f1' });
          }
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    }, {
      root: containerRef.current,
      threshold: 0.35
    });

    const sections = [heroRef.current, krceRef.current, krctRef.current].filter(Boolean);
    sections.forEach(s => observer.observe(s));

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      id="loading-screen"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: '#060b0f',
        overflowX: 'hidden',
        overflowY: 'auto',
        scrollBehavior: 'smooth',
        fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#ffffff',
        userSelect: 'none'
      }}
    >
      {/* 1. Fullscreen Fixed MagicRings Background Effect */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <MagicRings
          color={palette.color}
          colorTwo={palette.colorTwo}
          ringCount={6}
          speed={1}
          attenuation={10}
          lineThickness={2}
          baseRadius={0.35}
          radiusStep={0.1}
          scaleRate={0.1}
          opacity={1}
          blur={0}
          noiseAmount={0.1}
          rotation={0}
          ringGap={1.5}
          fadeIn={0.7}
          fadeOut={0.5}
          followMouse={false}
          mouseInfluence={0.2}
          hoverScale={1.2}
          parallax={0.05}
          clickBurst={false}
          alphaMode="luminance"
        />
      </div>

      {/* 2. Radial Vignette for Depth */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2,
        background: 'radial-gradient(circle at center, transparent 35%, rgba(6, 11, 15, 0.75) 85%)',
        pointerEvents: 'none'
      }} />

      {/* SECTION 1: HERO GATEWAY */}
      <section ref={heroRef} className="page-section in-view" id="section-hero">
        <div className="gateway-content">
          <span className="gateway-eyebrow">360° Campus Gateway</span>
          <h1 className="gateway-title">
            Choose your<br />campus
          </h1>
          <p className="gateway-subtitle">
            Step into the KRCT or KRCE virtual tour.
          </p>

          <div className="gateway-buttons">
            <button
              type="button"
              className="gateway-btn gateway-btn-dark"
              onClick={() => scrollTo(krctRef)}
            >
              <span>Enter KRCT Tour</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            </button>
            <button
              type="button"
              className="gateway-btn gateway-btn-light"
              onClick={() => scrollTo(krceRef)}
            >
              <span>Enter KRCE Tour</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: KRCE (ENGINEERING CAMPUS - IMAGE 2) */}
      <section ref={krceRef} className="page-section" id="section-krce">
        {/* Full-Section Glassmorphism Overlay (Middle Layer) */}
        <div className="section-glass-overlay glass-krce" />

        <div className="campus-card">
          <div className="campus-top-nav">
            <button type="button" className="back-nav-btn" onClick={() => scrollTo(heroRef)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              Back to Gateway
            </button>
            <button type="button" className="switch-campus-pill" onClick={() => scrollTo(krctRef)}>
              Switch to KRCT
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" transform="rotate(180 12 12)"/></svg>
            </button>
          </div>

          <div className="campus-header-line line-krce card-header-anim">
            <span className="campus-num">03</span>
            <span className="campus-rule" />
            <span className="campus-category">ENGINEERING CAMPUS</span>
          </div>

          <span className="campus-eyebrow card-header-anim">CHOOSE THE ENGINEERING EXPERIENCE</span>

          <h1 className="campus-giant-acronym card-acronym-anim">
            <span className="acronym-navy">KR</span><span className="acronym-orange">CE</span>
          </h1>

          <h2 className="campus-full-title card-title-anim">
            K. Ramakrishnan College<br />of Engineering
          </h2>

          <p className="campus-desc card-desc-anim">
            Step inside the Engineering campus through its dedicated immersive 360-degree experience.
          </p>

          <div className="campus-specs-grid card-specs-anim">
            <div className="spec-col bar-orange">
              <span className="spec-label">CAMPUS</span>
              <span className="spec-val">Engineering</span>
            </div>
            <div className="spec-col bar-orange">
              <span className="spec-label">FORMAT</span>
              <span className="spec-val">360-degree tour</span>
            </div>
          </div>

          <div className="campus-tags-row card-tags-anim">
            <span className="feature-tag"><span className="tag-sparkle sparkle-orange">✦</span> Smart Classrooms & Labs</span>
            <span className="feature-tag"><span className="tag-sparkle sparkle-orange">✦</span> Innovation & Incubation Center</span>
            <span className="feature-tag"><span className="tag-sparkle sparkle-orange">✦</span> Sports & Cultural Complex</span>
          </div>

          <div className="campus-action-box card-btn-anim">
            <a href="/KRCE/index.htm" className="launch-tour-btn launch-krce">
              <span>ENTER KRCE TOUR</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 3: KRCT (TECHNOLOGY CAMPUS - IMAGE 1) */}
      <section ref={krctRef} className="page-section" id="section-krct">
        {/* Full-Section Glassmorphism Overlay (Middle Layer) */}
        <div className="section-glass-overlay glass-krct" />

        <div className="campus-card">
          <div className="campus-top-nav">
            <button type="button" className="back-nav-btn" onClick={() => scrollTo(heroRef)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              Back to Gateway
            </button>
            <button type="button" className="switch-campus-pill" onClick={() => scrollTo(krceRef)}>
              Switch to KRCE
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </button>
          </div>

          <div className="campus-header-line line-krct card-header-anim">
            <span className="campus-num">02</span>
            <span className="campus-rule" />
            <span className="campus-category">TECHNOLOGY CAMPUS</span>
          </div>

          <span className="campus-eyebrow card-header-anim">CHOOSE THE TECHNOLOGY EXPERIENCE</span>

          <h1 className="campus-giant-acronym card-acronym-anim">
            <span className="acronym-navy">KR</span><span className="acronym-blue">CT</span>
          </h1>

          <h2 className="campus-full-title card-title-anim">
            K. Ramakrishnan College<br />of Technology
          </h2>

          <p className="campus-desc card-desc-anim">
            Explore the Technology campus through its dedicated immersive 360-degree experience.
          </p>

          <div className="campus-specs-grid card-specs-anim">
            <div className="spec-col bar-blue">
              <span className="spec-label">CAMPUS</span>
              <span className="spec-val">Technology</span>
            </div>
            <div className="spec-col bar-blue">
              <span className="spec-label">FORMAT</span>
              <span className="spec-val">360-degree tour</span>
            </div>
          </div>

          <div className="campus-tags-row card-tags-anim">
            <span className="feature-tag"><span className="tag-sparkle sparkle-blue">✦</span> 18+ Interactive Hotspots</span>
            <span className="feature-tag"><span className="tag-sparkle sparkle-blue">✦</span> Robotics & Drone Labs</span>
            <span className="feature-tag"><span className="tag-sparkle sparkle-blue">✦</span> Central Library & Arena</span>
          </div>

          <div className="campus-action-box card-btn-anim">
            <a href="/KRCT/index.htm" className="launch-tour-btn launch-krct">
              <span>ENTER KRCT TOUR</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
