"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LoaderCircle, Info, Layers, Images, Car, Save, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useDetail, useCrud } from "@/lib/admin";
import AdminHeader from "@/components/admin/ui/AdminHeader";
import Button from "@/components/admin/ui/Button";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import { cn, toPersianDigits } from "@/lib/utils";
import ProductInfoForm, { emptyProduct, type ProductFormValues } from "@/components/admin/products/ProductInfoForm";
import VariantsManager from "@/components/admin/products/VariantsManager";
import ImagesManager from "@/components/admin/products/ImagesManager";
import CompatibilityManager from "@/components/admin/products/CompatibilityManager";
import type { AdminProduct } from "@/types/admin";

function payload(v: ProductFormValues) {
  const out: Record<string, unknown> = { ...v };
  out.category = v.category || null;
  out.brand = v.brand || null;
  if (!out.slug) delete out.slug;
  out.weight = v.weight === "" ? 0 : Number(v.weight);
  return out;
}

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useDetail<AdminProduct>("products", id);
  const crud = useCrud("products");

  const [tab, setTab] = useState<"info" | "variants" | "images" | "compat">("info");
  const [form, setForm] = useState<ProductFormValues>(emptyProduct);

  useEffect(() => {
    if (product)
      setForm({
        name: product.name,
        name_en: product.name_en,
        sku: product.sku,
        slug: product.slug,
        oem_code: product.oem_code,
        part_number: product.part_number,
        category: product.category ?? "",
        brand: product.brand ?? "",
        part_type: product.part_type,
        short_description: product.short_description,
        description: product.description,
        weight: product.weight,
        meta_title: product.meta_title,
        meta_description: product.meta_description,
        is_active: product.is_active,
        is_featured: product.is_featured,
      });
  }, [product]);

  if (isLoading)
    return (
      <div className="flex h-64 items-center justify-center text-gray-300">
        <LoaderCircle className="h-7 w-7 animate-spin" />
      </div>
    );
  if (!product) return <p className="py-16 text-center text-gray-400">محصول یافت نشد.</p>;

  const tabs = [
    { key: "info", label: "اطلاعات", icon: Info },
    { key: "variants", label: "تنوع‌ها", icon: Layers, count: product.variants.length },
    { key: "images", label: "تصاویر", icon: Images, count: product.images.length },
    { key: "compat", label: "سازگاری", icon: Car, count: product.compatibilities.length },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto">
      <AdminHeader title={product.name} subtitle={`کد: ${product.sku}`} backHref="/admin/products">
        <StatusBadge label={product.is_active ? "فعال" : "غیرفعال"} status={product.is_active ? "active" : "inactive"} />
        <Link href={`/products/${product.slug}`} target="_blank" className="rounded-lg p-2 text-gray-400 hover:text-[#1e3a8a]" title="مشاهده در فروشگاه">
          <ExternalLink className="h-4 w-4" />
        </Link>
      </AdminHeader>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors",
              tab === t.key ? "border-[#f97316] font-bold text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {"count" in t && t.count !== undefined && (
              <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-500">{toPersianDigits(t.count)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {tab === "info" && (
          <>
            <ProductInfoForm value={form} onChange={setForm} />
            <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
              <Button icon={<Save className="h-4 w-4" />} loading={crud.update.isPending} onClick={() => crud.update.mutate({ id: product.id, data: payload(form) })}>
                ذخیره تغییرات
              </Button>
            </div>
          </>
        )}
        {tab === "variants" && <VariantsManager productId={product.id} />}
        {tab === "images" && <ImagesManager productId={product.id} />}
        {tab === "compat" && <CompatibilityManager productId={product.id} />}
      </div>
    </div>
  );
}


