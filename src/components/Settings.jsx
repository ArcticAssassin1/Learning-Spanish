import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { spanishVoices, onVoicesChanged, speak, speechSupported } from '../lib/speech.js';

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="toggle-row">
      <span>
        <span className="toggle-label">{label}</span>
        {hint && <span className="muted small block">{hint}</span>}
      </span>
      <input type="checkbox" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function Settings() {
  const { settings, updateSettings, resetProgress } = useStore();
  const [voices, setVoices] = useState(spanishVoices);
  useEffect(() => onVoicesChanged(() => setVoices(spanishVoices())), []);

  const reset = () => {
    if (window.confirm('Erase all progress and streaks? This cannot be undone.')) resetProgress();
  };

  return (
    <div className="page">
      <header className="page-head"><h1>⚙️ Settings</h1></header>

      <section className="panel">
        <Toggle
          label="Show explicit cards 🔞"
          hint="Turn off when studying in public. Hides vulgar cards and the Expletives deck."
          checked={settings.showVulgar}
          onChange={(showVulgar) => updateSettings({ showVulgar })}
        />
        <Toggle
          label="Auto-play audio"
          hint="Speak the Spanish automatically when a card appears."
          checked={settings.autoSpeak}
          onChange={(autoSpeak) => updateSettings({ autoSpeak })}
        />
      </section>

      <section className="panel">
        <div className="field-label">Daily goal (cards per day)</div>
        <div className="segmented">
          {[[0, 'Off'], [10, '10'], [20, '20'], [30, '30'], [50, '50']].map(([v, t]) => (
            <button key={v} className={settings.dailyGoal === v ? 'on' : ''} onClick={() => updateSettings({ dailyGoal: v })}>{t}</button>
          ))}
        </div>
        <p className="muted small">Every 7 days in a row earns a 🧊 streak freeze (max 2). It saves your streak if you miss a day.</p>
      </section>

      <section className="panel">
        <div className="field-label">Theme</div>
        <div className="segmented">
          {[['dark', '🌙 Dark'], ['light', '☀️ Light'], ['auto', 'Auto']].map(([v, t]) => (
            <button key={v} className={settings.theme === v ? 'on' : ''} onClick={() => updateSettings({ theme: v })}>{t}</button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="field-label">Voice</div>
        {!speechSupported ? (
          <p className="muted small">This browser can't speak. Try Chrome or Safari.</p>
        ) : (
          <>
            <select className="select" value={settings.voiceURI} onChange={(e) => updateSettings({ voiceURI: e.target.value })}>
              <option value="">Automatic (Dominican → US → Mexican Spanish)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
              ))}
            </select>
            {voices.length === 0 && <p className="muted small">No Spanish voices found yet. On Android, install one in Settings → Text-to-speech.</p>}
            <div className="row">
              <button className="btn" onClick={() => speak('¿Qué lo qué, mi pana? ¿Todo bien?', { voiceURI: settings.voiceURI })}>🔊 Test voice</button>
              <button className="btn" onClick={() => speak('¿Qué lo qué, mi pana? ¿Todo bien?', { slow: true, voiceURI: settings.voiceURI })}>🐢 Slow</button>
            </div>
          </>
        )}
      </section>

      <section className="panel">
        <div className="field-label">Install on your phone</div>
        <p className="small">
          <strong>iPhone (Safari):</strong> tap Share <span aria-hidden>⎋</span> → <em>Add to Home Screen</em>.<br />
          <strong>Android (Chrome):</strong> tap ⋮ → <em>Install app</em> (or <em>Add to Home screen</em>).<br />
          After that it opens like a normal app and works offline.
        </p>
      </section>

      <section className="panel">
        <div className="field-label">Progress</div>
        <p className="muted small">Your progress is saved on this device only.</p>
        <button className="btn btn-danger" onClick={reset}>Reset all progress</button>
      </section>
    </div>
  );
}
