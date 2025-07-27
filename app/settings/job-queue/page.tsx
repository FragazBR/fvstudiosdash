import { Metadata } from 'next'
import JobQueueDashboard from '@/components/job-queue-dashboard'

export const metadata: Metadata = {
  title: 'Job Queue Dashboard | FVStudios Dashboard',
  description: 'Monitore e gerencie o sistema de filas de jobs distribuído',
}

export default function JobQueuePage() {
  return (
    <div className="container mx-auto py-6">
      <JobQueueDashboard />
    </div>
  )
}