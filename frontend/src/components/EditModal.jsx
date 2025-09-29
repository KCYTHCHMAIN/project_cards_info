import React, { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import { api, API_BASE } from '../api';

function resolveImageUrl(u) {
  if (!u) return '';
  return u.startsWith('/') ? `${API_BASE}${u}` : u;
}

export const EditModal = ({ isOpen, onClose, initial, onUpdated, isDarkMode }) => {
  const fileRef = useRef(null);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [form, setForm] = useState({
    id: null, first_name: '', last_name: '', student_id: '', email: '', phone_number: '', gender: '',
    dob: '', social_url: '', weight_kg: '', height_cm: '', image_url: ''
  });

  // lock scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => (document.body.style.overflow = 'unset');
  }, [isOpen]);

  // cleanup blob url
  useEffect(() => () => {
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  // hydrate when open
  useEffect(() => {
    if (!isOpen || !initial) return;
    const safeDob = typeof initial.dob === 'string' ? initial.dob.slice(0, 10)
                   : initial.dob ? new Date(initial.dob).toISOString().slice(0, 10) : '';
    setForm({
      id: initial.id ?? initial.ID ?? null,
      first_name: initial.first_name ?? '',
      last_name: initial.last_name ?? '',
      student_id: initial.student_id ?? '',
      email: initial.email ?? '',
      phone_number: initial.phone_number ?? '',
      gender: initial.gender ?? '',
      dob: safeDob,
      social_url: initial.social_url ?? '',
      weight_kg: initial.weight_kg ?? '',
      height_cm: initial.height_cm ?? '',
      image_url: initial.image_url ?? ''
    });
    setAvatarPreview(''); setUploadedUrl(''); setServerError('');
  }, [isOpen, initial]);

  if (!isOpen || !initial) return null;

  const themeBase = 'rounded-xl border px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const theme = isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300 focus:border-blue-400'
                           : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500';

  const setField = (k, v) => { setForm((f) => ({ ...f, [k]: v })); if (serverError) setServerError(''); };
  const handlePickFile = () => fileRef.current?.click();

  const handleFileChange = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      setServerError('รองรับเฉพาะไฟล์ png, jpg, jpeg, webp, gif');
      ev.target.value = ''; return;
    }

    // preview immediately
    const blobUrl = URL.createObjectURL(file);
    setAvatarPreview(blobUrl);

    try {
      const data = await api.uploadAvatar(file); // { url:'/uploads/xxx.jpg' }
      setUploadedUrl(data.url);
      setField('image_url', data.url);
    } catch (err) {
      setServerError(err.message || 'อัปโหลดรูปไม่สำเร็จ');
      setAvatarPreview(''); setUploadedUrl('');
    } finally { ev.target.value = ''; }
  };

  const toNumberOrNull = (v) => (v === '' ? '' : String(v).replace(/[^\d.]/g, ''));

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setServerError('');

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      student_id: String(form.student_id).trim(),
      email: form.email.trim() || null,
      phone_number: form.phone_number.trim() || null,
      gender: form.gender || null,
      image_url: uploadedUrl || form.image_url || null,
      social_url: form.social_url.trim() || null,
      dob: form.dob || null,
      weight_kg: form.weight_kg === '' ? null : Number(form.weight_kg),
      height_cm: form.height_cm === '' ? null : Number(form.height_cm)
    };

    try {
      const data = await api.updateProfile(form.id, payload); // PUT /api/profiles/:id
      onUpdated?.({ id: form.id, ...payload, image_url: data.image_url ?? payload.image_url });
      onClose?.();
    } catch (err) {
      if (err.status === 409) {
        const field = err?.data?.field;
        if (field === 'student_id') setServerError('รหัสประจำตัวนี้ถูกใช้แล้ว');
        else if (field === 'email') setServerError('อีเมลนี้ถูกใช้แล้ว');
        else setServerError(err?.data?.error || 'ข้อมูลซ้ำในระบบ');
      } else {
        setServerError(err?.data?.error || err.message || 'แก้ไขไม่สำเร็จ');
      }
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
        ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
        rounded-3xl shadow-2xl`}
      >
        <div className="relative p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">แก้ไขข้อมูล</h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {serverError && <p className="mt-3 text-sm text-red-500">{serverError}</p>}
        </div>

        <form onSubmit={submit} className="p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-20 h-20">
              <div className={`w-20 h-20 rounded-full overflow-hidden ring-4 ${isDarkMode ? 'ring-gray-700' : 'ring-gray-200'}`}>
                {avatarPreview || form.image_url ? (
                  <img src={avatarPreview || resolveImageUrl(form.image_url)} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'}`}>ไม่มีรูป</div>
                )}
              </div>
              <button
                type="button"
                onClick={handlePickFile}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 text-white grid place-items-center shadow ring-4 ring-white/70"
                title="อัปโหลด/เปลี่ยนรูป"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-600'}`}><p className="font-medium">รูปโปรไฟล์</p></div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ชื่อ*" val={form.first_name} set={(v)=>setField('first_name', v)} themeBase={themeBase} theme={theme} isDarkMode={isDarkMode} />
            <Field label="นามสกุล*" val={form.last_name} set={(v)=>setField('last_name', v)} themeBase={themeBase} theme={theme} isDarkMode={isDarkMode} />
            <Field label="รหัสประจำตัว*" val={form.student_id} set={(v)=>setField('student_id', v)} themeBase={themeBase} theme={theme} isDarkMode={isDarkMode} />
            <Field label="อีเมล" val={form.email} set={(v)=>setField('email', v)} themeBase={themeBase} theme={theme} isDarkMode={isDarkMode} />
            <Field label="เบอร์โทร" val={form.phone_number} set={(v)=>setField('phone_number', v)} themeBase={themeBase} theme={theme} isDarkMode={isDarkMode} />

            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>เพศ</label>
              <select className={`${themeBase} ${theme}`} value={form.gender} onChange={(e)=>setField('gender', e.target.value)}>
                <option value="">— ไม่ระบุ —</option><option value="male">ชาย</option><option value="female">หญิง</option><option value="other">อื่น ๆ</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>วันเกิด</label>
              <input type="date" className={`${themeBase} ${theme}`} value={form.dob} onChange={(e)=>setField('dob', e.target.value)} />
            </div>

            <Field label="น้ำหนัก (กก.)" val={form.weight_kg} set={(v)=>setField('weight_kg', toNumberOrNull(v))} themeBase={themeBase} theme={theme} isDarkMode={isDarkMode} />
            <Field label="ส่วนสูง (ซม.)" val={form.height_cm} set={(v)=>setField('height_cm', toNumberOrNull(v))} themeBase={themeBase} theme={theme} isDarkMode={isDarkMode} />

            <div className="md:col-span-2">
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Facebook/Instagram URL</label>
              <input className={`${themeBase} ${theme}`} value={form.social_url} onChange={(e)=>setField('social_url', e.target.value)} placeholder="https://instagram.com/username หรือ https://facebook.com/username" />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600">ยกเลิก</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:brightness-110 disabled:opacity-50">บันทึกการแก้ไข</button>
          </div>
        </form>
      </div>
    </div>
  );
};

function Field({ label, val, set, themeBase, theme, isDarkMode }) {
  return (
    <div>
      <label className={`block text-xs mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>{label}</label>
      <input className={`${themeBase} ${theme}`} value={val} onChange={(e)=>set(e.target.value)} />
    </div>
  );
}

export default EditModal;
