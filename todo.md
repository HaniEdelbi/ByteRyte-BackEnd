The Project name is ByteRyte.

BackEnd:

✅ COMPLETE PASSWORD WALLET PROMPT (UPDATED WITH ALL NEW FEATURES)

Build a fully-featured, high-security Password Wallet application with modern UI/UX and strong encryption.
The system must include:

password creation

secure storage

item-based organization

strong password generator

advanced privacy/security layers

emergency access

tamper alerts

hidden vaults

audits

password strength improvement suggestions

This specification should be implemented at a professional level, comparable to 1Password, LastPass, or Bitwarden.

🧩 1. Core Password Storage Features

Each password entry must include:

Title (e.g., “YouTube”)

Service icon (auto-fetch favicon or built-in icons)

Email / username

Generated or user-entered password

Masked by default

Notes (optional)

Timestamps: created, updated, last viewed, last used

The UI format for each saved item:

[service icon] YouTube
email@example.com
•••••••••••••••• (masked password)
[copy] [show/hide] [edit] [delete]

Functionality must include:

Copy email

Copy password

Reveal password (with timer)

Edit entry

Delete entry

Favorite / pin item

Assign tags (smart tags + custom tags)

🔐 2. Strong Password Generator

Include a powerful generator with options for:

Length (8–64+)

Uppercase letters

Lowercase letters

Numbers

Symbols

Exclude similar characters (0, O, I, l)

Passphrase mode (random word combinations)

Real-time strength meter

Generated passwords should be automatically saved into entries if chosen.

🛡️ 3. High-Security Architecture (Zero-Knowledge Model)
3.1 Client-side Encryption

Encrypt everything locally before syncing or storing.

Use AES-256-GCM or XChaCha20-Poly1305.

Master key derived using Argon2id or PBKDF2 with high iteration count.

Server stores only encrypted blobs.

Never store or transmit plaintext passwords or master keys.

3.2 Secure Login

Master password unlocks vault.

Biometric unlock (FaceID, TouchID, Android Biometrics).

Optional 2FA (TOTP).

3.3 Auto-Lock

Vault locks after inactivity or app close.

Lock on loss of focus (optional).

3.4 Secure Clipboard Handling

Clear clipboard contents after 10–30 seconds.

3.5 Encrypted Local Storage

Vault persists securely using encrypted IndexedDB or Secure Storage.

3.6 Cloud Sync (optional)

End-to-end encrypted syncing across devices.

Server stores only encrypted vault blobs.

🚨 4. Advanced Security Features
4.1 Emergency Access

Allow user to select trusted contacts who can request access to the vault.
User receives notifications and can approve/deny.
If the user doesn’t respond within a configurable time period → access is granted.

4.2 Password Shredding (Secure Delete)

When deleting an item:

Overwrite memory buffers

Replace encrypted blobs

Ensure unrecoverable deletion

4.3 Anti-Screenshot Mode

Mask sensitive content from screenshots.

Blur passwords or the entire vault UI on screenshot attempt (mobile) or print-screen detection (desktop).

4.4 Tamper Detection + Notification

Detect suspicious behavior:

Vault file modified

Unexpected process edits storage

Unexpected access pattern

Trigger immediate:

Lockout

Notification to user

Optional device alert email

4.5 Hidden “Stealth Vault”

A secondary vault unlocked by an alternate password.
Displays decoy items for situations where a user is forced to unlock under pressure.

🗂️ 5. Organization & Productivity Features
5.1 Favorites / Pinned Items

Star important logins; show them first on dashboard.

5.2 Smart Tags

Automatically tag entries based on domain:

Banking

Social

Gaming

Shopping

Work

Entertainment

Allow custom tags.

5.3 Categories & Filters

Filter by:

category

last edited

frequently used

favorites

tags

5.4 Search

Instant search across:

title

username

tags

notes

📊 6. Password Strength & Security Auditing
6.1 Password Strength Audit

