'use client';
import { useState, useEffect } from 'react';
import { DIANN_OPTIONS } from '@/lib/options';
import { SearchOption } from '@/types/job';
import PathAutocomplete from './PathAutocomplete';

interface Props {
  onStartJob: (command: string, outputPath: string) => void;
  onCancel: () => void;
}

const DEFAULT_OPTIONS = [
  { flag: '--F', value: '' },
  { flag: '--out', value: '' },
  { flag: '--threads', value: '64' },
  { flag: '--verbose', value: '1' },
  { flag: '--fasta-search', value: true },
  { flag: '--qvalue', value: '0.01' },
  { flag: '--matrices', value: true },
  { flag: '--lib', value: '' },
  { flag: '--gen-lib', value: true },
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
];

export default function SearchForm({ onStartJob, onCancel }: Props) {
  const [selected, setSelected] = useState<any[]>(DEFAULT_OPTIONS);
  const [filter, setFilter] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const addOption = (opt: SearchOption) => {
    if (selected.find(s => s.flag === opt.flag)) return;
    const defaultValue = opt.defaultValue || (opt.type === 'boolean' ? true : '');
    setSelected([...selected, { flag: opt.flag, value: defaultValue }]);
    // Jump to the new option after a short delay
    setTimeout(() => {
      jumpToOption(opt.flag);
    }, 100);
  };

  const removeOption = (flag: string) => {
    const opt = DIANN_OPTIONS.find(o => o.flag === flag);
    if (opt?.required) return;
    setSelected(selected.filter(s => s.flag !== flag));
  };

  const updateValue = (flag: string, value: any) => {
    setSelected(selected.map(s => (s.flag === flag ? { ...s, value } : s)));
  };

  const jumpToOption = (flag: string) => {
    const el = document.getElementById(`opt-${flag}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(flag);
      setTimeout(() => setHighlightedId(null), 2000);
    }
  };

  const availableOptions = DIANN_OPTIONS.filter(opt => !selected.find(s => s.flag === opt.flag));
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
            <span key={s.flag}>
              <span 
                className="clickable-opt" 
                onClick={() => jumpToOption(s.flag)}
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
                    <strong>{opt.flag}</strong>
                    <span className="badge">{opt.type}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{opt.description}</div>
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
                    key={s.flag} 
                    id={`opt-${s.flag}`} 
                    className={`form-field ${highlightedId === s.flag ? 'highlight' : ''}`}
                  >
                    <div className="label-row">
                      <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.flag}</label>
                      {!opt.required && (
                        <button className="remove-btn" onClick={() => removeOption(s.flag)}>Remove</button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{opt.description}</div>
                    {opt.type === 'boolean' ? (
                      <div className="boolean-active">Active</div>
                    ) : opt.type === 'path' ? (
                      <PathAutocomplete value={s.value} onChange={(v) => updateValue(s.flag, v)} />
                    ) : (
                      <input 
                        type={opt.type === 'number' ? 'number' : 'text'} 
                        value={s.value} 
                        onChange={(e) => {
                            let val: any = e.target.value;
                            if (opt.flag === '--threads' && parseInt(val) > 64) val = '64';
                            updateValue(s.flag, val);
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
