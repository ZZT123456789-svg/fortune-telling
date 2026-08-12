# 无登录匿名身份部署说明

本版本没有登录、注册、邮箱、密码或找回密码。服务端用签名 HttpOnly Cookie 为每个浏览器生成匿名 UUID，积分、数据和支付订单绑定该 UUID。

## 数据库迁移

已有线上数据库依次执行：

1. `sql/remove-login-system.sql`
2. `sql/secure-credits.sql`

第一步只解除登录用户表外键并删除自有账号表，不删除余额、积分流水、兑换或支付订单。

全新数据库只需执行 `sql/secure-credits.sql`。

## 服务端环境变量

必须配置：

- `DATA_API_URL`（或兼容变量 `SUPABASE_URL`）
- `DATA_SERVICE_KEY`（或兼容变量 `SUPABASE_SERVICE_ROLE_KEY`）
- `VISITOR_SIGNING_KEY`：至少 32 字符的随机服务端密钥
- `ZPAY_PID`、`ZPAY_KEY`
- AI 使用的现有服务端密钥

不再需要 `SUPABASE_ANON_KEY`、`RESEND_API_KEY` 或 `MAIL_FROM`。

## 数据规则

- 不显示任何登录入口，所有功能直接使用。
- 匿名 Cookie 有效期一年，浏览器不能伪造或修改 UUID。
- 购买、兑换、余额和订单跟随当前浏览器 Cookie。
- 清除 Cookie、换浏览器或换设备后无法恢复原匿名 UUID，请在购买页面明确提示用户。
