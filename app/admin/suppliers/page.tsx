'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ErrorExplainer } from '@/components/feedback/ErrorExplainer';
import { api } from '@/lib/api';

interface Application { userId: string; businessName: string; cacNumber: string; address: string; state: string; lga: string; categories: string[] }

export default function Suppliers() {
  const t = useTranslations('admin.kyb');
  const q = useQuery({ queryKey: ['admin', 'kyb'], queryFn: () => api<Application[]>('/admin/suppliers?status=PENDING') });
  if (q.error) return <ErrorExplainer error={q.error} onRetry={() => void q.refetch()} />;
  return (
    <div className="space-y-3">
      <h2 className="font-semibold">{t('pending')}</h2>
      {q.data?.length === 0 && <p className="text-neutral-700">{t('none')}</p>}
      <ul className="space-y-3">
        {q.data?.map((a) => (
          <li key={a.userId} className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4" data-testid="application">
            <p className="font-semibold">{a.businessName}</p>
            <p className="text-sm text-neutral-700">CAC {a.cacNumber} · {a.address}, {a.lga}, {a.state}</p>
            <p className="text-sm">{a.categories.join(', ')}</p>
            <Link
              href={`/admin/suppliers/${encodeURIComponent(a.userId)}`}
              className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 font-bold text-white"
            >
              Review application
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
