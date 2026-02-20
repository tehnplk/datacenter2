"use client";

import { useEffect, useRef, useState } from "react";
import SpLevelBadge from "@/components/dashboard/SpLevelBadge";

type Hospital = {
  hoscode: string;
  hosname: string;
  hosname_short: string | null;
  size_level: string | null;
  gps: string | null;
  amp_code: string | null;
  beds: number | null;
};

const SP_LEVEL_COLOR: Record<string, string> = {
  A: "#c0392b",
  F1: "#2980b9",
  F2: "#27ae60",
  M2: "#8e44ad",
};

function getLevelColor(level: string | null) {
  if (!level) return "#7f8c8d";
  return SP_LEVEL_COLOR[level] ?? "#7f8c8d";
}

function redCrossSVG(color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="17" fill="white" stroke="${color}" stroke-width="2.5"/>
    <rect x="14" y="7" width="8" height="22" rx="2" fill="${color}"/>
    <rect x="7" y="14" width="22" height="8" rx="2" fill="${color}"/>
  </svg>`;
}

export default function HospitalMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    fetch("/api/info/hospitals")
      .then((r) => r.json())
      .then((data) => {
        setHospitals(data.hospitals ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("leaflet-css")) {
      setLeafletReady(true);
      return;
    }
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!leafletReady || loading || !mapRef.current || hospitals.length === 0) return;
    if (mapInstanceRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;

    const map = L.map(mapRef.current).setView([16.85, 100.45], 9);
    mapInstanceRef.current = map;

    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
        maxZoom: 19,
      }
    );

    osmLayer.addTo(map);

    L.control.layers(
      { "แผนที่": osmLayer, "ดาวเทียม": satelliteLayer },
      {},
      { position: "topright" }
    ).addTo(map);

    hospitals.forEach((hos) => {
      if (!hos.gps) return;
      const [lat, lng] = hos.gps.split(",").map(Number);
      if (isNaN(lat) || isNaN(lng)) return;

      const color = getLevelColor(hos.size_level);
      const svgStr = redCrossSVG(color);
      const iconUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));

      const icon = L.icon({
        iconUrl,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const levelBadge = hos.size_level
        ? `<span style="background:${color};color:#fff;padding:1px 5px;border-radius:10px;font-size:10px;font-weight:700;">${hos.size_level}</span>`
        : "";

      const marker = L.marker([lat, lng], { icon }).addTo(map);

      marker.bindTooltip(
        `<div style="font-family:sans-serif;line-height:1.4;display:flex;align-items:center;gap:4px;">
          ${levelBadge}
          <span style="font-weight:700;font-size:10px;">${hos.hosname}</span>
        </div>`,
        { permanent: true, direction: "top", offset: [0, -20], className: "hos-label" }
      );

      marker.bindPopup(
        `<div style="font-family:sans-serif;min-width:160px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${hos.hosname}</div>
          <div>รหัส: <b>${hos.hoscode}</b></div>
          <div>ระดับ: ${levelBadge}</div>
          <div style="font-size:11px;color:#888;margin-top:4px;">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
        </div>`
      );
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletReady, loading, hospitals]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-green-200 bg-white px-5 py-3 dark:border-green-800 dark:bg-green-900">
        <span className="text-xl">🏥</span>
        <div>
          <div className="font-bold text-green-900 dark:text-green-50">รายชื่อโรงพยาบาลในสังกัด</div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {Object.entries(SP_LEVEL_COLOR).map(([lvl, col]) => (
            <span
              key={lvl}
              style={{ background: col }}
              className="rounded-full px-3 py-0.5 text-xs font-bold text-white"
            >
              {lvl}
            </span>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10 text-green-700 dark:text-green-300">
          กำลังโหลดข้อมูล...
        </div>
      )}

      {/* Hospital Grid */}
      {!loading && (
        <div className="bg-white dark:bg-zinc-950">
          <table className="border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="w-12 border-b border-zinc-200 px-3 py-2 text-right font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">ลำดับ</th>
                <th className="w-24 border-b border-zinc-200 px-3 py-2 text-left font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">รหัส รพ.</th>
                <th className="border-b border-zinc-200 px-3 py-2 text-left font-semibold text-zinc-600 whitespace-nowrap dark:border-zinc-700 dark:text-zinc-300">ชื่อ รพ.</th>
                <th className="w-20 border-b border-zinc-200 px-3 py-2 text-center font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">ระดับ</th>
                <th className="w-20 border-b border-zinc-200 px-3 py-2 text-right font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">เตียง</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h, idx) => {
                const displayName = h.hosname_short?.trim() || h.hosname;
                return (
                  <tr key={h.hoscode} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <td className="border-b border-zinc-100 px-3 py-1.5 text-right tabular-nums text-zinc-500 dark:border-zinc-800">{idx + 1}</td>
                    <td className="border-b border-zinc-100 px-3 py-1.5 font-mono text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">{h.hoscode}</td>
                    <td className="border-b border-zinc-100 px-3 py-1.5 whitespace-nowrap dark:border-zinc-800">{displayName}</td>
                    <td className="border-b border-zinc-100 px-3 py-1.5 text-center dark:border-zinc-800">
                      <SpLevelBadge level={h.size_level} />
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-1.5 text-right tabular-nums font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                      {h.beds != null ? h.beds.toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Map */}
      <div style={{ height: "480px", display: loading ? "none" : "block", padding: "15px" }}>
        <div ref={mapRef} style={{ height: "100%", borderRadius: 8, overflow: "hidden" }} />
      </div>

      <style>{`
        .hos-label {
          background: rgba(255,255,255,0.92) !important;
          border: none !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18) !important;
          padding: 3px 8px !important;
          font-size: 12px !important;
          white-space: nowrap !important;
        }
        .hos-label::before { display: none !important; }
      `}</style>
    </div>
  );
}
