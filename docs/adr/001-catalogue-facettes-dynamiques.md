# ADR-001: Catalogue à facettes dynamiques (`attr_<key>`) + endpoint filter-options

- **Statut**: Accepté
- **Date**: 2026-09-28
- **Décideurs**: Équipe PC Paradis CI
- **Portée**: `apps/products` (backend), `apps/categories` (backend), `CatalogPage` / `FilterPanel` (frontend)

## Contexte

Le catalogue vend du matériel PC hétérogène : chaque catégorie feuille porte des
caractéristiques techniques propres (VRAM pour les GPU, socket pour les CPU,
MT/s pour la RAM…), modélisées par `AttributeDefinition` (une définition par
catégorie) et stockées dans `ProductAttributeValue.value` (`JSONField`). Il
fallait permettre de filtrer la liste produits sur ces facettes sans :

1. ajouter une colonne par attribut (schéma rigide, migrations à chaque nouvelle
   catégorie),
2. dupliquer la logique de filtre entre les trois vues de listing (public,
   vendeur, file de modération),
3. hardcoder côté frontend la liste des facettes par catégorie.

## Décision

1. **Convention d'URL** : tout paramètre de requête préfixé `attr_` cible une
   caractéristique dynamique — `?attr_vram=8,12`, `?attr_rgb=true`,
   `?attr_note=palit`. Le préfixe évite toute collision avec les filtres
   modèles existants (`category`, `brand`, `min_price`, `condition`…).

2. **Sémantique** : virgule = OU *au sein d'une clé* ; clés multiples = ET.
   `?attr_vram=8,12&attr_vram_type=GDDR6X` ⇒ (vram ∈ {8,12}) ET (type = GDDR6X).

3. **Deux chemins d'exécution** (`apps/products/filters.py`) :
   - `select` / `number` / `boolean` → égalité JSON exacte en base
     (`Q(attributes__value=v)`), portable SQLite/PostgreSQL, avec `distinct()`.
   - `text` (contient, insensible à la casse) et `multiselect` (valeur stockée =
     liste JSON) → filtrage Python puis réduction `pk__in`, car les lookups
     `contains`/`icontains` sur `JSONField` ne sont pas supportés par SQLite
     (base de tests).
   - Clés inconnues ou non filtrables : **ignorées silencieusement** (jamais de
     400), pour que le frontend puisse renvoyer tous les facets sans connaître
     leur existence par catégorie.

4. **Endpoint de découverte** : `GET /api/v1/categories/<slug>/filter-options/`
   renvoie `{category, filters: [{key, label, value_type, unit, options,
   values}]}` — `options` statiques pour select/multiselect, valeurs observées
   distinctes pour number. Le frontend génère le panneau à partir de cette
   réponse, aucune facette n'est codée en dur.

5. **État du frontend** : `CatalogPage` (`/products`) synchronise filtres et
   page dans l'URL (`useSearchParams`) — résultats partageables, bouton
   retour fonctionnel. `FilterPanel` est un composant contrôlé (desktop:
   sidebar; mobile: drawer Dialog).

## Alternatives considérées

| Alternative | Raison du rejet |
|---|---|
| Colonnes dédiées par attribut + `django-filters` statique | Rigidité : migration + code à chaque nouvelle catégorie ; contredit le modèle JSONField déjà en place. |
| Un seul paramètre JSON encodé (`?filters={"vram":[8]}`) | Illisible, non partageable, casse le cache HTTP et l'indexation. |
| Recherche full-text sur les attributs uniquement | Perd l'égalité exacte et les facettes comptées ; FTS reste pour `q=`. |
| Filtrage 100 % Python | Correct mais O(n) sur tout le catalogue ; le chemin DB couvre les facettes les plus utilisées. |
| Échouer en 400 sur clé inconnue | Casse l'UX multi-catégories : le panneau envoie des facets qui n'existent plus après changement de catégorie. |

## Conséquences

- **+** Nouvelles catégories/attributs : zéro changement backend ou frontend
  (l'attribut apparaît automatiquement s'il est `filterable=True`).
- **+** Les trois listings (public, vendeur, modération) partagent le même
  mixin `_apply_attribute_filters`.
- **−** Le chemin Python (`text`/`multiselect`) charge les valeurs d'attributs
  en mémoire ; acceptable au volume actuel, à revoir si le catalogue dépasse
  quelques dizaines de milliers de produits.
- **−** Le typage fort est perdu (valeurs JSON arbitraires) ; la coercition se
  fait côté `parse_query_value` (bool → int/float → str).

## Références

- `apps/products/filters.py` — parsing + application des filtres
- `apps/categories/views.py::FilterOptionsView` — découverte des facettes
- `src/components/ui/FilterPanel.tsx` / `src/pages/CatalogPage.tsx` — UI
- Spec §34 (filtres), §14-25 (caractéristiques par catégorie)
