# 🔐 VaultMe – AI Portfolio & Achievement Vault

VaultMe is a modern web application designed to help students and professionals securely organize, manage, and showcase their academic and career achievements in one place.

Instead of storing certificates, projects, CVs, and accomplishments across multiple platforms, VaultMe provides a centralized digital portfolio with analytics, AI-powered assistance, and a professional public profile.

---

# ✨ Features

- 👤 Professional profile management
- 📄 CV upload and download
- 🏆 Achievement showcase
- 📜 Certificate management
- 💼 Project portfolio
- ⭐ Skills tracking
- 🎥 Video portfolio uploads
- 📊 Analytics dashboard
- 🔍 Search functionality
- 🤖 AI Career Assistant (Vela AI)
- 🌐 Public portfolio page
- 📱 Responsive modern interface
- 🔐 Secure authentication using Supabase

---

# 📂 Project Structure

```
VaultMe/
│
├── assets/                 # Images, PDFs and static assets
├── css/
│   └── shared.css          # Global styling
├── js/
│   ├── store.js            # Local storage & data handling
│   ├── supabase.js         # Supabase configuration
│   └── vela.js             # AI assistant logic
├── pages/
│   ├── signin.html
│   ├── signup.html
│   ├── analytics.html
│   ├── upload.html
│   └── public.html
├── sql/
│   └── 00_profiles_trigger.sql
├── index.html
└── README.md
```

---

# 🚀 Technologies Used

- HTML5
- CSS3
- JavaScript (ES6)
- Supabase
- Local Storage
- SQL
- Tabler Icons

---

# 📊 Main Pages

| Page | Description |
|-------|-------------|
| Dashboard | Displays the user's portfolio overview |
| Sign In | User authentication |
| Sign Up | Profile creation and editing |
| Analytics | Portfolio completion and insights |
| Upload | Upload CV, certificates, images and videos |
| Public Profile | Shareable professional portfolio |

---

# ⚙️ Installation

## Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/VaultMe.git
```

## Navigate into the project

```bash
cd VaultMe
```

## Open the project

Simply open:

```
index.html
```

using any modern browser such as:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

No additional installation is required.

---

# 🔑 Supabase Configuration

Create a Supabase project and configure:

```
js/supabase.js
```

with your project's:

- Supabase URL
- Anonymous Key

Example:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

---

# 💾 Database

The project uses Supabase for authentication and user management.

SQL scripts are included in:

```
sql/
```

to create the required database objects.

---

# 📸 Supported Uploads

Users can upload:

- Profile photo
- Certificates
- Achievement images
- Curriculum Vitae (PDF)
- Portfolio videos

---

# 📈 Analytics

The Analytics dashboard provides insights into:

- Profile completion
- Skills coverage
- Portfolio completeness
- Professional profile readiness

---

# 🤖 Vela AI

VaultMe includes an AI-powered career assistant called **Vela AI** which helps users with:

- Career guidance
- Portfolio improvement suggestions
- Professional development advice
- Skills recommendations

---

# 🔒 Security

VaultMe includes:

- Secure authentication
- Protected user profiles
- Safe file validation
- Upload size restrictions
- User-specific portfolio access

---

# 🎯 Future Improvements

- Email notifications
- AI CV optimization
- Resume scoring
- Recruiter dashboard
- Portfolio themes
- Dark mode
- Cloud file storage
- Portfolio sharing via QR Code

---



# 📄 License

This project was developed for educational purposes.

```
© 2026 Lilitha Mhle. All Rights Reserved.
```

*README maintained by Zibusiso Ntethelelo Msane — VaultMe project.*
