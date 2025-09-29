import React, { useRef, useState } from 'react';
import { api } from '../api';

export default function AvatarUploader({ value, onChange, isDarkMode, label = 'รูปโปรไฟล์' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const pick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(''); setUploading(true);
    try {
      const data = await api.uploadAvatar(file);     // /api/upload-avatar
      onChange?.({ image_url: data.url, thumb_url: data.thumb_url });
    } catch (error) {
      setErr(error?.message || 'อัปโหลดไม่สำเร็จ');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 shrink-0">
          {value?.image_url ? <img src={value.image_url} alt="avatar" className="w-full h-full object-cover" />
                            : <div className="w-full h-full grid place-items-center text-xs text-gray-500">ไม่มีรูป</div>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={pick} disabled={uploading}
            className={`px-3 py-2 rounded-lg border ${isDarkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} disabled:opacity-60`}>
            {uploading ? 'กำลังอัปโหลด...' : 'เลือกรูป'}
          </button>
          {value?.image_url && (
            <button type="button" onClick={() => onChange?.({ image_url: null, thumb_url: null })}
              className={`px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
              ลบรูป
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
