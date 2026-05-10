'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Map() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!TOKEN || TOKEN.startsWith('pk.PASTE')) return;

    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-0.1556, 51.4795],
      zoom: 13,
    });
    map.on('error', (e) => console.error('[mapbox]', e?.error ?? e));
    map.on('load', () => map.resize());
    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  if (!TOKEN || TOKEN.startsWith('pk.PASTE')) {
    return (
      <div
        style={{ position: 'absolute', inset: 0 }}
        className="flex items-center justify-center p-5"
      >
        <p className="text-xs uppercase tracking-widest text-[#1a1a1a]/40 text-center leading-relaxed">
          Mapbox token<br />not configured
        </p>
      </div>
    );
  }

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}
