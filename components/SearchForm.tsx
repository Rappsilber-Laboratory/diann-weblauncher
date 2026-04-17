'use client';
import { useState, useEffect } from 'react';
import { DIANN_OPTIONS } from '@/lib/options';
import { SearchOption } from '@/types/job';
import PathAutocomplete from './PathAutocomplete';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onStartJob: (command: string, outputPath: string) => void;
  onCancel: () => void;
}

const INITIAL_OPTIONS = [
  { flag: '--F', value: '' },
  { flag: '--out', value: '' },
  { flag: '--out-lib', value: '' },
  { flag: '--threads', value: '16' },
  { flag: '--verbose', value: '1' },
  { flag: '--fasta-search', value: true },
  { flag: '--qvalue', value: '0.01' },
  { flag: '--matrices', value: true },
  { flag: '--gen-spec-lib', value: true },
  { flag: '--lib', value: '' },
  { flag: '--fasta', value: '' },
  { flag: '--min-fr-mz', value: '200' },
  { flag: '--max-fr-mz', value: '1800' },
  { flag: '--met-excision', value: true },
  { flag: '--min-pep-len', value: '7' },
  { flag: '--max-pep-len', value: '30' },
  { flag: '--min-pr-mz', value: '300' },
  { flag: '--max-pr-mz', value: '1800' },
  { flag: '--min-pr-charge', value: '1' },
  { flag: '--max-pr-charge', value: '4' },
  { flag: '--cut', value: 'K*,R*' },
  { flag: '--missed-cleavages', value: '2' },
  { flag: '--unimod4', value: true },
  { flag: '--var-mods', value: '1' },
  { flag: '--reanalyse', value: true },
  { flag: '--rt-profiling', value: true },
  { flag: '--mod', value: 'UniMod:5,43.005814' },
];

