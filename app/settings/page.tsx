// app/settings/page.tsx
import { redirect } from 'next/navigation';

export default function SettingsRoot() {
  redirect('/dashboard/settings');
}
