import type { RefObject } from "react";

// Neutral time-of-day scene from the accepted UI-00 R2. Weather is a later stage.
export function AmbientScene({ sceneRef }: { sceneRef: RefObject<HTMLDivElement | null> }) {
  return <div ref={sceneRef} className="ambient-scene-host" data-running="false" aria-hidden="true">
    <div className="sky-scene"><div className="orb" /><div className="cloud" /><div className="cloud second" />
      <svg className="landscape" viewBox="0 0 480 94" preserveAspectRatio="none"><path d="M0 75Q80 34 160 70T320 63T480 68V94H0Z" fill="currentColor" opacity=".4" /><path d="M0 90Q100 50 210 79T480 77V94H0Z" fill="currentColor" /></svg>
      <svg className="scene-house" viewBox="0 0 74 74"><path d="M9 67V31L37 9l28 22v36M3 32 37 3l34 29" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><path d="M23 39h10v14H23zM45 39h10v14H45z" className="house-window" /></svg>
    </div>
  </div>;
}
