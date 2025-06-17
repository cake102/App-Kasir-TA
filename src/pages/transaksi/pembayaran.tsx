// src/pages/transaksi/pembayaran.tsx

import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import MainLayout from "../../layouts/MainLayout";
import UserProfile from "../../components/UserProfile";
import PopupSukses from "@/components/PopupSukses";

type ItemType = {
  nama: string;
  jumlah: number;
  hargaJual: number;
};

type BarangType = {
  id: number;
  name: string;
};

type TransaksiType = {
  id: string;
  waktuOrder: string;
  waktuBayar: string;
  outlet: string;
  barangList: ItemType[];
  total: number;
  metode: string;
};

const formatRupiah = (angka: string): string => {
  const numericValue = parseInt(angka.replace(/\D/g, ""), 10);
  if (isNaN(numericValue)) return "Rp 0";
  return "Rp " + numericValue.toLocaleString("id-ID");
};

const Pembayaran = () => {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<ItemType[]>([]);
  const [totalHarga, setTotalHarga] = useState(0);
  const [inputPembayaran, setInputPembayaran] = useState("");
  const [metodePembayaran, setMetodePembayaran] = useState("Cash");
  const [showPopupSukses, setShowPopupSukses] = useState(false);
  const [kembalian, setKembalian] = useState<number | null>(null);
  const [lastTransaksi, setLastTransaksi] = useState<TransaksiType | null>(null);
  const [barangList, setBarangList] = useState<BarangType[]>([]);

  useEffect(() => {
    if (router.query.data) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(router.query.data as string));
        setSelectedItems(decodedData);
        setTotalHarga(Number(router.query.total));
      } catch {
        alert("Data transaksi tidak valid.");
      }
    }
  }, [router.query]);

  useEffect(() => {
    const fetchBarangList = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(
          "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/products",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Gagal mengambil data barang");

        const data = await res.json();
        setBarangList(data.data);
      } catch (err) {
        console.error("Gagal ambil barang dari API:", err);
      }
    };

    fetchBarangList();
  }, []);

  const handleBayar = useCallback(async () => {
    const cashGiven = parseFloat(inputPembayaran) || 0;
    const isQRIS = metodePembayaran === "QRIS";

    if (!isQRIS && cashGiven < totalHarga) {
      alert("Uang yang diberikan kurang!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const products = [];

      for (const item of selectedItems) {
        const barang = barangList.find((b) => b.name === item.nama);

        if (!barang || typeof barang.id !== "number") {
          alert(`Produk '${item.nama}' tidak ditemukan dalam database.`);
          return;
        }

        products.push({
          product_id: barang.id,
          quantity: item.jumlah,
        });
      }

      const payload = {
        products,
        balance: isQRIS ? totalHarga : cashGiven,
        payment_method: isQRIS ? "qris" : "cash",
        notes: isQRIS ? "Pembayaran via QRIS (manual)" : "",
      };

      const response = await fetch(
        "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || data.meta?.status !== "success") {
        throw new Error(data.meta?.message || "Gagal membuat transaksi");
      }

      setKembalian(isQRIS ? 0 : cashGiven - totalHarga);

      const transaksiBaru: TransaksiType = {
        id: data.data.trx_code || `TRX${Date.now()}`,
        waktuOrder: data.data.waktu_order || new Date().toLocaleString(),
        waktuBayar: data.data.waktu_bayar || new Date().toLocaleString(),
        outlet: "Outlet 1",
        barangList: selectedItems,
        total: totalHarga,
        metode: metodePembayaran,
      };

      const transaksiSebelumnya = JSON.parse(localStorage.getItem("transaksi") || "[]");
      localStorage.setItem("transaksi", JSON.stringify([transaksiBaru, ...transaksiSebelumnya]));

      setLastTransaksi(transaksiBaru);
      setShowPopupSukses(true);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Transaksi gagal:", err.message);
        alert(err.message);
      } else {
        console.error("Transaksi gagal:", err);
        alert("Terjadi kesalahan saat membuat transaksi.");
      }
    }
  }, [inputPembayaran, selectedItems, totalHarga, metodePembayaran, barangList]);

  const handleInput = useCallback(
    (value: string) => {
      if (value === "C") {
        setInputPembayaran("");
      } else if (value === "Backspace" || value === "←") {
        setInputPembayaran((prev) => prev.slice(0, -1));
      } else if (value === "✔") {
        handleBayar();
      } else if (/^[0-9.]$/.test(value) || value === "00") {
        setInputPembayaran((prev) => prev + value);
      }
    },
    [handleBayar]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleInput("✔");
      } else if (e.key === "Backspace") {
        handleInput("Backspace");
      } else if (/^[0-9]$/.test(e.key)) {
        handleInput(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleInput]);

  return (
    <MainLayout>
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/transaksi")}>
            <span className="text-2xl">&larr;</span>
            <h1 className="text-2xl font-bold">Kembali</h1>
          </div>
          <UserProfile />
        </div>

        <div className="flex flex-grow p-6 gap-6">
          <div className="w-1/2 bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-bold mb-3">List Barang</h2>
            <ul>
              {selectedItems.map((item) => (
                <li key={item.nama} className="flex justify-between items-center py-2 border-b">
                  <div className="font-medium">{item.nama} x {item.jumlah}</div>
                  <div>{formatRupiah((item.hargaJual * item.jumlah).toString())}</div>
                </li>
              ))}
            </ul>
            <div className="text-right mt-4 text-xl font-bold">
              Total: {formatRupiah(totalHarga.toString())}
            </div>
          </div>

          <div className="w-1/2 bg-white shadow-md rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-3">Metode Pembayaran</h2>
              <select
                className="w-full border p-2 rounded mb-4"
                value={metodePembayaran}
                onChange={(e) => setMetodePembayaran(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="QRIS">QRIS</option>
              </select>

              <h2 className="text-lg font-bold mb-3">Input Pembayaran</h2>
              <input
                type="text"
                inputMode="numeric"
                className="w-full border p-2 text-xl rounded mb-4 text-right"
                placeholder="0"
                value={formatRupiah(inputPembayaran)}
                readOnly
              />

              <div className="grid grid-cols-3 gap-2 mb-4">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "←"].map((val) => (
                  <button
                    key={val}
                    className="p-4 text-lg font-semibold bg-gray-200 hover:bg-gray-300 rounded"
                    onClick={() => handleInput(val)}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <button
                className="w-full bg-green-600 text-white py-3 text-xl rounded hover:bg-green-700"
                onClick={handleBayar}
              >
                Bayar
              </button>
            </div>

            {kembalian !== null && metodePembayaran === "Cash" && (
              <div className="mt-4 text-xl text-right font-semibold text-green-700">
                Kembalian: {formatRupiah(kembalian.toString())}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPopupSukses && lastTransaksi && (
        <PopupSukses
          transaksi={lastTransaksi}
          kembalian={kembalian}
          onClose={() => {
            setShowPopupSukses(false);
            router.push("/transaksi");
          }}
        />
      )}
    </MainLayout>
  );
};

export default Pembayaran;
