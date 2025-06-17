import React, { useState, useEffect } from "react";
import Image from "next/image";

// ✅ Definisi tipe item
interface Item {
  nama: string;
  hargaJual: number;
  jumlah: number;
}

// ✅ Props untuk EditItemModal
interface EditItemModalProps {
  item: Item | null; // Boleh null saat belum ada item yang dipilih
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [jumlah, setJumlah] = useState<number>(1);

  useEffect(() => {
    if (item) {
      setJumlah(item.jumlah || 1);
    }
  }, [item]);

  // ❌ Jangan render modal jika tidak terbuka atau tidak ada item
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[400px] p-6">
        {/* 🔹 Header */}
        <h2 className="text-xl font-bold text-center mb-4">Edit Item</h2>

        {/* 🔹 Informasi Barang */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/box.svg"
              alt={item.nama}
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="font-semibold">{item.nama}</span>
          </div>
          <span className="text-lg font-semibold">
            Rp {item.hargaJual.toLocaleString()}
          </span>
        </div>

        {/* 🔹 Kontrol Jumlah Barang */}
        <div className="flex justify-center items-center my-6 gap-4">
          <button
            className="bg-gray-200 w-10 h-10 flex items-center justify-center text-2xl rounded-lg"
            onClick={() => setJumlah((prev) => (prev > 1 ? prev - 1 : 1))}
          >
            −
          </button>
          <span className="text-2xl font-bold">{jumlah}</span>
          <button
            className="bg-gray-200 w-10 h-10 flex items-center justify-center text-2xl rounded-lg"
            onClick={() => setJumlah((prev) => prev + 1)}
          >
            +
          </button>
        </div>

        {/* 🔹 Tombol Aksi */}
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 border border-gray-400 rounded-lg"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => onSave({ ...item, jumlah })}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;
