'use client';

import { useState } from 'react';
import { Linkedin, Copy, Clock, CheckCircle, ExternalLink, AlertTriangle, X } from 'lucide-react';

const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.12)';
const font   = "'Plus Jakarta Sans', system-ui, sans-serif";

interface SocialPushProps {
  contentItemId: string;
  clientId: string;
  text: string;
  isLinkedInConnected: boolean;
  onClose?: () => void;
}

type Tab = 'linkedin' | 'copy' | 'schedule';

export function SocialPush({ contentItemId, clientId, text, isLinkedInConnected, onClose }: SocialPushProps) {
  const [activeTab, setActiveTab] = useState<Tab>('linkedin');
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string; url?: string } | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [editedText, setEditedText] = useState(text);

  async function handlePublishLinkedIn() {
    setPublishing(true);
    setResult(null);
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentItemId, platform: 'linkedin', text: editedText }),
      });
      const d = await res.json() as { success?: boolean; postUrl?: string; error?: string };
      if (d.success && d.postUrl) setResult({ type: 'success', message: 'Published to LinkedIn!', url: d.postUrl });
      else setResult({ type: 'error', message: d.error ?? 'Publish failed' });
    } catch { setResult({ type: 'error', message: 'Network error. Please try again.' }); }
    finally { setPublishing(false); }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSchedule() {
    if (!scheduleDate || !scheduleTime) return;
    setScheduling(true);
    setResult(null);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const res = await fetch('/api/social/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentItemId, clientId, platform: 'linkedin', text: editedText, scheduledAt }),
      });
      const d = await res.json() as { success?: boolean; error?: string };
      if (d.success) setResult({ type: 'success', message: `Scheduled for ${scheduleDate} at ${scheduleTime}` });
      else setResult({ type: 'error', message: d.error ?? 'Schedule failed' });
    } catch { setResult({ type: 'error', message: 'Network error. Please try again.' }); }
    finally { setScheduling(false); }
  }

  const charCount = editedText.length;
  const liMax = 3000;
  const overLimit = charCount > liMax;

  const tabs: { id: Tab; icon: React.ComponentType<{ style?: React.CSSProperties }>; label: string }[] = [
    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
    { id: 'copy',     icon: Copy,     label: 'Copy' },
    { id: 'schedule', icon: Clock,    label: 'Schedule' },
  ];

  // Min datetime for schedule (now + 5 min)
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000);
  const minDate = minDateTime.toISOString().split('T')[0];

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', fontFamily: font }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Publish Content</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 10 }}>Push your post live</span>
        </div>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}><X style={{ width: 16 }} /></button>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setResult(null); }} style={{
              flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: active ? `2px solid ${GOLD}` : '2px solid transparent',
              color: active ? GOLD : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: font, transition: 'all 150ms',
            }}>
              <Icon style={{ width: 14 }} />{tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Editable text area */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Content</span>
            <span style={{ fontSize: 11, color: overLimit ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>{charCount}/{liMax}</span>
          </div>
          <textarea value={editedText} onChange={e => setEditedText(e.target.value)} rows={8} style={{
            width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${overLimit ? '#ef4444' : BORDER}`,
            borderRadius: 10, padding: '12px 14px', color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.7,
            fontFamily: font, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          }} />
        </div>

        {/* Result banner */}
        {result && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10,
            background: result.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${result.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            display: 'flex', alignItems: 'center', gap: 10 }}>
            {result.type === 'success' ? <CheckCircle style={{ width: 15, color: '#10b981', flexShrink: 0 }} /> : <AlertTriangle style={{ width: 15, color: '#ef4444', flexShrink: 0 }} />}
            <span style={{ fontSize: 13, color: result.type === 'success' ? '#10b981' : '#ef4444', flex: 1 }}>{result.message}</span>
            {result.url && <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ color: GOLD, fontSize: 12 }}><ExternalLink style={{ width: 13 }} /></a>}
          </div>
        )}

        {/* LinkedIn tab */}
        {activeTab === 'linkedin' && (
          <div>
            {!isLinkedInConnected ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Connect LinkedIn to publish directly from ReputeOS</div>
                <a href="/api/social/linkedin/auth" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, background: '#0A66C2', color: 'white', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  <Linkedin style={{ width: 16 }} /> Connect LinkedIn
                </a>
              </div>
            ) : (
              <button onClick={handlePublishLinkedIn} disabled={publishing || overLimit} style={{
                width: '100%', padding: '13px', borderRadius: 10, cursor: publishing || overLimit ? 'not-allowed' : 'pointer',
                background: publishing ? 'rgba(10,102,194,0.3)' : '#0A66C2', color: 'white', border: 'none',
                fontSize: 14, fontWeight: 700, fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: overLimit ? 0.5 : 1,
              }}>
                <Linkedin style={{ width: 16 }} />
                {publishing ? 'Publishing…' : 'Publish to LinkedIn Now'}
              </button>
            )}
          </div>
        )}

        {/* Copy tab */}
        {activeTab === 'copy' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Copy content to paste anywhere — LinkedIn, Twitter, newsletters.</div>
            <button onClick={handleCopy} style={{
              width: '100%', padding: '13px', borderRadius: 10, cursor: 'pointer',
              background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(201,168,76,0.1)',
              color: copied ? '#10b981' : GOLD, border: `1px solid ${copied ? 'rgba(16,185,129,0.25)' : BORDER}`,
              fontSize: 14, fontWeight: 700, fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 200ms',
            }}>
              {copied ? <><CheckCircle style={{ width: 16 }} /> Copied!</> : <><Copy style={{ width: 16 }} /> Copy to Clipboard</>}
            </button>
          </div>
        )}

        {/* Schedule tab */}
        {activeTab === 'schedule' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Date</label>
                <input type="date" value={scheduleDate} min={minDate} onChange={e => setScheduleDate(e.target.value)} style={{
                  width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
                  borderRadius: 8, color: 'white', fontSize: 13, fontFamily: font, outline: 'none', boxSizing: 'border-box',
                  colorScheme: 'dark',
                }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Time</label>
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{
                  width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
                  borderRadius: 8, color: 'white', fontSize: 13, fontFamily: font, outline: 'none', boxSizing: 'border-box',
                  colorScheme: 'dark',
                }} />
              </div>
            </div>
            {!isLinkedInConnected && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#f59e0b', marginBottom: 12 }}>
                ⚠ Connect LinkedIn first for scheduled posting to work automatically.
              </div>
            )}
            <button onClick={handleSchedule} disabled={scheduling || !scheduleDate || !scheduleTime || overLimit} style={{
              width: '100%', padding: '13px', borderRadius: 10,
              cursor: scheduling || !scheduleDate || !scheduleTime ? 'not-allowed' : 'pointer',
              background: 'rgba(201,168,76,0.1)', color: GOLD, border: `1px solid ${BORDER}`,
              fontSize: 14, fontWeight: 700, fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: !scheduleDate || !scheduleTime ? 0.5 : 1,
            }}>
              <Clock style={{ width: 16 }} />
              {scheduling ? 'Scheduling…' : 'Schedule Post'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
