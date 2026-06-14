# Email & DNS setup — petplanwise.com

How email on the apex domain is received, sent, and authenticated. All
records below are **public DNS** (anyone can `dig` them) — there are **no
secrets in this file**. Credentials (the Gmail App Password) live only in
the Gmail account, never in the repo.

DNS is hosted at **Vercel** (`ns1/ns2.vercel-dns.com`). Add/edit every
record below in **Vercel → Domains → petplanwise.com → DNS Records**.

---

## Architecture in one line

**Inbound:** mail to any `@petplanwise.com` address is forwarded by
**ImprovMX** to the owner's Gmail inbox.
**Outbound:** the owner sends *as* `martin@petplanwise.com` through Gmail's
"Send mail as" feature (Gmail SMTP).
**Auth:** SPF + DKIM + DMARC published so receivers trust the domain.

ImprovMX free tier = forwarding (inbound) only. Outbound goes through
Gmail, not ImprovMX — this matters for DKIM (see "Authentication reality").

---

## Addresses

As of 2026-06-14 the **website displays only `martin@petplanwise.com`**.
Every on-site contact point — the contact page, the privacy/CCPA request
line, and editorial corrections — routes there. The role aliases below are
kept only as optional ImprovMX forwards for mail already addressed to them;
they are **no longer surfaced anywhere on the site**.

| Address | Purpose | Where it appears on-site |
|---|---|---|
| `martin@petplanwise.com` | The single public address — contact, corrections, CCPA requests, outreach, Qwoted | `/contact/`, `/privacy/`, `/editorial-standards/`; Gmail default "Send mail as" |
| `hello@` / `editorial@` / `corrections@` | Legacy aliases — forward to Gmail if still hit, but not published | none (removed from the site 2026-06-14) |

All addresses **forward to the owner's Gmail** via ImprovMX. With the site
now pointing only at `martin@`, the catch-all is no longer load-bearing for
published addresses — but keeping it enabled means any legacy `hello@` link
still in the wild (old emails, cached pages, the Wayback Machine) won't
bounce.

---

## DNS records (all at Vercel)

### Inbound — MX (ImprovMX)
| Type | Name | Value | Priority |
|---|---|---|---|
| MX | @ | `mx1.improvmx.com` | 10 |
| MX | @ | `mx2.improvmx.com` | 20 |

### SPF — TXT
```
Name: @    Type: TXT
v=spf1 include:spf.improvmx.com ~all
```
Authorizes ImprovMX to send for the domain. (Gmail-sent mail does not rely
on this for alignment — see below.)

### DKIM — two CNAMEs (ImprovMX)
| Type | Name | Value |
|---|---|---|
| CNAME | `dkimprovmx1._domainkey` | `dkimprovmx1.improvmx.com` |
| CNAME | `dkimprovmx2._domainkey` | `dkimprovmx2.improvmx.com` |

Added 2026-06-14. These let ImprovMX DKIM-sign mail **sent through
ImprovMX**. They do **not** sign mail sent through Gmail (see below).

### DMARC — TXT
```
Name: _dmarc    Type: TXT
v=DMARC1; p=none; rua=mailto:martin@petplanwise.com; fo=1
```
**Fixed 2026-06-14:** the `rua` previously pointed at
`martin@projectcostpro.com` (a different portfolio site — copy-paste
leftover), so reports were misrouted. Now points at this domain.
Keep **`p=none`** until outbound is fully aligned (see below); a stricter
policy would risk sending the owner's own Gmail-sent mail to spam.

---

## Outbound — Gmail "Send mail as"

Configured in **Gmail → Settings → Accounts and Import → Send mail as**:
- Address: `martin@petplanwise.com` (treat as alias)
- SMTP: `smtp.gmail.com`, port 587, TLS
- Username: the underlying Gmail account
- Password: a Gmail **App Password** — **stored in the Gmail account only,
  never in this repo.** (Generated at `myaccount.google.com/apppasswords`;
  requires 2-Step Verification.)
- Set `martin@petplanwise.com` as the **default** send-as so drafts go out
  from the alias automatically.

The Gmail confirmation code for the alias arrives via the ImprovMX forward,
which is how the loop closes without a real mailbox.

---

## Authentication reality (important nuance)

Because outbound goes through **Gmail SMTP**, outgoing mail is DKIM-signed
by **Google** (`d=gmail.com`), not by `petplanwise.com`. Consequences:

- The ImprovMX **DKIM records only activate for mail sent *through*
  ImprovMX** (a paid "send via SMTP" feature) — not for today's Gmail-sent
  mail. They're published anyway: harmless, and they future-proof the
  upgrade path.
- For Gmail-sent mail, neither SPF nor DKIM *aligns* to `petplanwise.com`,
  so DMARC alignment technically fails — which is exactly why the policy is
  **`p=none`**. Mail still delivers fine; some clients show "via gmail.com".
- **For low-volume cold outreach this is acceptable.** SPF is published,
  Google's reputation carries delivery, nothing is blocked.

### Deliverability discipline
`petplanwise.com` is a young sending identity. Send **≤ 3–5 cold
emails/day**, spaced out. Slower protects the domain so later mail keeps
landing in inboxes, not spam.

### When/how to upgrade to full alignment
When outreach becomes a real channel and you want DKIM+SPF+DMARC all
aligned to `petplanwise.com` (then you can raise DMARC to
`quarantine`/`reject`), pick one:
1. **ImprovMX premium** "send via SMTP" — activates the DKIM CNAMEs above.
2. **Google Workspace** (~$7/mo) — signs natively as `petplanwise.com`.

---

## Verify the records

```bash
# DKIM (should be CNAMEs to improvmx)
nslookup -type=CNAME dkimprovmx1._domainkey.petplanwise.com
nslookup -type=CNAME dkimprovmx2._domainkey.petplanwise.com
# SPF + DMARC
nslookup -type=TXT petplanwise.com | grep spf1
nslookup -type=TXT _dmarc.petplanwise.com
# MX
nslookup -type=MX petplanwise.com
```
After adding DKIM, the ImprovMX dashboard shows a green check within
~15–30 min once DNS propagates.

---

Last reviewed: 2026-06-14.
