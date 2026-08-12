const { Pool } = require('pg');

const MIGRATION_SQL = `
begin;

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
    return res.status(500).json({ success: false, error: 'env vars missing', url: !!supabaseUrl, key: !!serviceKey });
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

  const configs = [
    { label: 'us-east-1 pooler', host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: `postgres.${projectRef}` },
    { label: 'ap-se-1 pooler', host: 'aws-0-ap-southeast-1.pooler.supabase.com', port: 6543, user: `postgres.${projectRef}` },
    { label: 'direct DB', host: `db.${projectRef}.supabase.co`, port: 5432, user: 'postgres' }
  ];

  const errors = [];
  let pool = null;

  for (const cfg of configs) {
    try {
      pool = new Pool({
        host: cfg.host, port: cfg.port, database: 'postgres',
        user: cfg.user, password: serviceKey,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 6000, idleTimeoutMillis: 6000, max: 1
      });
      const client = await pool.connect();
      client.release();
      // connected — run migration
      const c2 = await pool.connect();
      try {
        const r = await c2.query(MIGRATION_SQL);
        await pool.end();
        return res.status(200).json({ success: true, via: cfg.label, results: [{ command: r.command || 'OK' }] });
      } finally {
        c2.release();
      }
    } catch (e) {
      errors.push({ label: cfg.label, error: e.message, code: e.code });
      if (pool) { try { await pool.end(); } catch (_) {} }
      pool = null;
    }
  }

  return res.status(500).json({ success: false, error: 'All connections failed', errors });
};
