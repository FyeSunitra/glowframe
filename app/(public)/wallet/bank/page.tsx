'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useToast } from '@/hooks/useToast';
import { money } from '@/lib/utils';
import type { Wallet } from '@/types';

const BANKS = ['เลือกธนาคาร', 'ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงเทพ', 'ธนาคารกรุงไทย'];

export default function WalletBankPage() {
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
    if ((wallet?.balance ?? 0) <= 0) { showToast('ยอดเงินคงเหลือไม่เพียงพอสำหรับการถอน'); return; }
    if (!agreed) { showToast('กรุณายอมรับข้อกำหนดและเงื่อนไขก่อนทำรายการ'); return; }
    showToast('ส่งคำขอถอนเงินเรียบร้อยแล้ว');
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['Wallet', 'ถอนเงิน', 'บัญชีธนาคาร']} />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px] max-w-[520px]">
        <div className="bg-gf-pink-100 rounded-[14px] [padding:14px] [margin-bottom:18px] text-[13px] text-gf-brown-700 [line-height:1.6]">
          Simulated prototype wallet: bank details are captured for demo flow only and are not sent to a banking provider.
        </div>
        <div className="flex justify-between [margin-bottom:20px] font-semibold">
          <span>ยอดเงินที่สามารถใช้ได้</span>
          <span>฿ {money(wallet?.balance ?? 0)}</span>
        </div>

        <Field label="ธนาคารปลายทาง">
          <select value={bank} onChange={(e) => setBank(e.target.value)} className="w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none">
            {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="เลขที่บัญชี">
          <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="123-4-56789-0" className="w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none" />
        </Field>
        <Field label="จำนวนเงิน">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="฿ 1.00" className="w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none" />
        </Field>

        <div className="flex gap-[10px] items-start [margin-top:10px] text-[14px] text-gf-brown-700">
          <input type="checkbox" id="wd-agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="[margin-top:3px]" />
          <label htmlFor="wd-agree">I agree to the Terms &amp; Conditions, Privacy Policy, and Rental Policy.</label>
        </div>

        <button onClick={submit} className="w-full bg-gf-pink-500 text-gf-brown-900 border-0 rounded-full [padding:13px_26px] font-semibold text-[15px] cursor-pointer [margin-top:16px]">
          โอนเงินเข้าบัญชีธนาคาร
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
