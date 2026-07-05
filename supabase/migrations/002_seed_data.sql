-- ============================================================
-- بيانات تجريبية — كافيه "نجمة روست" + ربط المالك + خانات روليت
-- شغّله في: Supabase → SQL Editor → New query
-- ============================================================

-- 1) إنشاء الكافيه التجريبي وربطه بحسابك كمالك
insert into public.cafes (slug, name, owner_id)
values (
  'najma',
  'نجمة روست',
  '25860fa5-a514-4e6f-a76e-0659b337037e'
)
on conflict (slug) do nothing;

-- 2) تسجيل حسابك كموظف (owner) في هذا الكافيه
--    ضروري عشان سياسات RLS تسمح لك بالوصول للبيانات
insert into public.staff (cafe_id, user_id, role)
select c.id, '25860fa5-a514-4e6f-a76e-0659b337037e', 'owner'
from public.cafes c
where c.slug = 'najma'
on conflict (cafe_id, user_id) do nothing;

-- 3) خانات روليت ابتدائية (التاجر يعدّلها لاحقاً من الإعدادات)
--    مجموع النسب = 100%
insert into public.roulette_slots (cafe_id, prize_name, probability, color, sort_order)
select c.id, v.prize_name, v.probability, v.color, v.sort_order
from public.cafes c
cross join (values
  ('حظ أوفر',        40, '#b5a382', 1),
  ('خصم 10%',        20, '#c08a3e', 2),
  ('إضافة مجانية',   15, '#6f4a2a', 3),
  ('ترقية الحجم',    12, '#a8672e', 4),
  ('نقطة إضافية',    10, '#8a6d3b', 5),
  ('كوب مجاني',       3, '#4f7a3f', 6)
) as v(prize_name, probability, color, sort_order)
where c.slug = 'najma'
  and not exists (
    select 1 from public.roulette_slots rs where rs.cafe_id = c.id
  );

-- 4) عميل تجريبي عشان نختبر عليه شاشة الكاشير لاحقاً
insert into public.customers (cafe_id, phone, name, cups_balance, verified)
select c.id, '966500000000', 'صالح التجريبي', 7, true
from public.cafes c
where c.slug = 'najma'
on conflict (cafe_id, phone) do nothing;

-- ============================================================
-- تحقق: اعرض ما تم إنشاؤه
-- ============================================================
select 'الكافيه' as النوع, name as القيمة from public.cafes where slug = 'najma'
union all
select 'خانات الروليت', count(*)::text from public.roulette_slots rs
  join public.cafes c on c.id = rs.cafe_id where c.slug = 'najma'
union all
select 'العملاء', count(*)::text from public.customers cu
  join public.cafes c on c.id = cu.cafe_id where c.slug = 'najma';
