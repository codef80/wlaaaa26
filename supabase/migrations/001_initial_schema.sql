-- ============================================================
-- مشروع الولاء — المخطط الأولي لقاعدة البيانات
-- شغّل هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ------------------------------------------------------------
-- 1) جدول الكافيهات (المستأجرون) — أساس كل شيء
-- ------------------------------------------------------------
create table if not exists public.cafes (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,          -- المعرّف في الرابط: cafe-name
  name              text not null,                 -- اسم الكافيه المعروض
  owner_id          uuid not null references auth.users(id) on delete cascade,

  -- الهوية البصرية (ألوان/شعار/نمط) — قابلة للتخصيص من الإعدادات
  theme             jsonb not null default '{
    "bg": "#f5ede0",
    "surface": "#faf4e8",
    "fg": "#3d2817",
    "primary": "#6f4a2a",
    "accent": "#c08a3e",
    "style": "بسيط",
    "logo_url": null,
    "background_url": null,
    "app_icon_url": null
  }'::jsonb,

  -- إعدادات الولاء
  loyalty_settings  jsonb not null default '{
    "cups_for_free": 10,
    "count_by": "cup",
    "daily_cup_limit": null,
    "free_cup_needs_staff": true,
    "reward_valid_days": 30
  }'::jsonb,

  created_at        timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2) جدول الموظفين — يربط مستخدم auth بكافيه معيّن
-- ------------------------------------------------------------
create table if not exists public.staff (
  id          uuid primary key default gen_random_uuid(),
  cafe_id     uuid not null references public.cafes(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'staff' check (role in ('owner','staff')),
  created_at  timestamptz not null default now(),
  unique (cafe_id, user_id)
);

-- ------------------------------------------------------------
-- 3) جدول العملاء — لكل كافيه عملاؤه (معرّفون برقم الجوال)
-- ------------------------------------------------------------
create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  cafe_id       uuid not null references public.cafes(id) on delete cascade,
  phone         text not null,                 -- رقم الجوال (بصيغة دولية)
  name          text,                          -- اسم العميل (اختياري)
  cups_balance  int not null default 0,        -- رصيد الأكواب الحالي نحو المجاني
  verified      boolean not null default false,-- هل تحقق عبر واتساب؟
  created_at    timestamptz not null default now(),
  unique (cafe_id, phone)                       -- نفس الرقم فريد داخل الكافيه الواحد
);

-- ------------------------------------------------------------
-- 4) جدول الزيارات — قلب التقارير (كل عملية شراء)
-- ------------------------------------------------------------
create table if not exists public.visits (
  id           uuid primary key default gen_random_uuid(),
  cafe_id      uuid not null references public.cafes(id) on delete cascade,
  customer_id  uuid not null references public.customers(id) on delete cascade,
  cups         int not null check (cups > 0),  -- عدد الأكواب في هذه الزيارة
  branch       text,                            -- الفرع (اختياري)
  note         text,                            -- ملاحظة الموظف (اختياري)
  staff_id     uuid references public.staff(id),-- من سجّل الزيارة
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5) جدول المكافآت — الجوائز التي حصل عليها العملاء
-- ------------------------------------------------------------
create table if not exists public.rewards (
  id           uuid primary key default gen_random_uuid(),
  cafe_id      uuid not null references public.cafes(id) on delete cascade,
  customer_id  uuid not null references public.customers(id) on delete cascade,
  prize        text not null,                  -- اسم الجائزة (خصم 10%، كوب مجاني...)
  source       text not null default 'roulette' check (source in ('roulette','free_cup')),
  status       text not null default 'pending' check (status in ('pending','used','expired')),
  expires_at   timestamptz,                    -- تاريخ انتهاء الصلاحية
  used_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6) جدول خانات الروليت — إعدادات التاجر لكل جائزة
-- ------------------------------------------------------------
create table if not exists public.roulette_slots (
  id           uuid primary key default gen_random_uuid(),
  cafe_id      uuid not null references public.cafes(id) on delete cascade,
  prize_name   text not null,                  -- اسم الجائزة
  probability  numeric not null check (probability >= 0 and probability <= 100), -- نسبة الظهور %
  color        text not null default '#c08a3e',-- لون الخانة في العجلة
  sort_order   int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- الفهارس (للأداء — التقارير تعتمد عليها)
-- ============================================================
create index if not exists idx_customers_cafe   on public.customers(cafe_id);
create index if not exists idx_visits_cafe       on public.visits(cafe_id);
create index if not exists idx_visits_customer   on public.visits(customer_id);
create index if not exists idx_visits_created    on public.visits(cafe_id, created_at);
create index if not exists idx_rewards_customer  on public.rewards(customer_id);
create index if not exists idx_staff_user        on public.staff(user_id);

-- ============================================================
-- دالة مساعدة: هل المستخدم الحالي ينتمي لهذا الكافيه؟
-- تُستخدم في كل سياسات RLS لعزل المستأجرين
-- ============================================================
create or replace function public.is_cafe_member(target_cafe uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.staff
    where staff.cafe_id = target_cafe
      and staff.user_id = auth.uid()
  );
$$;

-- ============================================================
-- تفعيل RLS على كل الجداول (العزل بين الكافيهات)
-- ============================================================
alter table public.cafes           enable row level security;
alter table public.staff           enable row level security;
alter table public.customers       enable row level security;
alter table public.visits          enable row level security;
alter table public.rewards         enable row level security;
alter table public.roulette_slots  enable row level security;

-- ------------------------------------------------------------
-- سياسات: الكافيهات
-- ------------------------------------------------------------
create policy "أعضاء الكافيه يرون كافيههم"
  on public.cafes for select
  using (public.is_cafe_member(id) or owner_id = auth.uid());

create policy "المالك ينشئ كافيه"
  on public.cafes for insert
  with check (owner_id = auth.uid());

create policy "المالك يعدّل كافيهه"
  on public.cafes for update
  using (owner_id = auth.uid());

-- ------------------------------------------------------------
-- سياسات: الموظفون
-- ------------------------------------------------------------
create policy "أعضاء الكافيه يرون الموظفين"
  on public.staff for select
  using (public.is_cafe_member(cafe_id));

create policy "المالك يدير الموظفين"
  on public.staff for all
  using (exists (
    select 1 from public.cafes
    where cafes.id = staff.cafe_id and cafes.owner_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- سياسات: العملاء / الزيارات / المكافآت / الروليت
-- كلها بنفس المبدأ: فقط أعضاء الكافيه يصلون لبيانات كافيههم
-- ------------------------------------------------------------
create policy "عزل العملاء بالكافيه"
  on public.customers for all
  using (public.is_cafe_member(cafe_id))
  with check (public.is_cafe_member(cafe_id));

create policy "عزل الزيارات بالكافيه"
  on public.visits for all
  using (public.is_cafe_member(cafe_id))
  with check (public.is_cafe_member(cafe_id));

create policy "عزل المكافآت بالكافيه"
  on public.rewards for all
  using (public.is_cafe_member(cafe_id))
  with check (public.is_cafe_member(cafe_id));

create policy "عزل الروليت بالكافيه"
  on public.roulette_slots for all
  using (public.is_cafe_member(cafe_id))
  with check (public.is_cafe_member(cafe_id));

-- ============================================================
-- انتهى. الآن كل كافيه معزول تماماً عن الآخر.
-- ملاحظة: وصول العميل لبياناته (بدون تسجيل دخول) سيتم لاحقاً
-- عبر Edge Function آمنة، وليس عبر RLS مباشرة.
-- ============================================================
