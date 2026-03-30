# 📊 Analyse du Projet — Système de Gestion du Stock
**Arrondissement Agdal-Ryad** · Service Voirie & Éclairage Public

---

## 🏗️ Architecture Générale

```
stock-magasin/
├── server.js          # Serveur Express (backend API REST)
├── db.json            # Base de données JSON (fichier plat)
├── package.json       # Dépendances Node.js
└── public/
    ├── login.html         # Page de connexion
    ├── dashboard.html     # Tableau de bord
    ├── stock.html         # Gestion des articles
    ├── mouvements.html    # Bons d'entrée / sortie
    ├── reservations.html  # Système de réservations
    ├── historique.html    # Journal des actions
    ├── alertes.html       # Alertes stock faible / rupture
    ├── rapports.html      # Rapports & impressions PDF
    ├── logo.png           # Logo de l'arrondissement
    ├── css/style.css      # Feuille de style globale
    └── js/app.js          # JS partagé (auth, API, layout)
```

**Type** : Application web full-stack MPA (Multi-Page Application)  
**Backend** : Node.js + Express · **Frontend** : HTML/CSS/JS Vanilla  
**Base de données** : [db.json](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/db.json) (fichier JSON lu/écrit à chaque requête)  
**Port** : `3000` (configurable via `process.env.PORT`)

---

## 👤 Système de Rôles

| Rôle | Accès |
|------|-------|
| `admin` | Tout — CRUD complet, rapports, historique, alertes |
| `responsable` | Stock, mouvements, réservations, historique, alertes, rapports |
| `agent` | Consultation stock, création réservations, alertes uniquement |

La session est stockée dans `sessionStorage` et expire après **8 heures**.  
L'authentification est gérée côté serveur (pas de JWT, comparaison de mot de passe en clair dans [db.json](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/db.json)).

---

## 📄 Pages & Fonctionnalités

### [login.html](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/login.html) — Connexion
- Design officiel avec zellige marocain en fond
- Logo rond, en-tête bilingue (FR/AR), formulaire classique
- Redirige vers [dashboard.html](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/dashboard.html) si déjà connecté

### [dashboard.html](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/dashboard.html) — Tableau de bord
- 5 cartes de statistiques (total articles, stock faible, ruptures, mouvements du jour, réservations en attente)
- 2 graphiques Chart.js (barres par catégorie, camembert Voirie/Éclairage Public)
- Tableau des 10 derniers mouvements
- **Auto-refresh toutes les 15 secondes**

### [stock.html](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/stock.html) — Gestion du Stock
- Tableau paginé (25 par page) avec tri par section, catégorie, statut
- Recherche en temps réel (FR + AR)
- CRUD articles (add/edit/delete) pour admin/responsable
- Agents : bouton **Réserver** directement depuis la liste
- Modal de détail au clic sur une ligne

### [mouvements.html](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/mouvements.html) — Bons d'Entrée/Sortie
- Formulaire de création de bons avec recherche d'article live
- Filtres par type, article, dates
- Génération de **bon PDF** (via jsPDF)
- Mise à jour automatique du stock après chaque mouvement

### [reservations.html](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/reservations.html) — Réservations
- Agents créent des demandes (quantité, chantier, motif, urgence)
- Admin/Responsable : approbation → crée automatiquement un bon de sortie
- Refus avec commentaire
- Badge de notification dans la sidebar pour les réservations en attente

### [historique.html](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/historique.html) — Journal d'audit
- Toutes les actions enregistrées (ajout, modification, suppression, mouvements, réservations)
- Filtrables par utilisateur, type d'action, dates
- Réservé aux rôles admin et responsable

### [alertes.html](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/alertes.html) — Alertes
- Articles en rupture (quantité = 0)
- Articles en stock faible (quantité ≤ seuil)
- Action directe : créer un bon d'entrée depuis l'alerte

### [rapports.html](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/rapports.html) — Rapports
- Vue synthétique par catégorie et section
- Rapports de mouvements avec filtres
- Export PDF (librairiejsPDF + AutoTable)
- Impression directe navigateur

---

