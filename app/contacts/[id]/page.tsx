import ContactDetailPage from "@/components/contact-detail-page"

import { type PageProps } from "next"

export default function ContactDetail({ params }: PageProps<{ id: string }>) {
  return <ContactDetailPage id={params.id} />
}
