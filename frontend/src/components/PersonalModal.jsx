import React, { useEffect, useState } from 'react';
import EditModal from './EditModal';
import { API_BASE } from '../api';

export const PersonalModal = ({ data, isOpen, onClose, onEdit, onDelete, isDarkMode }) => {
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => (document.body.style.overflow = 'unset');
  }, [isOpen]);

  useEffect(() => { if (!isOpen) setShowEditor(false); }, [isOpen, data?.id]);
  if (!isOpen || !data) return null;

  const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
  const email = data.email || '-';
  const phone = data.phone_number || '-';
  const studentId = data.student_id || '-';
  const gender = toThaiGender(data.gender);

  const dobDate = parseDOBThaiAware(data.dob);
  const dobText = dobDate ? formatThaiDate(dobDate) : '-';
  const age = dobDate ? calcAge(dobDate) : null;
  const dobBadgeText = dobDate ? `${dobText} (อายุ ${age} ปี)` : '-';

  const weight = data.weight_kg != null ? `${data.weight_kg} กก.` : '-';
  const height = data.height_cm != null ? `${data.height_cm} ซม.` : '-';
  const social = data.social_url || '';

  const handleUpdated = (updated) => { onEdit?.(updated); setShowEditor(false); onClose?.(); };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl`}>
          <div className="relative p-8 pb-6">
            <button onClick={onClose}
              className={`absolute right-0 top-0 p-3 rounded-full ${isDarkMode ? 'hover:bg-red-600 text-gray-400 hover:text-white' : 'hover:bg-red-100 text-gray-500 hover:text-red-600'}`}
              aria-label="Close">
              <span className="text-xl">❌</span>
            </button>

            <div className="flex items-start gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-purple-500/30 bg-gray-200">
                  {data.image_url ? (
                    <img src={resolveImageUrl(data.image_url)} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-gray-500">ไม่มีรูป</div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">🎭 {name} ✨</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge isDarkMode={isDarkMode} icon="🎓" text={`รหัส: ${studentId}`} />
                  <Badge isDarkMode={isDarkMode} icon="🧿" text={`เพศ: ${gender}`} />
                  <Badge isDarkMode={isDarkMode} icon="🎂" text={dobBadgeText} />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setShowEditor(true)}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full font-bold transition hover:brightness-110">
                    <span className="text-lg">✏️</span><span>แก้ไข</span>
                  </button>
                  <button onClick={() => onDelete?.(data.id)}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold transition hover:brightness-110">
                    <span className="text-lg">🗑️</span><span>ลบ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoTile isDarkMode={isDarkMode} icon="📧" label="อีเมล" value={email} copyable />
              <InfoTile isDarkMode={isDarkMode} icon="📱" label="โทรศัพท์" value={phone} copyable />
              <InfoTile isDarkMode={isDarkMode} icon="🔗" label="โซเชียล" value={social || '-'} href={social} className="md:col-span-2" />
            </div>

            {/* Physical */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Stat isDarkMode={isDarkMode} label="น้ำหนัก" value={weight} />
              <Stat isDarkMode={isDarkMode} label="ส่วนสูง" value={height} />
            </div>
          </div>
        </div>
      </div>

      {showEditor && (
        <EditModal
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          initial={data}
          onUpdated={handleUpdated}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};

/* ---- small UI helpers ---- */
function Badge({ isDarkMode, icon, text }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold
                      ${isDarkMode ? 'bg-purple-700/30 text-purple-200' : 'bg-purple-100 text-purple-700'}`} title={text}>
      <span>{icon}</span><span className="truncate">{text}</span>
    </span>
  );
}
function InfoTile({ isDarkMode, icon, label, value, href, copyable, className = '' }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e) => { 
    e.preventDefault(); 
    try { 
      await navigator.clipboard.writeText(String(value ?? '')); 
      setCopied(true); 
      setTimeout(()=>setCopied(false), 1200);
    } catch { 
      // Clipboard write failed; optionally handle error or log
    } 
  };
  const body = (
    <div className={`flex items-center justify-between gap-3 p-4 rounded-2xl ${isDarkMode ? 'bg-purple-700/40' : 'bg-purple-50'} ${className}`} title={String(value||'')}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl">{icon}</span>
        <div className="min-w-0">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</p>
          <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>{value}</p>
        </div>
      </div>
      {copyable && value ? (
        <button onClick={copy}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-white text-gray-700 border-gray-200'}`}>
          {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
        </button>
      ) : null}
    </div>
  );
  if (href && href.startsWith('http')) return <a href={href} target="_blank" rel="noopener noreferrer" className="block">{body}</a>;
  return body;
}
function Stat({ isDarkMode, label, value }) {
  return (
    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'border-gray-700 bg-gray-800/60 text-gray-200' : 'border-gray-200 bg-white/60 text-gray-800'}`}>
      <div className="text-[11px] opacity-70">{label}</div><div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

/* ---- logic helpers ---- */
function toThaiGender(g) { if (g==='male') return 'ชาย'; if (g==='female') return 'หญิง'; return 'อื่น ๆ'; }

function resolveImageUrl(u) {
  if (!u) return '';
  if (u.startsWith('/')) return `${API_BASE}${u}`;
  return u;
}

function parseDOBThaiAware(dob) {
  if (!dob) return null;
  if (dob instanceof Date) return isNaN(dob.getTime()) ? null : dob;
  const s = String(dob).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    let y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    if (y > 2400) y -= 543;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}
function formatThaiDate(date){ 
  try { return new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',year:'numeric'}).format(date);} 
  catch { const dd=String(date.getUTCDate()).padStart(2,'0'); const mm=String(date.getUTCMonth()+1).padStart(2,'0'); const yyyy=date.getUTCFullYear(); return `${dd}/${mm}/${yyyy+543}`; } 
}
function calcAge(b){ const t=new Date(); let a=t.getFullYear()-b.getUTCFullYear(); const m=t.getMonth()-b.getUTCMonth(); const d=t.getDate()-b.getUTCDate(); if(m<0||(m===0&&d<0)) a--; return a<0?0:a; }
