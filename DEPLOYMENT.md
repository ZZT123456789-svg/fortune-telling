# 自有身份系统部署说明

本版本不再使用 Supabase Auth。Postgres 数据表仍可继续托管在现有数据服务中，浏览器不会接触数据服务密钥。

## 1. 执行数据库迁移

已有线上数据时，按顺序在数据库管理控制台执行：

1. `sql/migrate-custom-identity.sql`
2. `sql/secure-credits.sql`

迁移会保留原用户 UUID、余额、兑换记录和支付订单。旧账号的密码哈希无法迁出，因此首次进入新系统时需点击“已有账号，恢复数据”→“忘记密码”设置本站密码。

全新数据库只需执行 `sql/secure-credits.sql`。

## 2. 服务端环境变量

必须配置：

- `DATA_API_URL`：Postgres REST 数据接口地址。为兼容现有部署，也可继续使用 `SUPABASE_URL`。
- `DATA_SERVICE_KEY`：只放在服务端的数据服务密钥。为兼容现有部署，也可继续使用 `SUPABASE_SERVICE_ROLE_KEY`。
- `APP_URL`：站点公开地址，例如 `https://daowenai.icu`。
- `RESEND_API_KEY`：用于发送密码重设邮件。
- `MAIL_FROM`：已验证的发件地址，例如 `道问 <account@example.com>`。

支付和 AI 的现有环境变量保持不变：`ZPAY_PID`、`ZPAY_KEY`、`DEEPSEEK_API_KEY` 等。

不再需要 `SUPABASE_ANON_KEY`，也不要把 service key 放进前端代码。

## 3. 身份与数据规则

- 第一次访问由 `/api/session` 创建游客和 30 天 HttpOnly 会话。
- 游客可直接使用功能、兑换和支付，所有业务记录绑定游客 UUID。
- “保存账号”只给当前 UUID 增加邮箱和密码，不迁移、不换号。
- 登录已有账号时，当前游客数据、余额和订单由数据库事务合并到目标账号。
- 找回密码链接 30 分钟有效、只可使用一次；完成后旧会话全部失效。
