'use client';

import { useEffect, useState } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AccountTabs } from '../AccountTabs';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/useToast';
import { getPageText } from '@/lib/menuI18n';
import { addressService } from '@/services/address';
import { locationService } from '@/services/location';
import type { Address, AddressPayload } from '@/types/address';
import type { District, Province, Subdistrict } from '@/types/location';

const EMPTY_FORM: AddressPayload = {
  label: '',
  recipientName: '',
  recipientPhone: '',
  addressLine: '',
  province: '',
  district: '',
  subdistrict: '',
  postalCode: '',
  landmark: '',
  isDefault: false,
};

export default function AccountAddressPage() {
  const locale = useAppStore((state) => state.locale);
  const user = useAppStore((state) => state.user);
  const addresses = useAppStore((state) => state.addresses);
  const setAddresses = useAppStore((state) => state.setAddresses);
  const accountText = getPageText(locale, 'account');
  const t = accountText.address;
  const { showToast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressPayload>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [subdistrictId, setSubdistrictId] = useState('');
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);

  async function loadAddresses() {
    setIsLoading(true);
    setLoadFailed(false);
    const result = await addressService.list();
    setIsLoading(false);
    if (!result.success) {
      setLoadFailed(true);
      return;
    }
    setAddresses(result.data);
  }

  useEffect(() => {
    let active = true;

    void Promise.all([addressService.list(), locationService.provinces()]).then(
      ([addressResult, provinceResult]) => {
      if (!active) return;
      setIsLoading(false);
      setIsLoadingProvinces(false);
      if (!addressResult.success) {
        setLoadFailed(true);
      } else {
        setAddresses(addressResult.data);
      }
      if (provinceResult.success) {
        setProvinces(provinceResult.data);
      }
    },
    );

    return () => {
      active = false;
    };
  }, [setAddresses]);

  function openForm() {
    setForm({
      ...EMPTY_FORM,
      recipientName: user.fullName || user.displayName,
      recipientPhone: user.phone ?? '',
      isDefault: addresses.length === 0,
    });
    setProvinceId('');
    setDistrictId('');
    setSubdistrictId('');
    setDistricts([]);
    setSubdistricts([]);
    setEditingAddressId(null);
    setFormOpen(true);
  }

  async function editAddress(address: Address) {
    setForm({
      label: address.label,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      addressLine: address.addressLine,
      province: address.province,
      district: address.district,
      subdistrict: address.subdistrict,
      postalCode: address.postalCode,
      landmark: address.landmark,
      isDefault: address.isDefault,
    });
    setEditingAddressId(address.id);
    setFormOpen(true);
    setDistricts([]);
    setSubdistricts([]);
    setProvinceId('');
    setDistrictId('');
    setSubdistrictId('');

    const province = provinces.find((item) => item.nameTh === address.province);
    if (!province) {
      showToast(t.locationLoadFailed);
      return;
    }

    setProvinceId(province.id.toString());
    setIsLoadingDistricts(true);
    const districtResult = await locationService.districts(province.id);
    setIsLoadingDistricts(false);
    if (!districtResult.success) {
      showToast(t.locationLoadFailed);
      return;
    }
    setDistricts(districtResult.data);

    const district = districtResult.data.find(
      (item) => item.nameTh === address.district,
    );
    if (!district) return;

    setDistrictId(district.id.toString());
    setIsLoadingSubdistricts(true);
    const subdistrictResult = await locationService.subdistricts(district.id);
    setIsLoadingSubdistricts(false);
    if (!subdistrictResult.success) {
      showToast(t.locationLoadFailed);
      return;
    }
    setSubdistricts(subdistrictResult.data);

    const subdistrict = subdistrictResult.data.find(
      (item) => item.nameTh === address.subdistrict,
    );
    if (subdistrict) setSubdistrictId(subdistrict.id.toString());
  }

  function closeForm() {
    setFormOpen(false);
    setEditingAddressId(null);
    setForm(EMPTY_FORM);
  }

  function updateField<K extends keyof AddressPayload>(field: K, value: AddressPayload[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function selectProvince(value: string | null) {
    const nextId = value ?? '';
    const selected = provinces.find((province) => province.id.toString() === nextId);
    setProvinceId(nextId);
    setDistrictId('');
    setSubdistrictId('');
    setDistricts([]);
    setSubdistricts([]);
    setForm((current) => ({
      ...current,
      province: selected?.nameTh ?? '',
      district: '',
      subdistrict: '',
      postalCode: '',
    }));
    if (!selected) return;

    setIsLoadingDistricts(true);
    const result = await locationService.districts(selected.id);
    setIsLoadingDistricts(false);
    if (!result.success) {
      showToast(t.locationLoadFailed);
      return;
    }
    setDistricts(result.data);
  }

  async function selectDistrict(value: string | null) {
    const nextId = value ?? '';
    const selected = districts.find((district) => district.id.toString() === nextId);
    setDistrictId(nextId);
    setSubdistrictId('');
    setSubdistricts([]);
    setForm((current) => ({
      ...current,
      district: selected?.nameTh ?? '',
      subdistrict: '',
      postalCode: '',
    }));
    if (!selected) return;

    setIsLoadingSubdistricts(true);
    const result = await locationService.subdistricts(selected.id);
    setIsLoadingSubdistricts(false);
    if (!result.success) {
      showToast(t.locationLoadFailed);
      return;
    }
    setSubdistricts(result.data);
  }

  function selectSubdistrict(value: string | null) {
    const nextId = value ?? '';
    const selected = subdistricts.find(
      (subdistrict) => subdistrict.id.toString() === nextId,
    );
    setSubdistrictId(nextId);
    setForm((current) => ({
      ...current,
      subdistrict: selected?.nameTh ?? '',
      postalCode: selected ? selected.zipCode.toString() : '',
    }));
  }

  async function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value,
      ]),
    ) as unknown as AddressPayload;

    if (
      !payload.label ||
      !payload.recipientName ||
      !payload.recipientPhone ||
      !payload.addressLine ||
      !payload.province ||
      !payload.district ||
      !payload.subdistrict ||
      !payload.postalCode
    ) {
      showToast(t.required);
      return;
    }
    if (!/^[0-9+\-()\s]{8,20}$/.test(payload.recipientPhone)) {
      showToast(t.invalidPhone);
      return;
    }
    if (!/^\d{5}$/.test(payload.postalCode)) {
      showToast(t.invalidPostalCode);
      return;
    }

    setIsSaving(true);
    const result =
      editingAddressId === null
        ? await addressService.create(payload)
        : await addressService.update(editingAddressId, payload);
    setIsSaving(false);
    if (!result.success) {
      showToast(t.saveFailed);
      return;
    }

    await loadAddresses();
    closeForm();
    showToast(editingAddressId === null ? t.saved : t.updated);
  }

  async function deleteAddress(id: number) {
    const result = await addressService.delete(id);
    if (!result.success) {
      showToast(t.deleteFailed);
      setDeleteTarget(null);
      return;
    }
    await loadAddresses();
    setDeleteTarget(null);
    showToast(t.deleted);
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[accountText.myAccount, t.breadcrumb]} />
      <AccountTabs active="address" />

      <div className="overflow-hidden rounded-[20px] bg-white shadow-[var(--gf-shadow)]">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-gf-line px-5 py-5 sm:px-7">
          <div>
            <h1 className="m-0 text-[19px] font-bold text-gf-brown-900">{t.title}</h1>
            <p className="mb-0 mt-1 text-sm leading-6 text-gf-muted">{t.subtitle}</p>
          </div>
          {!formOpen && (
            <button
              type="button"
              onClick={openForm}
              className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full border-0 bg-gf-brown-800 px-5 py-2 text-sm font-semibold text-gf-pink-100"
            >
              <Plus size={17} />
              {t.add}
            </button>
          )}
        </header>

        <div className="px-5 py-6 sm:px-7">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gf-muted">{t.loading}</div>
          ) : loadFailed ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="m-0 text-sm text-gf-muted">{t.loadFailed}</p>
              <button
                type="button"
                onClick={() => void loadAddresses()}
                className="cursor-pointer rounded-full border border-gf-brown-300 bg-white px-5 py-2.5 text-sm font-semibold text-gf-brown-800"
              >
                {t.retry}
              </button>
            </div>
          ) : (
            <>
              {addresses.length === 0 && !formOpen && (
                <div className="flex flex-col items-center gap-3 py-10 text-center text-gf-muted">
                  <MapPin size={28} />
                  <p className="m-0 text-sm">{t.empty}</p>
                </div>
              )}

              <div className="grid gap-3 py-4">
                {addresses.map((address) => (
                  <article
                    key={address.id}
                    className="flex items-start justify-between gap-4 rounded-[14px] border border-gf-line px-4 py-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="m-0 text-[14.5px] font-bold text-gf-brown-900">
                          {address.label}
                        </h2>
                        {address.isDefault && (
                          <span className="rounded-full bg-gf-pink-100 px-2.5 py-1 text-[11px] font-semibold text-gf-brown-800">
                            {t.defaultAddress}
                          </span>
                        )}
                      </div>
                      <p className="mb-0 mt-2 text-sm font-medium text-gf-brown-700">
                        {address.recipientName} · {t.phonePrefix} {address.recipientPhone}
                      </p>
                      <p className="mb-0 mt-1 text-sm leading-6 text-gf-muted">{address.detail}</p>
                      {address.landmark && (
                        <p className="mb-0 mt-1 text-xs leading-5 text-gf-muted">
                          {address.landmark}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void editAddress(address)}
                        aria-label={`${t.edit} ${address.label}`}
                        title={t.edit}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gf-brown-300 bg-white text-gf-brown-700 hover:bg-gf-pink-100"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(address)}
                        aria-label={`${t.delete} ${address.label}`}
                        title={t.delete}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gf-brown-300 bg-white text-gf-brown-700 hover:bg-gf-pink-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {formOpen && (
                <form onSubmit={saveAddress} className="mt-2">
                  <h2 className="mb-5 mt-0 text-base font-bold text-gf-brown-900">
                    {editingAddressId === null ? t.add : t.edit}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label={t.label} htmlFor="address-label">
                      <Input id="address-label" value={form.label} maxLength={80} placeholder={t.labelPlaceholder} onChange={(event) => updateField('label', event.target.value)} />
                    </Field>
                    {/* <Field label={t.recipientName} htmlFor="recipient-name">
                      <Input id="recipient-name" value={form.recipientName} maxLength={160} placeholder={t.recipientNamePlaceholder} autoComplete="name" onChange={(event) => updateField('recipientName', event.target.value)} />
                    </Field> */}
                    <Field label={t.phone} htmlFor="recipient-phone">
                      <Input id="recipient-phone" type="tel" value={form.recipientPhone} maxLength={20} placeholder={t.phonePlaceholder} autoComplete="tel" onChange={(event) => updateField('recipientPhone', event.target.value)} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label={t.detail} htmlFor="address-line">
                        <Textarea id="address-line" value={form.addressLine} maxLength={500} placeholder={t.detailPlaceholder} autoComplete="street-address" className="min-h-24" onChange={(event) => updateField('addressLine', event.target.value)} />
                      </Field>
                    </div>
                    <Field label={t.province} htmlFor="province">
                      <Select
                        value={provinceId}
                        onValueChange={(value) => void selectProvince(value)}
                        disabled={isLoadingProvinces || provinces.length === 0}
                      >
                        <SelectTrigger id="province">
                          <SelectValue
                            placeholder={
                              isLoadingProvinces ? t.loadingLocations : t.chooseProvince
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((province) => (
                            <SelectItem key={province.id} value={province.id.toString()}>
                              {locale === 'th' ? province.nameTh : province.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label={t.district} htmlFor="district">
                      <Select
                        value={districtId}
                        onValueChange={(value) => void selectDistrict(value)}
                        disabled={!provinceId || isLoadingDistricts}
                      >
                        <SelectTrigger id="district">
                          <SelectValue
                            placeholder={
                              isLoadingDistricts ? t.loadingLocations : t.chooseDistrict
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((district) => (
                            <SelectItem key={district.id} value={district.id.toString()}>
                              {locale === 'th' ? district.nameTh : district.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label={t.subdistrict} htmlFor="subdistrict">
                      <Select
                        value={subdistrictId}
                        onValueChange={selectSubdistrict}
                        disabled={!districtId || isLoadingSubdistricts}
                      >
                        <SelectTrigger id="subdistrict">
                          <SelectValue
                            placeholder={
                              isLoadingSubdistricts
                                ? t.loadingLocations
                                : t.chooseSubdistrict
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {subdistricts.map((subdistrict) => (
                            <SelectItem
                              key={subdistrict.id}
                              value={subdistrict.id.toString()}
                            >
                              {locale === 'th'
                                ? subdistrict.nameTh
                                : subdistrict.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label={t.postalCode} htmlFor="postal-code">
                      <Input
                        id="postal-code"
                        inputMode="numeric"
                        value={form.postalCode}
                        placeholder={t.postalCodeAuto}
                        autoComplete="postal-code"
                        readOnly
                        aria-readonly="true"
                        className="bg-gf-pink-50"
                      />
                    </Field>
                    
                    {/* <div className="sm:col-span-2">
                      <Field label={t.landmark} htmlFor="landmark">
                        <Input id="landmark" value={form.landmark} maxLength={500} placeholder={t.landmarkPlaceholder} onChange={(event) => updateField('landmark', event.target.value)} />
                      </Field>
                    </div> */}
                  </div>

                  <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gf-brown-800">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(event) => updateField('isDefault', event.target.checked)}
                      className="h-4 w-4 accent-gf-brown-800"
                    />
                    {t.setDefault}
                  </label>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="min-h-11 cursor-pointer rounded-full border-0 bg-gf-brown-800 px-6 py-2.5 text-sm font-semibold text-gf-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving
                        ? t.saving
                        : editingAddressId === null
                          ? t.save
                          : t.update}
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={closeForm}
                      className="min-h-11 cursor-pointer rounded-full border border-gf-brown-300 bg-white px-6 py-2.5 text-sm font-semibold text-gf-brown-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t.cancel}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) void deleteAddress(deleteTarget.id);
        }}
      />
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor} className="mb-2">
        {label}
      </Label>
      {children}
    </div>
  );
}
