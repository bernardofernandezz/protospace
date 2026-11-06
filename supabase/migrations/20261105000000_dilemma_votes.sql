-- Votação dos dilemas de bioética (src/lib/votes.ts, src/sections/Ethics.tsx).
--
-- Espelha o schema que roda no projeto `protospace` (lido em 2026-11-05): totais públicos em
-- `dilemma_tallies`, um voto por navegador e por dilema em `dilemma_votes`, escrita só por `cast_vote`
-- e limite de taxa por IP (hash com sal) em `private.vote_limits`. Idempotente; num projeto que já
-- tem tudo isso, não muda nada além de recriar as funções com o mesmo corpo.
-- Para um novo dilema: acrescente o id ao CHECK de `dilemma_votes`, à lista em `cast_vote` e semeie os totais.

create schema if not exists private;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists private.settings (key text primary key, value text not null);
-- o sal do hash de IP é um segredo do projeto: gerado aqui só se não existir, nunca versionado
insert into private.settings (key, value) values ('ip_salt', encode(extensions.gen_random_bytes(16), 'hex')) on conflict do nothing;

create table if not exists private.vote_limits (
  ip_hash      text primary key,
  window_start timestamptz default now(),
  calls        integer default 0
);

create table if not exists public.dilemma_tallies (
  dilemma_id text not null,
  stance     text not null,
  votes      integer not null default 0 check (votes >= 0),
  primary key (dilemma_id, stance)
);

create table if not exists public.dilemma_votes (
  dilemma_id text not null check (dilemma_id in ('embriao', 'gene-drive', 'sus')),
  voter_id   uuid not null,
  stance     text not null check (stance in ('pro', 'con', 'depends')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (dilemma_id, voter_id)
);

-- os totais começam zerados; as linhas existem de antemão (o realtime do cliente só escuta UPDATE)
insert into public.dilemma_tallies (dilemma_id, stance)
select d, s from unnest(array['embriao', 'gene-drive', 'sus']) as d, unnest(array['pro', 'con', 'depends']) as s
on conflict do nothing;

alter table public.dilemma_tallies enable row level security;
alter table public.dilemma_votes   enable row level security;

-- totais públicos; ninguém escreve direto (sem policies de escrita, só `cast_vote`)
drop policy if exists "tallies are public" on public.dilemma_tallies;
create policy "tallies are public" on public.dilemma_tallies for select to anon using (true);
grant select on public.dilemma_tallies to anon;

create or replace function private.check_vote_rate()
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  hdr json := coalesce(current_setting('request.headers', true), '{}')::json;
  ip text := coalesce(
    nullif(hdr ->> 'cf-connecting-ip', ''),
    nullif(trim(reverse(split_part(reverse(coalesce(hdr ->> 'x-forwarded-for', '')), ',', 1))), ''),
    'unknown');
  h text;
  used integer;
begin
  select encode(extensions.digest(ip || s.value, 'sha256'), 'hex') into h from private.settings s where s.key = 'ip_salt';
  insert into private.vote_limits as l (ip_hash, window_start, calls) values (h, now(), 1)
  on conflict (ip_hash) do update set
    calls = case when l.window_start < now() - interval '10 minutes' then 1 else l.calls + 1 end,
    window_start = case when l.window_start < now() - interval '10 minutes' then now() else l.window_start end
  returning calls into used;
  if used > 300 then
    raise exception 'too many votes, try again later' using errcode = '53400';
  end if;
  if random() < 0.01 then delete from private.vote_limits where window_start < now() - interval '1 day'; end if;
end;
$$;

create or replace function public.cast_vote(p_dilemma text, p_voter uuid, p_stance text)
returns setof public.dilemma_tallies
language plpgsql
security definer
set search_path to ''
as $$
declare
  prev text;
begin
  if p_dilemma not in ('embriao', 'gene-drive', 'sus') or p_stance not in ('pro', 'con', 'depends') or p_voter is null then
    raise exception 'invalid vote' using errcode = '22023';
  end if;
  perform private.check_vote_rate();

  select v.stance into prev from public.dilemma_votes v
  where v.dilemma_id = p_dilemma and v.voter_id = p_voter
  for update;

  if prev is null then
    insert into public.dilemma_votes (dilemma_id, voter_id, stance) values (p_dilemma, p_voter, p_stance);
    update public.dilemma_tallies t set votes = t.votes + 1 where t.dilemma_id = p_dilemma and t.stance = p_stance;
  elsif prev <> p_stance then
    update public.dilemma_votes v set stance = p_stance, updated_at = now() where v.dilemma_id = p_dilemma and v.voter_id = p_voter;
    update public.dilemma_tallies t set votes = t.votes - 1 where t.dilemma_id = p_dilemma and t.stance = prev;
    update public.dilemma_tallies t set votes = t.votes + 1 where t.dilemma_id = p_dilemma and t.stance = p_stance;
  end if;

  return query select * from public.dilemma_tallies t where t.dilemma_id = p_dilemma;
end;
$$;

revoke all on function public.cast_vote(text, uuid, text) from public;
grant execute on function public.cast_vote(text, uuid, text) to anon, authenticated;
revoke all on function private.check_vote_rate() from public;

-- tempo real: o cliente assina UPDATE em dilemma_tallies
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'dilemma_tallies') then
    alter publication supabase_realtime add table public.dilemma_tallies;
  end if;
end $$;
