# SocialPilot AI

**Plateforme intelligente de gestion et d'automatisation des publications sur les réseaux sociaux.**

SaaS destiné aux entreprises, agences et community managers. Centralise la création, la planification et (bientôt) la publication automatique sur Facebook Pages, Instagram professionnel et LinkedIn.

## État actuel — MVP v0.1

Application Next.js 15 fonctionnelle déployable sur Vercel.

### Fonctionnalités livrées

- Tableau de bord avec statistiques réelles (basées sur vos publications)
- Assistant IA (génération de textes + hashtags, ton et réseau au choix)
- CRUD publications (créer, modifier, supprimer, brouillons)
- Programmation date + heure
- Calendrier éditorial
- Interface moderne, sombre, 100 % responsive (optimisée téléphone Android)
- Persistance locale (localStorage) — les publications survivent aux actualisations
- Préparation des connexions Meta / LinkedIn (UI + sécurité, sans simulation)

### Structure

```
apps/web/          ← Application Next.js (Root Directory Vercel)
  app/
    dashboard/
    assistant/
    posts/
    calendar/
    connections/
    api/generate/  ← Route serveur sécurisée pour l'IA
  components/
  lib/
```

## Déploiement rapide sur Vercel (depuis téléphone)

1. Importez le dépôt `angulaire003/socialpilot-ai` dans Vercel
2. **Root Directory** : `apps/web`
3. Framework preset : Next.js
4. Ajoutez la variable d'environnement (optionnelle mais recommandée) :
   - `OPENAI_API_KEY` = votre clé OpenAI (ou compatible)
5. Deploy

Sans clé API, un générateur de secours intelligent est utilisé pour que le MVP reste immédiatement testable.

## Développement local

```bash
cd apps/web
npm install
npm run dev
```

## Roadmap

- **Phase 6** : OAuth Meta réel (Facebook + Instagram Graph API), stockage chiffré des tokens, publication réelle
- Authentification multi-utilisateurs
- Base de données persistante (Postgres + Prisma)
- Abonnements / forfaits
- LinkedIn Marketing API

## Sécurité

- Les clés API ne sont jamais exposées au navigateur
- Aucune publication n'est marquée comme « publiée » sans confirmation de l'API officielle
- Variables d'environnement uniquement

---

Propriétaire : angulaire003  
MVP livré pour tests mobiles immédiats.
