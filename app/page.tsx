import type { Metadata } from "next";
import { MiniCrmApp } from "./MiniCrmApp";

export const metadata: Metadata = {
  title: "Mini CRM",
  description:
    "Mini CRM dengan login, CRUD client, lead status, notes, filter, dan dashboard.",
};

export default function Home() {
  return <MiniCrmApp />;
}
