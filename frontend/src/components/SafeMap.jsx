import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// SVG-based custom markers to avoid any missing png assets in bundler
function createPinIcon(color, text, iconSvg) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${color};
        color: white;
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        border: 2px solid #ffffff;
      ">
        <div style="transform: rotate(45deg); font-size: 13px; font-weight: 700;">
          ${iconSvg || text || ''}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

const pulseIcon = L.divIcon({
  className: 'live-pulse-pin',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        background: rgba(168, 85, 247, 0.4);
        border-radius: 50%;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: absolute;
        top: 4px;
        left: 4px;
        width: 16px;
        height: 16px;
        background: #a855f7;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 10px #a855f7;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function SafeMap({
  origin = [28.6139, 77.2090], // Default center (e.g. New Delhi or user's coordinates)
  destination = [28.6289, 77.2190],
  currentPos = null,
  routes = [],
  selectedRouteIndex = 0,
  showSafeHavens = true,
  height = '420px',
  interactive = true,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map with Dark Matter tiles for a sleek, premium dark-mode look
      const map = L.map(mapContainerRef.current, {
        center: origin,
        zoom: 14,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: false,
      });

      // CartoDB Dark Matter tile layer (reliable, fast, stunning in dark theme)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    layers.clearLayers();

    const boundsPoints = [];

    // Origin marker
    if (origin && origin[0] && origin[1]) {
      const originPin = createPinIcon('#10b981', 'A');
      L.marker(origin, { icon: originPin })
        .bindPopup('<b>Starting Point (Origin)</b>')
        .addTo(layers);
      boundsPoints.push(origin);
    }

    // Destination marker
    if (destination && destination[0] && destination[1]) {
      const destPin = createPinIcon('#8b5cf6', 'B');
      L.marker(destination, { icon: destPin })
        .bindPopup('<b>Destination</b>')
        .addTo(layers);
      boundsPoints.push(destination);
    }

    // Draw routes
    if (routes && routes.length > 0) {
      routes.forEach((route, idx) => {
        const isSelected = idx === selectedRouteIndex;
        const color =
          route.safetyType === 'safest'
            ? '#22c55e'
            : route.safetyType === 'caution'
            ? '#ef4444'
            : '#f59e0b';

        const polyline = L.polyline(route.path, {
          color: isSelected ? color : '#64748b',
          weight: isSelected ? 6 : 3,
          opacity: isSelected ? 0.9 : 0.4,
          dashArray: isSelected ? null : '6, 8',
          lineCap: 'round',
        }).addTo(layers);

        polyline.bindPopup(`
          <div style="font-size: 13px; color: #1e293b;">
            <strong>${route.name}</strong><br/>
            Safety Score: <b>${route.safetyScore}/100</b><br/>
            ${route.distance} • ${route.duration}
          </div>
        `);

        if (isSelected) {
          route.path.forEach((p) => boundsPoints.push(p));
        }
      });
    }

    // Safe Havens layer
    if (showSafeHavens && origin && destination) {
      // Generate nearby safe zones along route
      const midLat = (origin[0] + destination[0]) / 2;
      const midLng = (origin[1] + destination[1]) / 2;

      const havens = [
        {
          name: 'Central Police Station',
          type: 'Police Assistance 24/7',
          coords: [midLat + 0.003, midLng - 0.002],
          color: '#3b82f6',
          icon: '👮',
        },
        {
          name: 'Apollo 24/7 Pharmacy & Clinic',
          type: 'Well-Lit Safe Haven',
          coords: [midLat - 0.002, midLng + 0.003],
          color: '#10b981',
          icon: '🏥',
        },
        {
          name: 'Metro Transit Security Booth',
          type: 'CCTV Guarded Zone',
          coords: [midLat + 0.001, midLng + 0.004],
          color: '#f59e0b',
          icon: '🛡️',
        },
      ];

      havens.forEach((haven) => {
        const havenPin = L.divIcon({
          className: 'haven-pin',
          html: `
            <div style="
              background: #0f172a;
              border: 1.5px solid ${haven.color};
              border-radius: 50%;
              width: 26px;
              height: 26px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.6);
            ">${haven.icon}</div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        L.marker(haven.coords, { icon: havenPin })
          .bindPopup(`
            <div style="color: #0f172a; font-size: 12px;">
              <strong>${haven.name}</strong><br/>
              <span style="color: #64748b;">${haven.type}</span>
            </div>
          `)
          .addTo(layers);
      });
    }

    // Live Traveler current position
    if (currentPos && currentPos[0] && currentPos[1]) {
      L.marker(currentPos, { icon: pulseIcon })
        .bindPopup('<b>Your Current Location (Live)</b>')
        .addTo(layers);
      boundsPoints.push(currentPos);
    }

    // Fit map to markers/routes
    if (boundsPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(boundsPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch {
        // Safe ignore
      }
    }
  }, [origin, destination, routes, selectedRouteIndex, currentPos, showSafeHavens]);

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-surface-900">
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%', zIndex: 1 }}
        className="outline-none"
      />
      {/* Legend Badge */}
      <div className="absolute top-3 right-3 z-10 glass-card px-3 py-1.5 text-xs text-surface-200 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Safest
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Moderate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Safe Haven
        </span>
      </div>
    </div>
  );
}
