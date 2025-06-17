import { useRouter } from "next/router";
import MainLayout from "../../layouts/MainLayout";
import UserProfile from "../../components/UserProfile";
import Image from "next/image";
import { useState, useEffect } from "react";
import BarcodeScanner from "../manajemen/BarcodeScanner";
import { FaBarcode } from "react-icons/fa";

const API_BASE_URL = "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net";

interface Produk {
  kode: string;
  nama: string;
  gambar: string;
  stok: number;
  hargaJual: number;
  kategoriId: number;
}

interface ProdukAPIResponse {
  id: number;
  code_product: string;
  name: string;
  image_url: string;
  stock: number;
  selling_price: number;
  category_id: number;
}

interface SelectedItem extends Produk {
  jumlah: number;
}

const Transaksi = () => {
  const router = useRouter();
  const [barangTersedia, setBarangTersedia] = useState<Produk[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fetchProduk = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/products`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) throw new Error(`Gagal fetch produk: status ${res.status}`);
      const json = await res.json();

      if (json.meta?.status !== "success") throw new Error("Respon bukan success");

      const produk: Produk[] = json.data.map((item: ProdukAPIResponse) => ({
        kode: item.code_product || String(item.id),
        nama: item.name,
        gambar:
          item.image_url && item.image_url.startsWith("http")
            ? item.image_url
            : "/icons/box.svg",
        stok: item.stock,
        hargaJual: item.selling_price,
        kategoriId: item.category_id,
      }));

      setBarangTersedia(produk);
    } catch (error) {
      console.error("Gagal fetch produk:", error);
      setBarangTersedia([]);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem("token");
    if (storedToken) fetchProduk(storedToken);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const currentToken = localStorage.getItem("token");
        if (currentToken) fetchProduk(currentToken);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const filteredBarang = barangTersedia
    .filter((barang) => barang.stok > 0)
    .filter((barang) => {
      const keyword = searchKeyword.toLowerCase();
      return (
        barang.nama.toLowerCase().includes(keyword) ||
        barang.kode.toLowerCase().includes(keyword)
      );
    });

  const tambahBarang = (barang: Produk) => {
    setSelectedItems((prevItems) => {
      const existing = prevItems.find((item) => item.kode === barang.kode);
      if (existing) {
        if (existing.jumlah + 1 > barang.stok) {
          alert("Jumlah pembelian melebihi stok!");
          return prevItems;
        }
        return prevItems.map((item) =>
          item.kode === barang.kode ? { ...item, jumlah: item.jumlah + 1 } : item
        );
      } else {
        if (barang.stok < 1) {
          alert("Stok habis!");
          return prevItems;
        }
        return [...prevItems, { ...barang, jumlah: 1 }];
      }
    });
  };

  const handleScan = (barcode: string) => {
    setIsScannerOpen(false);
    const barangDitemukan = barangTersedia.find((barang) => barang.kode === barcode);
    if (barangDitemukan) tambahBarang(barangDitemukan);
    else alert("Barang tidak ditemukan!");
  };

  const onTambah = (kode: string) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) =>
        item.kode === kode
          ? { ...item, jumlah: item.jumlah + 1 > item.stok ? item.stok : item.jumlah + 1 }
          : item
      )
    );
  };

  const onKurang = (kode: string) => {
    setSelectedItems((prevItems) =>
      prevItems
        .map((item) =>
          item.kode === kode ? { ...item, jumlah: item.jumlah - 1 } : item
        )
        .filter((item) => item.jumlah > 0)
    );
  };

  const totalHarga = selectedItems.reduce(
    (total, item) => total + item.hargaJual * item.jumlah,
    0
  );

  const handleBayar = () => {
    if (selectedItems.length === 0) return alert("Pilih barang terlebih dahulu!");
    const encodedData = encodeURIComponent(JSON.stringify(selectedItems));
    router.push(`/transaksi/pembayaran?data=${encodedData}&total=${totalHarga}`);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between p-6">
          <h1 className="text-2xl font-bold">Transaksi</h1>
          <UserProfile />
        </div>

        <div className="w-full border-b border-gray-300 mb-6" />

        <div className="flex flex-grow p-6 gap-6">
          {/* KIRI */}
          <div className="w-1/2 bg-white shadow-md rounded-lg p-6">
            <input
              type="text"
              placeholder="Cari nama atau kode barang..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded-md"
            />

            <div>
              {filteredBarang.map((barang) => (
                <button
                  key={barang.kode}
                  className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg mb-2 hover:bg-gray-100 flex items-center"
                  onClick={() => tambahBarang(barang)}
                >
                  <Image
                    src={barang.gambar || "/icons/box.svg"}
                    alt={barang.nama}
                    width={40}
                    height={40}
                    className="mr-3 rounded-md object-cover"
                  />
                  <div>
                    <span className="block font-semibold">{barang.nama}</span>
                    <span className="text-gray-500 text-sm">{`Rp ${barang.hargaJual.toLocaleString()} - Stok: ${barang.stok}`}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* KANAN */}
          <div className="w-1/2 bg-white rounded-lg shadow-md flex flex-col">
            <div className="p-6 flex-grow">
              <h2 className="text-lg font-bold mb-3">List Barang</h2>
              <ul>
                {selectedItems.map((item) => (
                  <li key={item.kode} className="flex justify-between items-center py-3 border-b">
                    <Image
                      src={item.gambar || "/icons/box.svg"}
                      alt={item.nama}
                      width={50}
                      height={50}
                      className="rounded-md"
                    />
                    <div className="flex-grow px-4">
                      <span className="block font-semibold">{item.nama}</span>
                      <span className="text-gray-500 text-sm">{`Rp ${item.hargaJual.toLocaleString()}`}</span>
                    </div>
                    <button onClick={() => onKurang(item.kode)} className="px-3">
                      <Image src="/icons/mines.svg" alt="Kurang" width={25} height={25} />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={item.jumlah === 0 ? "" : item.jumlah}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          setSelectedItems((prevItems) =>
                            prevItems.map((i) =>
                              i.kode === item.kode
                                ? { ...i, jumlah: value === "" ? 0 : Number(value) }
                                : i
                            )
                          );
                        }
                      }}
                      onBlur={() => {
                        if (item.jumlah < 1) {
                          setSelectedItems((prevItems) =>
                            prevItems.filter((i) => i.kode !== item.kode)
                          );
                        } else if (item.jumlah > item.stok) {
                          setSelectedItems((prevItems) =>
                            prevItems.map((i) =>
                              i.kode === item.kode ? { ...i, jumlah: item.stok } : i
                            )
                          );
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      className="bg-gray-200 px-4 py-2 rounded-lg text-xl font-bold w-16 text-center appearance-none"
                    />
                    <button onClick={() => onTambah(item.kode)} className="px-3">
                      <Image src="/icons/plus.svg" alt="Tambah" width={25} height={25} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-200 p-4 flex justify-between items-center rounded-b-lg">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg"
              >
                <FaBarcode className="mr-2" /> Scan Barcode
              </button>
              <span className="text-xl font-bold">{`Rp ${totalHarga.toLocaleString()}`}</span>
              <button
                onClick={handleBayar}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg"
              >
                Bayar
              </button>
            </div>
          </div>
        </div>
      </div>

      {isScannerOpen && (
        <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
      )}
    </MainLayout>
  );
};

export default Transaksi;
