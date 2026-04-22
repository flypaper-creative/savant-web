export default function SiteAtmosphere() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        <div className="noise-overlay" />
        <div className="scanlines-overlay" />
        <div className="neural-lattice-overlay opacity-10" />
        <div className="vignette-heavy" />
      </div>

      <div className="anamorphic-flare" />

      <div className="grid-overlay">
        <div className="grid-line horizontal top-1/4" />
        <div className="grid-line horizontal top-1/2" />
        <div className="grid-line horizontal top-3/4" />
        <div className="grid-line vertical left-1/4" />
        <div className="grid-line vertical left-1/2" />
        <div className="grid-line vertical left-3/4" />
      </div>

      <div className="corner-accent tl" />
      <div className="corner-accent tr" />
      <div className="corner-accent bl" />
      <div className="corner-accent br" />

      <div className="telemetry-hud left">
        signal integrity // recursive field // live
      </div>
      <div className="telemetry-hud right">
        savant // sovereign interface lattice
      </div>
    </>
  )
}