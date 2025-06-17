import MainLayout from "../../layouts/MainLayout";
import UserProfile from "../../components/UserProfile";
import Image from "next/image";
import { useRouter } from "next/router";
import { FaArrowLeft } from "react-icons/fa";
import TambahBarangModal from "./TambahBarangModal";
import { useState, useEffect, useCallback } from "react";

// Interface untuk penggunaan lokal dan modal
export interface Barang {
  id: number;
  nama: string;
  kategori: string;
  hargaJual: number;
  hargaDasar: number;
  stok: number;
  kode: string;
  gambar?: string | null;
}

// Interface produk sesuai respons API
interface ProdukResponse {
  id: number;
  name: string;
  code_product: string;
  stock: number;
  base_price: number;
  selling_price: number;
  category_id: number | string;
  image_url?: string;
}

const DataBarang = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProduk = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("currentUser") || "{}").token || ""
        : "";

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/products",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      const result = await response.json();

      const mappedBarang: Barang[] = (result.data as ProdukResponse[] || []).map((item, idx) => ({
        id: item.id ?? idx + Date.now(),
        nama: item.name,
        kode: item.code_product,
        stok: item.stock,
        hargaDasar: item.base_price,
        hargaJual: item.selling_price,
        kategori: String(item.category_id),
        gambar: item.image_url
          ? item.image_url.startsWith("http")
            ? item.image_url
            : `https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/${item.image_url}`
          : null,
      }));

      setBarangList(mappedBarang);
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
    }
  }, [router]);

  useEffect(() => {
    fetchProduk();
  }, [fetchProduk]);

  const handleTambahBarang = (barangBaru: Barang) => {
    setBarangList(prev => [barangBaru, ...prev]);
  };

  const filteredBarang = barangList.filter(b =>
    b.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <FaArrowLeft className="text-gray-500 cursor-pointer text-xl" onClick={() => router.push("/manajemen")} />
            <h1 className="text-2xl font-bold">Data Barang / Produk</h1>
          </div>
          <UserProfile />
        </div>

        <div className="w-[96%] mx-auto border-b border-gray-300 mb-6" />

        <div className="flex flex-grow p-6 gap-6">
          <div className="flex flex-col w-1/2 bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center gap-3">
              <button className="w-12 h-12 flex items-center justify-center border rounded-lg hover:bg-gray-100">
                <Image src="/icons/filter.svg" alt="Filter" width={20} height={20} />
              </button>
              <div className="flex items-center border rounded-lg px-4 py-3 w-full">
                <Image src="/icons/search.svg" alt="Search" width={20} height={20} className="mr-3" />
                <input
                  type="text"
                  placeholder="Cari barang..."
                  className="w-full outline-none bg-transparent text-gray-600"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto mt-4">
              {filteredBarang.length > 0 ? (
                filteredBarang.map((barang) => (
                  <div
                    key={barang.id}
                    className={`p-3 border-b cursor-pointer ${
                      selectedBarang?.id === barang.id ? "bg-blue-100" : ""
                    }`}
                    onClick={() => setSelectedBarang(barang)}
                  >
                    {barang.nama} - ({barang.kategori})
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center text-gray-400 h-full">
                  Tidak ada barang
                </div>
              )}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
            >
              + Tambah Barang
            </button>
          </div>

          <div className="flex flex-col w-1/2 bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Rincian Barang :</h2>
            <div className="flex-grow overflow-y-auto">
              {selectedBarang ? (
                <div className="space-y-4">
                  {selectedBarang.gambar && (
                    <div className="flex justify-center">
                      <Image
                        src={selectedBarang.gambar}
                        alt={selectedBarang.nama}
                        width={192}
                        height={192}
                        className="object-cover border rounded-md"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-[150px_10px_1fr] gap-y-2">
                    <div className="font-semibold">Nama</div><div>:</div><div>{selectedBarang.nama}</div>
                    <div className="font-semibold">Kategori</div><div>:</div><div>{selectedBarang.kategori}</div>
                    <div className="font-semibold">Kode</div><div>:</div><div>{selectedBarang.kode}</div>
                    <div className="font-semibold">Stok</div><div>:</div><div>{selectedBarang.stok}</div>
                    <div className="font-semibold">Harga Dasar</div><div>:</div><div>Rp {selectedBarang.hargaDasar.toLocaleString()}</div>
                    <div className="font-semibold">Harga Jual</div><div>:</div><div>Rp {selectedBarang.hargaJual.toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-400 h-full">
                  Tidak ada barang yang dipilih
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TambahBarangModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); fetchProduk(); }}
        onBarangTambah={handleTambahBarang}
      />
    </MainLayout>
  );
};

export default DataBarang;
