const { Pool } = require('pg');

const MIGRATION_SQL = `
begin;

-- 删除所有业务表指向 auth.users 或 app_users 的外键
do $$
declare
  target_table text;
  fk record;
begin
  foreach target_table in array array[
    'user_balances', 'redeem_redemptions', 'redeem_attempts',
    'credit_ledger', 'payment_orders', 'user_data'
  ] loop
    if to_regclass('public.' || target_table) is not null then
      for fk in
        select conname
        from pg_constraint
        where contype = 'f' and conrelid = to_regclass('public.' || target_table)
          and exists (
            select 1 from unnest(conkey) key(attnum)
            join pg_attribute a on a.attrelid = conrelid and a.attnum = key.attnum
            where a.attname = 'user_id'
          )
      loop
        execute format('alter table public.%I drop constraint %I', target_table, fk.conname);
      end loop;
    end if;
  end loop;
end $$;

drop function if exists public.api_merge_guest_identity(uuid, uuid);
drop table if exists public.app_login_attempts;
drop table if exists public.app_password_resets;
drop table if exists public.app_sessions;
drop table if exists public.app_users;
drop table if exists public.trusted_reset_attempts;
drop table if exists public.trusted_recovery_devices;

commit;
`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ success: false, error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set' });
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const pool = new Pool({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: serviceKey,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    max: 1
  });

  const results = [];
  try {
    const client = await pool.connect();
    try {
      const r = await client.query(MIGRATION_SQL);
      results.push({ sql: 'remove-login-system', rowCount: r.length >= 0 ? r.length : null, command: r.command });
    } finally {
      client.release();
    }
    await pool.end();
    return res.status(200).json({ success: true, results });
  } catch (e) {
    try { await pool.end(); } catch (_) {}
    return res.status(500).json({ success: false, error: e.message, detail: e.detail || '' });
  }
};
