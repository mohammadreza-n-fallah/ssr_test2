"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Heart,
  Check,
  Truck,
  ShieldCheck,
  RefreshCw,
  Minus,
  Plus,
  ChevronLeft,
  LoaderCircle,
} from "lucide-react";
import StarRating from "@/components/product/StarRating";
import api from "@/lib/api";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { formatPriceToman, toPersianDigits } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import ProductReviews from "@/components/product/ProductReviews";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { has, toggle, fetchIds } = useWishlistStore();

  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: () => api.get(`/products/${slug}/`).then((r) => r.data),
    enabled: !!slug,
  });

  const { data: related } = useQuery<Product[]>({
    queryKey: ["related", product?.id],
    queryFn: () => api.get(`/recommendations/related/${product!.id}/`).then((r) => r.data),
    enabled: !!product?.id,
  });

  const variants = product?.variants ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Default to the cheapest in-stock variant once the product loads.
  useEffect(() => {
    if (variants.length > 0 && selectedVariantId === null) {
      const inStock = variants.find((v) => v.is_in_stock) ?? variants[0];
      setSelectedVariantId(inStock.id);
    }
  }, [variants, selectedVariantId]);

  useEffect(() => {
    if (isAuthenticated) fetchIds();
  }, [isAuthenticated, fetchIds]);

  const variant: ProductVariant | undefined =
    variants.find((v) => v.id === selectedVariantId) ?? product?.default_variant;

  const images = product?.images ?? (product?.primary_image ? [product.primary_image] : []);
  const inWishlist = product ? has(product.id) : false;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push("/auth?next=" + window.location.pathname);
      return;
    }
    if (!variant) return;
    setAdding(true);
    try {
      await addToCart(variant.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      router.push("/auth?next=" + window.location.pathname);
      return;
    }
    if (product) await toggle(product.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        <LoaderCircle className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔧</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">محصول یافت نشد</h1>
        <p className="text-gray-500 mb-6">این محصول وجود ندارد یا حذف شده است.</p>
        <Link
          href="/products"
          className="inline-block bg-gradient-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-lg hover:brightness-110 transition-all"
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  const flashPrice = variant?.flash_price ?? null;
  const effectivePrice = flashPrice ?? Number(variant?.price ?? 0);
  const hasCompare = variant?.compare_price && Number(variant.compare_price) > effectivePrice;
  const partTypeLabel =
    product.part_type === "original" ? "اصل" : product.part_type === "oem" ? "OEM" : "بازار";
  const rating = (product as Product & { rating?: { average: number; count: number } }).rating;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5 flex-wrap">
        <Link href="/" className="hover:text-[#1e3a8a]">خانه</Link>
        <ChevronLeft className="w-3 h-3" />
        <Link href="/products" className="hover:text-[#1e3a8a]">محصولات</Link>
        {product.category && (
          <>
            <ChevronLeft className="w-3 h-3" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-[#1e3a8a]"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronLeft className="w-3 h-3" />
        <span className="text-gray-600 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div className="group relative bg-gradient-to-b from-gray-50 to-white ring-1 ring-gray-100 shadow-card rounded-3xl pt-[100%] overflow-hidden">
            {images[activeImage] ? (
              <Image
                src={images[activeImage].image}
                alt={images[activeImage].alt_text || product.name}
                fill
                className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-200 text-7xl">
                🔧
              </div>
            )}
            {hasCompare && variant && variant.discount_percent > 0 && (
              <div className="absolute top-4 right-4 bg-gradient-to-l from-red-500 to-rose-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl shadow-md">
                {toPersianDigits(variant.discount_percent)}٪ تخفیف
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === i ? "border-[#1e3a8a] shadow-md scale-105" : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={img.image}
                    alt={img.alt_text || product.name}
                    fill
                    className="object-contain p-1.5"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            {product.brand && (
              <Link
                href={`/products?brand=${product.brand.slug}`}
                className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-medium hover:bg-blue-100"
              >
                {product.brand.name}
              </Link>
            )}
            <span
              className={`text-xs px-2.5 py-1 rounded-full ${
                product.part_type === "original"
                  ? "bg-green-50 text-green-700"
                  : product.part_type === "oem"
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-gray-50 text-gray-600"
              }`}
            >
              {partTypeLabel}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 leading-relaxed">{product.name}</h1>
          {product.name_en && (
            <p className="text-sm text-gray-400 ltr mt-1">{product.name_en}</p>
          )}

          {/* Rating + meta */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {rating && rating.count > 0 && (
              <div className="flex items-center gap-1.5">
                <StarRating value={rating.average} size={16} />
                <span className="text-sm text-gray-500">
                  ({toPersianDigits(rating.count)} دیدگاه)
                </span>
              </div>
            )}
            <span className="text-sm text-gray-400">
              {toPersianDigits(product.view_count)} بازدید
            </span>
          </div>

          {/* Codes */}
          <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
            {product.oem_code && (
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-gray-400 text-xs block">کد OEM</span>
                <span className="font-mono text-gray-700 ltr">{product.oem_code}</span>
              </div>
            )}
            {product.part_number && (
              <div className="bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-gray-400 text-xs block">شماره فنی</span>
                <span className="font-mono text-gray-700 ltr">{product.part_number}</span>
              </div>
            )}
          </div>

          {/* Variant selector */}
          {variants.length > 1 && (
            <div className="mt-5">
              <p className="text-sm font-medium text-gray-700 mb-2">انتخاب نوع:</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    disabled={!v.is_in_stock}
                    className={`px-3 py-2 rounded-xl text-sm border transition-all ${
                      selectedVariantId === v.id
                        ? "border-transparent bg-gradient-primary text-white shadow-md"
                        : v.is_in_stock
                        ? "border-gray-200 text-gray-700 hover:border-[#1e3a8a]"
                        : "border-gray-100 text-gray-300 line-through cursor-not-allowed"
                    }`}
                  >
                    {v.attributes && Object.values(v.attributes).length > 0
                      ? Object.values(v.attributes).join(" / ")
                      : v.sku}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price card */}
          <div className="mt-6 bg-white ring-1 ring-gray-100 shadow-card rounded-2xl p-5">
            {variant ? (
              <>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    {hasCompare && (
                      <div className="text-sm text-gray-400 line-through mb-1">
                        {formatPriceToman(Number(variant.compare_price))}
                      </div>
                    )}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-[#1e3a8a]">
                        {formatPriceToman(effectivePrice)}
                      </span>
                      <span className="text-sm text-gray-400 font-medium">تومان</span>
                    </div>
                    {flashPrice !== null && (
                      <span className="inline-block mt-1 text-xs text-white bg-gradient-to-l from-red-500 to-rose-500 px-2 py-0.5 rounded-full shadow-sm">
                        فروش ویژه
                      </span>
                    )}
                  </div>

                  {variant.is_in_stock ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <Check className="w-4 h-4" /> موجود در انبار
                    </span>
                  ) : (
                    <span className="text-red-500 text-sm">ناموجود</span>
                  )}
                </div>

                {variant.is_low_stock && variant.is_in_stock && (
                  <p className="text-xs text-orange-500 mt-2">
                    تنها {toPersianDigits(variant.stock)} عدد در انبار باقی مانده
                  </p>
                )}

                {/* Quantity + actions */}
                {variant.is_in_stock && (
                  <div className="flex items-center gap-3 mt-5">
                    <div className="flex items-center border border-gray-200 rounded-xl">
                      <button
                        onClick={() => setQuantity((q) => Math.min(variant.stock, q + 1))}
                        className="p-2.5 text-gray-500 hover:text-[#1e3a8a]"
                        aria-label="افزایش"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium">
                        {toPersianDigits(quantity)}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-2.5 text-gray-500 hover:text-[#1e3a8a]"
                        aria-label="کاهش"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={adding}
                      className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                        added
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-gradient-accent hover:brightness-110 text-white shadow-glow"
                      } disabled:opacity-70`}
                    >
                      {added ? (
                        <>
                          <Check className="w-5 h-5" /> به سبد اضافه شد
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          {adding ? "در حال افزودن..." : "افزودن به سبد خرید"}
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleWishlist}
                      className={`p-3 rounded-xl border transition-colors ${
                        inWishlist
                          ? "border-red-200 bg-red-50 text-red-500"
                          : "border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200"
                      }`}
                      aria-label="افزودن به علاقه‌مندی‌ها"
                    >
                      <Heart className={`w-5 h-5 ${inWishlist ? "fill-red-500" : ""}`} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400">قیمتی برای این محصول ثبت نشده است.</p>
            )}
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-5 text-center">
            {[
              { icon: ShieldCheck, label: "ضمانت اصالت" },
              { icon: Truck, label: "ارسال سریع" },
              { icon: RefreshCw, label: "۷ روز بازگشت" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bg-white ring-1 ring-gray-100 shadow-soft rounded-xl py-3 hover:-translate-y-0.5 transition-transform">
                <Icon className="w-5 h-5 text-[#1e3a8a] mx-auto mb-1" />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {(product.description || product.short_description) && (
        <section className="mt-10 bg-white ring-1 ring-gray-100 shadow-soft rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2.5">
            <span className="w-1.5 h-6 rounded-full bg-gradient-accent" />
            توضیحات محصول
          </h2>
          <p className="text-sm text-gray-600 leading-loose whitespace-pre-line">
            {product.description || product.short_description}
          </p>
        </section>
      )}

      {/* Compatibility */}
      {product.compatibilities && product.compatibilities.length > 0 && (
        <section className="mt-6 bg-white ring-1 ring-gray-100 shadow-soft rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
            <span className="w-1.5 h-6 rounded-full bg-gradient-accent" />
            خودروهای سازگار
          </h2>
          <div className="flex flex-wrap gap-2">
            {product.compatibilities.map((c) => (
              <span
                key={c.id}
                className="text-sm bg-blue-50 text-[#1e3a8a] px-3 py-1.5 rounded-xl ring-1 ring-blue-100"
              >
                {[c.car_brand?.name, c.car_model?.name, c.car_year?.year_shamsi]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <ProductReviews productId={product.id} />

      {/* Related */}
      {related && related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2.5">
            <span className="w-1.5 h-6 rounded-full bg-gradient-accent" />
            محصولات مرتبط
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

