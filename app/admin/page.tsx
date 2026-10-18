import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getBranding } from '@/lib/branding';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  let branding;
  try {
    branding = await getBranding();
  } catch (error) {
    console.error('Unable to load branding in admin dashboard:', error);
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F4EE] p-6 text-[#26343A]">
        <section className="max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="font-serif text-2xl">Dashboard setup incomplete</h1>
          <p className="mt-3 text-sm leading-6 text-[#687D8C]">
            Could not load branding settings. Apply the branding migration to your
            Supabase project and try again.
          </p>
        </section>
      </main>
    );
  }

  return <AdminDashboard initialBranding={branding} />;
}
