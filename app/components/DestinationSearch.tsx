'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  GeocodeResult,
  PlaceSuggestion,
  retrievePlace,
  suggestPlaces,
} from '../lib/mapbox';

interface Props {
  onSelect: (place: GeocodeResult | null) => void;
}

export default function DestinationSearch({ onSelect }: Props) {
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
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={text}
        onChange={onChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="THE CROWN, BATTERSEA"
        className="w-full text-lg uppercase tracking-wide bg-transparent outline-none placeholder:text-[#1a1a1a]/30"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-3 bg-white rounded-2xl shadow-[0_4px_0_0_#3da95c33,0_8px_24px_-8px_rgba(61,169,92,0.25)] overflow-hidden z-50">
          {suggestions.map((s, i) => (
            <li key={s.mapboxId}>
              <button
                type="button"
                onClick={() => pick(s)}
                className={`w-full text-left px-5 py-3 hover:bg-[#3da95c]/10 active:bg-[#3da95c]/20 transition-colors ${
                  i > 0 ? 'border-t border-[#1a1a1a]/10' : ''
                }`}
              >
                <p className="text-sm font-bold text-[#1a1a1a] truncate">{s.name}</p>
                {s.description && (
                  <p className="text-xs text-[#1a1a1a]/60 mt-0.5 truncate font-normal normal-case">
                    {s.description}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
