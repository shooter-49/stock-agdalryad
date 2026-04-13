/**
 * SCRIPT DE MIGRATION — db.json → MongoDB
 * Exécuter UNE SEULE FOIS après déploiement :  node migrate.js
 */
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stock-agdal';
const DB_PATH   = path.join(__dirname, 'db.json');

// ── Modèles (identiques à server.js) ─────────────────────────────────────────
const User        = mongoose.model('User',        new mongoose.Schema({ id:Number, username:String, password:String, role:String, nom:String, service:String }));
const Category    = mongoose.model('Category',    new mongoose.Schema({ id:Number, nom:String, nom_ar:String, section:String }));
const Article     = mongoose.model('Article',     new mongoose.Schema({ id:String, designation:String, designation_ar:String, categorie_id:Number, section:String, quantite:Number, unite:String, seuil:Number, notes:String }));
const Mouvement   = mongoose.model('Mouvement',   new mongoose.Schema({ id:Number, type:String, article_id:String, article_designation:String, article_designation_ar:String, article_unite:String, quantite:Number, quantite_avant:Number, quantite_apres:Number, demandeur:String, motif:String, fournisseur:String, valide_par:String, date:String, utilisateur:String, reservation_id:Number }));
const Reservation = mongoose.model('Reservation', new mongoose.Schema({ id:Number, numero:String, article_id:String, article_designation:String, article_designation_ar:String, article_unite:String, quantite:Number, motif:String, chantier:String, urgence:String, agent:String, nom_agent:String, statut:String, date_demande:String, date_traitement:String, traite_par:String, commentaire_traitement:String }));
const Historique  = mongoose.model('Historique',  new mongoose.Schema({ id:Number, date:String, utilisateur:String, action:String, article_id:String, detail:String, ancienne_valeur:String, nouvelle_valeur:String }));
const Counter     = mongoose.model('Counter',     new mongoose.Schema({ name:{ type:String, unique:true }, value:{ type:Number, default:0 } }));

async function migrate() {
  console.log('\n🚀 Démarrage de la migration db.json → MongoDB...\n');

  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connecté');

  // Lire db.json
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  // Vider les collections existantes
  await Promise.all([
    User.deleteMany({}), Category.deleteMany({}), Article.deleteMany({}),
    Mouvement.deleteMany({}), Reservation.deleteMany({}),
    Historique.deleteMany({}), Counter.deleteMany({})
  ]);
  console.log('🗑️  Collections vidées');

  // ── Users ──────────────────────────────────────────────────────────────────
  await User.insertMany(db.users);
  console.log(`👥 Users migrés: ${db.users.length}`);

  // ── Categories ─────────────────────────────────────────────────────────────
  await Category.insertMany(db.categories);
  console.log(`📂 Catégories migrées: ${db.categories.length}`);

  // ── Articles ───────────────────────────────────────────────────────────────
  await Article.insertMany(db.articles);
  console.log(`📦 Articles migrés: ${db.articles.length}`);

  // ── Mouvements ─────────────────────────────────────────────────────────────
  if (db.mouvements && db.mouvements.length) {
    await Mouvement.insertMany(db.mouvements);
    console.log(`↔️  Mouvements migrés: ${db.mouvements.length}`);
  }

  // ── Reservations ───────────────────────────────────────────────────────────
  if (db.reservations && db.reservations.length) {
    await Reservation.insertMany(db.reservations);
    console.log(`🔖 Réservations migrées: ${db.reservations.length}`);
  }

  // ── Historique ─────────────────────────────────────────────────────────────
  if (db.historique && db.historique.length) {
    await Historique.insertMany(db.historique);
    console.log(`📋 Historique migré: ${db.historique.length} entrées`);
  }

  // ── Compteurs ──────────────────────────────────────────────────────────────
  const c = db._counters || {};
  await Counter.insertMany([
    { name: 'mouvement_id',     value: c.mouvement_id     || 0 },
    { name: 'historique_id',    value: c.historique_id    || 0 },
    { name: 'article_custom_id',value: c.article_custom_id|| 0 },
    { name: 'reservation_id',   value: c.reservation_id   || 0 }
  ]);
  console.log('🔢 Compteurs migrés');

  await mongoose.disconnect();

  console.log('\n✅ Migration terminée avec succès !');
  console.log('👉 Tu peux maintenant lancer le serveur avec : node server.js\n');
}

migrate().catch(err => {
  console.error('❌ Erreur migration:', err);
  process.exit(1);
});
