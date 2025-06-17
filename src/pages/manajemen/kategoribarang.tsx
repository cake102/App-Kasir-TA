import React, { useState, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";
import UserProfile from "../../components/UserProfile";
import Image from "next/image";
import { useRouter } from "next/router";
import { FaArrowLeft } from "react-icons/fa";
import TambahKategoriModal from "./TambahKategoriModal";

type Kategori = {
  id: number;
  name: string;
};

type Barang = {
  id: number;
  nama: string;
  category_id: number;
};

type KategoriResponse = {
  id: number;
  name: string;
};

type BarangResponse = {
  id: number;
  name: string;
  category_id: number;
};

const KategoriBarang = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editKategoriId, setEditKategoriId] = useState<number | null>(null);
  const [editKategoriName, setEditKategoriName] = useState("");

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      const parsed = JSON.parse(currentUser);
      setToken(parsed?.token || null);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const kategoriRes = await fetch(
          "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/categories",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const kategoriData = await kategoriRes.json();
        setKategoriList(
          Array.isArray(kategoriData.data)
            ? kategoriData.data.map((k: KategoriResponse): Kategori => ({
                id: k.id,
                name: k.name,
              }))
            : []
        );

        const barangRes = await fetch(
          "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/products",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const barangData = await barangRes.json();
        setBarangList(
          Array.isArray(barangData.data)
            ? barangData.data.map((b: BarangResponse): Barang => ({
                id: b.id,
                nama: b.name,
                category_id: b.category_id,
              }))
            : []
        );
      } catch (err) {
        console.error("❌ Gagal fetch data:", err);
      }
    };

    fetchData();
  }, [token]);

  const filteredKategori = kategoriList.filter((kategori) =>
    kategori.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedKategoriObj = kategoriList.find(
    (k) => k.name === selectedKategori
  );

  const barangByKategori = selectedKategoriObj
    ? barangList.filter((barang) => barang.category_id === selectedKategoriObj.id)
    : [];

  const handleEditClick = () => {
    if (!selectedKategoriObj) return;
    setIsEditMode(true);
    setEditKategoriId(selectedKategoriObj.id);
    setEditKategoriName(selectedKategoriObj.name);
    setIsDeleteMode(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditKategoriName(e.target.value);
  };

  const handleEditSave = async () => {
    if (!token || editKategoriId === null) return;

    if (editKategoriName.trim() === "") {
      alert("Nama kategori tidak boleh kosong");
      return;
    }

    try {
      const res = await fetch(
        `https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/categories/${editKategoriId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: editKategoriName }),
        }
      );
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.meta?.message || "Gagal update kategori");
      }

      setKategoriList((prev) =>
        prev.map((k) =>
          k.id === editKategoriId ? { ...k, name: editKategoriName } : k
        )
      );

      setSelectedKategori(editKategoriName);
      alert("Kategori berhasil diubah");
      setIsEditMode(false);
      setEditKategoriId(null);
      setEditKategoriName("");
    } catch (err) {
      alert("Gagal mengubah kategori");
      console.error(err);
    }
  };

  const handleEditCancel = () => {
    setIsEditMode(false);
    setEditKategoriId(null);
    setEditKategoriName("");
  };

  const handleDeleteClick = () => {
    setIsDeleteMode(!isDeleteMode);
    setIsEditMode(false);
  };

  const handleDeleteKategori = async (kategoriId: number, kategoriName: string) => {
    if (!token) return;

    const confirmed = confirm(
      `Apakah anda yakin ingin menghapus kategori "${kategoriName}"?\n` +
        `Semua barang yang terkait kategori ini akan kehilangan kategori.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/categories/${kategoriId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.meta?.message || "Gagal menghapus kategori");
      }

      setKategoriList((prev) => prev.filter((k) => k.id !== kategoriId));

      if (selectedKategoriObj && selectedKategoriObj.id === kategoriId) {
        setSelectedKategori(null);
      }

      alert("Kategori berhasil dihapus");
    } catch (err) {
      alert("Gagal menghapus kategori");
      console.error(err);
    }
  };

  const tambahKategoriKeAPI = async (namaKategori: string) => {
    if (!token) return;

    try {
      const res = await fetch(
        "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/categories",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: namaKategori }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.meta?.message || "Gagal menambah kategori");
      }

      const kategoriBaru = {
        id: result.data.id,
        name: result.data.name,
      };

      setKategoriList((prev) => [...prev, kategoriBaru]);
      setSelectedKategori(kategoriBaru.name);
      alert("Kategori berhasil ditambahkan");
    } catch (error) {
      alert("Gagal menambah kategori");
      console.error(error);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <FaArrowLeft
              className="text-gray-500 cursor-pointer text-xl"
              onClick={() => router.push("/manajemen")}
            />
            <h1 className="text-2xl font-bold">Kategori Barang</h1>
          </div>
          <UserProfile />
        </div>

        <div className="w-[96%] max-w-0xl mx-auto border-b border-gray-300 mb-6"></div>

        <div className="flex flex-grow p-6 gap-6">
          <div className="flex flex-col w-1/2 bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center gap-3 w-full">
              <button className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100">
                <Image src="/icons/filter.svg" alt="Filter" width={20} height={20} />
              </button>

              <input
                type="text"
                placeholder="Cari kategori.."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-600 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="flex gap-2 ml-3">
                <button
                  title="Edit Kategori"
                  onClick={handleEditClick}
                  disabled={!selectedKategori}
                  className={`p-2 rounded hover:bg-green-100 ${
                    selectedKategori ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <Image src="/icons/edit.svg" alt="Edit" width={40} height={20} />
                </button>
                <button
                  title="Hapus Kategori"
                  onClick={handleDeleteClick}
                  disabled={!selectedKategori}
                  className={`p-2 rounded hover:bg-red-100 ${
                    selectedKategori ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <Image src="/icons/delete.svg" alt="Delete" width={35} height={20} />
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto mt-4">
              {filteredKategori.length > 0 ? (
                filteredKategori.map((kategori) => {
                  const isBeingEdited = isEditMode && editKategoriId === kategori.id;

                  return (
                    <div
                      key={kategori.id}
                      className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-gray-100 ${
                        selectedKategori === kategori.name ? "bg-blue-100" : ""
                      }`}
                      onClick={() => {
                        if (isDeleteMode) return;
                        if (!isEditMode) setSelectedKategori(kategori.name);
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {isDeleteMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteKategori(kategori.id, kategori.name);
                            }}
                            className="text-red-600 hover:text-red-800 font-bold text-lg"
                            title="Hapus kategori"
                            type="button"
                          >
                            &times;
                          </button>
                        )}

                        {isBeingEdited ? (
                          <input
                            type="text"
                            value={editKategoriName}
                            onChange={handleEditChange}
                            onClick={(e) => e.stopPropagation()}
                            className="border rounded px-2 py-1 flex-grow"
                          />
                        ) : (
                          <span>{kategori.name}</span>
                        )}
                      </div>

                      {isBeingEdited && (
                        <div className="flex gap-2">
                          <button
                            onClick={handleEditSave}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            type="button"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
                            type="button"
                          >
                            Batal
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 mt-6">Kategori tidak ditemukan</p>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
            >
              Tambah Kategori
            </button>
          </div>

          <div className="flex flex-col w-1/2 bg-white shadow-md rounded-lg p-6">
            <h2 className="font-bold text-lg mb-4">
              Barang di Kategori:{" "}
              <span className="text-blue-600">{selectedKategori || "-"}</span>
            </h2>
            <div className="flex-grow overflow-y-auto">
              {selectedKategori ? (
                barangByKategori.length > 0 ? (
                  barangByKategori.map((barang) => (
                    <div
                      key={barang.id}
                      className="flex items-center gap-3 border-b py-3 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => router.push(`/manajemen/barang/${barang.id}`)}
                    >
                      <Image
                        src="/icons/box.svg"
                        alt="Barang"
                        width={24}
                        height={24}
                        className="ml-2"
                      />
                      <p className="truncate">{barang.nama}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-6">
                    Belum ada barang di kategori ini.
                  </p>
                )
              ) : (
                <p className="text-center text-gray-500 mt-6">
                  Silakan pilih kategori terlebih dahulu.
                </p>
              )}
            </div>
          </div>
        </div>

        <TambahKategoriModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onKategoriTambah={(namaKategori) => {
            tambahKategoriKeAPI(namaKategori);
          }}
        />
      </div>
    </MainLayout>
  );
};

export default KategoriBarang;
