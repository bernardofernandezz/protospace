-- Votação dos dilemas de bioética (src/lib/votes.ts, src/sections/Ethics.tsx).
--
-- Reconstruída a partir do que o cliente espera: leitura pública dos totais em `dilemma_tallies`
-- (dilemma_id, stance, votes), escrita só por `cast_vote(p_dilemma, p_voter, p_stance)`, um voto por
-- navegador e por dilema (trocar de posição move o voto) e limite de taxa por IP.
-- O projeto original não tinha migrations versionadas: confira com `supabase db diff` antes de aplicar
-- num projeto que já tenha essas tabelas, porque `cast_vote` é recriada aqui.

create table if not exists public.dilemma_tallies (
  dilemma_id text not null check (dilemma_id ~ '^[a-z0-9-]{1,64}$'),
  stance     text not null check (stance in ('pro', 'con', 'depends')),
  votes      integer not null default 0 check (votes >= 0),
  primary key (dilemma_id, stance)
);

-- Um voto por navegador e por dilema. Não é lido pelo cliente.
create table if not exists public.dilemma_votes (
  dilemma_id text not null,
  voter      text not null check (length(voter) between 8 and 64),
  stance     text not null check (stance in ('pro', 'con', 'depends')),
  voted_at   timestamptz not null default now(),
  primary key (dilemma_id, voter)
);

-- Janela do limite de taxa por IP (apagada aos poucos pela própria função).
create table if not exists public.vote_attempts (
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists vote_attempts_ip_at on public.vote_attempts (ip, at);

alter table public.dilemma_tallies enable row level security;
alter table public.dilemma_votes   enable row level security;
alter table public.vote_attempts   enable row level security;

-- Totais são públicos; ninguém escreve direto (sem policies de escrita, só a função abaixo).
drop policy if exists "totais públicos" on public.dilemma_tallies;
create policy "totais públicos" on public.dilemma_tallies for select to anon, authenticated using (true);
grant select on public.dilemma_tallies to anon, authenticated;

create or replace function public.cast_vote(p_dilemma text, p_voter text, p_stance text)
returns setof public.dilemma_tallies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip   text := coalesce(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), 'desconhecido');
  v_prev text;
begin
  if p_dilemma is null or p_dilemma !~ '^[a-z0-9-]{1,64}$' then
    raise exception 'dilema inválido' using errcode = '22023';
  end if;
  if p_stance is null or p_stance not in ('pro', 'con', 'depends') then
    raise exception 'posição inválida' using errcode = '22023';
  end if;
  if p_voter is null or length(p_voter) not between 8 and 64 then
    raise exception 'votante inválido' using errcode = '22023';
  end if;

  -- limite de taxa: 30 votos por minuto por IP
  delete from public.vote_attempts where at < now() - interval '1 hour';
  if (select count(*) from public.vote_attempts where ip = v_ip and at > now() - interval '1 minute') >= 30 then
    raise exception 'muitos votos, tente de novo em instantes' using errcode = '54000';
  end if;
  insert into public.vote_attempts (ip) values (v_ip);

  -- garante as três posições do dilema (o realtime do cliente só escuta UPDATE)
  insert into public.dilemma_tallies (dilemma_id, stance)
  select p_dilemma, s from unnest(array['pro', 'con', 'depends']) as s
  on conflict do nothing;

  select stance into v_prev from public.dilemma_votes where dilemma_id = p_dilemma and voter = p_voter;
  if v_prev is distinct from p_stance then
    if v_prev is not null then
      update public.dilemma_tallies set votes = greatest(votes - 1, 0) where dilemma_id = p_dilemma and stance = v_prev;
    end if;
    update public.dilemma_tallies set votes = votes + 1 where dilemma_id = p_dilemma and stance = p_stance;
    insert into public.dilemma_votes (dilemma_id, voter, stance) values (p_dilemma, p_voter, p_stance)
    on conflict (dilemma_id, voter) do update set stance = excluded.stance, voted_at = now();
  end if;

  return query select * from public.dilemma_tallies where dilemma_id = p_dilemma;
end;
$$;

revoke all on function public.cast_vote(text, text, text) from public;
grant execute on function public.cast_vote(text, text, text) to anon, authenticated;

-- tempo real: o cliente assina UPDATE em dilemma_tallies
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'dilemma_tallies') then
    alter publication supabase_realtime add table public.dilemma_tallies;
  end if;
end $$;
