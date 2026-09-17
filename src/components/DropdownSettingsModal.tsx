import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, SlidersHorizontal, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { DropdownSettings } from '../types';
import { DEFAULT_DROPDOWN_SETTINGS, saveDropdownSettings } from '../utils/storage';

interface DropdownSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DropdownSettings;
  onSave?: (newSettings: DropdownSettings) => void;
  onSaveSettings?: (newSettings: DropdownSettings) => void;
}

type DropdownTab = 'category' | 'vatType' | 'paymentType';

export const DropdownSettingsModal: React.FC<DropdownSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<DropdownTab>('category');
  const [localSettings, setLocalSettings] = useState<DropdownSettings>(settings);
  const [newItemText, setNewItemText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  // Sync settings when opened or when parent settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentList =
    activeTab === 'category'
      ? localSettings.categories
      : activeTab === 'vatType'
      ? localSettings.vatTypes
      : localSettings.paymentTypes;

  const tabTitle =
    activeTab === 'category'
      ? 'Service / Freight Categories'
      : activeTab === 'vatType'
      ? 'VAT Types (Taxability)'
      : 'Payment Types (Payment Method)';

  const tabPlaceholder =
    activeTab === 'category'
      ? 'e.g. Bulk Cement, Dangerous Goods, Reefer Cargo...'
      : activeTab === 'vatType'
      ? 'e.g. Taxable (13%), Non-Taxable, Special Concession...'
      : 'e.g. eSewa / Khalti, LC (Letter of Credit), UPI...';

  const commitUpdate = (updated: DropdownSettings) => {
    setLocalSettings(updated);
    if (typeof onSave === 'function') {
      onSave(updated);
    }
    if (typeof onSaveSettings === 'function') {
      onSaveSettings(updated);
    }
    // Direct persistent storage fallback
    saveDropdownSettings(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newItemText.trim();
    if (!trimmed) {
      setErrorMsg('Please enter an option name.');
      return;
    }

    const exists = currentList.some((item) => item.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setErrorMsg(`"${trimmed}" already exists in the list.`);
      return;
    }

    setErrorMsg('');
    let updated: DropdownSettings;
    if (activeTab === 'category') {
      updated = { ...localSettings, categories: [...localSettings.categories, trimmed] };
    } else if (activeTab === 'vatType') {
      updated = { ...localSettings, vatTypes: [...localSettings.vatTypes, trimmed] };
    } else {
      updated = { ...localSettings, paymentTypes: [...localSettings.paymentTypes, trimmed] };
    }

    commitUpdate(updated);
    setNewItemText('');
  };

  const handleDeleteItem = (itemToDelete: string) => {
    if (currentList.length <= 1) {
      setErrorMsg('Cannot remove: At least one option must remain in this dropdown.');
      return;
    }

    setErrorMsg('');
    let updated: DropdownSettings;
    if (activeTab === 'category') {
      updated = {
        ...localSettings,
        categories: localSettings.categories.filter((c) => c !== itemToDelete),
      };
    } else if (activeTab === 'vatType') {
      updated = {
        ...localSettings,
        vatTypes: localSettings.vatTypes.filter((v) => v !== itemToDelete),
      };
    } else {
      updated = {
        ...localSettings,
        paymentTypes: localSettings.paymentTypes.filter((p) => p !== itemToDelete),
      };
    }

    commitUpdate(updated);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset this dropdown list to standard default options?')) {
      let updated: DropdownSettings;
      if (activeTab === 'category') {
        updated = { ...localSettings, categories: [...DEFAULT_DROPDOWN_SETTINGS.categories] };
      } else if (activeTab === 'vatType') {
        updated = { ...localSettings, vatTypes: [...DEFAULT_DROPDOWN_SETTINGS.vatTypes] };
      } else {
        updated = { ...localSettings, paymentTypes: [...DEFAULT_DROPDOWN_SETTINGS.paymentTypes] };
      }
      commitUpdate(updated);
      setErrorMsg('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      id="modal-dropdown-settings"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 text-teal-400 border border-teal-500/40 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">
                Manage Sales Dropdowns
              </h2>
              <p className="text-[11px] text-slate-400">
                Add or delete items in Category, VAT Type, and Payment Type
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="btn-close-dropdown-modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('category');
              setErrorMsg('');
              setNewItemText('');
            }}
            id="tab-dropdown-category"
            className={`flex-1 py-2 px-2.5 text-center font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'category'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Category ({settings.categories.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('vatType');
              setErrorMsg('');
              setNewItemText('');
            }}
            id="tab-dropdown-vattype"
            className={`flex-1 py-2 px-2.5 text-center font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'vatType'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            VAT Type ({settings.vatTypes.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('paymentType');
              setErrorMsg('');
              setNewItemText('');
            }}
            id="tab-dropdown-paymenttype"
            className={`flex-1 py-2 px-2.5 text-center font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'paymentType'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Payment Type ({settings.paymentTypes.length})
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 flex-1 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">{tabTitle}</label>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] text-slate-500 hover:text-teal-700 flex items-center gap-1 transition-colors cursor-pointer"
                title="Restore default items"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Items listed below are immediately available in the dropdown when adding or editing
              sales bills.
            </p>

            {/* Add New Input */}
            <form onSubmit={handleAddItem} className="flex gap-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => {
                  setNewItemText(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                id="input-new-dropdown-item"
                placeholder={tabPlaceholder}
                className="flex-1 text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
              />
              <button
                type="submit"
                id="btn-add-dropdown-item"
                className="flex items-center gap-1 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {errorMsg && (
              <div className="flex items-center gap-1.5 mt-2 text-rose-600 text-xs bg-rose-50 p-2 rounded border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {savedNotice && (
              <div className="flex items-center gap-1.5 mt-2 text-emerald-700 text-xs bg-emerald-50 p-1.5 rounded border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                <span>Updated! Available in Add/Edit Bill forms.</span>
              </div>
            )}
          </div>

          {/* Current List Container */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
            <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider flex justify-between items-center">
              <span>Active Options ({currentList.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Click trash to delete</span>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
              {currentList.map((item, index) => (
                <div
                  key={index}
                  className="px-3 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-mono flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-800">{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    id={`btn-delete-option-${index}`}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    title={`Delete "${item}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            Syncs automatically with Add Sales Bill & Edit forms
          </span>
          <button
            type="button"
            onClick={onClose}
            id="btn-done-dropdown-modal"
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
