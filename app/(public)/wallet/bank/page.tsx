'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useToast } from '@/hooks/useToast';
import { money } from '@/lib/utils';
import type { Wallet } from '@/types';
import { getPageText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

export default function WalletBankPage() {
  const t = getPageText(useAppStore((s) => s.locale), 'wallet');
  const banks = [t.selectBank, 'ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงเทพ', 'ธนาคารกรุงไทย'];
  const { showToast } = useToast();
  const [bank, setBank] = useState('');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [agreed, setAgreed] = useState(false);

  const { data: wallet } = useQuery<Wallet>({
    queryKey: ['wallet'],
    queryFn: async () => (await axios.get('/api/wallet')).data.data,
  });

  function submit() {
    if ((wallet?.balance ?? 0) <= 0) { showToast(t.insufficientBalance); return; }
    if (!agreed) { showToast(t.acceptTerms); return; }
    showToast(t.requestSubmitted);
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.title, t.withdraw, t.bankAccount]} />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px] max-w-[520px]">
        <div className="flex justify-between [margin-bottom:20px] font-semibold">
          <span>{t.availableBalance}</span>
          <span>฿ {money(wallet?.balance ?? 0)}</span>
        </div>

        <Field label={t.destinationBank}>
          <select value={bank} onChange={(e) => setBank(e.target.value)} className="w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none">
            {banks.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label={t.accountNumber}>
          <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="123-4-56789-0" className="w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none" />
        </Field>
        <Field label={t.amount}>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="฿ 1.00" className="w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none" />
        </Field>

        <div className="flex gap-[10px] items-start [margin-top:10px] text-[14px] text-gf-brown-700">
          <input type="checkbox" id="wd-agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="[margin-top:3px]" />
          <label htmlFor="wd-agree">{t.agreement}</label>
        </div>

        <button onClick={submit} className="w-full bg-gf-pink-500 text-gf-brown-900 border-0 rounded-full [padding:13px_26px] font-semibold text-[15px] cursor-pointer [margin-top:16px]">
          {t.transferToBank}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="[margin-bottom:18px]">
      <label className="block text-[13.5px] font-semibold text-gf-brown-800 [margin-bottom:8px]">{label}</label>
      {children}
    </div>
  );
}
