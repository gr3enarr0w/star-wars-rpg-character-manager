# Security Documentation

## Overview

The Star Wars RPG Character Manager implements enterprise-grade security measures to protect user data and ensure NIST compliance. This document outlines the security architecture, implementation details, and best practices.

## 🔒 Security Architecture

### Data Encryption at Rest

#### Email Encryption
- **Algorithm**: AES-256 via Fernet symmetric encryption
- **Key Derivation**: PBKDF2 with SHA-256 hash function
- **Iterations**: 100,000 (exceeds NIST minimum of 10,000)
- **Salt**: Installation-specific salt for key derivation
- **Storage**: All user emails encrypted before database storage

#### Implementation Details
```python
# Key generation using PBKDF2
kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,  # 256-bit key
    salt=salt,
    iterations=100000,  # NIST recommended minimum
)
key = base64.urlsafe_b64encode(kdf.derive(password))
cipher = Fernet(key)
```

### Database Security

#### Secure Indexing
- **Email Hash**: SHA-256 hash of emails for database indexing
- **No Plaintext**: Zero plaintext emails stored in database
- **Unique Constraints**: Email hash uniqueness enforcement
- **Sparse Indexes**: Handle null values gracefully

#### Schema Protection
```javascript
// User document structure
{
  username: "user123",
  email: "encrypted_base64_data...",      // Encrypted email
  email_hash: "sha256_hash...",           // For indexing/lookup
  password_hash: "bcrypt_hash...",        // Secure password storage
  role: "player",
  // ... other fields
}
```

### Authentication & Authorization

#### JWT Token Security
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 24-hour token lifetime
- **Payload**: Minimal user data (id, username, role only)
- **No Sensitive Data**: Email excluded from JWT payload

#### Two-Factor Authentication
- **Standard**: TOTP (Time-based One-Time Password)
- **Library**: PyOTP for TOTP generation/validation
- **QR Codes**: Secure QR code generation for authenticator apps
- **Backup Codes**: Secure backup code generation and storage

### API Security

#### Response Sanitization
All API endpoints exclude sensitive data from responses:

```python
# Safe user data format
safe_user = {
    'id': str(user._id),
    'username': user.username,
    'role': user.role
    # Email intentionally excluded
}
```

#### Endpoint Protection
- **Authentication Required**: All user data endpoints protected
- **Role-Based Access**: Admin, GM, and Player role enforcement
- **Resource Ownership**: Users can only access their own data
- **Campaign Access**: Proper GM/player relationship validation

### Security Audit Logging

#### Event Tracking
- **Data Access**: User data read/write operations
- **Encryption Events**: Successful/failed encryption operations
- **Authentication**: Login attempts and failures
- **Authorization**: Access control violations

#### Log Format
```python
{
    "timestamp": "2025-06-09T11:30:00Z",
    "user_id": "user_identifier",
    "action": "get_user_by_email",
    "data_type": "user_data",
    "success": True,
    "ip_address": "192.168.1.1"
}
```

## 🛡️ NIST Compliance

### Standards Adherence

#### NIST SP 800-63B (Authentication)
- ✅ Password complexity requirements
- ✅ Multi-factor authentication support
- ✅ Secure session management
- ✅ Account lockout protection

#### NIST SP 800-57 (Cryptographic Key Management)
- ✅ 256-bit encryption keys
- ✅ PBKDF2 key derivation
- ✅ Secure key storage
- ✅ Key rotation capability

#### NIST SP 800-53 (Security Controls)
- ✅ Access control implementation
- ✅ Audit and accountability
- ✅ System and communication protection
- ✅ Identification and authentication

### Encryption Implementation

#### Key Management
```python
class DataEncryption:
    def _get_or_create_master_key(self) -> bytes:
        """Generate NIST-compliant encryption key"""
        password = os.getenv('ENCRYPTION_PASSWORD').encode()
        salt = os.getenv('ENCRYPTION_SALT').encode()
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256-bit key
            salt=salt,
            iterations=100000,  # NIST minimum: 10,000
        )
        return base64.urlsafe_b64encode(kdf.derive(password))
```

#### Data Protection
- **Confidentiality**: AES-256 encryption for data at rest
- **Integrity**: HMAC verification in Fernet implementation
- **Availability**: Graceful degradation on encryption failures

## 🔐 Security Best Practices

### Deployment Security

#### Environment Variables
```bash
# Required secure configuration
ENCRYPTION_PASSWORD=strong-unique-password-32chars+
ENCRYPTION_SALT=unique-installation-salt-16chars+
JWT_SECRET_KEY=jwt-signing-key-64chars+
FLASK_SECRET_KEY=flask-session-key-32chars+
```

#### Database Security
- Use MongoDB authentication in production
- Enable TLS/SSL for database connections
- Implement network-level access controls
- Regular security updates and patches

#### Application Security
- HTTPS enforcement in production
- Secure session cookie configuration
- CSRF protection implementation
- Rate limiting for authentication endpoints

### Operational Security

#### User Management
- Regular audit of user accounts and permissions
- Immediate revocation of access for departing users
- Periodic review of admin and GM permissions
- Monitor for unusual account activity

#### Monitoring
- Real-time security event monitoring
- Failed authentication attempt tracking
- Unusual data access pattern detection
- Regular security log review and analysis

#### Backup Security
- Encrypted database backups
- Secure backup storage with access controls
- Regular backup restoration testing
- Backup retention policy enforcement

## 🚨 Incident Response

### Security Event Types

#### Data Breach
1. **Immediate**: Isolate affected systems
2. **Assessment**: Determine scope and impact
3. **Notification**: Inform affected users and authorities
4. **Remediation**: Apply security patches and monitoring

#### Authentication Compromise
1. **Account Lockout**: Disable compromised accounts
2. **Password Reset**: Force password changes
3. **Session Termination**: Invalidate active sessions
4. **Investigation**: Analyze attack vectors

#### System Compromise
1. **System Isolation**: Disconnect affected systems
2. **Forensic Analysis**: Preserve evidence and analyze
3. **System Restoration**: Clean restoration from backups
4. **Security Hardening**: Additional protective measures

### Contact Information
- **Security Team**: security@organization.com
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Incident Reporting**: incidents@organization.com

## 🔍 Security Testing

### Automated Testing
- Regular penetration testing
- Vulnerability scanning
- Dependency security audits
- Code security analysis

### Manual Testing
- Authentication bypass attempts
- Authorization escalation testing
- Input validation verification
- Session management analysis

### Compliance Testing
- NIST control verification
- Encryption standard validation
- Audit log completeness
- Access control effectiveness

## 📋 Security Checklist

### Pre-Deployment
- [ ] All environment variables configured securely
- [ ] Database encryption enabled
- [ ] HTTPS certificates installed
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Audit logging enabled

### Post-Deployment
- [ ] Security monitoring active
- [ ] Backup procedures tested
- [ ] Incident response plan validated
- [ ] User training completed
- [ ] Regular security reviews scheduled

### Ongoing Maintenance
- [ ] Security patches applied monthly
- [ ] User access reviewed quarterly
- [ ] Penetration testing annually
- [ ] Security training updated
- [ ] Compliance audits completed

## 📚 References

- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) - Authentication Guidelines
- [NIST SP 800-57](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final) - Key Management
- [NIST SP 800-53](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final) - Security Controls
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Web Application Security
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

---

*Security is not a destination, but a journey of continuous improvement.*