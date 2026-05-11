'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  GeocodeResult,
  PlaceSuggestion,
  retrievePlace,
  suggestPlaces,
} from '../lib/mapbox';
import { C } from '../lib/tokens';

interface Props {
  onSelect: (place: GeocodeResult | null) => void;
  placeholder?: string;
}

export default function DestinationSearch({ onSelect, placeholder = 'Search destination' }: Props) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const sessionToken = useRef<string>('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortCtrl = useRef<AbortController | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function scheduleSuggest(q: string) {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    abortCtrl.current?.abort();

    if (q.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      if (!sessionToken.current) sessionToken.current = crypto.randomUUID();
      const ctrl = new AbortController();
      abortCtrl.current = ctrl;
      try {
        const items = await suggestPlaces(q.trim(), sessionToken.current, ctrl.signal);
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') {
          console.error('[suggest]', e);
        }
      }
    }, 250);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setText(v);
    if (hasSelection) {
      setHasSelection(false);
      onSelect(null);
    }
    scheduleSuggest(v);
  }

  async function pick(s: PlaceSuggestion) {
    setOpen(false);
    setSuggestions([]);
    setText(s.name);
    try {
      const place = await retrievePlace(s.mapboxId, sessionToken.current);
      sessionToken.current = '';
      setHasSelection(true);
      onSelect(place);
    } catch (e) {
      console.error('[retrieve]', e);
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={text}
        onChange={onChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        style={{
          width: '100%',
          fontSize: 15,
          fontWeight: 500,
          color: text ? C.ink : C.ink40,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: 0,
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      {open && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            left: -12,
            right: -12,
            top: 'calc(100% + 12px)',
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 12px 32px rgba(31,58,46,0.18), 0 0 0 1px rgba(26,26,26,0.06)',
            overflow: 'hidden',
            zIndex: 50,
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {suggestions.map((s, i) => (
            <li key={s.mapboxId}>
              <button
                type="button"
                onClick={() => pick(s)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderTop: i > 0 ? `1px solid ${C.ink08}` : 'none',
                  display: 'block',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </div>
                {s.description && (
                  <div style={{ fontSize: 12, color: C.ink60, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.description}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
