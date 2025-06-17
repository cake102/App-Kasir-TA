import React, { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

interface PopupEksporProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  name: string;
  code_product: string;
  category_id?: number;
  stock: number;
  selling_price: number;
  base_price: number;
}

interface ImportedProduct {
  name: string;
  code: string;
  category_id?: number;
  stock: number;
  selling_price: number;
  base_price: number;
}

const PopupEkspor: React.FC<PopupEksporProps> = ({ isOpen, onClose }) => {
  const [format, setFormat] = useState<"PDF" | "Excel">("PDF");
  const [showSuccess, setShowSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const token = (() => {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return "";
    try {
      return JSON.parse(raw).token || "";
    } catch {
      return "";
    }
  })();

  const fetchProductList = async (): Promise<Product[]> => {
    const res = await fetch(
      "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/products",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) throw new Error("Gagal ambil data produk");
    const json = await res.json();
    return json.data || [];
  };

  const handleExport = async () => {
    try {
      const barangList: Product[] = await fetchProductList();

      if (format === "PDF") {
        const doc = new jsPDF();
        let y = 10;
        doc.setFontSize(12);
        doc.text("Laporan Stok Barang", 10, y);
        y += 10;
        barangList.forEach((item: Product, idx: number) => {
          const line = `${idx + 1}. ${item.name} | Kode: ${item.code_product} | Stok: ${item.stock}`;
          doc.text(line, 10, y);
          y += 10;
        });
        doc.save("stok-barang.pdf");
      } else {
        const rows = barangList.map((item: Product) => ({
          name: item.name,
          code: item.code_product,
          category_id: item.category_id,
          stock: item.stock,
          selling_price: item.selling_price,
          base_price: item.base_price,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "StokBarang");
        XLSX.writeFile(wb, "stok-barang.xlsx");
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert("❌ Gagal ekspor: " + err.message);
      } else {
        alert("❌ Gagal ekspor karena kesalahan tak dikenal.");
      }
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImportError(null);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const imported: ImportedProduct[] = XLSX.utils.sheet_to_json<ImportedProduct>(ws);

        const valid = imported.every(
          (it) =>
            it.name &&
            it.code !== undefined &&
            it.stock !== undefined &&
            it.selling_price !== undefined &&
            it.base_price !== undefined
        );
        if (!valid) {
          throw new Error(
            "Format salah! Kolom harus ada: name, code, stock, selling_price, base_price."
          );
        }

        const existing: Product[] = await fetchProductList();
        const existingSet = new Set(
          existing.map((p: Product) => `${p.name}-${p.code_product}`)
        );

        const toInsert = imported.filter((it: ImportedProduct) => {
          const key = `${it.name}-${it.code}`;
          return !existingSet.has(key);
        });

        for (const item of toInsert) {
          const fd = new FormData();
          fd.append("name", item.name);
          fd.append("code", item.code);
          fd.append("price_sell", item.selling_price.toString());
          fd.append("price_buy", item.base_price.toString());
          fd.append("stock", item.stock.toString());
          fd.append("category_id", item.category_id ? item.category_id.toString() : "1");
          fd.append("image", new Blob(), "stub.jpg");

          const res = await fetch(
            "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/products",
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            }
          );
          if (!res.ok) {
            const j = await res.json();
            console.error("Import failed:", item, j);
          }
        }

        alert(`✅ Import selesai! Baris baru: ${toInsert.length}`);
        onClose();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setImportError(err.message);
        } else {
          setImportError("Terjadi kesalahan saat import.");
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        {!showSuccess ? (
          <>
            <div className="flex justify-between">
              <h2 className="text-lg font-bold">Ekspor / Import Barang</h2>
              <button onClick={onClose}>✖</button>
            </div>
            <div className="mt-3">
              <label>Format Ekspor:</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as "PDF" | "Excel")}
                className="w-full border p-2 rounded"
              >
                <option value="PDF">PDF</option>
                <option value="Excel">Excel</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
                Batal
              </button>
              <button onClick={handleExport} className="bg-blue-500 text-white px-4 py-2 rounded">
                Ekspor
              </button>
            </div>

            <div className="mt-6">
              <label>Import Excel:</label>
              <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="mt-2 w-full" />
              {importError && <p className="text-red-500 mt-2">{importError}</p>}
            </div>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-lg font-bold mb-2">Sukses!</h2>
            <p>Laporan berhasil diekspor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupEkspor;
