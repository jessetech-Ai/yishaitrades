# YishaiEdge OAuth And Encryption Setup

## B. Real Google OAuth Credentials

The app now supports a real Google Identity Services button when a client ID is configured.

1. Go to Google Cloud Console.
2. Create or select a project.
3. Configure the OAuth consent screen.
4. Create an OAuth 2.0 Client ID with type **Web application**.
5. Add your deployed origin, for example:
   - `https://yishaiedge.com`
   - `https://www.yishaiedge.com`
   - `http://localhost:5173` for local development
6. Copy the Web Client ID into your environment:

```bash
VITE_GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
```

7. Rebuild and redeploy.

The frontend decodes the Google ID token to create a local demo session. In production, send the credential to your backend and verify it using Google's token verification libraries before creating a server session.

## C. Encrypted Storage / Backups

The app now supports encrypted backup export/import from Settings.

- Algorithm: PBKDF2-SHA256 with 210,000 iterations
- Encryption: AES-256-GCM
- Key material: derived from a user-entered passphrase
- Recovery: impossible without the passphrase

For production server-side encryption, use the same principle with managed keys:

1. Encrypt sensitive columns before writing to PostgreSQL, or use application-layer envelope encryption.
2. Store encryption keys in AWS KMS, Google Cloud KMS, Doppler, or Vault.
3. Never store raw encryption keys in the database.
4. Keep TLS enforced for all API traffic.
5. Keep database backups encrypted at rest.

Recommended production model:

```txt
Browser -> HTTPS API -> App encrypts sensitive trade notes -> PostgreSQL encrypted at rest
                         Key management -> Cloud KMS/Vault
```

The local encrypted backup feature is useful immediately for safe portability, while the docs above describe the server-side model needed for a SaaS launch.