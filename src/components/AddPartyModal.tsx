import React, { useState } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  User,
  CreditCard,
  FileText,
  AlertCircle,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { PartyRecord } from '../types';
import { isValidPanVat } from '../utils/nepaliCalendar';

interface AddPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveParty: (party: PartyRecord) => void;
  initialType?: 'buyer' | 'supplier' | 'both';
  existingParties?: PartyRecord[];
}

export const AddPartyModal: React.FC<AddPartyModalProps> = ({
  isOpen,
  onClose,
  onSaveParty,
  initialType = 'buyer',
  existingParties = [],
}) => {
  const [name, setName] = useState('');
  const [panOrVat, setPanOrVat] = useState('');
  const [type, setType] = useState<'buyer' | 'supplier' | 'both'>(initialType);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [creditDays, setCreditDays] = useState<string>('30');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    const cleanName = name.trim();
    if (!cleanName) {
      newErrors.name = 'Party / Buyer / Client Name is required';
    }

    const cleanPan = panOrVat.trim();
    if (!cleanPan) {
      newErrors.panOrVat = 'Nepal PAN / VAT Number is required for tax invoices';
    } else if (!isValidPanVat(cleanPan)) {
      newErrors.panOrVat = 'PAN / VAT must be exactly 9 numeric digits';
    }

    const cleanAddress = address.trim();
    if (!cleanAddress) {
      newErrors.address = 'Registered address is required for VAT invoices';
    }

    // Check duplicate PAN
    if (cleanPan && existingParties.some((p) => p.panOrVat === cleanPan)) {
      const existing = existingParties.find((p) => p.panOrVat === cleanPan);
      if (existing && existing.name.toLowerCase() !== cleanName.toLowerCase()) {
        newErrors.panOrVat = `This PAN is already registered under "${existing.name}"`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const partyRecord: PartyRecord = {
      name: cleanName,
      panOrVat: cleanPan,
      address: cleanAddress,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      type,
      notes: notes.trim() || undefined,
      creditDays: creditDays ? parseInt(creditDays, 10) : undefined,
    };

    onSaveParty(partyRecord);
    setSuccessMsg(`"${cleanName}" added successfully!`);

    setTimeout(() => {
      // Reset form
      setName('');
      setPanOrVat('');
      setAddress('');
      setPhone('');
      setEmail('');
      setContactPerson('');
      setNotes('');
      setCreditDays('30');
      setErrors({});
      setSuccessMsg(null);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:hidden">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        id="add-party-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Add Party / Buyer / Client</h3>
              <p className="text-xs text-slate-300">
                Register new client or vendor with tax and billing details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Party Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Party / Entity Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('buyer')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                  type === 'buyer'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Buyer (Client / Consignee)
              </button>
              <button
                type="button"
                onClick={() => setType('supplier')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                  type === 'supplier'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Supplier (Vendor / Expense)
              </button>
              <button
                type="button"
                onClick={() => setType('both')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                  type === 'both'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Both (Client & Supplier)
              </button>
            </div>
          </div>

          {/* Name & PAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Party / Buyer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-party-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="e.g. Company or Client Name"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-rose-300 ring-rose-100'
                    : 'border-slate-300 focus:ring-teal-600'
                }`}
              />
              {errors.name && (
                <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                PAN / VAT Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="input-party-pan"
                  maxLength={9}
                  value={panOrVat}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setPanOrVat(clean);
                    if (errors.panOrVat) setErrors({ ...errors, panOrVat: '' });
                  }}
                  placeholder="9-digit IRD PAN (e.g. 101010101)"
                  className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.panOrVat
                      ? 'border-rose-300 ring-rose-100'
                      : 'border-slate-300 focus:ring-teal-600'
                  }`}
                />
                {panOrVat.length === 9 && (
                  <span className="absolute right-2.5 top-2.5 text-teal-600">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                )}
              </div>
              {errors.panOrVat ? (
                <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.panOrVat}
                </p>
              ) : (
                <span className="text-[10px] text-slate-400">
                  {panOrVat.length}/9 digits (Nepal Tax Law requirement)
                </span>
              )}
            </div>
          </div>

          {/* Registered Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Registered Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                id="input-party-address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors({ ...errors, address: '' });
                }}
                placeholder="e.g. Pipara, Simara, Bara or Kathmandu-04"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.address
                    ? 'border-rose-300 ring-rose-100'
                    : 'border-slate-300 focus:ring-teal-600'
                }`}
              />
            </div>
            {errors.address && (
              <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.address}
              </p>
            )}
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone / Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  id="input-party-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 051-522100 / 9801234567"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  id="input-party-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. billing@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Contact Person & Credit Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Person / Designation
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  id="input-party-contact"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Ramesh Sharma (Accounts Head)"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Credit Days / Payment Terms
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  id="input-party-credit-days"
                  value={creditDays}
                  onChange={(e) => setCreditDays(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Notes / Special Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes / Logistics Remarks
            </label>
            <textarea
              rows={2}
              id="input-party-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Birgunj-Kathmandu route, require original hard copy of LR and VAT invoice"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-party"
              className="px-5 py-2 text-sm font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Party / Buyer / Client</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
