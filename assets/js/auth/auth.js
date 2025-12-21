/**
 * HiveDrive - Authentication Module
 */

class Auth {
    constructor() {
        this.user = null;
        this.session = null;
    }

    /**
     * Initialize auth - check for existing session
     */
    async init() {
        try {
            const { data: { session }, error } = await db.auth.getSession();
            if (error) throw error;

            if (session) {
                this.session = session;
                await this.loadUserProfile(session.user.id);
            }

            // Listen for auth changes
            db.auth.onAuthStateChange(async (event, session) => {
                this.session = session;
                if (session) {
                    await this.loadUserProfile(session.user.id);
                } else {
                    this.user = null;
                }

                window.dispatchEvent(new CustomEvent('authStateChanged', {
                    detail: { event, session, user: this.user }
                }));
            });

            return { user: this.user, session: this.session };
        } catch (error) {
            console.error('Auth init error:', error);
            return { user: null, session: null };
        }
    }

    /**
     * Load user profile from database
     */
    async loadUserProfile(userId) {
        try {
            const { data, error } = await db
                .from('users')
                .select('*, branches(name, name_en)')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.warn('Load profile error:', error);
                // If RLS blocks or no record, use basic auth data
                const { data: authData } = await db.auth.getUser();
                if (authData?.user) {
                    this.user = {
                        id: authData.user.id,
                        email: authData.user.email,
                        full_name: authData.user.email?.split('@')[0] || 'User',
                        role: 'admin' // Default role
                    };
                }
                return this.user;
            }

            if (!data) {
                // No user record in users table - use auth data
                const { data: authData } = await db.auth.getUser();
                if (authData?.user) {
                    this.user = {
                        id: authData.user.id,
                        email: authData.user.email,
                        full_name: authData.user.email?.split('@')[0] || 'User',
                        role: 'admin'
                    };
                }
                return this.user;
            }

            this.user = data;
            return data;
        } catch (error) {
            console.error('Load profile error:', error);
            // Fallback to basic auth data
            try {
                const { data: authData } = await db.auth.getUser();
                if (authData?.user) {
                    this.user = {
                        id: authData.user.id,
                        email: authData.user.email,
                        full_name: authData.user.email?.split('@')[0] || 'User',
                        role: 'admin'
                    };
                }
            } catch (e) {
                console.error('Fallback error:', e);
            }
            return this.user;
        }
    }

    /**
     * Login with email and password
     */
    async login(email, password) {
        try {
            const { data, error } = await db.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.session = data.session;
            await this.loadUserProfile(data.user.id);

            return { success: true, user: this.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            const { error } = await db.auth.signOut();
            if (error) throw error;

            this.user = null;
            this.session = null;

            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.session;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.user;
    }

    /**
     * Get user role
     */
    getRole() {
        return this.user?.role || null;
    }

    /**
     * Check if user has specific role
     */
    hasRole(roles) {
        if (!this.user) return false;
        if (typeof roles === 'string') roles = [roles];
        return roles.includes(this.user.role);
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.hasRole('admin');
    }

    /**
     * Check if user is manager or admin
     */
    isManager() {
        return this.hasRole(['admin', 'manager']);
    }

    /**
     * Get role display name
     */
    getRoleDisplayName() {
        const roleMap = {
            admin: 'role_admin',
            manager: 'role_manager',
            reception: 'role_reception',
            specialist: 'role_specialist',
            warehouse: 'role_warehouse',
            treasurer: 'role_treasurer',
            technician: 'role_technician'
        };
        return t(roleMap[this.user?.role] || 'unknown');
    }
}

// Create global instance
window.auth = new Auth();
