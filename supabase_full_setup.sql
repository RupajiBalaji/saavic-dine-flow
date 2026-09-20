-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('SUPER_ADMIN','MANAGER','KITCHEN_STAFF');
CREATE TYPE public.table_status AS ENUM ('AVAILABLE','OCCUPIED','ORDERING','FOOD_PREPARING','READY','BILL_REQUESTED','PAYMENT_PENDING','PAID','CLOSED','DISABLED');
CREATE TYPE public.session_status AS ENUM ('ACTIVE','CLOSED');
CREATE TYPE public.order_status AS ENUM ('PLACED','ACCEPTED','PREPARING','READY','SERVED','COMPLETED','CANCELLED');
CREATE TYPE public.payment_state AS ENUM ('UNPAID','PAYMENT_PENDING','PAID','FAILED','REFUND_PENDING','REFUNDED','CASH_PAID','REFUND_REQUIRED');
CREATE TYPE public.payment_txn_status AS ENUM ('PENDING','SUCCESS','FAILED','REFUNDED');
CREATE TYPE public.product_status AS ENUM ('AVAILABLE','OUT_OF_STOCK','HIDDEN');

-- ============ STAFF / ROLES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "roles readable by staff" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'SUPER_ADMIN'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SETTINGS ============
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.settings FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.settings (key, value) VALUES
 ('cafe', '{"name":"Saavic Healthy Cafe","tagline":"EAT CLEAN • FEEL STRONG • LIVE BETTER","phone":"","whatsapp":"","address":"Secunderabad, Hyderabad, Telangana","currency":"INR","opening_time":"09:00","closing_time":"22:00","ordering_enabled":true,"enforce_hours":false}'::jsonb),
 ('tax', '{"name":"GST","percent":5,"inclusive":false}'::jsonb);

-- ============ MENU ============
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories staff write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  ingredients text,
  image_url text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  status public.product_status NOT NULL DEFAULT 'AVAILABLE',
  prep_minutes int NOT NULL DEFAULT 10,
  calories int, protein_g numeric(6,2), carbs_g numeric(6,2), fats_g numeric(6,2),
  allergens text,
  is_meal_plan boolean NOT NULL DEFAULT false,
  plan_days int,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products staff write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN'));

