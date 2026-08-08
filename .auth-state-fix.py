from pathlib import Path

path = Path('js/supabase-auth.js')
text = path.read_text(encoding='utf-8')


def replace_once(old, new, label):
    global text
    if old not in text:
        raise SystemExit(f'patch target missing: {label}')
    text = text.replace(old, new, 1)


replace_once(
"""      if (!result.ok) return { success: false, msg: this._signupDiagnostic(data, result.status) };""",
"""      if (!result.ok) {
        var signupCode = String((data && (data.code || data.error_code)) || '').toLowerCase();
        var signupRaw = String((data && (data.msg || data.message || data.error_description || data.error)) || '').toLowerCase();
        var alreadyRegistered = signupCode === 'user_already_exists' || signupCode === 'user_already_registered' || signupRaw.indexOf('already registered') !== -1 || signupRaw.indexOf('already exists') !== -1;
        if (alreadyRegistered) {
          this._markPendingEmail(email, 'existing_or_ambiguous');
          this._recentSignup = { email: email, at: Date.now(), reason: 'existing_or_ambiguous' };
          this._toggleResendVerification(false);
          return {
            success: true,
            pending: true,
            ambiguous: true,
            existing: true,
            signupState: true,
            msg: '这个邮箱已经注册过。本次输入的新密码不会覆盖原密码；请使用原密码登录，或点“忘记密码”重置。'
          };
        }
        return { success: false, msg: this._signupDiagnostic(data, result.status) };
      }""",
'signup explicit existing handling')

replace_once(
"""        this._clearSession(false);
        this._updateUI();
        this._toggleResendVerification(true);
        if (ambiguousExisting) {
          return {
            success: false,
            existing: true,
            signupState: true,
            msg: '这个邮箱可能已经注册过。本次输入的新密码不会覆盖旧账号密码；请使用原密码登录，或点“忘记密码”重置。'
          };
        }
        return {
          success: true,
          pending: true,
          ambiguous: false,
          msg: '注册成功，但账号还需要完成邮箱验证。请先打开验证邮件，确认后再登录。'
        };""",
"""        this._clearSession(false);
        this._updateUI();
        this._toggleResendVerification(!ambiguousExisting);
        if (ambiguousExisting) {
          return {
            success: true,
            pending: true,
            ambiguous: true,
            existing: true,
            signupState: true,
            msg: '这个邮箱可能已经注册过。本次输入的新密码不会覆盖旧账号密码；请使用原密码登录，或点“忘记密码”重置。'
          };
        }
        return {
          success: true,
          pending: true,
          ambiguous: false,
          needsVerification: true,
          signupState: true,
          msg: '注册成功，但账号还需要完成邮箱验证。请先打开验证邮件，确认后再登录。'
        };""",
'ambiguous signup state')

replace_once(
"""        if (notConfirmed) {
          this._markPendingEmail(email);
          this._toggleResendVerification(true);
          return { success: false, needsVerification: true, msg: '账号已经注册，但邮箱还没有验证。请先打开验证邮件完成确认；没收到可重新发送验证邮件。' };
        }""",
"""        if (notConfirmed) {
          this._markPendingEmail(email);
          this._toggleResendVerification(true);
          this._applySignupActions({ ambiguous: false });
          return {
            success: false,
            pending: true,
            ambiguous: false,
            signupState: true,
            needsVerification: true,
            msg: '账号已经注册，但邮箱还没有验证。请先打开验证邮件完成确认；没收到可重新发送验证邮件。'
          };
        }""",
'email not confirmed actions')

replace_once(
"""        if (invalidCredentials && signupState) {
          this._toggleResendVerification(true);
          if (signupState.reason === 'existing_or_ambiguous') {
            return {
              success: false,
              signupState: true,
              msg: '这次注册没有生成可立即登录的新账号密码。若该邮箱以前注册过，请使用原密码；不确定原密码时请点“忘记密码”重置。若是首次注册，请先完成邮箱验证。'
            };
          }
          return {
            success: false,
            needsVerification: true,
            signupState: true,
            msg: '这是刚注册、尚待邮箱验证的账号，不能立即登录。请先打开验证邮件完成确认，然后再点击登录。'
          };
        }""",
"""        if (invalidCredentials && signupState) {
          if (signupState.reason === 'existing_or_ambiguous') {
            this._toggleResendVerification(false);
            this._applySignupActions({ ambiguous: true, existing: true });
            return {
              success: false,
              pending: true,
              ambiguous: true,
              existing: true,
              signupState: true,
              msg: '这次注册没有生成新的账号密码。若该邮箱以前注册过，请使用原密码；不确定原密码时请点“忘记密码”重置。'
            };
          }
          this._toggleResendVerification(true);
          this._applySignupActions({ ambiguous: false });
          return {
            success: false,
            pending: true,
            ambiguous: false,
            needsVerification: true,
            signupState: true,
            msg: '这是刚注册、尚待邮箱验证的账号，不能立即登录。请先打开验证邮件完成确认，然后再点击登录。'
          };
        }""",
'invalid credentials signup state')

