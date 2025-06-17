import { useState, useEffect, useCallback } from "react";
import MainLayout from "../../layouts/MainLayout";
import UserProfile from "../../components/UserProfile";
import Image from "next/image";
import { useRouter } from "next/router";
import { FaArrowLeft } from "react-icons/fa";
import EditStokModal from "./EditStokModal";
import PopupEkspor from "./PopupEkspor";

type Barang = {
  id: string;
  nama: string;
  gambar: string;
  kode: string;
  kategori: string;
  stok: number;
  hargaJual: number;
  hargaDasar: number;
};

type APIProduct = {
  id: string;
  name: string;
  image_url?: string;
  code_product?: string;
  category_id: string;
  stock: number;
  selling_price: number;
  base_price: number;
};

type Kategori = {
  id: string;
  name: string;
};

const getTokenFromLocalStorage = () => {
  if (typeof window === "undefined") return "";
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) return "";
  try {
    return JSON.parse(currentUser)?.token || "";
  } catch {
    return "";
  }
};

const StokBarang = () => {
  const router = useRouter();
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null);
  const [showPopupEkspor, setShowPopupEkspor] = useState(false);
  const itemsPerPage = 8;

  const fetchData = useCallback(async () => {
    const token = getTokenFromLocalStorage();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(
        "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/products",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      const mapped: Barang[] = json.data.map((item: APIProduct) => {
        const isFullUrl = item.image_url?.startsWith("http");
        return {
          id: item.id,
          nama: item.name,
          gambar: isFullUrl
            ? item.image_url
            : `https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/${item.image_url}`,
          kode: item.code_product || "-",
          kategori: item.category_id,
          stok: item.stock,
          hargaJual: item.selling_price,
          hargaDasar: item.base_price,
        };
      });
      setBarangList(mapped);
    } catch (err) {
      console.error(err);
      setBarangList([]);
    }
  }, [router]);

  const fetchKategori = useCallback(async () => {
    const token = getTokenFromLocalStorage();
    if (!token) return;

    try {
      const res = await fetch(
        "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/categories",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch categories");
      const json = await res.json();
      setKategoriList(json.data); // asumsi format response: { data: [...] }
    } catch (err) {
      console.error("Kategori error:", err);
      setKategoriList([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchKategori();
  }, [fetchData, fetchKategori]);

  const filtered = barangList.filter((b) =>
    b.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getKategoriName = (id: string): string => {
    const kategori = kategoriList.find((k) => k.id === id);
    return kategori ? kategori.name : "Tidak Diketahui";
  };

  const renderPagination = () => {
    const maxVisible = 5;
    const start = Math.max(
      1,
      Math.min(currentPage - Math.floor(maxVisible / 2), totalPages - maxVisible + 1)
    );
    const end = Math.min(start + maxVisible - 1, totalPages);
    const pages = [];

    pages.push(
      <button
        key="prev"
        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="border px-3 py-1 rounded-lg hover:bg-gray-200 disabled:opacity-50"
      >
        &lt;
      </button>
    );

    if (start > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className={`border px-3 py-1 rounded-lg ${
            currentPage === 1 ? "bg-blue-500 text-white" : "hover:bg-gray-100"
          }`}
        >
          1
        </button>
      );
      if (start > 2) pages.push(<span key="start-ell" className="px-2">...</span>);
    }

    for (let p = start; p <= end; p++) {
      pages.push(
        <button
          key={p}
          onClick={() => setCurrentPage(p)}
          className={`border px-3 py-1 rounded-lg ${
            currentPage === p ? "bg-blue-500 text-white" : "hover:bg-gray-100"
          }`}
        >
          {p}
        </button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push(<span key="end-ell" className="px-2">...</span>);
      pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={`border px-3 py-1 rounded-lg ${
            currentPage === totalPages ? "bg-blue-500 text-white" : "hover:bg-gray-100"
          }`}
        >
          {totalPages}
        </button>
      );
    }

    pages.push(
      <button
        key="next"
        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="border px-3 py-1 rounded-lg hover:bg-gray-200 disabled:opacity-50"
      >
        &gt;
      </button>
    );

    return <div className="flex justify-center items-center p-4 text-sm text-gray-500 gap-2">{pages}</div>;
  };

  const handleEditClick = (b: Barang) => {
    setSelectedBarang(b);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (kode: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus barang ini?")) return;
    const token = getTokenFromLocalStorage();
    if (!token) {
      alert("Silakan login ulang");
      router.push("/login");
      return;
    }
    const b = barangList.find((x) => x.kode === kode);
    if (!b) return alert("Barang tidak ditemukan");

    try {
      const res = await fetch(
        `https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/products/${b.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.meta?.message || "Error");
      alert("Terhapus");
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Gagal hapus");
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between p-6 w-[96%] mx-auto">
          <div className="flex items-center gap-3">
            <FaArrowLeft className="text-gray-500 cursor-pointer text-xl" onClick={() => router.push("/manajemen")} />
            <h1 className="text-2xl font-bold">Stok Barang</h1>
          </div>
          <UserProfile />
        </div>

        <div className="w-[96%] mx-auto border-b border-gray-300 mt-3"></div>

        <div className="flex justify-between items-center px-6 mt-4 w-[96%] mx-auto">
          <button
            onClick={() => setShowPopupEkspor(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Export & Import Data
          </button>
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3 w-80">
            <Image src="/icons/search.svg" alt="Search" width={20} height={20} className="mr-3" />
            <input
              type="text"
              placeholder="Cari barang.."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full outline-none bg-transparent text-gray-600"
            />
          </div>
        </div>

        <div className="flex-grow overflow-auto p-6">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-blue-500 text-white">
                  <th className="p-3 border">Gambar</th>
                  <th className="p-3 border">Nama</th>
                  <th className="p-3 border">Kode</th>
                  <th className="p-3 border">Kategori</th>
                  <th className="p-3 border">Stok</th>
                  <th className="p-3 border">Harga Jual</th>
                  <th className="p-3 border">Harga Dasar</th>
                  <th className="p-3 border">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((b, i) => (
                  <tr key={i} className="border">
                    <td className="p-3 border">
                      <Image src={b.gambar} alt={b.nama} width={50} height={50} unoptimized className="rounded-md" />
                    </td>
                    <td className="p-3 border">{b.nama}</td>
                    <td className="p-3 border">{b.kode}</td>
                    <td className="p-3 border">{getKategoriName(b.kategori)}</td>
                    <td className="p-3 border">{b.stok}</td>
                    <td className="p-3 border">Rp {b.hargaJual.toLocaleString()}</td>
                    <td className="p-3 border">Rp {b.hargaDasar.toLocaleString()}</td>
                    <td className="p-3 border">
                      <span onClick={() => handleEditClick(b)} className="text-green-500 cursor-pointer mr-2 hover:text-green-700">Edit</span>
                      <span onClick={() => handleDeleteClick(b.kode)} className="text-red-500 cursor-pointer hover:text-red-700">Hapus</span>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-5 text-center text-gray-400 border">Data tidak ditemukan</td>
                  </tr>
                )}
              </tbody>
            </table>
            {renderPagination()}
          </div>
        </div>

        <EditStokModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} barang={selectedBarang} onSave={() => fetchData()} />
        <PopupEkspor isOpen={showPopupEkspor} onClose={() => setShowPopupEkspor(false)} />
      </div>
    </MainLayout>
  );
};

export default StokBarang;