CREATE TABLE public.modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  selection_type text NOT NULL DEFAULT 'SINGLE',
  required boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE public.modifier_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier_id uuid NOT NULL REFERENCES public.modifiers(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_delta numeric(10,2) NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE public.product_modifiers (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  modifier_id uuid NOT NULL REFERENCES public.modifiers(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, modifier_id)
);
GRANT SELECT ON public.modifiers, public.modifier_options, public.product_modifiers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.modifiers, public.modifier_options, public.product_modifiers TO authenticated;
GRANT ALL ON public.modifiers, public.modifier_options, public.product_modifiers TO service_role;
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mod public read" ON public.modifiers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "modopt public read" ON public.modifier_options FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "prodmod public read" ON public.product_modifiers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "mod staff write" ON public.modifiers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN'));
CREATE POLICY "modopt staff write" ON public.modifier_options FOR ALL TO authenticated USING (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN'));
CREATE POLICY "prodmod staff write" ON public.product_modifiers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN'));

-- ============ TABLES & SESSIONS ============
CREATE TABLE public.cafe_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  capacity int NOT NULL DEFAULT 4,
  status public.table_status NOT NULL DEFAULT 'AVAILABLE',
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cafe_tables TO authenticated;
GRANT ALL ON public.cafe_tables TO service_role;
ALTER TABLE public.cafe_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tables staff read" ON public.cafe_tables FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "tables manager write" ON public.cafe_tables FOR ALL TO authenticated USING (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN'));

CREATE TABLE public.table_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  table_id uuid NOT NULL REFERENCES public.cafe_tables(id) ON DELETE CASCADE,
  status public.session_status NOT NULL DEFAULT 'ACTIVE',
  payment_state public.payment_state NOT NULL DEFAULT 'UNPAID',
  token text NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  closed_by uuid,
  customer_name text,
  customer_phone text,
  discount_code text,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX one_active_session_per_table ON public.table_sessions(table_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_sessions_table ON public.table_sessions(table_id);
CREATE INDEX idx_sessions_status ON public.table_sessions(status);
GRANT SELECT, INSERT, UPDATE ON public.table_sessions TO authenticated;
GRANT ALL ON public.table_sessions TO service_role;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions staff read" ON public.table_sessions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "sessions staff write" ON public.table_sessions FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- ============ ORDERS ============
CREATE SEQUENCE public.order_number_seq START 1001;
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  session_id uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.cafe_tables(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'PLACED',
  notes text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  idempotency_key text UNIQUE,
  cancel_reason text,
  customer_name text,
  customer_phone text,
  accepted_at timestamptz, ready_at timestamptz, served_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_session ON public.orders(session_id);
CREATE INDEX idx_orders_table ON public.orders(table_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders staff read" ON public.orders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "orders staff update" ON public.orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  line_total numeric(10,2) NOT NULL,
  notes text,
  modifiers jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items staff read" ON public.order_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.cafe_tables(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'RAZORPAY',
  razorpay_order_id text,
  razorpay_payment_id text,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status public.payment_txn_status NOT NULL DEFAULT 'PENDING',
  method text,
  idempotency_key text UNIQUE,
  recorded_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_payments_rzp_payment ON public.payments(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX idx_payments_session ON public.payments(session_id);
CREATE INDEX idx_payments_created ON public.payments(created_at);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments staff read" ON public.payments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ============ DISCOUNTS ============
CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'PERCENT',
  value numeric(10,2) NOT NULL,
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  used_count int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discounts TO authenticated;
GRANT ALL ON public.discounts TO service_role;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discounts staff read" ON public.discounts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "discounts manager write" ON public.discounts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN'));
INSERT INTO public.discounts (code, type, value, min_order) VALUES ('WELCOME10','PERCENT',10,299);

-- ============ INVENTORY ============
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  stock numeric(12,3) NOT NULL DEFAULT 0,
  min_stock numeric(12,3) NOT NULL DEFAULT 0,
  cost numeric(10,2) NOT NULL DEFAULT 0,
  supplier text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory staff read" ON public.inventory_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "inventory manager write" ON public.inventory_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN')) WITH CHECK (public.has_role(auth.uid(),'MANAGER') OR public.has_role(auth.uid(),'SUPER_ADMIN'));

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  object_type text,
  object_id text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit staff read" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ============ REALTIME ============
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.cafe_tables REPLICA IDENTITY FULL;
ALTER TABLE public.table_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cafe_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_sessions;
-- Categories
INSERT INTO public.categories (name, slug, sort_order) VALUES
 ('Smoothies','smoothies',1),
 ('Fresh Salads','fresh-salads',2),
 ('Quick Bites','quick-bites',3),
 ('Wellness Shots','wellness-shots',4),
 ('26 Days of Clean – Meal Plans','meal-plans',5),
 ('Add-ons','add-ons',6);

-- Smoothies
INSERT INTO public.products (category_id, name, slug, description, ingredients, price, sort_order) VALUES
 ((SELECT id FROM public.categories WHERE slug='smoothies'),'Green Detox','green-detox','Spinach, cucumber, apple, lemon & mint','Spinach, cucumber, apple, lemon, mint',149,1),
 ((SELECT id FROM public.categories WHERE slug='smoothies'),'Berry Blast','berry-blast','Mixed berries, banana & yogurt','Mixed berries, banana, yogurt',189,2),
 ((SELECT id FROM public.categories WHERE slug='smoothies'),'Chocolate Peanut Butter','chocolate-peanut-butter','Peanut butter, banana, cocoa & milk','Peanut butter, banana, cocoa, milk',159,3),
 ((SELECT id FROM public.categories WHERE slug='smoothies'),'Tropical Smoothie','tropical-smoothie','Mango, pineapple & banana','Mango, pineapple, banana',159,4),
 ((SELECT id FROM public.categories WHERE slug='smoothies'),'Creamy Coffee Smoothie','creamy-coffee-smoothie','Coffee, banana, milk & cocoa','Coffee, banana, milk, cocoa',169,5);

-- Salads
INSERT INTO public.products (category_id, name, slug, description, price, sort_order) VALUES
 ((SELECT id FROM public.categories WHERE slug='fresh-salads'),'Veg Garden Salad','veg-garden-salad','Crisp seasonal vegetables with healthy dressing',149,1),
 ((SELECT id FROM public.categories WHERE slug='fresh-salads'),'High-Protein Chickpea Salad','high-protein-chickpea-salad','Protein-packed chickpeas, fresh veggies & herbs',189,2),
 ((SELECT id FROM public.categories WHERE slug='fresh-salads'),'Paneer Protein Salad','paneer-protein-salad','Grilled paneer over a fresh vegetable base',209,3),
 ((SELECT id FROM public.categories WHERE slug='fresh-salads'),'Chicken Protein Salad','chicken-protein-salad','Grilled chicken, greens & healthy dressing',219,4);

-- Quick Bites
INSERT INTO public.products (category_id, name, slug, description, price, sort_order) VALUES
 ((SELECT id FROM public.categories WHERE slug='quick-bites'),'Boiled Eggs','boiled-eggs','3 pcs',79,1),
 ((SELECT id FROM public.categories WHERE slug='quick-bites'),'Avocado Toast','avocado-toast','Smashed avocado on toasted bread',149,2),
 ((SELECT id FROM public.categories WHERE slug='quick-bites'),'Egg Avocado Toast','egg-avocado-toast','Avocado toast topped with egg',179,3),
 ((SELECT id FROM public.categories WHERE slug='quick-bites'),'Overnight Soaked Oats','overnight-soaked-oats','Toppings of your choice',149,4);

-- Wellness Shots
INSERT INTO public.products (category_id, name, slug, description, price, sort_order) VALUES
 ((SELECT id FROM public.categories WHERE slug='wellness-shots'),'ABC Shot','abc-shot','Apple, Beetroot & Carrot',69,1),
 ((SELECT id FROM public.categories WHERE slug='wellness-shots'),'Immunity Booster','immunity-booster','Carrot, Orange, Ginger & Lemon',69,2),
 ((SELECT id FROM public.categories WHERE slug='wellness-shots'),'Hydration Shot','hydration-shot','Watermelon, Mint, Cucumber & Ginger',69,3),
 ((SELECT id FROM public.categories WHERE slug='wellness-shots'),'Anti-Bloat Shot','anti-bloat-shot','Pineapple, Celery, Green Apple & Ginger',69,4),
 ((SELECT id FROM public.categories WHERE slug='wellness-shots'),'Green Detox Shot','green-detox-shot','Spinach, Apple, Cucumber, Ginger, Mint & Lemon',69,5);

-- Meal plans
INSERT INTO public.products (category_id, name, slug, description, ingredients, price, is_meal_plan, plan_days, protein_g, sort_order) VALUES
 ((SELECT id FROM public.categories WHERE slug='meal-plans'),'Veg Fit','veg-fit','Protein-Rich Veg Salad + Seasonal Fruit Bowl · 26 Days','Every day includes 1 Salad + 1 Seasonal Fruit Bowl + Healthy Dressing',3999,true,26,25,1),
 ((SELECT id FROM public.categories WHERE slug='meal-plans'),'Chicken Fit','chicken-fit','Chicken Protein Salad + Seasonal Fruit Bowl · 26 Days','Every day includes 1 Salad + 1 Seasonal Fruit Bowl + Healthy Dressing',4999,true,26,40,2);

INSERT INTO public.products (category_id, name, slug, description, ingredients, price, sort_order) VALUES
 ((SELECT id FROM public.categories WHERE slug='add-ons'),'Wellness Shot Add-on (26 Days)','wellness-shot-addon','100 ml × 26 Days · Fresh ginger & lemon','Ginger, Lemon',999,1);

-- Modifiers
INSERT INTO public.modifiers (id, name, selection_type, required, sort_order) VALUES
 ('11111111-1111-1111-1111-111111111111','Dressing','SINGLE',false,1),
 ('22222222-2222-2222-2222-222222222222','Extras','MULTI',false,2),
 ('33333333-3333-3333-3333-333333333333','Toppings','MULTI',false,3);

INSERT INTO public.modifier_options (modifier_id, name, price_delta, sort_order) VALUES
 ('11111111-1111-1111-1111-111111111111','Healthy Dressing',0,1),
 ('11111111-1111-1111-1111-111111111111','No Dressing',0,2),
 ('11111111-1111-1111-1111-111111111111','Extra Dressing',20,3),
 ('22222222-2222-2222-2222-222222222222','Extra Paneer',60,1),
 ('22222222-2222-2222-2222-222222222222','Extra Chicken',80,2),
 ('22222222-2222-2222-2222-222222222222','Extra Egg',30,3),
 ('33333333-3333-3333-3333-333333333333','Fruit',30,1),
 ('33333333-3333-3333-3333-333333333333','Nuts',40,2),
 ('33333333-3333-3333-3333-333333333333','Seeds',30,3);

INSERT INTO public.product_modifiers (product_id, modifier_id)
SELECT p.id, '11111111-1111-1111-1111-111111111111' FROM public.products p
JOIN public.categories c ON c.id = p.category_id WHERE c.slug = 'fresh-salads';
INSERT INTO public.product_modifiers (product_id, modifier_id)
SELECT p.id, '22222222-2222-2222-2222-222222222222' FROM public.products p
JOIN public.categories c ON c.id = p.category_id WHERE c.slug = 'fresh-salads';
INSERT INTO public.product_modifiers (product_id, modifier_id)
VALUES ((SELECT id FROM public.products WHERE slug='overnight-soaked-oats'),'33333333-3333-3333-3333-333333333333');

-- Tables 01..20
INSERT INTO public.cafe_tables (name, slug, capacity, sort_order)
SELECT 'Table ' || lpad(i::text, 2, '0'), 'table-' || lpad(i::text, 2, '0'), 4, i
FROM generate_series(1,20) AS i;

-- Inventory samples
INSERT INTO public.inventory_items (name, unit, stock, min_stock, cost, supplier) VALUES
 ('Chicken Breast','kg',12,5,320,'Local Farm'),
 ('Paneer','kg',6,3,380,'Dairy Co'),
 ('Spinach','kg',4,5,60,'Green Grocer'),
 ('Bananas','kg',9,4,50,'Fruit Mandi'),
 ('Avocado','pcs',18,10,90,'Fruit Mandi');
CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS text LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'SV-' || nextval('public.order_number_seq')::text;
$$;
REVOKE ALL ON FUNCTION public.next_order_number() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;
