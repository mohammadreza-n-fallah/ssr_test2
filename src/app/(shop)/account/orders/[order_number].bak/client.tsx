"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  MapPin,
  Truck,
  CreditCard,
  XCircle,
  LoaderCircle,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { formatPriceToman, formatDateTime, toPersianDigits } from "@/lib/utils";
import type { Order } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  paid: "bg-blue-50 text-blue-700",
  processing: "bg-indigo-50 text-indigo-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
  refunded: "bg-gray-100 text-gray-600",
};

const STEPS = [
  { key: "pending", label: "ثبت سفارش" },
  { key: "paid", label: "پرداخت" },
  { key: "processing", label: "آماده‌سازی" },
  { key: "shipped", label: "ارسال" },
  { key: "delivered", label: "تحویل" },
];

export default function OrderDetailPage() {
  const params = useParams();
  const orderNumber = params.order_number as string;
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState("");
  // Read the ?created=1 flag client-side (avoids a Suspense boundary requirement).
  const [justCreated, setJustCreated] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setJustCreated(new URLSearchParams(window.location.search).get("created") === "1");
    }
  }, []);

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ["order", orderNumber],
    queryFn: () => api.get(`/orders/${orderNumber}/`).then((r) => r.data),
    enabled: !!orderNumber,
  });

  const payNow = useMutation({
    mutationFn: () => api.post(`/payments/pay/${orderNumber}/`),
    onSuccess: ({ data }) => {
      if (data.redirect_url) window.location.href = data.redirect_url;
    },
    onError: (err: any) =>
      setActionError(err.response?.data?.detail || "خطا در اتصال به درگاه پرداخت"),
  });

  const cancelOrder = useMutation({
    mutationFn: () => api.post(`/orders/${orderNumber}/cancel/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order", orderNumber] }),
    onError: (err: any) =>
      setActionError(err.response?.data?.detail || "خطا در لغو سفارش"),
  });

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-400">
        <LoaderCircle className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="bg-white ring-1 ring-gray-100 shadow-soft rounded-2xl py-16 text-center">
        <p className="text-gray-500 mb-4">سفارش یافت نشد.</p>
        <Link
          href="/account/orders"
          className="text-[#1e3a8a] text-sm font-medium"
        >
          بازگشت به سفارش‌ها
        </Link>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";
  const canPay = order.status === "pending";
  const canCancel = order.status === "pending" || order.status === "paid";

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1e3a8a]"
      >
        <ChevronRight className="w-4 h-4" />
        بازگشت به سفارش‌ها
      </Link>

      {justCreated && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
          <div>
            <p className="font-bold text-green-800 text-sm">سفارش شما ثبت شد</p>
            <p className="text-green-600 text-xs mt-0.5">
              در صورت عدم تکمیل پرداخت، می‌توانید از همین صفحه اقدام کنید.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white ring-1 ring-gray-100 shadow-soft rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-bold text-gray-900 ltr font-mono">
              {order.order_number}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              ثبت شده در {formatDateTime(order.created_at)}
            </p>
          </div>
          <span
            className={`text-sm px-3 py-1.5 rounded-full font-medium ${
              STATUS_STYLES[order.status] || "bg-gray-100 text-gray-600"
            }`}
          >
            {order.status_display}
          </span>
        </div>

        {/* Progress timeline */}
        {!isCancelled && (
          <div className="mt-6 flex items-center">
            {STEPS.map((step, i) => {
              const done = i <= currentStepIndex;
              return (
                <div key={step.key} className="flex-1 flex items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                        done ? "bg-[#1e3a8a] text-white" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {done ? <CheckCircle2 className="w-4 h-4" /> : toPersianDigits(i + 1)}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 ${
                        done ? "text-[#1e3a8a] font-medium" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 -mt-5 ${
                        i < currentStepIndex ? "bg-[#1e3a8a]" : "bg-gray-100"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {order.tracking_code && (
          <div className="mt-5 bg-purple-50 rounded-xl p-3 flex items-center gap-2 text-sm">
            <Truck className="w-4 h-4 text-purple-600" />
            <span className="text-gray-600">کد رهگیری مرسوله:</span>
            <span className="font-mono font-bold text-purple-700 ltr">
              {order.tracking_code}
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white ring-1 ring-gray-100 shadow-soft rounded-2xl p-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-[#1e3a8a]" />
          اقلام سفارش
        </h2>
        <div className="divide-y divide-gray-50">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">
                  {item.product_name}
                </p>
                <p className="text-xs text-gray-400 ltr mt-0.5">{item.variant_sku}</p>
              </div>
              <div className="text-left shrink-0 mr-3">
                <p className="text-sm font-bold text-gray-800">
                  {formatPriceToman(Number(item.total_price))}
                </p>
                <p className="text-xs text-gray-400">
                  {toPersianDigits(item.quantity)} × {formatPriceToman(Number(item.unit_price))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Address */}
      {order.address && (
        <div className="bg-white ring-1 ring-gray-100 shadow-soft rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-[#1e3a8a]" />
            آدرس تحویل
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {order.address.province}، {order.address.city}، {order.address.address}
          </p>
          <p className="text-xs text-gray-400 mt-1 ltr">
            {order.address.receiver_name} — {order.address.receiver_phone}
            {order.address.postal_code && ` — ${order.address.postal_code}`}
          </p>
        </div>
      )}

      {/* Totals */}
      <div className="bg-white ring-1 ring-gray-100 shadow-soft rounded-2xl p-5">
        <h2 className="font-bold text-gray-900 mb-4">صورتحساب</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>مبلغ کالاها</span>
            <span>{formatPriceToman(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>هزینه ارسال</span>
            <span>
              {Number(order.shipping_cost) === 0
                ? "رایگان"
                : formatPriceToman(Number(order.shipping_cost))}
            </span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>تخفیف</span>
              <span>− {formatPriceToman(Number(order.discount_amount))}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>مبلغ کل</span>
            <span className="text-[#1e3a8a] text-lg">
              {formatPriceToman(Number(order.total))}
            </span>
          </div>
        </div>
      </div>

      {actionError && <p className="text-red-500 text-sm">{actionError}</p>}

      {/* Actions */}
      {(canPay || canCancel) && (
        <div className="flex gap-3">
          {canPay && (
            <button
              onClick={() => payNow.mutate()}
              disabled={payNow.isPending}
              className="flex-1 bg-gradient-accent hover:brightness-110 disabled:opacity-60 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              {payNow.isPending ? "در حال اتصال..." : "پرداخت سفارش"}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => cancelOrder.mutate()}
              disabled={cancelOrder.isPending}
              className="flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 px-5 py-3 rounded-xl font-medium transition-colors"
            >
              <XCircle className="w-5 h-5" />
              لغو سفارش
            </button>
          )}
        </div>
      )}
    </div>
  );
}


