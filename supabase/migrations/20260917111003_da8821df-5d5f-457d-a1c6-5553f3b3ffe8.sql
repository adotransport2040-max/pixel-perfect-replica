CREATE TABLE public.purchase_bills (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sn INTEGER,
  date_bs TEXT NOT NULL DEFAULT '',
  bs_year INTEGER NOT NULL,
  bs_month INTEGER NOT NULL,
  fiscal_year TEXT NOT NULL DEFAULT '',
  invoice_no TEXT NOT NULL DEFAULT '',
  party_name TEXT NOT NULL DEFAULT '',
  vat_no TEXT NOT NULL DEFAULT '',
  pan TEXT NOT NULL DEFAULT '',
  bills_description TEXT NOT NULL DEFAULT '',
  before_vat NUMERIC NOT NULL DEFAULT 0,
  vat NUMERIC NOT NULL DEFAULT 0,
  after_vat NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_bills TO authenticated;
GRANT ALL ON public.purchase_bills TO service_role;
ALTER TABLE public.purchase_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their purchase bills" ON public.purchase_bills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX purchase_bills_user_period_idx ON public.purchase_bills (user_id, bs_year, bs_month);

CREATE TABLE public.sales_bills (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sn INTEGER,
  date_bs TEXT NOT NULL DEFAULT '',
  bs_year INTEGER NOT NULL,
  bs_month INTEGER NOT NULL,
  fiscal_year TEXT NOT NULL DEFAULT '',
  invoice_no TEXT NOT NULL DEFAULT '',
  buyer_name TEXT NOT NULL DEFAULT '',
  party_name TEXT,
  vat_no TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  vat_type TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT '',
  before_vat NUMERIC NOT NULL DEFAULT 0,
  vat NUMERIC NOT NULL DEFAULT 0,
  after_vat NUMERIC NOT NULL DEFAULT 0,
  buyer_address TEXT,
  item_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_bills TO authenticated;
GRANT ALL ON public.sales_bills TO service_role;
ALTER TABLE public.sales_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their sales bills" ON public.sales_bills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX sales_bills_user_period_idx ON public.sales_bills (user_id, bs_year, bs_month);

CREATE TABLE public.parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pan_or_vat TEXT NOT NULL DEFAULT '',
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  type TEXT NOT NULL DEFAULT 'buyer',
  notes TEXT,
  credit_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX parties_user_name_key ON public.parties (user_id, lower(name));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parties TO authenticated;
GRANT ALL ON public.parties TO service_role;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their parties" ON public.parties FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.app_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  categories TEXT[] NOT NULL DEFAULT '{}',
  vat_types TEXT[] NOT NULL DEFAULT '{}',
  payment_types TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their settings" ON public.app_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);