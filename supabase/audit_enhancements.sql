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
    nullif(jwt->>'sub','')::uuid
  );

  v_role := coalesce(
    (select ui.role from user_institutions ui
     where ui.user_id = v_actor
     order by ui.created_at desc limit 1),
    nullif(jwt->>'role',''),
    nullif(h_actor_role,'')
  );

  v_sess := coalesce(
    nullif(h_session_id,''),
    nullif(jwt->>'session_id',''),
    nullif(jwt->>'sid',''),
    nullif(jwt->>'jti',''),
    nullif(jwt->>'sub',''),
    v_actor::text
  );

  v_ip := coalesce(
    nullif(h_real_ip,'')::inet,
    nullif(h_cf_ip,'')::inet,
    nullif(h_client_ip,'')::inet,
    nullif(split_part(coalesce(h_xff,''), ',', 1),'')::inet,
    inet_client_addr()
  );

  v_ua := coalesce(v_role, nullif(h_ua,''));
  v_req := v_actor;

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
  v_role text := nullif(ctx->>'actor_role','');
  v_session text := nullif(ctx->>'session_id','');
  v_ip inet := nullif(ctx->>'ip','')::inet;
  v_ua text := nullif(ctx->>'ua','');
  v_request uuid := nullif(ctx->>'request_id','')::uuid;
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

  -- Ensure actor and context fields are fully populated without nulls
  if v_actor is null then
    v_actor := coalesce(
      nullif((coalesce(v_new, '{}'::jsonb)->>'user_id'), '')::uuid,
      nullif((coalesce(v_old, '{}'::jsonb)->>'user_id'), '')::uuid,
      nullif((coalesce(v_new, '{}'::jsonb)->>'created_by'), '')::uuid,
      nullif((coalesce(v_old, '{}'::jsonb)->>'created_by'), '')::uuid,
      nullif((coalesce(v_new, '{}'::jsonb)->>'owner_id'), '')::uuid,
      nullif((coalesce(v_old, '{}'::jsonb)->>'owner_id'), '')::uuid
    );
  end if;

  if v_role is null and v_actor is not null then
    select ui.role into v_role
    from user_institutions ui
    where ui.user_id = v_actor
    order by ui.created_at desc
    limit 1;
  end if;

  v_ua := coalesce(v_ua, v_role);
  v_session := coalesce(v_session, (v_actor::text));
  v_ip := coalesce(v_ip, inet_client_addr());
  v_request := coalesce(v_request, v_actor);

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

-- Remove defaults so that values must be supplied from context and logic
alter table app.audit_log
  alter column request_id   drop default,
  alter column actor_role   drop default,
  alter column session_id   drop default,
  alter column ip_address   drop default,
  alter column user_agent   drop default;