Identify:

weak passwords

reused passwords

similar passwords

passwords older than X days

passwords used across multiple services

6.2 Password Expiration Policies (Optional)

Allow optional rules:

Remind user to change password every X days

Useful for organizational vaults

6.3 Breach Checks (safe, hashed mode)

Use HaveIBeenPwned-style k-anonymous API to detect breached credentials (never send full password).

6.4 Password Improvement Suggestions

For any weak password, generate instructions on:

how to strengthen it

how to follow site-specific rules

how to make a unique, high-entropy replacement

📅 7. Login History for Each Item

Each password item should track:

Created date

Last edited

Last copied

Last revealed

Last auto-filled

Last password change date

Last login attempt (optional with autofill)

This can be used for audits or reminders.

👥 8. Group Vaults / Shared Vaults

Allow creation of shared vaults:

Family vaults

Team vaults

Work groups

Each vault should have its own encryption key.
Sharing occurs by re-encrypting item keys with each member’s public key.

Permissions:

Read-only

Read + write

Admin

Shared vault changes should be synced to all members.

🌐 9. UI/UX & Platform Features
Modern Dashboard

Grid layout with logos, titles, emails, masked passwords.

Dark/Light/AMOLED Themes
Offline Mode

Everything works offline; sync occurs when connected.

Custom Icons

Users may upload their own icons.

Favicon Auto-Detection

Automatically fetch icons based on domain.

Browser Extension-Style Autofill

Autofill username + password

Autofill TOTP 2FA codes

Strict domain matching to prevent phishing

Phishing Protection

Warn users if autofill is triggered on a suspicious domain.

🛠️ 10. Technical Requirements
Frontend (choose one)

Vue (recommended)

React

Svelte

Must include components for:

Vault unlock

Entry card

Add/edit entry

Password generator

Strength meter

Smart tag system

Audit dashboard

Backend (optional, for syncing)

Node.js (Express/Fastify) or AWS Lambda

Database: DynamoDB, MongoDB, PostgreSQL, or S3 encrypted objects

Store only encrypted blobs; no plaintext data ever

Deployment

Frontend → AWS S3 + CloudFront

Backend → AWS Lambda or EC2

Storage → DynamoDB or S3 with encryption

🎯 Goal of This Prompt

Produce a complete Password Wallet including:

Strong password creation

Secure zero-knowledge storage

Entry organization (tags, categories, favorites)

Emergency access

Tamper detection

Anti-screenshot mode

Password shredding

Stealth vault

Password audits

Strength improvements

Group vaults

Login history

And show:

architecture

UI structure

API examples

encryption flow

best practices

11. Workplace / Enterprise Environment & Protection from IT Misuse

Design the Password Wallet to be safe not only from external attackers, but also from potential IT errors or misbehavior.
Focus on:

11.1 Role-Based Access Control (RBAC) & Least Privilege

Define roles such as:

Org Owner

Security Admin

IT Admin / Workspace Admin

Vault Manager

Regular User

Each role must only have the minimum permissions needed:

IT admins can manage accounts, groups, SSO, devices, but cannot view or decrypt vault contents.

Vault Managers can control who has access to a vault, but still cannot bypass encryption or see user master passwords.

11.2 Zero-Knowledge Even for Admins

Maintain the zero-knowledge model:

No backend or admin (including IT) can see plaintext passwords.

All encryption and decryption happens client-side.

Admins can revoke access, rotate keys, or disable users, but never see their vault contents.

11.3 Admin Console & Governance

Provide an Admin Console for workplace use:

Manage users, groups, licenses.

Assign roles and group vault permissions.

Enforce security policies (minimum password length, 2FA required, device controls).

Configure data residency and retention policies.

11.4 Immutable Audit Logs & Monitoring

Maintain tamper-resistant audit logs for:

Logins, unlocks, failed unlock attempts.

