import { FaTimes } from "react-icons/fa";
import { useEffect, useState } from "react";

interface EditKategoriModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kategoriLama: string, kategoriBaru: string) => void;
  kategoriLama: string | null;
}

const EditKategoriModal: React.FC<EditKategoriModalProps> = ({
  isOpen,
  onClose,
  onSave,
  kategoriLama,
}) => {
  const [kategoriBaru, setKategoriBaru] = useState("");

  useEffect(() => {
    if (kategoriLama) setKategoriBaru(kategoriLama);
  }, [kategoriLama]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kategoriLama && kategoriBaru.trim()) {
      onSave(kategoriLama, kategoriBaru.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
        
        {/* 🔹 Header Modal */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Kategori</h2>
          <FaTimes className="text-gray-500 cursor-pointer" onClick={onClose} />
        </div>

        {/* 🔹 Garis Pembatas */}
        <div className="border-t border-gray-300 my-4"></div>

        {/* 🔹 Form Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="text-sm font-medium">Nama Kategori Baru</label>
          <input 
            type="text" 
            value={kategoriBaru} 
            onChange={(e) => setKategoriBaru(e.target.value)} 
            placeholder="Masukkan nama baru.." 
            className="w-full p-2 border rounded-md bg-gray-100"
          />

          {/* 🔹 Tombol Simpan */}
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white p-3 rounded-lg mt-3 hover:bg-blue-600"
          >
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditKategoriModal;