"use client";
import ProjectDetailPage from "@/components/project-detail-page"
import { use } from "react";

export default function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  return <ProjectDetailPage id={id} />
}