Vault sharing changes, role changes, group membership changes.

Emergency access events and approvals.

Logs must be:

Immutable (WORM-style / append-only).

Exportable to SIEM (e.g., Splunk, Datadog) for security review.

IT/Admins can see metadata (who accessed what, when) but not secrets themselves.

11.5 Access Controls & Data Loss Prevention (DLP)

Ability to disable bulk export of passwords except for specific high-level roles.

Option to:

Disable copy for certain high-sensitivity items.

Block screenshots / screen recording on managed devices (where possible).

Allow organizations to define:

Which users can create shared/group vaults.

Whether passwords can be shared outside the organization.

11.6 Just-in-Time & Temporary Access

Ability to grant time-limited access to specific vaults:

Example: contractor gets access to “Project X Vault” for 7 days.

After expiry, access auto-revoked and logged.

11.7 Break-Glass / Emergency Access with Controls

“Break-glass” accounts for emergency access:

Protected by hardened policies (hardware keys, extra approval).

Every use is heavily logged and notifiable to security contacts.

11.8 SSO, SCIM & Device Trust

Support SSO (SAML/OIDC) so employees log in with company identity (e.g., Google Workspace, Azure AD).

SCIM provisioning for automatic:

User creation

Role assignments

Deprovisioning on employee exit

Optional policies:

Restrict access to managed devices only.

IP allowlisting or geo-restrictions for admin actions.

Overall goal:
Even if IT has full access to the infrastructure and admin console, they must not be able to:

See users’ raw passwords.

Steal vault contents.

Export everything without trace.

But they should be able to:

Enforce policy.

Audit behavior.

Lock or remove accounts.

Manage groups and access at a high level.

End of BackEnd Prompt.

---

FrontEnd:

Design a modern, high-end frontend for the Password Wallet app described in the prompt.

Overall Style

Sleek dashboard look, inspired by premium SaaS tools.

Use dark mode by default, with support for light and AMOLED themes.

Lots of cards, subtle glassmorphism, soft shadows, and micro-interactions (hover states, smooth transitions).

Rounded corners, 12–16px radius. Comfortable spacing and a clear visual hierarchy.

Layout

Persistent left sidebar with:

App logo + name (“Vault”, “Keylock”, etc.)

Sections:

Dashboard

All Items

Favorites

Categories (Banking, Social, Work, etc.)

Group Vaults (Family, Team, Work)

Security Audit

Settings

Top bar in main content:

Search bar (“Search by title, email, tag…”)

Theme toggle (light/dark/AMOLED)

User avatar/menu (profile, lock vault, logout)

Main area:

Grid of password cards (responsive: 1–4 columns depending on width).

Filters/chips row: All / Favorites / Weak / Reused / Expiring / Breached.

Floating “+ Add Item” button in bottom-right (FAB style).

Password Card Component

For each entry (YouTube, Bank, etc.), show a compact card:

Top row:

Service icon (favicon or custom icon)

Title (e.g., “YouTube”)

Favorite star ⭐ (click to toggle)

Middle:

Email/username (truncate & tooltip on hover)

Bottom:

Masked password: •••••••••••••

Buttons:

[Copy] (clipboard icon)

[Reveal] (eye icon; reveal for a few seconds with countdown)

[More] (3-dot menu → View details, Edit, Move to group vault, Delete)

Subtle badge row:

Tags (Banking / Social / Work)

Strength badge: “Strong”, “Weak”, “Reused”, etc. (color-coded)

Item Detail Panel (Right Drawer)

When clicking a card:

Slide in a right-side drawer with full details:

Service icon + title

Email / username

Password with show/hide + copy + regenerate buttons

Strength bar + explanation (why it’s strong/weak)

Tags and category selector

Group vault membership (which vaults it belongs to)

Login history section:

Created, Last edited, Last copied, Last revealed, Last autofilled, Last password change

Notes textarea

Buttons at bottom: Save, Cancel, Delete, Move to vault…

