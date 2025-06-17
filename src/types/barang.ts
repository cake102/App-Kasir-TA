export interface Kategori {
  id: number;
  name: string;
}

export interface Barang {
  id: number | string; // tergantung dari API kamu
  name?: string;
  nama?: string;
  kode?: string;
  code_product?: string;
  stok?: number;
  stock?: number;
  hargaJual?: number;
  selling_price?: number;
  hargaDasar?: number;
  base_price?: number;
  gambar?: string;
  image_url?: string;
  kategori?: string;
  category?: {
    name?: string;
  };
}