replace_once(
"""      } else if (result.success && result.pending) {
        this._setStatus(result.msg, result.ambiguous ? 'info' : 'success');
        var row = document.getElementById('loginNormalActions');
        if (row) {
          var buttons = row.querySelectorAll('button');
          if (buttons[0]) buttons[0].textContent = result.ambiguous ? '使用原密码登录' : '验证后登录';
          if (buttons[1]) {
            buttons[1].textContent = result.ambiguous ? '忘记密码' : '重新发送验证邮件';
            buttons[1].onclick = result.ambiguous
              ? function() { DaoWenAuth.resetPassword(); }
              : function() { DaoWenAuth.resendVerification(); };
          }
        }
      } else {""",
"""      } else if (result.pending || result.existing || result.signupState || result.needsVerification) {
        var ambiguousState = !!(result.ambiguous || result.existing);
        this._setStatus(result.msg || '请完成账号验证后继续', ambiguousState ? 'info' : (result.success ? 'success' : 'info'));
        this._applySignupActions({ ambiguous: ambiguousState, existing: !!result.existing });
      } else {""",
'doLogin state handling')

replace_once(
"""  _restoreLoginActions: function() {
    var row = document.getElementById('loginNormalActions');
    if (!row) return;
    var buttons = row.querySelectorAll('button');
    if (buttons[0]) { buttons[0].textContent = '登录'; buttons[0].onclick = function() { DaoWenAuth.doLogin('signin'); }; }
    if (buttons[1]) { buttons[1].textContent = '注册账号'; buttons[1].onclick = function() { DaoWenAuth.doLogin('signup'); }; }
  },""",
"""  _applySignupActions: function(state) {
    state = state || {};
    var ambiguous = !!(state.ambiguous || state.existing || state.reason === 'existing_or_ambiguous');
    var row = document.getElementById('loginNormalActions');
    if (!row) return;
    var buttons = row.querySelectorAll('button');
    if (buttons[0]) {
      buttons[0].textContent = ambiguous ? '使用原密码登录' : '验证后登录';
      buttons[0].onclick = function() { DaoWenAuth.doLogin('signin'); };
    }
    if (buttons[1]) {
      buttons[1].textContent = ambiguous ? '忘记密码' : '重新发送验证邮件';
      buttons[1].onclick = ambiguous
        ? function() { DaoWenAuth.resetPassword(); }
        : function() { DaoWenAuth.resendVerification(); };
    }
    this._toggleResendVerification(!ambiguous);
  },

  _restoreLoginActions: function() {
    var row = document.getElementById('loginNormalActions');
    if (!row) return;
    var buttons = row.querySelectorAll('button');
    if (buttons[0]) { buttons[0].textContent = '登录'; buttons[0].onclick = function() { DaoWenAuth.doLogin('signin'); }; }
    if (buttons[1]) { buttons[1].textContent = '注册账号'; buttons[1].onclick = function() { DaoWenAuth.doLogin('signup'); }; }
    this._toggleResendVerification(false);
  },""",
'central signup action helper')

replace_once(
"""        var recent = authSelf._recentSignup && authSelf._recentSignup.email === current;
        if (!recent && !authSelf._isPendingEmail(current)) authSelf._restoreLoginActions();""",
"""        var recent = authSelf._recentSignup && authSelf._recentSignup.email === current;
        var pending = authSelf._getPendingState(current);
        if (pending) authSelf._applySignupActions(pending);
        else if (!recent) authSelf._restoreLoginActions();""",
'email state sync')

path.write_text(text, encoding='utf-8')
print('auth state patch applied')
