-- DATA-001: discount_coupons "Anyone can read active coupons" exposed coupon data
-- without any authentication. Fix: require auth.role() = 'authenticated'.

DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.discount_coupons;

CREATE POLICY "Authenticated can read active coupons"
  ON public.discount_coupons FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);
