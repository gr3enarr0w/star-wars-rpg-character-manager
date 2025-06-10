# Security Guide

## 🔒 Setting Up Secure Environment Variables

This application requires several secure keys and passwords. **NEVER use the default/example values in production!**

### Required Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Generate secure random keys:**
   ```bash
   # Flask Secret Key
   python -c "import secrets; print(f'FLASK_SECRET_KEY={secrets.token_urlsafe(32)}')"
   
   # JWT Secret Key  
   python -c "import secrets; print(f'JWT_SECRET_KEY={secrets.token_urlsafe(32)}')"
   
   # Admin Password
   python -c "import secrets; print(f'ADMIN_PASSWORD={secrets.token_urlsafe(16)}')"
   
   # Encryption Keys
   python -c "import secrets; print(f'ENCRYPTION_PASSWORD={secrets.token_urlsafe(32)}')"
   python -c "import secrets; print(f'ENCRYPTION_SALT={secrets.token_urlsafe(32)}')"
   ```

3. **Update your .env file** with the generated values

### 🚨 Security Checklist

- [ ] All default passwords changed
- [ ] Strong random keys generated
- [ ] `.env` file never committed to Git
- [ ] Encryption key stored securely (not in repository)
- [ ] Admin password follows strong password policy
- [ ] OAuth credentials configured for your domain

### 🔑 Key Management

1. **Encryption Key**: Store separately from application code
2. **Database Backups**: Ensure encrypted data is properly backed up
3. **Key Rotation**: Regularly rotate secrets in production
4. **Access Control**: Limit who can access production secrets

### ⚠️ What NOT to Do

- ❌ Don't use example/default passwords
- ❌ Don't commit secrets to Git
- ❌ Don't use weak or predictable passwords
- ❌ Don't store secrets in application code
- ❌ Don't share secrets via insecure channels

### 🛡️ Production Security

For production deployments:

1. **Use a dedicated secrets management system** (HashiCorp Vault, AWS Secrets Manager, etc.)
2. **Enable audit logging** for all secret access
3. **Implement key rotation policies**
4. **Regular security audits** and penetration testing
5. **Monitor for exposed secrets** in your codebase

### 🔍 Security Audit

Run security checks:
```bash
# Check for secrets in git history
git log --all --grep="password\|secret\|key" --oneline

# Scan for potential secrets in code
grep -r -i "password\|secret\|key" --include="*.py" src/
```

## 📞 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public issue
2. Email the maintainer directly with details
3. Include steps to reproduce
4. Allow time for fix before public disclosure

## 🔐 Compliance

This application implements:
- NIST-compliant encryption (AES-256)
- Secure password hashing (bcrypt)
- Two-factor authentication (TOTP)
- Role-based access control
- Comprehensive audit logging