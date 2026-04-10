import { redirect } from "next/navigation";

/** 行程详情在 /trips/[tripId]；根路径无列表页，统一到首页选行程。 */
export default function TripsIndexPage() {
  redirect("/");
}
