"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, User, ShoppingBag, Save } from "lucide-react";
import api from "@/lib/api";
import { useDetail, useCrud } from "@/lib/admin";
import AdminHeader from "@/components/admin/ui/AdminHeader";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import Button from "@/components/admin/ui/Button";
import { TextInput, Switch } from "@/components/admin/ui/fields";
import { formatDate, formatDateTime, formatPriceToman, toPersianDigits } from "@/lib/utils";
import type { AdminCustomer, AdminOrderListItem } from "@/types/admin";

function Card({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Icon className="h-4 w-4 text-[#1e3a8a]" />
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: customer, isLoading } = useDetail<AdminCustomer>("customers", id);
  const crud = useCrud("customers");

  const { data: orders } = useQuery<AdminOrderListItem[]>({
    queryKey: ["admin", "customer-orders", id],
    queryFn: () => api.get(`/dashboard/customers/${id}/orders/`).then((r) => r.data),
    enabled: !!id,
  });

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    national_code: "",
    is_active: true,
    is_staff: false,
    is_verified: false,
  });
  useEffect(() => {
    if (customer)
      setForm({
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        email: customer.email || "",
        national_code: customer.national_code || "",
        is_active: customer.is_active,
        is_staff: customer.is_staff,
        is_verified: customer.is_verified,
      });
  }, [customer]);

  if (isLoading)
    return (
      <div className="flex h-64 items-center justify-center text-gray-300">
        <LoaderCircle className="h-7 w-7 animate-spin" />
      </div>
    );
  if (!customer) return <p className="py-16 text-center text-gray-400">مشتری یافت نشد.</p>;

  return (
    <div className="max-w-5xl mx-auto">
      <AdminHeader title={customer.full_name || "مشتری"} subtitle={customer.phone || customer.email || ""} backHref="/admin/customers" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Stats + profile edit */}
        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="سفارش‌ها" value={toPersianDigits(customer.orders_count)} />
            <Stat label="مجموع خرید" value={formatPriceToman(customer.total_spent)} />
          </div>

          <Card title="ویرایش پروفایل" icon={User}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="نام" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
                <TextInput label="نام خانوادگی" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
              </div>
              <TextInput label="ایمیل" ltr value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              <TextInput label="کد ملی" ltr value={form.national_code} onChange={(e) => setForm((f) => ({ ...f, national_code: e.target.value }))} />
              <div className="space-y-1 rounded-xl border border-gray-200 px-3.5 py-2">
                <Switch label="حساب فعال" checked={form.is_active} onChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <Switch label="تأییدشده" checked={form.is_verified} onChange={(v) => setForm((f) => ({ ...f, is_verified: v }))} />
                <Switch label="دسترسی مدیریت (کارمند)" checked={form.is_staff} onChange={(v) => setForm((f) => ({ ...f, is_staff: v }))} />
              </div>
              <Button
                icon={<Save className="h-4 w-4" />}
                loading={crud.update.isPending}
                onClick={() => crud.update.mutate({ id: customer.id, data: form })}
                className="w-full"
              >
                ذخیره پروفایل
              </Button>
            </div>
          </Card>
        </div>

        {/* Orders */}
        <div className="lg:col-span-3">
          <Card title="سفارش‌های مشتری" icon={ShoppingBag}>
            {!orders || orders.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">این مشتری سفارشی ثبت نکرده است.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => router.push(`/admin/orders/${o.id}`)}
                    className="flex w-full items-center justify-between gap-3 py-3 text-right transition-colors hover:bg-blue-50/40"
                  >
                    <div className="min-w-0">
                      <div className="ltr font-bold text-[#1e3a8a]">{o.order_number}</div>
                      <div className="text-xs text-gray-400">{formatDateTime(o.created_at)}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-medium text-gray-700">{formatPriceToman(Number(o.total))}</span>
                      <StatusBadge label={o.status_display} status={o.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <p className="mt-3 text-center text-xs text-gray-400">عضویت از {formatDate(customer.created_at)}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
      <div className="text-lg font-black text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}


