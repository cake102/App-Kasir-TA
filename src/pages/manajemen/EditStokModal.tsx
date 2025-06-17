import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Barang, Kategori } from "@/types/barang";


interface EditStokModalProps {
  isOpen: boolean;
  onClose: () => void;
  barang: Barang | null;
  onSave: (updatedBarang: Barang) => void;
}

const EditStokModal: React.FC<EditStokModalProps> = ({
  isOpen,
  onClose,
  barang,
  onSave,
}) => {
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [kategori, setKategori] = useState("");
  const [stok, setStok] = useState(0);
  const [hargaJual, setHargaJual] = useState(0);
  const [hargaDasar, setHargaDasar] = useState(0);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [gambar, setGambar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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
    if (!isOpen || !barang) return;

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

        const kategoriBarang =
          typeof barang?.kategori === "string"
            ? barang.kategori
            : typeof barang?.category?.name === "string"
            ? barang.category.name
            : "";

        const foundKat = json.data.find(
          (k: Kategori) =>
            typeof k.name === "string" &&
            kategoriBarang &&
            k.name.toLowerCase() === kategoriBarang.toLowerCase()
        );

        setKategori(foundKat?.name || json.data[0]?.name || "");
        setError(null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Terjadi kesalahan saat mengambil kategori.");
        }
        setKategoriList([]);
      }
    };

    fetchKategori();
  }, [isOpen, token, barang]);

  useEffect(() => {
    if (barang) {
      setNama(barang.nama || barang.name || "");
      setKode(barang.kode || barang.code_product || "");
      setStok(barang.stok || barang.stock || 0);
      setHargaJual(barang.hargaJual || barang.selling_price || 0);
      setHargaDasar(barang.hargaDasar || barang.base_price || 0);
      setPreview(barang.gambar || barang.image_url || null);
      setGambar(null);
    }
  }, [barang]);

  const handleGambarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGambar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    const selectedKategori = kategoriList.find((k) => k.name === kategori);
    const formData = new FormData();

    formData.append("name", nama);
    formData.append("code", kode);
    formData.append("price_sell", hargaJual.toString());
    formData.append("price_buy", hargaDasar.toString());
    formData.append("stock", stok.toString());
    formData.append("category_id", selectedKategori?.id?.toString() || "");

    if (gambar) {
      formData.append("image", gambar);
    } else if (preview) {
      try {
        const response = await fetch(preview);
        const blob = await response.blob();
        const file = new File([blob], "fallback.jpg", { type: "image/jpeg" });
        formData.append("image", file);
      } catch {
        alert("Gagal mengambil gambar lama. Silakan unggah ulang gambar.");
        return;
      }
    }

    try {
      const response = await fetch(
        `https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/products/${barang?.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.meta?.message || "Gagal update produk");
      }

      const result = await response.json();
      onSave(result.data);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Terjadi kesalahan saat update data produk");
      }
    }
  };

  if (!isOpen || !barang) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">Edit Stok Barang</h2>

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <div className="mb-4">
          <label className="block mb-1">Gambar</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleGambarChange}
            className="w-full"
          />
          {preview && (
            <div className="mt-2">
              <Image
                src={preview}
                alt="Preview"
                width={128}
                height={128}
                className="object-cover rounded border"
                style={{ width: "128px", height: "128px" }}
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-1">Nama Barang</label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="border rounded-lg w-full p-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Kode</label>
          <input
            type="text"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            className="border rounded-lg w-full p-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Kategori</label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="border rounded-lg w-full p-2 bg-white"
          >
            {kategoriList.length > 0 ? (
              kategoriList.map((kat) => (
                <option key={kat.id} value={kat.name}>
                  {kat.name}
                </option>
              ))
            ) : (
              <option disabled value="">
                Tambahkan kategori terlebih dahulu
              </option>
            )}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Stok</label>
          <input
            type="number"
            value={stok}
            onChange={(e) => setStok(Number(e.target.value))}
            className="border rounded-lg w-full p-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Harga Jual (Rp)</label>
          <input
            type="number"
            value={hargaJual}
            onChange={(e) => setHargaJual(Number(e.target.value))}
            className="border rounded-lg w-full p-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Harga Dasar (Rp)</label>
          <input
            type="number"
            value={hargaDasar}
            onChange={(e) => setHargaDasar(Number(e.target.value))}
            className="border rounded-lg w-full p-2"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded-lg mr-2"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStokModal;
