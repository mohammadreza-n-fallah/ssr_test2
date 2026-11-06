import type {
  Brand,
  CarBrand,
  CarModel,
  CarYear,
  Category,
  PaginatedResponse,
  Product,
  ProductImage,
  ProductVariant,
} from "@/types";

function svgDataUri(label: string, bg = "#e5e7eb", fg = "#1e3a8a"): string {
  const safe = label.slice(0, 18).replace(/[<>&"]/g, "");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='100%' height='100%' fill='${bg}'/><rect x='40' y='40' width='520' height='520' rx='28' fill='white' opacity='0.75'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' font-family='Tahoma,Arial,sans-serif' font-size='34' fill='${fg}'>${safe}</text><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-family='Tahoma,Arial,sans-serif' font-size='18' fill='#6b7280'>نمونه نمایشی</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function img(id: number, alt: string, primary = false): ProductImage {
  return { id, image: svgDataUri(alt), alt_text: alt, is_primary: primary };
}

function variant(
  id: number,
  sku: string,
  priceToman: number,
  stock: number,
  partType: "original" | "oem" | "aftermarket",
  compareToman?: number,
): ProductVariant {
  const price = priceToman * 10;
  const compare_price = compareToman ? compareToman * 10 : undefined;
  const discount_percent =
    compare_price && compare_price > price
      ? Math.round(((compare_price - price) / compare_price) * 100)
      : 0;
  return {
    id,
    sku,
    price,
    compare_price,
    stock,
    part_type: partType,
    attributes: { نوع: partType === "original" ? "اصل" : partType === "oem" ? "OEM" : "بازار" },
    is_active: true,
    discount_percent,
    is_in_stock: stock > 0,
    is_low_stock: stock > 0 && stock <= 5,
    flash_price: null,
  };
}

export const fakeCategories: Category[] = [
  { id: 1, name: "چراغ و بدنه", name_en: "Lighting & Body", slug: "lighting-body", icon: "body", image: "/چراغ و بدنه.png", children: [] },
  { id: 2, name: "موتوری", name_en: "Engine", slug: "engine", icon: "engine", image: "/موتوری.png", children: [] },
  { id: 3, name: "سیستم تعلیق و جلوبندی", name_en: "Suspension", slug: "suspension", icon: "suspension", image: "/سیستم تعلیق و جلوبندی.png", children: [] },
  { id: 4, name: "سیستم ترمز ", name_en: "Brake", slug: "brake", icon: "brake", image: "/سیستم ترمز.png", children: [] },
  { id: 5, name: "سیستم الکتریکی و برق خودرو", name_en: "Electrical", slug: "electrical", icon: "electrical", image: "/سیستم الکترونیک برق خودرو.png", children: [] },
  { id: 6, name: "فیلترها", name_en: "Filters", slug: "filters", icon: "filter", image: "/فیلتر ها.png", children: [] },
];

export const fakeBrands: Brand[] = [
  { id: 1, name: "کروز", name_fa: "کروز", slug: "cruz", country: "IR", logo: "/کروز.png" },
  { id: 2, name: "عظام", name_fa: "عظام", slug: "azam", country: "IR", logo: "/عظام.jpg" },
  { id: 3, name: "جمع ساز", name_fa: "جمع ساز", slug: "jamsaz", country: "IR", logo: "/جمع ساز.jpg" },
  { id: 4, name: "ایساکو", name_fa: "ایساکو", slug: "isaco", country: "IR", logo: "/ایساکو.png" },
  { id: 5, name: "ایران خودرو", name_fa: "ایران خودرو", slug: "iran-khodro", country: "IR", logo: "/ایران خودرو.png" },
  { id: 6, name: "مدرن", name_fa: "مدرن", slug: "modern", country: "IR", logo: "/مدرن.png" },
];

const carYears = (modelId: number, start: number): CarYear[] =>
  [0, 1, 2, 3].map((i) => {
    const year = start + i;
    return {
      id: modelId * 10 + i + 1,
      year,
      year_shamsi: String(year - 621),
      engine: "1.6L",
    };
  });

export const fakeCarBrands: CarBrand[] = [
  { id: 1, name: "پژو", name_en: "Peugeot", slug: "peugeot" },
  { id: 2, name: "سمند", name_en: "Samand", slug: "samand" },
  { id: 3, name: "پراید", name_en: "Pride", slug: "pride" },
  { id: 4, name: "تیبا", name_en: "Tiba", slug: "tiba" },
  { id: 5, name: "دنا", name_en: "Dena", slug: "dena" },
];

export const fakeCarModelsByBrand: Record<string, CarModel[]> = {
  peugeot: [
    { id: 11, name: "206", name_en: "206", slug: "206", years: carYears(11, 2018) },
    { id: 12, name: "207", name_en: "207", slug: "207", years: carYears(12, 2019) },
  ],
  samand: [{ id: 21, name: "سورن", name_en: "Soren", slug: "soren", years: carYears(21, 2018) }],
  pride: [{ id: 31, name: "111", name_en: "111", slug: "111", years: carYears(31, 2017) }],
  tiba: [{ id: 41, name: "تیبا 2", name_en: "Tiba 2", slug: "tiba-2", years: carYears(41, 2019) }],
  dena: [{ id: 51, name: "پلاس", name_en: "Plus", slug: "dena-plus", years: carYears(51, 2020) }],
};

const productsSample = [
  { name: "چراغ خطر رانا پلاس", description: "چراغ خطر رانا پلاس چپ", category: "چراغ و بدنه", brand: "کروز", price: 12000000, sale_price: 10000000, image: "/چراغ خطر رانا پلاس.jpg" },
  { name: "چراغ جلو پژو 207", description: "چراغ جلو پژو 207 سمت چپ", category: "چراغ و بدنه", brand: "مدرن", price: 8500000, sale_price: 7500000, image: "/چراغ جلو 207.png" },
  { name: "آینه بغل پژو پارس", description: "آینه بغل پژو پارس برقی سمت راست", category: "چراغ و بدنه", brand: "کروز", price: 6500000, sale_price: 5500000, image: "/آیینه بغل پژو پارس.png" },
  { name: "سپر جلو پژو ۲۰۷", description: "سپر جلو پژو ۲۰۷ مناسب مدل‌های جدید", category: "چراغ و بدنه", brand: "ایران خودرو", price: 15000000, sale_price: 13500000, image: "/سپر جلو پژو 207.png" },
  { name: "چراغ عقب سمند", description: "چراغ خطر عقب سمند سمت راست", category: "چراغ و بدنه", brand: "کروز", price: 5800000, sale_price: 5000000, image: "/چراغ عقب سمند.png" },
  { name: "جلوپنجره دنا پلاس", description: "جلوپنجره دنا پلاس مشکی فابریک", category: "چراغ و بدنه", brand: "ایساکو", price: 7200000, sale_price: 6200000, image: "/جلو پنجره دنا پلاس.png" },
  { name: "چراغ جلو دنا پلاس", description: "چراغ جلو دنا پلاس سمت راست", category: "چراغ و بدنه", brand: "کروز", price: 11000000, sale_price: 9500000, image: "/چراغ جلو دنا پلاس.png" },
  { name: "سپر عقب پژو ۲۰۶", description: "سپر عقب پژو ۲۰۶ هاچبک رنگ سفید", category: "چراغ و بدنه", brand: "ایران خودرو", price: 12500000, sale_price: 11000000, image: "/سپر عقب پژو 207.png" },
  { name: "چراغ خطر عقب پژو پارس", description: "چراغ خطر عقب پژو پارس سمت چپ", category: "چراغ و بدنه", brand: "کروز", price: 6800000, sale_price: 5900000, image: "/چراغ خطر پژو پارس.png" },
  { name: "آینه بغل سمند", description: "آینه بغل سمند برقی سمت چپ", category: "چراغ و بدنه", brand: "ایساکو", price: 5700000, sale_price: 4900000, image: "/آیینه بغل سمند.png" },
  { name: "دستگیره درب پژو ۴۰۵", description: "دستگیره بیرونی درب جلو پژو ۴۰۵ مشکی", category: "بدنه خودرو", brand: "کروز", price: 1800000, sale_price: 1500000, image: "/دستگیره درب پژو 405.png" },
];

export const fakeProducts: Product[] = productsSample.map((p, i) => {
  const id = i + 1;
  const cat = fakeCategories.find((c) => c.name === p.category) || fakeCategories[0];
  const brand = fakeBrands.find((b) => b.name === p.brand) || fakeBrands[0];
  const sku = `SKU-${id}`;
  const stock = 10;
  const v = variant(id * 1000 + 1, sku, p.price, stock, "aftermarket", p.sale_price);
  const primaryImage: ProductImage = { id: id * 100 + 1, image: p.image, alt_text: p.name, is_primary: true };
  return {
    id,
    name: p.name,
    name_en: p.name,
    slug: `product-${id}`,
    sku,
    oem_code: "",
    part_number: "",
    category: cat,
    brand,
    part_type: "aftermarket",
    short_description: p.description,
    description: p.description,
    primary_image: primaryImage,
    images: [primaryImage],
    variants: [v],
    default_variant: v,
    min_price: p.price * 10,
    is_featured: true,
    view_count: 100,
  };
});

export function paginate<T>(items: T[], page = 1, pageSize = 12): PaginatedResponse<T> {
  const total_pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current_page = Math.min(Math.max(1, page), total_pages);
  const start = (current_page - 1) * pageSize;
  return {
    count: items.length,
    next: current_page < total_pages ? String(current_page + 1) : undefined,
    previous: current_page > 1 ? String(current_page - 1) : undefined,
    total_pages,
    current_page,
    results: items.slice(start, start + pageSize),
  };
}

export function fakeSearchProducts(params: URLSearchParams): PaginatedResponse<Product> {
  let items = [...fakeProducts];
  const category = params.get("category");
  const brand = params.get("brand");
  const partType = params.get("part_type");
  const featured = params.get("is_featured");
  const inStock = params.get("in_stock");
  const q = params.get("q") || params.get("search");
  if (category) items = items.filter((p) => p.category?.slug === category);
  if (brand) items = items.filter((p) => p.brand?.slug === brand);
  if (partType) items = items.filter((p) => p.part_type === partType);
  if (featured === "true") items = items.filter((p) => p.is_featured);
  if (inStock === "true") items = items.filter((p) => p.default_variant?.is_in_stock);
  if (q) {
    const qq = q.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(qq) ||
        p.name_en.toLowerCase().includes(qq) ||
        p.sku.toLowerCase().includes(qq) ||
        p.oem_code.toLowerCase().includes(qq),
    );
  }
  const ordering = params.get("ordering") || "-created_at";
  if (ordering === "variants__price") items.sort((a, b) => a.min_price - b.min_price);
  else if (ordering === "-variants__price") items.sort((a, b) => b.min_price - a.min_price);
  else if (ordering === "-view_count") items.sort((a, b) => b.view_count - a.view_count);
  else items.sort((a, b) => b.id - a.id);
  return paginate(items, Number(params.get("page") || 1), Number(params.get("page_size") || 12));
}

export function fakeProductBySlug(slug: string): Product | undefined {
  return fakeProducts.find((p) => p.slug === slug);
}

export function fakeSitemapData() {
  return {
    products: fakeProducts.map((p) => ({ slug: p.slug, updated_at: new Date().toISOString() })),
    categories: fakeCategories.map((c) => ({ slug: c.slug })),
    posts: [] as { slug: string; updated_at?: string }[],
    blog_categories: [] as { slug: string; updated_at?: string }[],
  };
}

export function fakeYearsForModel(modelId: number): CarYear[] {
  for (const models of Object.values(fakeCarModelsByBrand)) {
    const m = models.find((x) => x.id === modelId);
    if (m?.years) return m.years;
  }
  return [];
}
