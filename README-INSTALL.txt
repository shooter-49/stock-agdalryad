╔══════════════════════════════════════════════════════════════════╗
║     SYSTÈME DE GESTION DU STOCK — ARRONDISSEMENT AGDAL-RYAD     ║
║       نظام إدارة المخزون — مقاطعة أكدال الرياض                 ║
║          Service Voirie & Éclairage Public — 2025               ║
╚══════════════════════════════════════════════════════════════════╝

══════════════════════════════════════════
 INSTALLATION — FRENCH / التركيب — بالعربية
══════════════════════════════════════════

───────────────────────────────────────────────────────────────────
ÉTAPE 1 — INSTALLER NODE.JS
خطوة 1 — تثبيت Node.js
───────────────────────────────────────────────────────────────────

Téléchargez et installez Node.js (version 18 ou supérieure) depuis :
قم بتنزيل وتثبيت Node.js (الإصدار 18 أو أحدث) من:

  https://nodejs.org/

Vérifier l'installation / للتحقق من التثبيت:
  > node --version
  > npm --version

───────────────────────────────────────────────────────────────────
ÉTAPE 2 — COPIER LE DOSSIER
خطوة 2 — نسخ المجلد
───────────────────────────────────────────────────────────────────

Copiez le dossier complet "stock-magasin" sur le PC serveur.
انسخ المجلد الكامل "stock-magasin" على جهاز الكمبيوتر الخادم.

Emplacement recommandé / الموقع الموصى به:
  C:\stock-magasin\     (Windows)
  /home/magasin/stock-magasin/    (Linux)

───────────────────────────────────────────────────────────────────
ÉTAPE 3 — INSTALLER LES DÉPENDANCES
خطوة 3 — تثبيت المكتبات
───────────────────────────────────────────────────────────────────

Ouvrez un terminal (Invite de commandes / PowerShell) dans le dossier:
افتح الطرفية (Command Prompt / PowerShell) في المجلد:

  cd C:\stock-magasin

Puis lancez / ثم شغّل:
  npm install

Attendre la fin de l'installation (1-2 minutes).
انتظر اكتمال التثبيت (1-2 دقائق).

───────────────────────────────────────────────────────────────────
ÉTAPE 4 — DÉMARRER LE SERVEUR
خطوة 4 — تشغيل الخادم
───────────────────────────────────────────────────────────────────

Dans le terminal, lancez / في الطرفية، شغّل:

  node server.js

Vous devriez voir / يجب أن ترى:
  ✅ Serveur démarré sur http://0.0.0.0:3000

Le serveur tourne maintenant. NE PAS fermer ce terminal.
الخادم يعمل الآن. لا تغلق هذه الطرفية.

───────────────────────────────────────────────────────────────────
ÉTAPE 5 — ACCÉDER À L'APPLICATION
خطوة 5 — الوصول إلى التطبيق
───────────────────────────────────────────────────────────────────

Sur le PC serveur / على جهاز الخادم:
  Ouvrez un navigateur et allez sur:
  افتح متصفحاً واذهب إلى:
    http://localhost:3000

Sur les autres PC du réseau / على أجهزة الشبكة الأخرى:
  Trouvez l'adresse IP du PC serveur / ابحث عن عنوان IP للخادم:
    (Windows) > ipconfig    → Adresse IPv4 (ex: 192.168.1.50)
    (Linux)   > ip addr     → inet addr (ex: 192.168.1.50)

  Puis sur chaque poste client / ثم على كل جهاز عميل:
    http://192.168.1.50:3000

──────────────────────────────
 COMPTES UTILISATEURS / حسابات المستخدمين
──────────────────────────────

┌─────────────────┬──────────────┬───────────────────────────────────┐
│ Utilisateur     │ Mot de passe │ Rôle                              │
├─────────────────┼──────────────┼───────────────────────────────────┤
│ admin           │ admin2025    │ Administrateur (accès complet)     │
│ responsable     │ resp2025     │ Responsable Magasin               │
│ agent           │ agent2025    │ Agent Terrain (lecture + sorties) │
└─────────────────┴──────────────┴───────────────────────────────────┘

⚠️  IMPORTANT: Changez les mots de passe après la première connexion!
⚠️  مهم: قم بتغيير كلمات المرور بعد أول تسجيل دخول!

──────────────────────────────
 DÉMARRAGE AUTOMATIQUE / التشغيل التلقائي (Windows)
──────────────────────────────

Pour que le serveur démarre automatiquement avec Windows:
لتشغيل الخادم تلقائياً مع Windows:

1. Créez un fichier "demarrer.bat" avec le contenu:
   أنشئ ملف "demarrer.bat" بالمحتوى:

   @echo off
   cd /d C:\stock-magasin
   node server.js
   pause

2. Placez ce fichier dans:
   ضع هذا الملف في:
   C:\Users\[Votre Nom]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\

──────────────────────────────
 SAUVEGARDE / النسخ الاحتياطي
──────────────────────────────

Toutes les données sont dans le fichier:
جميع البيانات موجودة في الملف:
  stock-magasin/db.json

Sauvegardez ce fichier régulièrement (clé USB, réseau, cloud).
احتفظ بنسخة احتياطية من هذا الملف بانتظام (USB، شبكة، سحابة).

Recommandé / موصى به: Copie quotidienne automatique.
نسخة احتياطية يومية تلقائية.

──────────────────────────────
 DÉPANNAGE / استكشاف الأخطاء
──────────────────────────────

Problème: Port 3000 déjà utilisé / المنفذ 3000 مستخدم بالفعل
Solution: Modifiez la ligne dans server.js:
          غيّر السطر في server.js:
            const PORT = 3000;   →   const PORT = 3001;

Problème: Impossible de se connecter depuis un autre PC / تعذر الاتصال
Solution: Vérifiez le pare-feu Windows — autorisez le port 3000
          تحقق من جدار الحماية — اسمح بالمنفذ 3000

Problème: Page blanche / صفحة بيضاء
Solution: Effacez le cache du navigateur (Ctrl+Shift+Delete)
          امسح ذاكرة التخزين المؤقت للمتصفح

──────────────────────────────
 INFORMATIONS SYSTÈME / معلومات النظام
──────────────────────────────

Application: Système de Gestion du Stock v1.0
Établissement: Arrondissement Agdal-Ryad / مقاطعة أكدال الرياض
Service: Voirie & Éclairage Public / الطرق والإنارة العمومية
Port par défaut: 3000
Base de données: db.json (format JSON local)
Technologies: Node.js + Express + Vanilla HTML/CSS/JS

Pour toute assistance technique / للمساعدة التقنية:
  Contactez votre responsable informatique de la commune.

══════════════════════════════════════════════════════════════════
  Arrondissement Agdal-Ryad — مقاطعة أكدال الرياض — 2025
══════════════════════════════════════════════════════════════════
