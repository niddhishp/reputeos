// app/dashboard/page.tsx - Redirect to clients
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  redirect('/clients');
}
