CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS text LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'SV-' || nextval('public.order_number_seq')::text;
$$;
REVOKE ALL ON FUNCTION public.next_order_number() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;