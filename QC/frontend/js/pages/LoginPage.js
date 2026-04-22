// ──────────────────────────────────────────────
//  Login Page
// ──────────────────────────────────────────────
// LoginPage
const LoginPage = {
    render() {
        return `
        <div class="login-page">
            <div class="login-card">
                <div class="login-logo">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h1 class="login-title">Smart Log</h1>
                <p class="login-subtitle">Quality Control Management</p>

                <div class="form-group">
                    <label>Username</label>
                    <i class="fas fa-user form-icon"></i>
                    <input type="text" class="form-input" id="login-username"
                           placeholder="Enter your username"
                           onkeydown="if(event.key==='Enter') LoginPage.login()">
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <i class="fas fa-lock form-icon"></i>
                    <input type="password" class="form-input" id="login-password"
                           placeholder="Enter your password"
                           onkeydown="if(event.key==='Enter') LoginPage.login()">
                </div>

                <div id="login-error" class="mb-4" style="color:var(--danger);font-size:13px;display:none"></div>

                <button class="btn btn-primary btn-block" onclick="LoginPage.login()" id="login-btn">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>

                <div class="text-center mt-4">
                    <button class="btn-link" onclick="LoginPage.showForgotPassword()">
                        Forgot Password?
                    </button>
                </div>
            </div>

            <div id="forgot-dialog"></div>
        </div>`;
    },

    async login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorEl = document.getElementById('login-error');
        const btn = document.getElementById('login-btn');

        if (!username || !password) {
            errorEl.textContent = 'Please enter username and password';
            errorEl.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span> Signing in...';

        try {
            await api.login(username, password);
            Router.navigate('dashboard');
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    },

    showForgotPassword() {
        document.getElementById('forgot-dialog').innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this) LoginPage.closeForgot()">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Reset Password</h3>
                    <button class="modal-close" onclick="LoginPage.closeForgot()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" class="form-input" id="fp-username" placeholder="Account username">
                    </div>
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" class="form-input" id="fp-new-password" placeholder="New password">
                    </div>
                    <div class="form-group">
                        <label>Confirm Password</label>
                        <input type="password" class="form-input" id="fp-confirm" placeholder="Confirm new password">
                    </div>
                    <div class="form-group">
                        <label>Manager Username</label>
                        <input type="text" class="form-input" id="fp-admin-user" placeholder="Manager username for approval">
                    </div>
                    <div class="form-group">
                        <label>Manager Password</label>
                        <input type="password" class="form-input" id="fp-admin-pass" placeholder="Manager password">
                    </div>
                    <div id="fp-error" style="color:var(--danger);font-size:13px;display:none"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="LoginPage.closeForgot()">Cancel</button>
                    <button class="btn btn-accent" onclick="LoginPage.resetPassword()">
                        <i class="fas fa-key"></i> Reset Password
                    </button>
                </div>
            </div>
        </div>`;
    },

    closeForgot() {
        document.getElementById('forgot-dialog').innerHTML = '';
    },

    async resetPassword() {
        try {
            await api.forgotPassword({
                username: document.getElementById('fp-username').value,
                new_password: document.getElementById('fp-new-password').value,
                confirm_password: document.getElementById('fp-confirm').value,
                admin_username: document.getElementById('fp-admin-user').value,
                admin_password: document.getElementById('fp-admin-pass').value,
            });
            App.toast('Password reset successfully!', 'success');
            LoginPage.closeForgot();
        } catch (err) {
            const el = document.getElementById('fp-error');
            el.textContent = err.message;
            el.style.display = 'block';
        }
    }
};