## 🔌 API REST (server.js)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/login` | Authentification |
| GET/POST/PUT/DELETE | `/api/articles` | CRUD articles |
| GET/POST | `/api/mouvements` | Mouvements de stock |
| GET | `/api/historique` | Journal d'audit |
| GET | `/api/stats` | Statistiques dashboard |
| GET | `/api/alertes` | Articles en alerte |
| GET/POST/PUT/DELETE | `/api/reservations` | Gestion réservations |
| GET/POST/PUT/DELETE | `/api/categories` | Gestion catégories |
| GET | `/api/users` | Liste utilisateurs (admin) |

---

## 🎨 Design System (style.css + app.js)

- **Palette** : Vert Maroc `#006233`, Rouge Maroc `#C1272D`, Or Royal `#C9A84C`
- **Police** : Cairo (Google Fonts) — parfaite pour le bilingue FR/AR
- **Composants partagés** : sidebar, top-navbar, official-header-band, modals, toasts, badges, pagination
- **[app.js](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/js/app.js)** centralise : [initPage()](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/js/app.js#255-283), [buildSidebar()](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/js/app.js#173-221), [topNavbar()](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/public/js/app.js#157-172), helpers API, formatage dates/quantités, toasts, modal de confirmation, génération en-têtes PDF

---

## ✅ Points Forts

- ✔️ Interface bilingue (Français/Arabe) cohérente sur toutes les pages
- ✔️ Design officiel respectant la charte de l'administration marocaine
- ✔️ Gestion des rôles bien structurée (3 niveaux)
- ✔️ Traçabilité complète (historique de toutes les actions)
- ✔️ Réservations avec workflow d'approbation automatisant le bon de sortie
- ✔️ Export PDF des bons et rapports
- ✔️ Auto-refresh du dashboard et sidebar (pas besoin de recharger)
- ✔️ Pagination côté client pour le stock
- ✔️ Zéro dépendance frontend (HTML/JS/CSS pur, sauf Chart.js & FontAwesome CDN)

---

## ⚠️ Points à Améliorer

| Priorité | Problème | Impact |
|----------|----------|--------|
| 🔴 Haute | Mot de passe stocké en **clair** dans [db.json](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/db.json) | Sécurité critique |
| 🔴 Haute | Pas d'authentification API (n'importe qui peut appeler `/api/...`) | Sécurité critique |
| 🟠 Moyenne | [db.json](file:///c:/Users/ryadb/OneDrive/Documents/stock-magasin-agdal-ryad1/stock-magasin/db.json) lu/écrit **synchroniquement** en clair à chaque requête | Performance & intégrité |
| 🟠 Moyenne | Pas de mobile burger menu (sidebar cachée en mobile) | UX mobile |
| 🟡 Faible | Le dossier `{css,js}` existe en doublon dans `public/` | Organisation fichiers |
| 🟡 Faible | Sessions via `sessionStorage` → perdues à la fermeture du tab | UX |
| 🟡 Faible | Pas de validation côté serveur des champs obligatoires | Robustesse |
| 🟡 Faible | `stats-grid` affiche 5 cartes sur un `grid-template-columns: repeat(4, 1fr)` | Layout |

---

## 📦 Dépendances

```json
{
  "express": "^4.18.2",
  "bcryptjs": "^2.4.3",   ← installé mais NON utilisé (mdp en clair !)
  "jsonwebtoken": "^9.0.0", ← installé mais NON utilisé
  "cors": "^2.8.5"         ← installé mais NON configuré dans server.js
}
```

> [!WARNING]
> `bcryptjs` et `jsonwebtoken` sont dans les dépendances mais **pas utilisés**. L'authentification se fait avec une simple comparaison de chaînes de caractères. C'est une faille de sécurité à corriger en priorité.

---

## 🗺️ Structure des Données (db.json)

```
db.json
├── users[]           → id, username, password (clair!), role, nom
├── categories[]      → id, nom, nom_ar, section
├── articles[]        → id, designation, designation_ar, section, categorie_id,
│                        quantite, unite, seuil, notes
├── mouvements[]      → id, type, article_id, quantite, demandeur, motif, date...
├── reservations[]    → id, numero, article_id, quantite, statut, agent...
├── historique[]      → id, date, utilisateur, action, detail, ancienne/nouvelle_valeur
└── _counters{}       → article_custom_id, mouvement_id, historique_id, reservation_id
```
