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