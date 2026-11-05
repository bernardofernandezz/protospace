-- Sala ao vivo (src/lib/roomApi.ts): a plateia responde "a Cas vai cortar?" pelo celular e o telão mostra a contagem.
-- Depende de 20261105000000_dilemma_votes.sql (reusa `vote_attempts` para o limite de taxa).
-- Sem cadastro e sem nome: só um id anônimo do navegador, uma escolha por sala. Salas velhas somem em 1 dia.

create table if not exists public.room_votes (
  room     text not null check (room ~ '^[a-z0-9.-]{3,40}$'),
  voter    text not null check (length(voter) between 8 and 64),
  choice   text not null check (choice in ('cut', 'nocut')),
  voted_at timestamptz not null default now(),
  primary key (room, voter)
);
create index if not exists room_votes_voted_at on public.room_votes (voted_at);

alter table public.room_votes enable row level security;
-- sem policies: leitura e escrita só pelas funções abaixo

create or replace function public.room_cast(p_room text, p_voter text, p_choice text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip text := coalesce(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), 'desconhecido');
begin
  if p_room is null or p_room !~ '^[a-z0-9.-]{3,40}$' then
    raise exception 'sala inválida' using errcode = '22023';
  end if;
  if p_choice is null or p_choice not in ('cut', 'nocut') then
    raise exception 'escolha inválida' using errcode = '22023';
  end if;
  if p_voter is null or length(p_voter) not between 8 and 64 then
    raise exception 'votante inválido' using errcode = '22023';
  end if;

  delete from public.room_votes where voted_at < now() - interval '1 day';
  delete from public.vote_attempts where at < now() - interval '1 hour';
  -- numa sala de aula muita gente divide o mesmo IP: o limite é mais folgado que o dos dilemas
  if (select count(*) from public.vote_attempts where ip = v_ip and at > now() - interval '1 minute') >= 300 then
    raise exception 'muitos votos, tente de novo em instantes' using errcode = '54000';
  end if;
  insert into public.vote_attempts (ip) values (v_ip);

  insert into public.room_votes (room, voter, choice) values (p_room, p_voter, p_choice)
  on conflict (room, voter) do update set choice = excluded.choice, voted_at = now();
end;
$$;

create or replace function public.room_tally(p_room text)
returns table (choice text, votes bigint)
language sql
security definer
set search_path = ''
stable
as $$
  select c.choice, count(v.voter)
  from (values ('cut'), ('nocut')) as c(choice)
  left join public.room_votes v on v.choice = c.choice and v.room = p_room
  group by c.choice
  order by c.choice;
$$;

revoke all on function public.room_cast(text, text, text) from public;
revoke all on function public.room_tally(text) from public;
grant execute on function public.room_cast(text, text, text) to anon, authenticated;
grant execute on function public.room_tally(text) to anon, authenticated;
