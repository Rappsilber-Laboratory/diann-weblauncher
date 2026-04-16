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

  const addOption = (opt: SearchOption) => {
    if (selected.find(s => s.flag === opt.flag)) return;
    const defaultValue = opt.defaultValue || (opt.type === 'boolean' ? true : '');
    setSelected([...selected, { flag: opt.flag, value: defaultValue }]);
  };

  const removeOption = (flag: string) => {
    const opt = DIANN_OPTIONS.find(o => o.flag === flag);
    if (opt?.required) return;
    setSelected(selected.filter(s => s.flag !== flag));
  };

  const updateValue = (flag: string, value: any) => {
    setSelected(selected.map(s => (s.flag === flag ? { ...s, value } : s)));
  };

  const availableOptions = DIANN_OPTIONS.filter(opt => !selected.find(s => s.flag === opt.flag));
  const commonAvailable = availableOptions.filter(o => o.category === 'common');
  const otherAvailable = availableOptions.filter(o => o.category === 'other' || !o.category)
    .filter(o => o.flag.toLowerCase().includes(filter.toLowerCase()) || o.description.toLowerCase().includes(filter.toLowerCase()));

  const generateCommand = () => {
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

  const currentCommand = generateCommand();
  const outPath = selected.find(s => s.flag === '--out')?.value || '';

  return (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Configure Search</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={onCancel}>Cancel</button>
          <button onClick={() => onStartJob(currentCommand, outPath)} disabled={!outPath || !selected.find(s => s.flag === '--F')?.value}>
            Start Job
          </button>
        </div>
      </div>

      <div className="terminal-preview" style={{ marginBottom: '1.5rem' }}>
        {currentCommand}
      </div>

      <div className="form-container" style={{ flex: 1, overflow: 'hidden' }}>
        <div className="options-left" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 auto' }}>
            <h3 style={{ marginTop: 0 }}>Common Options</h3>
            <div className="options-scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {commonAvailable.map(opt => (
                <div key={opt.flag} className="option-item" onClick={() => addOption(opt)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{opt.flag}</strong>
                    <span className="badge">{opt.type}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{opt.description}</div>
                </div>
              ))}
              {commonAvailable.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No more common options</p>}
            </div>
          </div>

          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>All Options</h3>
            <input 
              type="text" 
              placeholder="Filter options..." 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ marginBottom: '0.5rem', width: '100%' }}
            />
            <div className="options-scroll" style={{ flex: 1, overflowY: 'auto' }}>
              {otherAvailable.map(opt => (
                <div key={opt.flag} className="option-item" onClick={() => addOption(opt)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{opt.flag}</strong>
                    <span className="badge">{opt.type}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{opt.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="options-right" style={{ overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>Selected Parameters</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {selected.map(s => {
              const opt = DIANN_OPTIONS.find(o => o.flag === s.flag);
              if (!opt) return null;
              return (
                <div key={s.flag} className="form-field">
                  <div className="label-row">
                    <label style={{ fontWeight: 600 }}>{s.flag}</label>
                    {!opt.required && (
                      <button className="remove-btn" onClick={() => removeOption(s.flag)}>Remove</button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{opt.description}</div>
                  {opt.type === 'boolean' ? (
                    <div className="boolean-active">Active (Flag present)</div>
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
  );
}