Password Generator UI

Open as either:

A modal or

A section within the detail drawer

Controls:

Length slider (8–64)

Toggles: uppercase / lowercase / numbers / symbols / exclude similar characters

Passphrase mode switch (show word count instead of length)

Live preview:

Generated password field

Copy button

Strength meter:

Multi-color bar + label: Very Weak / Weak / Medium / Strong / Excellent

A small explanation line (“Includes numbers, symbols, length 24, unique”)

Security Audit Page

A dedicated Security Audit dashboard:

Cards for:

Weak passwords

Reused passwords

Old passwords (older than X days)

Breached (via HIBP)

Each card shows:

Count

“View all” button that filters the item grid

Table or list below with recommended actions and “Fix” buttons that open the affected item and propose a new stronger password.

Group Vaults UI

In sidebar, list group vaults: “Family”, “Team”, “Work”.

Each group vault page:

Header: vault name, member avatars, add member button.

Grid or list of shared items only.

Icons/badges to show who created/edited last.

Hidden / Stealth Vault UX

On login screen:

If the user types an alternate “stealth” password, open a minimal decoy vault.

Design decoy vault to look real but with harmless entries.

Emergency Access & Notifications

Settings section:

List trusted contacts

Config for delay (e.g., 3 days, 7 days) before emergency access takes effect

Notifications UI:

Bell icon in top bar

Dropdown list for alerts: tamper detection, emergency access requests, new device logins

Anti-Screenshot & Tamper UX Hints

When a screenshot is detected (if platform supports it), blur sensitive content and show a small toast: “Sensitive content hidden due to security settings.”

When tamper is detected (from backend or local checks), show a modal:

“We detected unusual activity. Your vault has been locked.”

Button: “Re-authenticate”

Animations / Microinteractions

Smooth fade/slide transitions between pages and drawers.

Hover states with slight scale/brightness.

Subtle loading skeletons for cards.

Responsive Behavior

On mobile:

Sidebar collapses into a bottom tab bar or hamburger menu.

Cards become full-width.

Detail drawer becomes full-screen modal.

End of FrontEnd prompt.

---

OPTIONAL STRATEGY:

0. Core Product Decisions (Before Coding)

Goal: Lock in the big choices so you don’t fight them later.

0.1 Architecture style

Client-side encryption (zero-knowledge):

All encryption/decryption in the frontend (web app / extension / mobile).

Backend = stateless-ish API + encrypted blob storage.

API style:

REST (simple, widely supported) or GraphQL (if you want flexible querying).

For this project, a clean REST API is enough.

0.2 Tech stack (suggested)

Frontend: Vue 3 + Vite + TypeScript + Tailwind (as you already leaned toward).

Backend: Node.js + TypeScript, with:

Fastify or Express

JWT for auth tokens (after initial key derivation)

Zod / Joi for input validation

Database:

Postgres (good for relational RBAC, audits, groups)

OR DynamoDB if you prefer full AWS serverless. I’ll assume Postgres below.

Infrastructure:

API: AWS Lambda or EC2/Fargate

DB: AWS RDS (Postgres)

Storage for large encrypted blobs: S3

Frontend: S3 + CloudFront

1. Data & Crypto Model First (Absolute Foundation)

Before UI or fancy features, you need the vault & key model solid.

1.1 Core entities

Sketch DB tables (or collections):

users

id, email, password_verifier (NOT plaintext), 2FA secret (encrypted), created_at…

vaults

id, type (personal, group, stealth), owner_user_id, created_at…

vault_members

(vault_id, user_id, role) → for group vaults

items

id, vault_id, encrypted_item_blob, created_at, updated_at, last_viewed_at…

The item blob contains title, username, password, notes, tags, etc., all encrypted.

audit_logs

id, actor_user_id, action_type, target_id, metadata_json, created_at…

emergency_access

