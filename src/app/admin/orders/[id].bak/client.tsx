"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, User, MapPin, Package, Save, ExternalLink } from "lucide-react";
import { useDetail, useCrud } from "@/lib/admin";
import AdminHeader from "@/components/admin/ui/AdminHeader";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import Button from "@/components/admin/ui/Button";
import { SelectInput, TextInput, Field } from "@/components/admin/ui/fields";
import { formatDateTime, formatPriceToman, toPersianDigits } from "@/lib/utils";
import type { AdminOrderDetail } from "@/types/admin";

const STATUSES = [
  { value: "pending", label: "در انتظار پرداخت" },
  { value: "paid", label: "پرداخت شده" },
  { value: "processing", label: "در حال پردازش" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل داده شده" },
  { value: "cancelled", label: "لغو شده" },
  { value: "refunded", label: "بازپرداخت شده" },
];

function Card({ title, icon: Icon, children, action }: { title: string; icon: typeof User; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Icon className="h-4 w-4 text-[#1e3a8a]" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useDetail<AdminOrderDetail>("orders", id);
  const crud = useCrud("orders");

  const [form, setForm] = useState({ status: "", tracking_code: "", shipping_method: "", estimated_delivery: "" });
  useEffect(() => {
    if (order)
      setForm({
        status: order.status,
        tracking_code: order.tracking_code || "",
        shipping_method: order.shipping_method || "",
        estimated_delivery: order.estimated_delivery || "",
      });
  }, [order]);

  if (isLoading)
    return (
      <div className="flex h-64 items-center justify-center text-gray-300">
        <LoaderCircle className="h-7 w-7 animate-spin" />
      </div>
    );
  if (!order)
    return <p className="py-16 text-center text-gray-400">سفارش یافت نشد.</p>;

  const save = () =>
    crud.act.mutate({
      id: order.id,
      action: "update_status",
      method: "patch",
      data: { ...form, estimated_delivery: form.estimated_delivery || null },
    });

  return (
    <div className="max-w-5xl mx-auto">
      <AdminHeader title={`سفارش ${order.order_number}`} subtitle={formatDateTime(order.created_at)} backHref="/admin/orders">
        <StatusBadge label={order.status_display} status={order.status} className="text-sm px-3 py-1" />
      </AdminHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Items */}
          <Card title="اقلام سفارش" icon={Package}>
            <div className="divide-y divide-gray-50">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-gray-800">{it.product_name}</div>
                    <div className="ltr text-xs text-gray-400">{it.variant_sku}</div>
                  </div>
                  <div className="shrink-0 text-left">
                    <div className="text-gray-500">
                      {toPersianDigits(it.quantity)} × {formatPriceToman(Number(it.unit_price))}
                    </div>
                    <div className="font-medium text-gray-900">{formatPriceToman(Number(it.total_price))}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
              <Row label="جمع اقلام" value={formatPriceToman(Number(order.subtotal))} />
              <Row label="هزینه ارسال" value={formatPriceToman(Number(order.shipping_cost))} />
              {Number(order.discount_amount) > 0 && (
                <Row label="تخفیف" value={`- ${formatPriceToman(Number(order.discount_amount))}`} accent />
              )}
              <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-base font-black text-gray-900">
                <span>مبلغ کل</span>
                <span>{formatPriceToman(Number(order.total))}</span>
              </div>
            </div>
          </Card>

          {/* Address */}
          {order.address && (
            <Card title="آدرس تحویل" icon={MapPin}>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="font-medium text-gray-900">
                  {order.address.receiver_name} — <span className="ltr">{order.address.receiver_phone}</span>
                </p>
                <p>
                  {order.address.province}، {order.address.city}
                </p>
                <p>{order.address.address}</p>
                <p className="ltr text-xs text-gray-400">کد پستی: {toPersianDigits(order.address.postal_code)}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar: status mgmt + customer */}
        <div className="space-y-5">
          <Card title="مدیریت وضعیت" icon={Save}>
            <div className="space-y-3">
              <SelectInput label="وضعیت سفارش" options={STATUSES} value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
              <TextInput label="کد رهگیری مرسوله" ltr value={form.tracking_code} onChange={(e) => setForm((f) => ({ ...f, tracking_code: e.target.value }))} />
              <TextInput label="روش ارسال" value={form.shipping_method} onChange={(e) => setForm((f) => ({ ...f, shipping_method: e.target.value }))} />
              <Field label="تاریخ تحویل تخمینی">
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-100"
                  value={form.estimated_delivery || ""}
                  onChange={(e) => setForm((f) => ({ ...f, estimated_delivery: e.target.value }))}
                />
              </Field>
              <Button icon={<Save className="h-4 w-4" />} loading={crud.act.isPending} onClick={save} className="w-full">
                ذخیره تغییرات
              </Button>
            </div>
          </Card>

          <Card
            title="مشتری"
            icon={User}
            action={
              <Link href={`/admin/customers/${order.customer_id}`} className="text-gray-300 hover:text-[#1e3a8a]" aria-label="پروفایل مشتری">
                <ExternalLink className="h-4 w-4" />
              </Link>
            }
          >
            <div className="space-y-1 text-sm">
              <p className="font-medium text-gray-900">{order.customer_name}</p>
              {order.customer_phone && <p className="ltr text-gray-500">{order.customer_phone}</p>}
              {order.customer_email && <p className="ltr text-gray-500">{order.customer_email}</p>}
              {order.coupon_code && (
                <p className="text-xs text-gray-400">
                  کوپن: <span className="ltr">{order.coupon_code}</span>
                </p>
              )}
              {order.notes && <p className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-500">یادداشت: {order.notes}</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={accent ? "text-[#f97316]" : "text-gray-700"}>{value}</span>
    </div>
  );
}


