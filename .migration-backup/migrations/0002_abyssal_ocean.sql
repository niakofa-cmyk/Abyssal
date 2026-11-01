create table if not exists abyssal_ocean (
  id text primary key,
  version bigint not null default 0,
  body jsonb not null,
  updated_at timestamptz not null default now()
);
