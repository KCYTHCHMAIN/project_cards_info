import React, { useEffect, useState } from 'react';
import { PersonalCard } from './components/PersonalCard';
import { PersonalModal } from './components/PersonalModal';
import { CreateModal } from './components/CreateModal';
import { ThemeToggle } from './components/ThemeToggle';
import { Users } from 'lucide-react';
import { listProfiles, deleteProfile } from './api';

export default function App() {
  const [data, setData] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const rows = await listProfiles();
      setData(rows);
      setError('');
    } catch (e) {
      setError(e?.data?.error || e.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCardDoubleClick = (person) => {
    setSelectedPerson(person);
  };

  const handleCloseModal = () => {
    setSelectedPerson(null);
  };

  const handleCreated = (created) => {
    setData((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
  };

  const handleEdited = (updated) => {
    setData((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) return;
    try {
      await deleteProfile(id);
      setData((prev) => prev.filter((p) => p.id !== id));
      handleCloseModal();
    } catch (e) {
      alert(e?.data?.error || e.message || 'ลบไม่สำเร็จ');
    }
  };

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
      }`}
    >
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-400'}`} />
        <div className={`absolute bottom-20 right-20 w-72 h-72 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-purple-600' : 'bg-purple-400'}`} />
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 ${isDarkMode ? 'bg-pink-600' : 'bg-pink-400'}`} />
      </div>

      <ThemeToggle isDarkMode={isDarkMode} onToggle={() => setIsDarkMode((v) => !v)} />

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20' : 'bg-gradient-to-r from-blue-100 to-purple-100'}`}>
              <span className="text-4xl">🎭</span>
            </div>
            <h1 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🌟 Classmate Directory 🌟
            </h1>
          </div>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            ✨ แสดงข้อมูลส่วนตัวในรูปแบบการ์ดที่สวยงาม พร้อมระบบจัดการที่เชื่อมต่อฐานข้อมูลจริง 🎨
          </p>
          <div className="mt-8">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center space-x-3 px-8 py-4 rounded-full font-bold text-lg
                         transition-all duration-300 transform hover:scale-110 hover:rotate-2
                         bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 
                         hover:from-purple-600 hover:via-pink-600 hover:to-blue-600
                         text-white shadow-2xl shadow-purple-500/30 hover:shadow-pink-500/40">
              <span className="text-2xl">🎉</span>
              <span>เพิ่มข้อมูลใหม่</span>
              <span className="text-2xl">✨</span>
            </button>
          </div>
        </div>

        {/* States */}
        {loading && <div className="text-center text-gray-500">กำลังโหลดข้อมูล…</div>}
        {error && !loading && <div className="text-center text-red-500">{error}</div>}

        {/* Cards */}
        {!loading && !error && (
          <>
            {data.length === 0 ? (
              <div className="text-center py-16">
                <div className={`inline-flex p-6 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <Users className={`w-12 h-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <h3 className={`text-xl font-semibold mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>ยังไม่มีข้อมูล</h3>
              </div>
            ) : (
              <div className="relative">
                {/* เดสก์ท็อป: 3 คอลัมน์ */}
                <div className="hidden md:grid grid-cols-3 gap-6">
                  {data.map((person, index) => (
                    <div key={person.id} className="duration-700" style={{ animationDelay: `${index * 80}ms` }}>
                      <PersonalCard data={person} onDoubleClick={handleCardDoubleClick} isDarkMode={isDarkMode} />
                    </div>
                  ))}
                </div>
                {/* มือถือ: แนวตั้ง */}
                <div className="md:hidden space-y-6">
                  {data.map((person, index) => (
                    <div key={person.id} className="duration-700" style={{ animationDelay: `${index * 100}ms` }}>
                      <PersonalCard data={person} onDoubleClick={handleCardDoubleClick} isDarkMode={isDarkMode} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ดูรายละเอียด / แก้ไข / ลบ */}
      <PersonalModal
        data={selectedPerson}
        isOpen={!!selectedPerson}
        onClose={handleCloseModal}
        onEdit={handleEdited}
        onDelete={handleDelete}
        isDarkMode={isDarkMode}
      />

      {/* เพิ่มข้อมูลใหม่ */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreated}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
