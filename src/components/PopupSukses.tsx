import React, { useEffect, useCallback } from "react";

interface Item {
  nama: string;
  jumlah: number;
  hargaJual: number;
}

interface Transaksi {
  barangList: Item[];
  total: number;
  metode: string;
  waktuBayar: string;
}

interface PopupSuksesProps {
  kembalian: number | null;
  transaksi: Transaksi;
  onClose: () => void;
}

const PopupSukses: React.FC<PopupSuksesProps> = ({ kembalian, transaksi, onClose }) => {
  const handlePrint = useCallback(() => {
    if (transaksi && transaksi.barangList) {
      transaksi.barangList.forEach(item => {
        console.log(`Kurangi stok untuk ${item.nama}`);
        // Misalnya: updateStok(item.id, -item.jumlah);
      });
    }

    const printContent = document.getElementById("print-area");
    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk Pembayaran</title>
            <style>
              @media print {
                body {
                  width: 80mm;
                  font-family: monospace;
                  font-size: 12px;
                  margin: 0;
                  padding: 0;
                }
                .struk-container {
                  padding: 10px;
                }
                .struk-container h2 {
                  text-align: center;
                  font-size: 14px;
                  margin-bottom: 5px;
                }
                .struk-item {
                  display: flex;
                  justify-content: space-between;
                  margin: 2px 0;
                }
                .divider {
                  border-top: 1px dashed #000;
                  margin: 4px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 10px;
                }
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }, [transaksi]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handlePrint();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrint, onClose]);

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center w-80">
          <div className="flex justify-center">
            <svg
              className="w-16 h-16 text-green-500 animate-pulse"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          <h2 className="text-lg font-bold mt-3">Pembayaran Sukses!</h2>
          {kembalian !== null && (
            <p className="text-xl font-semibold text-green-600 mt-2">
              Kembalian: Rp {Math.max(kembalian ?? 0, 0).toLocaleString()}
            </p>
          )}

          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Print Struk
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* Area Print */}
      <div id="print-area" style={{ display: "none" }}>
        <div className="struk-container">
          <h2>Toko Aya</h2>
          <div className="divider" />
          {transaksi?.barangList?.map((item, index) => (
            <div className="struk-item" key={index}>
              <span>{item.nama} x{item.jumlah}</span>
              <span>Rp {(item.hargaJual * item.jumlah).toLocaleString()}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="struk-item">
            <strong>Total</strong>
            <strong>Rp {transaksi.total.toLocaleString()}</strong>
          </div>
          <div className="struk-item">
            <span>Metode</span>
            <span>{transaksi.metode}</span>
          </div>
          <div className="struk-item">
            <span>Waktu</span>
            <span>{transaksi.waktuBayar}</span>
          </div>
          {kembalian !== null && (
            <div className="struk-item">
              <span>Kembalian</span>
              <span>Rp {Math.max(kembalian ?? 0, 0).toLocaleString()}</span>
            </div>
          )}
          <div className="divider" />
          <p className="footer">Terima Kasih</p>
          <p className="footer">Hati-Hati Dijalan ☺️</p>
        </div>
      </div>
    </>
  );
};

export default PopupSukses;
