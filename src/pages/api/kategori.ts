import type { NextApiRequest, NextApiResponse } from "next";

const BASE_API = "https://cashier-app-dfamcgc4g3cbhwdw.southeastasia-01.azurewebsites.net/api/v1/category";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed, gunakan POST" });
  }

  const { nama } = req.body;

  if (!nama || typeof nama !== "string") {
    return res.status(400).json({ message: "Field 'nama' diperlukan dan harus berupa string" });
  }

  try {
    const response = await fetch(BASE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name }), 
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ message: data.message || "Gagal menambah kategori" });
    }

    return res.status(200).json({ message: "Kategori berhasil ditambahkan", data });
  } catch (error) {
    console.error("API handler error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
