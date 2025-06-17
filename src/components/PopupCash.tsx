import React, { useState } from "react";

// ✅ Tipe props untuk komponen ini
interface PopupCashProps {
  totalHarga: number;
  onClose: () => void;
  onSuccess: (kembalian: number | null) => void;
}

const PopupCash: React.FC<PopupCashProps> = ({ totalHarga, onClose, onSuccess }) => {
  const [inputPembayaran, setInputPembayaran] = useState<string>("");

  const handleKonfirmasi = () => {
    const cashGiven = parseFloat(inputPembayaran) || 0;

    if (cashGiven < totalHarga) {
      alert("❌ Uang yang diberikan kurang!");
    } else {
      const kembali = cashGiven - totalHarga;
      setTimeout(() => {
        onSuccess(kembali === 0 ? null : kembali); // Bisa null jika tidak ada kembalian
        onClose();
      }, 500);
    }
  };

  if (totalHarga <= 0) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96">
        <h2 className="text-lg font-bold mb-4">Masukkan Uang Cash</h2>

        <p className="mb-2 text-sm text-gray-600">Total yang harus dibayar:</p>
        <div className="text-2xl font-semibold text-blue-600 mb-4">
          Rp {totalHarga.toLocaleString("id-ID")}
        </div>

        <input
          type="number"
          className="w-full p-2 border rounded-lg text-center"
          placeholder="Jumlah uang yang dibayarkan"
          value={inputPembayaran}
          onChange={(e) => setInputPembayaran(e.target.value)}
        />

        <button
          className="mt-4 bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg w-full transition"
          onClick={handleKonfirmasi}
        >
          Konfirmasi Pembayaran
        </button>

        <button
          className="mt-2 bg-gray-300 hover:bg-gray-400 text-black p-2 rounded-lg w-full transition"
          onClick={onClose}
        >
          Batal
        </button>
      </div>
    </div>
  );
};

export default PopupCash;
