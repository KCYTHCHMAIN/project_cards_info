import React from 'react';
import { API_BASE } from '../api';

export const PersonalCard = ({ data, onDoubleClick, isDarkMode }) => {
  const name = `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
  const email = data?.email || '-';
  const phone = data?.phone_number || '-';
  const studentId = data?.student_id || '-';
  const gender = toThaiGender(data?.gender);

  const dobDate = parseDOBThaiAware(data?.dob);
  const dobText = dobDate ? formatThaiDate(dobDate) : null;
  const age = dobDate ? calcAge(dobDate) : null;

  const weight = data?.weight_kg ?? null;
  const height = data?.height_cm ?? null;
  const social = data?.social_url || '';

  return (
    <div
      className={`
        relative group cursor-pointer transition-all duration-500 ease-out w/full
        ${isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/95 to-gray-700/95 shadow-2xl shadow-purple-900/40' 
          : 'bg-gradient-to-br from-white/95 to-blue-50/95 shadow-2xl shadow-purple-200/60'
        }
        backdrop-blur-sm rounded-3xl p-6 border-2 min-h-[420px]
        ${isDarkMode ? 'border-purple-700/50' : 'border-purple-200/50'}
        overflow-hidden
      `}
      onDoubleClick={() => onDoubleClick?.(data)}
    >
      <div className="relative z-10">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-purple-500/30 bg-gray-200">
              {data?.image_url ? (
                <img src={resolveImageUrl(data.image_url)} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-gray-500">ไม่มีรูป</div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>{name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge isDarkMode={isDarkMode} icon="🎓" text={`รหัส: ${studentId}`} />
              <Badge isDarkMode={isDarkMode} icon="🧿" text={`เพศ: ${gender}`} />
              {dobText && <Badge isDarkMode={isDarkMode} icon="🎂" text={age != null ? `${dobText} (อายุ ${age} ปี)` : dobText} />}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Row isDarkMode={isDarkMode} icon="📧" text={email} truncate />
          <Row isDarkMode={isDarkMode} icon="📱" text={phone} />
          <Row isDarkMode={isDarkMode} icon="🔗" text={social || '-'} truncate />
        </div>

        <div className={`my-4 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

        <div className="grid grid-cols-2 gap-3">
          <Stat isDarkMode={isDarkMode} label="น้ำหนัก" value={weight != null ? `${weight} กก.` : '-'} />
          <Stat isDarkMode={isDarkMode} label="ส่วนสูง" value={height != null ? `${height} ซม.` : '-'} />
        </div>

        <div className={`text-xs mt-4 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          ✨ Double-click เพื่อดูรายละเอียด
        </div>
      </div>
    </div>
  );
};

/* ---------- small presentational helpers ---------- */
function Row({ isDarkMode, icon, text, truncate }) {
  return (
    <div className={`flex items-center space-x-2 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
      <span>{icon}</span>
      <span className={truncate ? 'truncate' : ''}>{text}</span>
    </div>
  );
}
function Badge({ isDarkMode, icon, text }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold
                      ${isDarkMode ? 'bg-purple-700/30 text-purple-200' : 'bg-purple-100 text-purple-700'}`} title={text}>
      <span>{icon}</span><span className="truncate">{text}</span>
    </span>
  );
}
function Stat({ isDarkMode, label, value }) {
  return (
    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'border-gray-700 bg-gray-800/60 text-gray-200' : 'border-gray-200 bg-white/60 text-gray-800'}`}>
      <div className="text-[11px] opacity-70">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

/* ---------- logic helpers: date & image ---------- */
function toThaiGender(g) { if (g === 'male') return 'ชาย'; if (g === 'female') return 'หญิง'; return 'อื่น ๆ'; }

function resolveImageUrl(u) {
  if (!u) return '';
  if (u.startsWith('/')) return `${API_BASE}${u}`; // เสิร์ฟรูปจาก backend port 5000
  return u; // เป็น URL เต็มอยู่แล้ว
}

// รองรับปี พ.ศ. ถ้าเจอ YYYY>2400 จะลบ 543 ให้เป็น ค.ศ.
function parseDOBThaiAware(dob) {
  if (!dob) return null;
  if (dob instanceof Date) return isNaN(dob.getTime()) ? null : dob;
  const s = String(dob).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    let y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    if (y > 2400) y -= 543;                 // พ.ศ. -> ค.ศ.
    const dt = new Date(Date.UTC(y, mo - 1, d)); // ใช้ UTC กัน timezone เพี้ยน
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}
function formatThaiDate(date) {
  try {
    return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  } catch {
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = date.getUTCFullYear();
    return `${dd}/${mm}/${yyyy + 543}`;
  }
}
function calcAge(birthDate) {
  const t = new Date();
  let age = t.getFullYear() - birthDate.getUTCFullYear();
  const m = t.getMonth() - birthDate.getUTCMonth();
  const d = t.getDate() - birthDate.getUTCDate();
  if (m < 0 || (m === 0 && d < 0)) age--;
  return age < 0 ? 0 : age;
}