export default function SearchForm({ onStartJob, onCancel }: Props) {
  const [selected, setSelected] = useState<any[]>(() => 
    INITIAL_OPTIONS.map(opt => ({ id: uuidv4(), ...opt }))
  );
  const [filter, setFilter] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const addOption = (opt: SearchOption) => {
    if (!opt.multiple && selected.find(s => s.flag === opt.flag)) return;
    const defaultValue = opt.defaultValue || (opt.type === 'boolean' ? true : '');
    const newId = uuidv4();
    setSelected([...selected, { id: newId, flag: opt.flag, value: defaultValue }]);
    // Jump after a short delay
    setTimeout(() => {
      jumpToId(newId);
    }, 100);
  };

  const removeOption = (id: string) => {
    const item = selected.find(s => s.id === id);
    if (!item) return;
    const opt = DIANN_OPTIONS.find(o => o.flag === item.flag);
    if (opt?.required) return;
    setSelected(selected.filter(s => s.id !== id));
  };

  const updateValue = (id: string, value: any) => {
    setSelected(selected.map(s => {
      if (s.id !== id) return s;
      const opt = DIANN_OPTIONS.find(o => o.flag === s.flag);
      let sanitizedValue = value;
      if (opt?.type === 'path' && typeof value === 'string') {
        sanitizedValue = value.replace(/\\/g, '/');
      }
      return { ...s, value: sanitizedValue };
    }));
  };

  const jumpToId = (id: string) => {
    const el = document.getElementById(`opt-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(id);
      setTimeout(() => setHighlightedId(null), 2000);
    }
  };

  const availableOptions = DIANN_OPTIONS.filter(opt => opt.multiple || !selected.find(s => s.flag === opt.flag));
  const commonAvailable = availableOptions.filter(o => o.category === 'common');
  const otherAvailable = availableOptions.filter(o => o.category === 'other' || !o.category)
    .filter(o => o.flag.toLowerCase().includes(filter.toLowerCase()) || o.description.toLowerCase().includes(filter.toLowerCase()));

  const generateRawCommand = () => {
    const parts = ['diann-wrapper'];
    selected.forEach(s => {
      const opt = DIANN_OPTIONS.find(o => o.flag === s.flag);
      if (opt?.type === 'boolean') {
        if (s.value) parts.push(s.flag);
      } else if (s.value !== '') {
        parts.push(s.flag);
        if (typeof s.value === 'string' && (s.value.includes(' ') || s.value.includes('*'))) {
          parts.push(`"${s.value}"`);
        } else {
          parts.push(s.value);
        }
      }
    });
    return parts.join(' ');
  };

  const currentCommand = generateRawCommand();
  const outPath = selected.find(s => s.flag === '--out')?.value || '';

  return (
    <div className="container" style={{ padding: '1rem', overflow: 'hidden' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Configure Search</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={onCancel}>Cancel</button>
          <button onClick={() => onStartJob(currentCommand, outPath)} disabled={!outPath || !selected.find(s => s.flag === '--F')?.value}>
            Start Job
          </button>
        </div>
      </div>

      <div className="terminal-preview" style={{ marginBottom: '1rem' }}>
        <span style={{ opacity: 0.5 }}>diann-wrapper </span>
        {selected.map((s, i) => {
          const opt = DIANN_OPTIONS.find(o => o.flag === s.flag);
          const needsValue = opt?.type !== 'boolean';
          const isEmptyValue = needsValue && s.value === '';
          
          if (isEmptyValue && !opt?.required) return null;

          return (
            <span key={s.id}>
              <span 
                className="clickable-opt" 
                onClick={() => jumpToId(s.id)}
                title="Click to jump to this option"
              >
                {s.flag}
              </span>
              {needsValue && s.value !== '' && (
                <span> {typeof s.value === 'string' && (s.value.includes(' ') || s.value.includes('*')) ? `"${s.value}"` : s.value}</span>
              )}
              {i < selected.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>

      <div className="form-container">
        <div className="options-left">
          <div style={{ flex: '0 0 auto' }}>
            <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '0.5rem' }}>Common</h3>
            <div className="options-scroll" style={{ maxHeight: '200px' }}>
              {commonAvailable.map(opt => (
                <div key={opt.flag} className="option-item" onClick={() => addOption(opt)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{opt.flag}{opt.defaultValue && <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: '4px' }}> "{opt.defaultValue}"</span>}</strong>
                    <span className="badge">{opt.type}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{opt.description}</div>
                  {opt.multiple && (
                    <div style={{ fontSize: '0.6rem', color: 'var(--accent)', marginTop: '2px', fontWeight: 'bold' }}>Can be added multiple times</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>All Options</h3>
            <input 
              type="text" 
              placeholder="Filter..." 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ marginBottom: '0.5rem', padding: '0.3rem 0.5rem' }}
            />
            <div className="options-scroll">
              {otherAvailable.map(opt => (
                <div key={opt.flag} className="option-item" onClick={() => addOption(opt)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{opt.flag}</strong>
                    <span className="badge">{opt.type}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{opt.description}</div>
                  {opt.multiple && (
                    <div style={{ fontSize: '0.6rem', color: 'var(--accent)', marginTop: '2px', fontWeight: 'bold' }}>Can be added multiple times</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="options-right" id="selected-panel">
          <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '0.5rem' }}>Configuration</h3>
          <div className="options-scroll" style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selected.map(s => {
                const opt = DIANN_OPTIONS.find(o => o.flag === s.flag);
                if (!opt) return null;
                return (
                  <div 
                    key={s.id} 
                    id={`opt-${s.id}`} 
                    className={`form-field ${highlightedId === s.id ? 'highlight' : ''}`}
                  >
                    <div className="label-row">
                      <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.flag}</label>
                      {!opt.required && (
                        <button className="remove-btn" onClick={() => removeOption(s.id)}>Remove</button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{opt.description}</div>
                    {opt.type === 'boolean' ? (
                      <div className="boolean-active">Active</div>
                    ) : opt.type === 'path' ? (
                      <PathAutocomplete value={s.value} onChange={(v) => updateValue(s.id, v)} />
                    ) : (
                      <input 
                        type={opt.type === 'number' ? 'number' : 'text'} 
                        value={s.value} 
                        onChange={(e) => {
                          let val: any = e.target.value;
                          if (opt.flag === '--threads' && parseInt(val) > 64) val = '64';
                          updateValue(s.id, val);
                        }} 
                        placeholder={`Enter ${opt.type}...`}
                        {...(opt.flag === '--threads' ? { max: 64, min: 1 } : {})}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
