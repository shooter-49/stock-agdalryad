require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');
const multer   = require('multer');
const XLSX     = require('xlsx');
const mammoth  = require('mammoth');

const app    = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.redirect('/login.html'));

// ═══════════════════════════════════════════════════════════════════════════════
// CONNEXION MONGODB
// ═══════════════════════════════════════════════════════════════════════════════
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stock-agdal';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => { console.error('❌ MongoDB erreur:', err); process.exit(1); });

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════
const User = mongoose.model('User', new mongoose.Schema({
  id: Number, username: { type: String, unique: true },
  password: String, role: String, nom: String
}));

const Category = mongoose.model('Category', new mongoose.Schema({
  id: { type: Number, unique: true }, nom: String, nom_ar: String, section: String
}));

const Article = mongoose.model('Article', new mongoose.Schema({
  id: { type: String, unique: true }, designation: String, designation_ar: String,
  categorie_id: Number, section: String, quantite: Number,
  unite: String, seuil: Number, notes: String
}));

const Mouvement = mongoose.model('Mouvement', new mongoose.Schema({
  id: Number, type: String, article_id: String,
  article_designation: String, article_designation_ar: String, article_unite: String,
  quantite: Number, quantite_avant: Number, quantite_apres: Number,
  demandeur: String, motif: String, fournisseur: String,
  valide_par: String, date: String, utilisateur: String, reservation_id: Number
}));

const Reservation = mongoose.model('Reservation', new mongoose.Schema({
  id: { type: Number, unique: true }, numero: String,
  article_id: String, article_designation: String,
  article_designation_ar: String, article_unite: String,
  quantite: Number, motif: String, chantier: String, urgence: String,
  agent: String, nom_agent: String, statut: { type: String, default: 'en_attente' },
  date_demande: String, date_traitement: String,
  traite_par: String, commentaire_traitement: String
}));

const Historique = mongoose.model('Historique', new mongoose.Schema({
  id: Number, date: String, utilisateur: String, action: String,
  article_id: String, detail: String, ancienne_valeur: String, nouvelle_valeur: String
}));

const Counter = mongoose.model('Counter', new mongoose.Schema({
  name: { type: String, unique: true }, value: { type: Number, default: 0 }
}));

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
async function nextId(name) {
  const doc = await Counter.findOneAndUpdate(
    { name }, { $inc: { value: 1 } }, { new: true, upsert: true }
  );
  return doc.value;
}

