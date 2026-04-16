'use client';
import { useState, useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function PathAutocomplete({ value, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const timer = useRef<any>(null);

  const fetchSuggestions = async (q: string) => {
    try {
      const res = await fetch(`/api/autocomplete?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data);
    } catch (e) {
      setSuggestions([]);
    }
  };

  const handleChange = (val: string) => {
    onChange(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchSuggestions(val), 200);
    setShow(true);
  };

  const handleSelect = (path: string) => {
    onChange(path);
    setShow(false);
  };

  return (
    <div className="autocomplete-container">
      <input 
        type="text" 
        value={value} 
        onChange={(e) => handleChange(e.target.value)} 
        onBlur={() => setTimeout(() => setShow(false), 200)}
        autoComplete="off"
        placeholder="Type path..."
      />
      {show && suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((s, i) => (
            <div key={i} className="suggestion-item" onClick={() => handleSelect(s.path)}>
              <span style={{ fontSize: '0.8rem', marginRight: '0.5rem' }}>{s.isDirectory ? '📁' : '📄'}</span>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
