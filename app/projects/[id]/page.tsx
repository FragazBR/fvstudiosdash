"use client";
import ProjectDetailPage from "@/components/project-detail-page"

export default function ProjectDetail({
  params,
}: {
  params: { id: string }
}) {
  return <ProjectDetailPage id={params.id} />
}
