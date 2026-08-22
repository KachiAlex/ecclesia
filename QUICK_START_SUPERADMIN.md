# Quick Start: Superadmin Access

## 🚀 Fastest Way to Get Started

### Method 1: Using API (Recommended)

**1. Start your development server:**
```bash
npm run dev
```

**2. Create superadmin account:**
```bash
curl -X POST http://localhost:3000/api/superadmin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecclesia.com",
    "password": "Admin123!@#",
    "firstName": "Super",
    "lastName": "Admin"
  }'
```

**3. Login:**
- Go to: `http://localhost:3000/auth/login`
- Email: `admin@ecclesia.com`
- Password: `Admin123!@#`

**4. Access Portal:**
- Navigate to: `http://localhost:3000/superadmin`

### Method 2: Using Script

**1. Run the script:**
```bash
npm run create-superadmin
```

**2. Follow the prompts:**
```
Email: admin@ecclesia.com
Password: Admin123!@#
First Name: Super
Last Name: Admin
```

**3. Login and access portal** (same as Method 1)

## 📋 Default Credentials

**⚠️ CHANGE THESE IMMEDIATELY AFTER FIRST LOGIN!**

```
Email: admin@ecclesia.com
Password: Admin123!@#
```

## 🔗 Important Links

- **Login**: `http://localhost:3000/auth/login`
- **Superadmin Portal**: `http://localhost:3000/superadmin`
- **Churches List**: `http://localhost:3000/superadmin/churches`

## ✅ What You Can Do

Once logged in as superadmin:

1. ✅ View all churches (`/superadmin/churches`)
2. ✅ Manage church licenses (`/superadmin/churches/[churchId]`)
3. ✅ Extend trials, change plans, suspend/activate churches
4. ✅ View platform statistics (`/superadmin`)
5. ✅ Monitor usage and subscriptions

## 🛡️ Security Reminder

- Change default password immediately
- Use strong, unique password
- Don't share superadmin credentials
- Limit superadmin accounts to trusted administrators only

---

**Need more details?** See `SUPERADMIN_ACCESS.md` for complete documentation.

