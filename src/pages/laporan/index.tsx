import MainLayout from "../../layouts/MainLayout";
import UserProfile from "../../components/UserProfile";
import { useState, useEffect, useCallback } from "react";
import PopupEkspor from "./PopupEkspor";
import Image from "next/image";

// Types
type TransactionDetail = {
  product: {
    name: string;
  };
  qty: number;
};

type Transaction = {
  trx_code: string;
  waktu_order: string;
  waktu_bayar: string;
  amount: number;
  payment_method: string;
  details: TransactionDetail[];
  total: number;
  tanggal: string;
  bulan: string;
};

type RawTransaction = {
  trx_code: string;
  waktu_order: string;
  waktu_bayar: string;
  amount: string | number;
  payment_method: string;
  details: TransactionDetail[];
};

const Laporan = () => {
  const [data, setData] = useState<Transaction[]>([]);
  const [filteredData, setFilteredData] = useState<Transaction[]>([]);
  const [totalPenjualan, setTotalPenjualan] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [showPopupEkspor, setShowPopupEkspor] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAll, setShowAll] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [filterMode, setFilterMode] = useState<"date" | "month">("date");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const parseAmount = (amountStr: string | number): number => {
    if (typeof amountStr === "number") return amountStr;
    if (typeof amountStr !== "string") return 0;

    const cleaned = amountStr
      .replace(/Rp\s?/gi, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");

    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : Math.round(value);
  };

  const fetchTransactions = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("currentUser") || "{}").token || ""
        : "";

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch("/api/proxy-transactions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Gagal ambil data:", await res.text());
        return;
      }

      const json = await res.json();

      if (!json.data || !Array.isArray(json.data)) {
        console.error("Struktur data tidak valid:", json);
        return;
      }

      const transactions: Transaction[] = json.data.map((trx: RawTransaction) => {
        const waktuOrder = new Date(trx.waktu_order);
        return {
          ...trx,
          total: parseAmount(trx.amount),
          tanggal: waktuOrder.toLocaleDateString("en-CA"),
          bulan: waktuOrder.toISOString().slice(0, 7),
        };
      });

      setData(transactions);
    } catch (err) {
      console.error("Terjadi error saat fetch transaksi:", err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    let filteredBy: Transaction[] = [];

    if (showAll) {
      filteredBy = data;
    } else if (filterMode === "month" && selectedMonth) {
      filteredBy = data.filter((trx) => trx.bulan === selectedMonth);
    } else {
      filteredBy = data.filter((trx) => trx.tanggal === selectedDate);
    }

    setFilteredData(filteredBy);
    setCurrentPage(1);
    const total = filteredBy.reduce((sum, trx) => sum + trx.total, 0);
    setTotalPenjualan(total);
    setTotalTransaksi(filteredBy.length);
  }, [data, selectedDate, selectedMonth, showAll, filterMode]);

  const renderPagination = () => {
    const maxVisiblePages = 5;
    const pages = [];

    const startPage = Math.max(
      1,
      Math.min(currentPage - Math.floor(maxVisiblePages / 2), totalPages - maxVisiblePages + 1)
    );
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    pages.push(
      <button key="prev" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded">
        &lt;
      </button>
    );

    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded ${currentPage === page ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
          {page}
        </button>
      );
    }

    pages.push(
      <button key="next" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-200 rounded">
        &gt;
      </button>
    );

    return <div className="flex justify-center mt-4 space-x-1 flex-wrap">{pages}</div>;
  };

  const monthOptions = [
    "2025-01", "2025-02", "2025-03", "2025-04", "2025-05",
    "2025-06", "2025-07", "2025-08", "2025-09", "2025-10",
    "2025-11", "2025-12"
  ];

  return (
    <MainLayout>
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between p-6">
          <h1 className="text-2xl font-bold">Laporan Transaksi</h1>
          <UserProfile />
        </div>

        <div className="flex flex-wrap gap-6 items-center px-6 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-lg font-semibold">Mode Filter:</label>
            <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as "date" | "month")} className="p-2 border rounded-lg">
              <option value="date">Per Tanggal</option>
              <option value="month">Per Bulan</option>
            </select>
          </div>

          {filterMode === "date" && (
            <div className="flex items-center gap-2">
              <label className="text-lg font-semibold">Pilih Tanggal:</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-2 border rounded-lg" disabled={showAll} />
            </div>
          )}

          {filterMode === "month" && (
            <div className="flex items-center gap-2">
              <label className="text-lg font-semibold">Pilih Bulan:</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 border rounded-lg" disabled={showAll}>
                <option value="">-- Pilih Bulan --</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {new Date(month + "-01").toLocaleString("id-ID", {
                      month: "long",
                      year: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="showAll" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="w-5 h-5" />
            <label htmlFor="showAll" className="text-lg font-semibold cursor-pointer">Tampilkan Semua Transaksi</label>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-6">
          <div className="bg-white shadow-md p-4 rounded-lg">
            <p className="text-gray-500">Total Penjualan</p>
            <h2 className="text-2xl font-bold">Rp {totalPenjualan.toLocaleString()}</h2>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <p className="text-gray-500">Total Transaksi</p>
            <h2 className="text-2xl font-bold">{totalTransaksi}</h2>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <p className="text-gray-500">Total Pembayaran</p>
            <h2 className="text-2xl font-bold">Rp {totalPenjualan.toLocaleString()}</h2>
          </div>
        </div>

        <div className="flex justify-end px-6">
          <button onClick={() => setShowPopupEkspor(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Image src="/icons/export.svg" alt="Export" width={20} height={20} />
            Ekspor Laporan
          </button>
        </div>

        <div className="p-6 bg-white shadow-md rounded-lg mt-4 overflow-auto max-h-[800px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Kode Transaksi</th>
                <th className="p-3 text-left">Waktu Order</th>
                <th className="p-3 text-left">Waktu Bayar</th>
                <th className="p-3 text-left">Barang</th>
                <th className="p-3 text-left">Total Penjualan (Rp.)</th>
                <th className="p-3 text-left">Metode Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((trx, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3">{trx.trx_code}</td>
                    <td className="p-3">{trx.waktu_order}</td>
                    <td className="p-3">{trx.waktu_bayar}</td>
                    <td className="p-3">
                      <ul className="list-disc pl-4">
                        {trx.details.map((item, i) => (
                          <li key={i}>{item.product.name} x{item.qty}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-3">Rp {trx.total.toLocaleString()}</td>
                    <td className="p-3">{trx.payment_method}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">Data tidak tersedia</td>
                </tr>
              )}
            </tbody>
          </table>
          {renderPagination()}
        </div>

        {/* Popup ekspor */}
        <PopupEkspor
          isOpen={showPopupEkspor}
          onClose={() => setShowPopupEkspor(false)}
          dataTransaksi={filteredData}
        />
      </div>
    </MainLayout>
  );
};

export default Laporan;
