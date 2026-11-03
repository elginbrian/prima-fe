import { redirect } from "next/navigation";

export default function GuaranteesRedirectPage() {
  redirect("/dashboard/overview?lens=guarantees");
}
