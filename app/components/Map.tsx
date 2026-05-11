'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Coords } from '../lib/mapbox';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const ROUTE_SOURCE_ID = 'route';
const ROUTE_LAYER_ID = 'route-line';
const EMPTY_LINE: GeoJSON.Feature<GeoJSON.LineString> = {
  type: 'Feature',
  geometry: { type: 'LineString', coordinates: [] },
  properties: {},
};

interface MapProps {
  origin?: Coords;
  destination?: Coords;
  route?: GeoJSON.LineString;
}

export default function Map({ origin, destination, route }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const loadedRef = useRef(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

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
    map.on('load', () => {
      loadedRef.current = true;
      map.resize();
      map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: EMPTY_LINE });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#FF6B47', 'line-width': 5 },
      });
    });
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (origin) {
        markersRef.current.push(
          new mapboxgl.Marker({ color: '#1F3A2E' }).setLngLat(origin).addTo(map),
        );
      }
      if (destination) {
        markersRef.current.push(
          new mapboxgl.Marker({ color: '#FF6B47' }).setLngLat(destination).addTo(map),
        );
      }

      const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData(
          route ? { type: 'Feature', geometry: route, properties: {} } : EMPTY_LINE,
        );
      }

      if (route && route.coordinates.length > 0) {
        const first = route.coordinates[0] as Coords;
        const bounds = route.coordinates.reduce(
          (b, c) => b.extend(c as Coords),
          new mapboxgl.LngLatBounds(first, first),
        );
        map.fitBounds(bounds, { padding: 60, duration: 800, maxZoom: 16 });
      } else if (origin && destination) {
        const bounds = new mapboxgl.LngLatBounds(origin, origin).extend(destination);
        map.fitBounds(bounds, { padding: 60, duration: 800, maxZoom: 16 });
      }
    };

    if (loadedRef.current) {
      apply();
    } else {
      map.once('load', apply);
    }
  }, [origin, destination, route]);

  if (!TOKEN || TOKEN.startsWith('pk.PASTE')) {
    return (
      <div
        style={{ position: 'absolute', inset: 0 }}
        className="flex items-center justify-center p-5 bg-[#E8EDE5]"
      >
        <p className="text-xs uppercase tracking-widest text-[#1a1a1a]/40 text-center leading-relaxed">
          Mapbox token<br />not configured
        </p>
      </div>
    );
  }

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}
