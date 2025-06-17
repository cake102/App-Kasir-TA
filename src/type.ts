export interface ProductType {
  id: number;
  name: string;
  code: string;
  stock: number;
  price_buy: number;
  price_sell: number;
  category_id: number;
  image_url?: string | null;
}
