import { useState, useEffect } from "react";
import { FaTimes, FaCamera, FaSyncAlt, FaBarcode } from "react-icons/fa";
import BarcodeScanner from "./BarcodeScanner";
import Image from "next/image";
import type { Barang } from "./databarang"; // pastikan path sesuai

interface TambahBarangModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarangTambah: (barangBaru: Barang) => void;
}

interface Kategori {
  id: number;
  name: string;
}

const TambahBarangModal = ({
  isOpen,
  onClose,
  onBarangTambah,
}: TambahBarangModalProps) => {
  const [kodeBarang, setKodeBarang] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [stok, setStok] = useState("");
  const [hargaDasar, setHargaDasar] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [kategori, setKategori] = useState("");
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [gambar, setGambar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = (() => {
    if (typeof window !== "undefined") {
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        try {
          const parsed = JSON.parse(currentUser);
          return parsed?.token || "";
        } catch {
          return "";
        }
      }
    }
    return "";
  })();

  useEffect(() => {
    if (!isOpen) return;

    const fetchKategori = async () => {
      if (!token) {
        setError("Token tidak ditemukan, silakan login.");
        return;
      }

      try {
        const res = await fetch("/api/v1/categories/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.meta?.message || "Gagal mengambil kategori");
        }

        const json = await res.json();
        setKategoriList(json.data);
        if (json.data.length > 0) setKategori(json.data[0].name);
        setError(null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        }
        setKategoriList([]);
      }
    };

    fetchKategori();
  }, [isOpen, token]);

  const handleGambarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGambar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateRandomCode = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setKodeBarang(randomCode);
  };

  const handleScan = (barcode: string) => {
    setKodeBarang(barcode);
    setShowScanner(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!namaBarang.trim() || !kategori || !stok || !hargaDasar || !hargaJual || !kodeBarang.trim()) {
      alert("Semua field wajib diisi!");
      return;
    }

    const selectedKategori = kategoriList.find((k) => k.name === kategori);
    if (!selectedKategori) {
      alert("Kategori tidak valid.");
      return;
    }

    const formData = new FormData();
    formData.append("name", namaBarang);
    formData.append("category_id", selectedKategori.id.toString());
    formData.append("price_sell", hargaJual);
    formData.append("price_buy", hargaDasar);
    formData.append("stock", stok);
    formData.append("code", kodeBarang);

    if (gambar) {
      const response = await fetch(gambar);
      const blob = await response.blob();
      const filename = `gambar-${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: blob.type });
      formData.append("image", file);
    }

    try {
      const res = await fetch(
        "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/products",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.meta?.message || "Gagal menambahkan produk");
      }

      const result = await res.json();
      const produk = result.data;

      const barangBaru: Barang = {
        id: produk.id,
        nama: produk.name,
        kode: produk.code,
        stok: produk.stock,
        hargaDasar: produk.price_buy,
        hargaJual: produk.price_sell,
        kategori: String(produk.category_id),
        gambar: produk.image_url ?? null,
      };

      onBarangTambah(barangBaru);

      setNamaBarang("");
      setKodeBarang("");
      setStok("");
      setHargaDasar("");
      setHargaJual("");
      setKategori(kategoriList.length > 0 ? kategoriList[0].name : "");
      setGambar(null);
      setError(null);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-lg overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tambah Barang</h2>
          <FaTimes className="text-gray-500 cursor-pointer" onClick={onClose} />
        </div>

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
            {gambar ? (
              <Image
                src={gambar}
                alt="Preview"
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            ) : (
              <FaCamera className="text-gray-400 text-2xl" />
            )}
          </div>
          <input type="file" accept="image/*" id="gambar-upload" onChange={handleGambarChange} hidden />
          <label
            htmlFor="gambar-upload"
            className="mt-2 px-4 py-1 bg-blue-500 text-white rounded-lg text-sm cursor-pointer"
          >
            Ubah
          </label>
        </div>

        {error && <p className="text-red-500 mt-2">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="text-sm font-medium">Nama*</label>
          <input
            type="text"
            value={namaBarang}
            onChange={(e) => setNamaBarang(e.target.value)}
            placeholder="Masukkan nama.."
            className="w-full p-2 border rounded-md"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Stok*</label>
              <input
                type="number"
                value={stok}
                onChange={(e) => setStok(e.target.value)}
                placeholder="Masukkan stok"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Kode Barang*</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={kodeBarang}
                  onChange={(e) => setKodeBarang(e.target.value)}
                  placeholder="Masukkan kode"
                  className="w-full p-2 border rounded-md"
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="bg-gray-200 p-2 rounded-md hover:bg-gray-300"
                  title="Generate Kode Acak"
                >
                  <FaSyncAlt className="text-gray-600 text-lg" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="bg-blue-500 p-2 rounded-md text-white hover:bg-blue-600"
                  title="Scan Barcode"
                >
                  <FaBarcode className="text-lg" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Harga Dasar*</label>
              <input
                type="number"
                value={hargaDasar}
                onChange={(e) => setHargaDasar(e.target.value)}
                placeholder="Masukkan harga dasar"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Harga Jual*</label>
              <input
                type="number"
                value={hargaJual}
                onChange={(e) => setHargaJual(e.target.value)}
                placeholder="Masukkan harga jual"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          <label className="text-sm font-medium">Kategori</label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            {kategoriList.length > 0 ? (
              kategoriList.map((kat) => (
                <option key={kat.id} value={kat.name}>
                  {kat.name}
                </option>
              ))
            ) : (
              <option disabled>Tambahkan kategori terlebih dahulu</option>
            )}
          </select>

          <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded-lg mt-3">
            Simpan
          </button>
        </form>
      </div>

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default TambahBarangModal;
