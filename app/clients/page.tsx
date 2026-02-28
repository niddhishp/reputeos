// app/clients/page.tsx - redirect to dashboard clients
import { redirect } from 'next/navigation';
export default function ClientsRoot() {
  redirect('/dashboard/clients');
}
