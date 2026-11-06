import { fakeProducts } from "@/lib/fake-data";
import ProductDetailClient from "./client";

export async function generateStaticParams() {
  return fakeProducts.map((p) => ({ slug: p.slug }));
}

export default function Page() {
  return <ProductDetailClient />;
}
