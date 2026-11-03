import { redirect } from "next/navigation";

export default function NextActionRedirectPage() {
  redirect("/dashboard/overview?lens=sla-actions");
}