id, grantor_user_id, grantee_user_id, status, delay_days, created_at…

admin_roles / orgs (for enterprise features)

orgs, org_users, org_roles, org_policies…

devices

id, user_id, device_fingerprint, last_seen…

1.2 Key / encryption strategy (high-level)

User has master password → run through Argon2id / PBKDF2 locally to derive:

master_key (never leaves the device)

Generate a random vault key per vault:

vault_key encrypted with master_key (stored server-side).

Items inside vault:

item_data JSON → encrypted with vault_key using AES-256-GCM or XChaCha20-Poly1305.

For group vaults:

Each user has a public/private keypair:

Public key stored on server.

Private key encrypted with master_key.

Vault key is encrypted with each member’s public key.

Strategy: implement crypto once in a small, well-tested frontend module and re-use it everywhere (web + extension + mobile).

2. Phase 1 – Minimal but Secure MVP (Personal Vault only)

Goal: A personal ByteRyte that works end-to-end with zero-knowledge, but without all advanced enterprise features.

2.1 Backend MVP features

Endpoints (REST sketch):

POST /auth/register

POST /auth/login (returns session token; all crypto stays client-side)

GET /vaults (list user’s vaults)

POST /vaults (create personal vault)

GET /vaults/:id/items

POST /vaults/:id/items

PUT /items/:id

DELETE /items/:id

GET /audit-logs (basic logs like login/logout)

POST /sync (optionally batch upload/download encrypted vault blobs)

Backend only deals with encrypted blobs + metadata, never plaintext passwords.

2.2 Frontend MVP features

Implement just enough of your frontend prompt:

Login/registration screen (with master password & basic 2FA option).

Main dashboard:

Left sidebar: All Items, Favorites, Categories (static for now).

Password card grid (title, icon, email, masked password, actions).

Item detail drawer:

Show all decrypted fields.

Generate + copy + reveal.

Password generator:

Length slider, character type toggles, strength meter.

Local encrypted storage:

Keep vault in IndexedDB (encrypted again if you want double protection).

Auto-lock:

Timer in JS that locks UI & clears keys from memory after inactivity.

Focus: correctness of crypto, clean UX, no enterprise yet.

3. Phase 2 – Security Enhancements (Emergency, Shredding, Stealth)

Goal: Add your “wow” security and privacy features on top of MVP.

3.1 Emergency access

Frontend:

Settings screen for “Trusted Contacts”.

UI to:

Add a contact (invite by email).

Set delay (e.g., 3 / 7 / 14 days).

Notifications panel for incoming emergency requests.

Backend:

POST /emergency-access/grant

POST /emergency-access/request

POST /emergency-access/approve

Background job (Lambda cron) to:

Check overdue requests.

Move into “granted” state.

Crypto:

When granting emergency access, create an emergency re-encrypted copy of vault key for that user.

3.2 Password shredding (secure delete)

Frontend:

On delete, clear any decrypted copies from memory.

Backend:

Mark items as deleted, then background job to hard-delete + overwrite any temporary storage (if used).

For DB, “overwrite” is best-effort → combine with encryption (rotating keys makes old blobs unrecoverable in practice).

3.3 Anti-screenshot + tamper UX

Frontend:

Use CSS/JS to blur password fields on certain platforms.

Optional setting: “Hide vault on window blur” (protects from shoulder surfing, screen recording).

Tamper detection:

If integrity checks on local vault file fail → lock vault and log an event.

3.4 Stealth vault

Data model: a second vault for same user with type="stealth".

Login:

If user enters “stealth password”, derive a different master key → open stealth vault.

UI:

Make it look legit but only include harmless items.

4. Phase 3 – Organization & Audit (Password Health, Tags, History)

Goal: Make ByteRyte actually useful & informative, not just storage.

4.1 Smart tags and categories

Frontend:

Tag system in item detail drawer.

Auto-tagging based on domain (e.g., “bank”, “social”).

Backend:

