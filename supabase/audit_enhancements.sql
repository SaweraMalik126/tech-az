-- Audit enhancements: request context, json diff, trigger with details

-- Ensure uuid generator is available
create extension if not exists pgcrypto;

-- Derive request context from headers/JWT and database
create or replace function app.get_request_context()
returns jsonb
language plpgsql
stable
set search_path = pg_catalog, public, app
as $$
declare
  jwt jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;

  h_actor_user_id text := current_setting('request.header.x-actor-user-id', true);
  h_actor_role    text := current_setting('request.header.x-actor-role', true);
  h_session_id    text := current_setting('request.header.x-session-id', true);

  h_real_ip       text := current_setting('request.header.x-real-ip', true);
  h_cf_ip         text := current_setting('request.header.cf-connecting-ip', true);
  h_client_ip     text := current_setting('request.header.x-client-ip', true);
  h_xff           text := current_setting('request.header.x-forwarded-for', true);

  h_ua            text := current_setting('request.header.user-agent', true);
  h_request_id    text := current_setting('request.header.x-request-id', true);

  v_actor uuid;
  v_role  text;
  v_sess  text;
  v_ip    inet;
  v_ua    text;
  v_req   uuid;
begin
  v_actor := coalesce(
    nullif(h_actor_user_id,'')::uuid,
    auth.uid(),
    nullif(jwt->>'sub','')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );

  v_role := coalesce(
    nullif(h_actor_role,''),
    (select ui.role from user_institutions ui
     where ui.user_id = v_actor
     order by ui.created_at desc limit 1),
    'anon'
  );

  v_sess := coalesce(nullif(h_session_id,''), 'unknown');

  v_ip := coalesce(
    nullif(h_real_ip,'')::inet,
    nullif(h_cf_ip,'')::inet,
    nullif(h_client_ip,'')::inet,
    nullif(split_part(coalesce(h_xff,''), ',', 1),'')::inet,
    '0.0.0.0'::inet
  );

  v_ua := coalesce(nullif(h_ua,''), 'unknown');
  v_req := coalesce(nullif(h_request_id,'')::uuid, gen_random_uuid());

  return jsonb_build_object(
    'actor_user_id', v_actor::text,
    'actor_role',    v_role,
    'session_id',    v_sess,
    'ip',            v_ip::text,
    'ua',            v_ua,
    'request_id',    v_req::text
  );
end;
$$;

-- JSON diff for details
create or replace function app.jsonb_diff(a jsonb, b jsonb)
returns jsonb
language sql immutable
as $$
with keys as (
  select k from jsonb_object_keys(a) as t(k)
  union
  select k from jsonb_object_keys(b) as t(k)
),
diff as (
  select k, a->k as a_val, b->k as b_val from keys
)
select coalesce(
  jsonb_object_agg(k, jsonb_build_object('from', a_val, 'to', b_val)),
  '{}'::jsonb
)
from diff
where coalesce(a_val, 'null'::jsonb) is distinct from coalesce(b_val, 'null'::jsonb);
$$;

-- Trigger to capture CRUD with rich details
create or replace function app.audit_row_changes()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, app
as $$
declare
  ctx jsonb := app.get_request_context();
  v_actor uuid := nullif((ctx->>'actor_user_id'), '')::uuid;
  v_role text := coalesce(nullif(ctx->>'actor_role',''), 'anon');
  v_session text := coalesce(nullif(ctx->>'session_id',''), 'unknown');
  v_ip inet := coalesce(nullif(ctx->>'ip','')::inet, '0.0.0.0'::inet);
  v_ua text := coalesce(nullif(ctx->>'ua',''), 'unknown');
  v_request uuid := coalesce(nullif(ctx->>'request_id','')::uuid, gen_random_uuid());
  v_action text;
  v_target_id text;
  v_old jsonb;
  v_new jsonb;
  v_details jsonb := null;
  v_target_table text := concat_ws('.', tg_table_schema, tg_table_name);
begin
  if (tg_op = 'UPDATE' and new is not distinct from old) then
    return new;
  end if;

  if (tg_op = 'INSERT') then
    v_action := 'insert';
    v_new := to_jsonb(new);
    v_target_id := coalesce((to_jsonb(new)->>'id'), new.id::text, '');
    v_details := jsonb_build_object('summary','row inserted');
  elsif (tg_op = 'UPDATE') then
    v_action := 'update';
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_target_id := coalesce(
      (to_jsonb(new)->>'id'),
      (to_jsonb(old)->>'id'),
      new.id::text, old.id::text, ''
    );
    v_details := app.jsonb_diff(v_old, v_new);
    if v_details ? 'profile_picture_url' then
      v_details := v_details || jsonb_build_object('hint',
        case
          when (v_old->>'profile_picture_url') is null and (v_new->>'profile_picture_url') is not null then 'profile picture added'
          when (v_old->>'profile_picture_url') is not null and (v_new->>'profile_picture_url') is null then 'profile picture removed'
          else 'profile picture changed'
        end
      );
    end if;
    if v_details ? 'full_name' then
      v_details := v_details || jsonb_build_object('hint_name','name changed');
    end if;
    if v_details ? 'language_preference' then
      v_details := v_details || jsonb_build_object('hint_language','language changed');
    end if;
  else
    v_action := 'delete';
    v_old := to_jsonb(old);
    v_target_id := coalesce((to_jsonb(old)->>'id'), old.id::text, '');
    v_details := jsonb_build_object('summary','row deleted');
  end if;

  insert into app.audit_log (
    occurred_at, actor_user_id, actor_role, action, target_table, target_id,
    session_id, ip_address, user_agent, request_id,
    details, old_values, new_values
  ) values (
    clock_timestamp(), v_actor, v_role, v_action, v_target_table, v_target_id,
    v_session, v_ip, v_ua, v_request,
    v_details, v_old, v_new
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- Defensive defaults so fields are never null if called outside web path
alter table app.audit_log
  alter column request_id   set default gen_random_uuid(),
  alter column actor_role   set default 'anon',
  alter column session_id   set default 'unknown',
  alter column ip_address   set default '0.0.0.0'::inet,
  alter column user_agent   set default 'unknown';