-- Create role enum
create type public.app_role as enum ('admin', 'employee');

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone default now(),
  unique (user_id, company_id)
);

alter table public.user_roles enable row level security;

-- Create invite_codes table
create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  company_id uuid references public.companies(id) on delete cascade not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  used_at timestamp with time zone,
  expires_at timestamp with time zone default (now() + interval '30 days')
);

alter table public.invite_codes enable row level security;

-- Security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Security definer function to check if user is admin of a company
create or replace function public.is_company_admin(_user_id uuid, _company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and company_id = _company_id
      and role = 'admin'
  )
$$;

-- RLS policies for user_roles
create policy "Users can view their own roles"
on public.user_roles
for select
using (auth.uid() = user_id);

create policy "Admins can view company roles"
on public.user_roles
for select
using (is_company_admin(auth.uid(), company_id));

-- RLS policies for invite_codes
create policy "Admins can view their company's invite codes"
on public.invite_codes
for select
using (is_company_admin(auth.uid(), company_id));

create policy "Admins can create invite codes for their company"
on public.invite_codes
for insert
with check (is_company_admin(auth.uid(), company_id));

create policy "Anyone can view unused codes for validation"
on public.invite_codes
for select
using (used_by is null and expires_at > now());

create policy "System can update invite codes"
on public.invite_codes
for update
using (true);

-- Update handle_new_user_company to assign admin role
create or replace function public.handle_new_user_company()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  new_company_id uuid;
begin
  -- Create a new company for the user
  insert into public.companies (name)
  values ('Company - ' || NEW.email)
  returning id into new_company_id;
  
  -- Link user to the company
  insert into public.user_companies (user_id, company_id)
  values (NEW.id, new_company_id);
  
  -- Assign admin role to the new user
  insert into public.user_roles (user_id, company_id, role)
  values (NEW.id, new_company_id, 'admin');
  
  return NEW;
end;
$function$;