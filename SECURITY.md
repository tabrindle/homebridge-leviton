# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | ✅ Active support  |
| 2.x.x   | ⚠️ Security fixes only |
| < 2.0   | ❌ No longer supported |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue**
2. Email the maintainer directly or use GitHub's private vulnerability reporting
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

## Security Measures

This plugin implements:

- **HTTPS only** - All API communication uses TLS encryption
- **No credential storage** - Passwords are only used for authentication, tokens are used thereafter
- **Token refresh** - Automatic token rotation on expiry
- **Rate limiting** - Prevents abuse of Leviton API
- **Input validation** - All configuration inputs are validated
- **Dependency auditing** - Regular `npm audit` checks

## Best Practices for Users

1. Use a strong, unique password for your My Leviton account
2. Keep Homebridge and this plugin updated
3. Run Homebridge with minimal system privileges
4. Use Homebridge's secure remote access features

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next release

---

*Last updated: 2026-01-02*

