-- Identidad de Stripe asignada exclusivamente por servidor; nunca desde metadata del usuario.
create table public.billetera_clientes_stripe (
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  modo text not null check (modo in ('test', 'live')),
  stripe_customer_id text not null check (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'),
  creado_en timestamptz not null default now(),
  primary key (auth_user_id, modo),
  unique (stripe_customer_id, modo)
);
alter table public.billetera_clientes_stripe enable row level security;
revoke all on public.billetera_clientes_stripe from public, anon, authenticated, service_role;
grant select, insert on public.billetera_clientes_stripe to service_role;
comment on table public.billetera_clientes_stripe is 'Relación privada de billetera. No almacena números de tarjeta ni CVC.';