Tags can either be:

Encrypted (inside item blob), or

Partly plain metadata (like “category=banking”) for easier filtering.

4.2 Password strength & audit

Frontend:

Run strength analysis locally (zxcvbn or similar library).

Build a Security Audit page:

Weak passwords.

Reused passwords.

Old passwords.

Backend:

Store some audit summary metadata (non-sensitive) to power dashboards.

4.3 Login history per item

Backend:

On any action involving an item (view, copy, autofill), emit audit events.

Frontend:

Display this audit data in the item detail drawer (read-only).

5. Phase 4 – Group Vaults & Sharing

Goal: Multi-user, teams, families.

5.1 Group model

Entities:

orgs (optional), group_vaults, vault_members.

Crypto:

Generated group vault key.

Encrypted with each member’s public key.

Backend:

POST /orgs, POST /vaults?type=group, POST /vaults/:id/members, etc.

Frontend:

Sidebar sections: “Family”, “Team”, “Work”.

Group vault page: shared items only, member list, invite/remove.

6. Phase 5 – Enterprise & IT Safeguards

Goal: Implement everything in your Workplace / IT misuse section.

6.1 RBAC & org-level admin

Add org-level roles:

Org Owner, Security Admin, IT Admin, Regular user, etc.

Backend:

Middleware to enforce RBAC on each endpoint.

Policy table for org-level security rules.

Frontend:

Admin Console view:

Users list, roles, policies, DLP settings, SSO configuration.

6.2 Immutable audit logs & DLP

Backend:

audit_logs table with append-only design.

Optionally forward to external SIEM (webhooks).

DLP:

Policy flags:

allow_bulk_export, allow_copy_on_sensitive, etc.

Enforced in API and UI:

Hide export options for restricted users.

Disable “copy password” for certain items.

6.3 SSO, SCIM & device trust

Integrate with:

SAML / OIDC providers (Google Workspace, Azure AD).

SCIM:

API endpoints for automatic provisioning/deprovisioning of users.

Device trust:

Record device fingerprint on login.

Optional restrictions (org policy): only allow managed devices, enforce 2FA, IP allowlisting for admin actions.

7. Phase 6 – Browser Extension & Autofill

Goal: Compete with real password managers.

Build browser extensions (Chrome, Firefox, Edge) using:

The same crypto module & API logic as web app.

Features:

Autofill username/password + TOTP.

Strict domain matching.

Quick add/update credentials from login pages.

Security:

Never store master password in extension; use short-lived unlock sessions.

8. Phase 7 – Hardening, Testing & Compliance

Goal: Make ByteRyte trustworthy, not just feature-rich.

8.1 Testing strategy

Unit tests:

Crypto flows, key derivation, encrypt/decrypt round trips.

Integration tests:

Full registration → login → vault CRUD → sharing.

UI tests:

Cypress/Playwright for key user flows.

8.2 Security reviews

Threat modeling:

Map out attacker types (external, insider IT, stolen device, compromised browser).

External pentest:

Have experts review.

Bug bounty:

Later, create a program for security researchers.

8.3 Operational security

Secrets management:

AWS Secrets Manager or similar, no secrets in code.

Backups:

Encrypted DB backups.

Monitoring:

Metrics + alerting for abnormal patterns (login floods, suspicious admin actions).

9. How to Actually Execute This (Practically)

When you plug your Backend Prompt + Frontend Prompt into a builder (Lovable, Bolt, custom AI, or human dev team):

Start with Phase 1 only (personal vault, zero-knowledge, UI basics).

Confirm:

Crypto model works.

Vault sync is stable.

UX feels good.

Then incrementally give the tool/team extra prompt sections:

Phase 2: security extras.

Phase 3: auditing & organization.

Phase 4–5: group vaults + enterprise.

Keep a CHANGELOG / ROADMAP doc:

“Current phase: X”

“Next: Y”

This keeps scope under control.
