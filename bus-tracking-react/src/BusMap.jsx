import { useEffect, useRef } from "react";

// Leaflet is loaded via CDN links injected into index.html
// This avoids CSS import issues with Vite bundler

const CHENNAI = [13.0827, 80.2707]; // default center

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function BusMap({ latitude, longitude, busId, darkMode, speed }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const trailRef     = useRef(null);   // polyline trail
  const trailPoints  = useRef([]);
  const prevPos      = useRef(null);
  const animFrame    = useRef(null);
  const initialized  = useRef(false);

  // ── Init Leaflet once ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || initialized.current) return;
    if (typeof window.L === "undefined") return; // wait for CDN

    initialized.current = true;
    const L   = window.L;
    const map = L.map(containerRef.current, {
      center:      CHENNAI,
      zoom:        15,
      zoomControl: true,
      attributionControl: false,
    });

    // Tile layer
    const tileUrl = darkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    // Attribution (small)
    L.control.attribution({ prefix: false })
      .addAttribution('© <a href="https://osm.org">OSM</a>')
      .addTo(map);

    // Bus icon (emoji in a styled div)
    const busIcon = L.divIcon({
      html: `
        <div style="
          font-size:30px;
          line-height:1;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));
          transition: transform 0.1s;
          transform-origin: center;
        ">🚌</div>
      `,
      className: "",
      iconSize:   [34, 34],
      iconAnchor: [17, 17],
    });

    // Marker at default center
    const marker = L.marker(CHENNAI, { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
    marker.bindPopup(`<b>${busId}</b><br>Awaiting GPS…`, { closeButton: false });

    // Trail polyline
    const trail = L.polyline([], {
      color:     darkMode ? "#00c8ff" : "#0050ff",
      weight:    3,
      opacity:   0.7,
      dashArray: "6 4",
    }).addTo(map);

    mapRef.current    = map;
    markerRef.current = marker;
    trailRef.current  = trail;

    return () => {
      cancelAnimationFrame(animFrame.current);
      map.remove();
      mapRef.current    = null;
      markerRef.current = null;
      trailRef.current  = null;
      initialized.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animate to new GPS position ─────────────────────────────────────────────
  useEffect(() => {
    const L = window.L;
    if (!L || !markerRef.current || !mapRef.current) return;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    const marker = markerRef.current;
    const map    = mapRef.current;
    const trail  = trailRef.current;

    // Update popup
    marker.setPopupContent(
      `<b style="font-family:monospace">${busId}</b><br>
       🌡 ${latitude}° &nbsp; | &nbsp; 📍 ${longitude}°<br>
       🏎 Speed: ${speed || "0 km/h"}`
    );

    const prev = prevPos.current;
    if (prev) {
      // Smooth animation from prev → new position
      cancelAnimationFrame(animFrame.current);
      const fromLat = prev[0], fromLng = prev[1];
      const duration = 4500; // 4.5 s so it finishes just before next 5 s poll
      const startTime = performance.now();

      // Add trail point
      trailPoints.current.push([lat, lng]);
      if (trailPoints.current.length > 40) trailPoints.current.shift(); // keep last 40
      trail?.setLatLngs(trailPoints.current);

      const step = (now) => {
        const elapsed = now - startTime;
        const t       = Math.min(elapsed / duration, 1);
        const ease    = easeInOut(t);
        const curLat  = fromLat + (lat - fromLat) * ease;
        const curLng  = fromLng + (lng - fromLng) * ease;
        marker.setLatLng([curLat, curLng]);

        // Rotate bus icon based on direction
        const dLat = lat - fromLat;
        const dLng = lng - fromLng;
        if (Math.abs(dLat) > 0.00001 || Math.abs(dLng) > 0.00001) {
          const angle  = Math.atan2(dLng, dLat) * (180 / Math.PI);
          const el     = marker.getElement();
          if (el) el.querySelector("div").style.transform = `rotate(${angle}deg)`;
        }

        if (t < 1) {
          animFrame.current = requestAnimationFrame(step);
        } else {
          // Smoothly pan map to follow
          map.panTo([lat, lng], { animate: true, duration: 0.8 });
        }
      };

      animFrame.current = requestAnimationFrame(step);
    } else {
      // First fix — jump directly
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], 15, { animate: true });
      trailPoints.current.push([lat, lng]);
      trail?.setLatLngs(trailPoints.current);
    }

    prevPos.current = [lat, lng];
  }, [latitude, longitude, busId, speed]);

  // ── Tile swap on dark/light toggle ─────────────────────────────────────────
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;
    mapRef.current.eachLayer(layer => {
      if (layer._url) mapRef.current.removeLayer(layer);
    });
    const url = darkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    L.tileLayer(url, { maxZoom: 19 }).addTo(mapRef.current);
    // Restore trail on top
    trailRef.current?.addTo(mapRef.current);
    markerRef.current?.addTo(mapRef.current);
  }, [darkMode]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: "380px", borderRadius: "6px" }} />
      {/* Corner brackets */}
      {["TL","TR","BL","BR"].map(c => (
        <div key={c} style={{
          position: "absolute", pointerEvents: "none", zIndex: 1000,
          top:    c.startsWith("T") ? "8px" : "auto",
          bottom: c.startsWith("B") ? "8px" : "auto",
          left:   c.endsWith("L")   ? "8px" : "auto",
          right:  c.endsWith("R")   ? "8px" : "auto",
          width: "16px", height: "16px",
          borderTop:    c.startsWith("T") ? "2px solid #00c8ff" : "none",
          borderBottom: c.startsWith("B") ? "2px solid #00c8ff" : "none",
          borderLeft:   c.endsWith("L")   ? "2px solid #00c8ff" : "none",
          borderRight:  c.endsWith("R")   ? "2px solid #00c8ff" : "none",
        }}/>
      ))}
      {/* Live badge */}
      <div style={{
        position: "absolute", top: "12px", left: "12px", zIndex: 1000,
        background: "rgba(0,0,0,0.75)", border: "1px solid rgba(0,200,255,0.4)",
        borderRadius: "3px", padding: "4px 10px", display: "flex", gap: "6px", alignItems: "center",
        backdropFilter: "blur(6px)",
      }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00ff88",
          boxShadow: "0 0 6px #00ff88", display: "inline-block",
          animation: "pulse 1.5s infinite" }} />
        <span style={{ color: "#00c8ff", fontSize: "10px", letterSpacing: "2px",
          fontFamily: "'Courier New',monospace" }}>
          {busId} — LIVE GPS
        </span>
      </div>
    </div>
  );
}
