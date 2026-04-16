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

  const addOption = (opt: SearchOption) => {
    if (selected.find(s => s.flag === opt.flag)) return;
    const defaultValue = opt.type === 'boolean' ? true : '';
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

  const generateCommand = () => {
    const parts = ['diann-wrapper'];
    selected.forEach(s => {
      const opt = DIANN_OPTIONS.find(o => o.flag === s.flag);
      if (opt?.type === 'boolean') {
        if (s.value) parts.push(s.flag);
      } else if (s.value !== '') {
        parts.push(s.flag);
        // Add quotes if string
        if (typeof s.value === 'string' && s.value.includes(' ')) {
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
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Configure Search</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={onCancel}>Cancel</button>
          <button onClick={() => onStartJob(currentCommand, outPath)} disabled={!outPath || !selected.find(s => s.flag === '--F')?.value}>
            Start Job
          </button>
        </div>
      </div>

      <div className="card" style={{ background: '#000', fontFamily: 'monospace', padding: '0.75rem', marginBottom: '1rem', border: '1px solid var(--accent)' }}>
        {currentCommand}
      </div>

      <div className="form-container">
        <div className="options-left">
          <h3>Available Options</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Click to add</p>
          {DIANN_OPTIONS.map(opt => (
            <div key={opt.flag} className="option-item" onClick={() => addOption(opt)}>
              <span>{opt.flag}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{opt.type}</span>
            </div>
          ))}
        </div>

        <div className="options-right">
          <h3>Selected Parameters</h3>
          {selected.map(s => {
            const opt = DIANN_OPTIONS.find(o => o.flag === s.flag);
            if (!opt) return null;
            return (
              <div key={s.flag} className="form-field">
                <div className="label-row">
                  <label>{s.flag} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({opt.description})</span></label>
                  {!opt.required && (
                    <button className="remove-btn" onClick={() => removeOption(s.flag)}>Remove</button>
                  )}
                </div>
                {opt.type === 'boolean' ? (
                  <input type="checkbox" checked={s.value} onChange={(e) => updateValue(s.flag, e.target.checked)} />
                ) : opt.type === 'path' ? (
                  <PathAutocomplete value={s.value} onChange={(v) => updateValue(s.flag, v)} />
                ) : (
                  <input 
                    type={opt.type === 'number' ? 'number' : 'text'} 
                    value={s.value} 
                    onChange={(e) => updateValue(s.flag, e.target.value)} 
                    placeholder={`Enter ${opt.type}...`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