async function addHistorique(user, action, articleId, detail, ancienne, nouvelle) {
  const id = await nextId('historique_id');
  await Historique.create({
    id, date: new Date().toISOString(), utilisateur: user,
    action, article_id: articleId, detail,
    ancienne_valeur: ancienne || '', nouvelle_valeur: nouvelle || ''
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: 'Identifiants incorrects / بيانات خاطئة' });
    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, nom: user.nom } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/categories', async (req, res) => {
  try { res.json(await Category.find().sort({ id: 1 }).lean()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/categories', async (req, res) => {
  try {
    const last  = await Category.findOne().sort({ id: -1 }).lean();
    const cat   = await Category.create({ id: (last?.id || 0) + 1, ...req.body });
    res.json(cat);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const cat = await Category.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!cat) return res.status(404).json({ error: 'Catégorie non trouvée' });
    res.json(cat);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/categories/:id', async (req, res) => {
  try { await Category.deleteOne({ id: req.params.id }); res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ARTICLES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/articles', async (req, res) => {
  try {
    let query = {};
    if (req.query.section)      query.section      = req.query.section;
    if (req.query.categorie_id) query.categorie_id = Number(req.query.categorie_id);
    if (req.query.search) {
      const s = req.query.search;
      query.$or = [
        { id:             { $regex: s, $options: 'i' } },
        { designation:    { $regex: s, $options: 'i' } },
        { designation_ar: { $regex: s } }
      ];
    }
    res.json(await Article.find(query).sort({ id: 1 }).lean());
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const art = await Article.findOne({ id: req.params.id }).lean();
    if (!art) return res.status(404).json({ error: 'Article non trouvé' });
    res.json(art);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/articles', async (req, res) => {
  try {
    const { utilisateur, ...articleData } = req.body;
    if (!articleData.id) {
      const n = await nextId('article_custom_id');
      articleData.id = 'ART-' + String(n).padStart(3, '0');
    }
    if (await Article.findOne({ id: articleData.id }))
      return res.status(400).json({ error: 'Un article avec cet identifiant existe déjà' });
    const art = await Article.create(articleData);
    await addHistorique(utilisateur || 'Système', 'Ajout article', art.id,
      `Ajout de "${art.designation}"`, '', '');
    res.json(art);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const { utilisateur, ...updateData } = req.body;
    const ancien  = await Article.findOne({ id: req.params.id }).lean();
    if (!ancien) return res.status(404).json({ error: 'Article non trouvé' });
    const updated = await Article.findOneAndUpdate({ id: req.params.id }, updateData, { new: true }).lean();
    await addHistorique(utilisateur || 'Système', 'Modification article', req.params.id,
      `Modification de "${updated.designation}"`, JSON.stringify(ancien), JSON.stringify(updated));
    res.json(updated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    const art = await Article.findOne({ id: req.params.id }).lean();
    if (!art) return res.status(404).json({ error: 'Article non trouvé' });
    await Article.deleteOne({ id: req.params.id });
    await addHistorique(req.query.utilisateur || 'Système', 'Suppression article', req.params.id,
      `Suppression de "${art.designation}"`, JSON.stringify(art), '');
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MOUVEMENTS
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/mouvements', async (req, res) => {
  try {
    let query = {};
    if (req.query.type)       query.type       = req.query.type;
    if (req.query.article_id) query.article_id = req.query.article_id;
    if (req.query.date_from || req.query.date_to) {
      query.date = {};
      if (req.query.date_from) query.date.$gte = req.query.date_from;
      if (req.query.date_to)   query.date.$lte = req.query.date_to + 'T23:59:59';
    }
    let mouvs = await Mouvement.find(query).sort({ id: -1 }).lean();
    if (req.query.limit) mouvs = mouvs.slice(0, parseInt(req.query.limit));
    res.json(mouvs);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/mouvements', async (req, res) => {
  try {
    const { article_id, quantite, type, demandeur, motif, fournisseur, valide_par, date, utilisateur } = req.body;
    const art = await Article.findOne({ id: article_id });
    if (!art) return res.status(404).json({ error: 'Article non trouvé' });
    const qty = parseFloat(quantite);
    const qtyAvant = art.quantite;
    if (type === 'sortie') {
      if (qty > art.quantite) return res.status(400).json({ error: `Stock insuffisant. Disponible: ${art.quantite} ${art.unite}` });
      art.quantite = Math.round((art.quantite - qty) * 1000) / 1000;
    } else {
      art.quantite = Math.round((art.quantite + qty) * 1000) / 1000;
    }
    await art.save();
    const id   = await nextId('mouvement_id');
    const mouv = await Mouvement.create({
      id, type, article_id,
      article_designation: art.designation, article_designation_ar: art.designation_ar,
      article_unite: art.unite, quantite: qty,
      quantite_avant: qtyAvant, quantite_apres: art.quantite,
      demandeur: demandeur||'', motif: motif||'', fournisseur: fournisseur||'',
      valide_par: valide_par||utilisateur||'',
      date: date||new Date().toISOString(), utilisateur: utilisateur||'Système'
    });
    await addHistorique(utilisateur||'Système',
      type==='sortie'?'Bon de sortie':"Bon d'entrée", article_id,
      `${type==='sortie'?'Sortie':'Entrée'}: ${qty} ${art.unite} - ${art.designation}`,
      String(qtyAvant), String(art.quantite));
    res.json(mouv);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORIQUE
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/historique', async (req, res) => {
  try {
    let query = {};
    if (req.query.utilisateur) query.utilisateur = req.query.utilisateur;
    if (req.query.action)      query.action      = req.query.action;
    if (req.query.date_from || req.query.date_to) {
      query.date = {};
      if (req.query.date_from) query.date.$gte = req.query.date_from;
      if (req.query.date_to)   query.date.$lte = req.query.date_to + 'T23:59:59';
    }
    res.json(await Historique.find(query).sort({ id: -1 }).lean());
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/stats', async (req, res) => {
  try {
    const today    = new Date().toISOString().split('T')[0];
    const articles = await Article.find().lean();
    const cats     = await Category.find().sort({ id: 1 }).lean();
    const mouvJour = await Mouvement.countDocuments({ date: { $regex: '^' + today } });
    const resaAtt  = await Reservation.countDocuments({ statut: 'en_attente' });
    res.json({
      total_articles:       articles.length,
      ruptures:             articles.filter(a => a.quantite === 0).length,
      stock_faible:         articles.filter(a => a.quantite > 0 && a.quantite <= a.seuil).length,
      mouvements_jour:      mouvJour,
      reservations_attente: resaAtt,
      par_categorie: cats.map(cat => {
        const artsCat = articles.filter(a => a.categorie_id === cat.id);
        return { categorie: cat.nom, categorie_ar: cat.nom_ar, section: cat.section,
          total: artsCat.reduce((s,a) => s+a.quantite, 0), articles: artsCat.length };
      }),
      voirie_count: articles.filter(a => a.section === 'Voirie').length,
      ep_count:     articles.filter(a => a.section === 'Éclairage Public').length
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ALERTES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/alertes', async (req, res) => {
  try {
    const articles = await Article.find().lean();
    res.json({
      ruptures:     articles.filter(a => a.quantite === 0),
      stock_faible: articles.filter(a => a.quantite > 0 && a.quantite <= a.seuil)
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESERVATIONS
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/reservations', async (req, res) => {
  try {
    let query = {};
    if (req.query.statut) query.statut = req.query.statut;
    if (req.query.agent)  query.agent  = req.query.agent;
    res.json(await Reservation.find(query).sort({ id: -1 }).lean());
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const { article_id, quantite, motif, chantier, urgence, utilisateur, nom_agent } = req.body;
    const art = await Article.findOne({ id: article_id }).lean();
    if (!art) return res.status(404).json({ error: 'Article non trouvé' });
    const qty = parseFloat(quantite);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Quantité invalide' });
    const id     = await nextId('reservation_id');
    const numero = 'RES-' + String(id).padStart(4, '0');
    const resa   = await Reservation.create({
      id, numero, article_id,
      article_designation: art.designation, article_designation_ar: art.designation_ar||'',
      article_unite: art.unite, quantite: qty,
      motif: motif||'', chantier: chantier||'', urgence: urgence||'normale',
      agent: utilisateur||'', nom_agent: nom_agent||utilisateur||'',
      statut: 'en_attente', date_demande: new Date().toISOString(),
      date_traitement: null, traite_par: '', commentaire_traitement: ''
    });
    await addHistorique(utilisateur||'Système', 'Réservation article', article_id,
      `Réservation N°${numero}: ${qty} ${art.unite} - ${art.designation}`, '', '');
    res.json(resa);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const { statut, commentaire_traitement, utilisateur } = req.body;
    const resa = await Reservation.findOne({ id: req.params.id });
    if (!resa) return res.status(404).json({ error: 'Réservation non trouvée' });
    if (statut === 'approuvee') {
      const art = await Article.findOne({ id: resa.article_id });
      if (!art) return res.status(404).json({ error: 'Article non trouvé' });
      if (resa.quantite > art.quantite) return res.status(400).json({ error: `Stock insuffisant. Disponible: ${art.quantite} ${art.unite}` });
      const qtyAvant = art.quantite;
      art.quantite   = Math.round((art.quantite - resa.quantite) * 1000) / 1000;
      await art.save();
      const mouvId = await nextId('mouvement_id');
      await Mouvement.create({
        id: mouvId, type: 'sortie', article_id: resa.article_id,
        article_designation: art.designation, article_designation_ar: art.designation_ar,
        article_unite: art.unite, quantite: resa.quantite,
        quantite_avant: qtyAvant, quantite_apres: art.quantite,
        demandeur: resa.nom_agent, motif: `[Réservation ${resa.numero}] ${resa.motif}`,
        fournisseur: '', valide_par: utilisateur||'',
        date: new Date().toISOString(), utilisateur: utilisateur||'Système',
        reservation_id: resa.id
      });
      await addHistorique(utilisateur||'Système', 'Approbation réservation', resa.article_id,
        `Approbation ${resa.numero}: ${resa.quantite} ${art.unite} pour ${resa.nom_agent}`,
        String(qtyAvant), String(art.quantite));
    } else if (statut === 'refusee') {
      await addHistorique(utilisateur||'Système', 'Refus réservation', resa.article_id,
        `Refus ${resa.numero}: ${commentaire_traitement||''}`, '', '');
    }
    resa.statut = statut;
    resa.date_traitement = new Date().toISOString();
    resa.traite_par = utilisateur||'';
    resa.commentaire_traitement = commentaire_traitement||'';
    await resa.save();
    res.json(resa);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try { await Reservation.deleteOne({ id: req.params.id }); res.json({ success: true }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT FICHIER
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/import-articles', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });
  const filePath = req.file.path;
  const ext      = path.extname(req.file.originalname).toLowerCase();
  let rows = [];
  try {
    if (['.xlsx','.xls','.csv'].includes(ext)) {
      const wb = XLSX.readFile(filePath);
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    } else if (ext === '.docx') {
      const r = await mammoth.extractRawText({ path: filePath });
      rows = r.value.split('\n').filter(l=>l.trim()).map(l=>l.split('\t').map(c=>c.trim()));
    } else {
      return res.status(400).json({ error: 'Format non supporté' });
    }
    let ajoutes=0, mis_a_jour=0, erreurs=[];
    for (let i=1; i<rows.length; i++) {
      const row = rows[i];
      if (!row||row.length<8) { erreurs.push({ligne:i+1,raison:'Ligne incomplète'}); continue; }
      const [id,designation,designation_ar,section,categorie_id,quantite,unite,seuil] = row.map(c=>c?c.toString().trim():'');
      if (!designation||!section||!categorie_id||!quantite||!unite||!seuil) { erreurs.push({ligne:i+1,raison:'Champs manquants'}); continue; }
      const catId=parseInt(categorie_id), qty=parseFloat(quantite), seuilV=parseFloat(seuil);
      if (isNaN(catId)||isNaN(qty)||isNaN(seuilV)) { erreurs.push({ligne:i+1,raison:'Valeurs invalides'}); continue; }
      if (!['Voirie','Éclairage Public'].includes(section)) { erreurs.push({ligne:i+1,raison:'Section invalide'}); continue; }
      let artId = id;
      if (!artId) { const n=await nextId('article_custom_id'); artId='ART-'+String(n).padStart(3,'0'); }
      const existing = await Article.findOne({ id: artId });
      if (existing) {
        await Article.updateOne({id:artId},{quantite:qty});
        await addHistorique('Système','Import mise à jour',artId,`Quantité: ${existing.quantite} → ${qty}`,String(existing.quantite),String(qty));
        mis_a_jour++;
      } else {
        await Article.create({id:artId,designation,designation_ar:designation_ar||'',section,categorie_id:catId,quantite:qty,unite,seuil:seuilV,notes:''});
        await addHistorique('Système','Import ajout',artId,`Article ajouté: ${designation}`,'','');
        ajoutes++;
      }
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ ajoutes, mis_a_jour, erreurs });
  } catch(e) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Erreur: ' + e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().lean();
    res.json(users.map(u => ({ id:u.id, username:u.username, role:u.role, nom:u.nom })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Serveur démarré — http://localhost:${PORT}`);
  console.log(`🗄️  MongoDB: ${MONGO_URI.replace(/:\/\/.*@/, '://***@')}\n`);
});
