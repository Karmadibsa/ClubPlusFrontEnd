# Club Plus - Frontend Angular

## Description

Ce projet constitue l'interface utilisateur (frontend) de l'application Club Plus. Développée avec le framework Angular, cette Single Page Application (SPA) a pour rôle principal de fournir une expérience utilisateur interactive et moderne pour accéder à l'ensemble des fonctionnalités de gestion des réservations d'événements sportifs pour les clubs. Elle communique exclusivement avec le backend (développé en Java Spring Boot) via une API RESTful, en utilisant le format JSON pour l'échange de données.

L'interface est conçue pour être responsive et s'adapter à différentes tailles d'écran (ordinateurs, tablettes, smartphones). Une attention particulière a été portée à l'ergonomie, à la simplicité d'utilisation et à l'accessibilité.

## Fonctionnalités Principales

L'application frontend offre plusieurs sections et fonctionnalités clés:

*   **Section Publique:** Présentation de l'application, informations de contact, tarifs, et section "À propos". Accessible sans connexion.
*   **Section Adhérents:**
  *   Accès aux événements des clubs auxquels l'adhérent appartient.
  *   Réservation de places (jusqu'à deux par événement).
  *   Consultation des billets.
  *   Gestion des demandes d'amis (via un code ami).
  *   Modification des informations personnelles.
  *   Notation des événements participés.
*   **Section Réservation (pour les gestionnaires de club):**
  *   Tableau de bord avec statistiques clés du club.
  *   Accès aux événements passés et futurs.
  *   Visualisation des nouveaux membres inscrits.
  *   Consultation des listes de membres et d'événements.
  *   Création et gestion des événements.
  *   Visualisation des informations personnelles des membres.
*   **Section Administrative (pour les administrateurs de club):**
  *   Fonctionnalités de la section Réservation.
  *   Modification des informations du club.
  *   Gestion des rôles des membres.
  *   Gestion des adhésions au club.
*   **Fonctionnalités Transverses:**
  *   Système d'authentification sécurisé (gestion des tokens JWT).
  *   Formulaires de création de compte et d'inscription de structure (club).
  *   Calendrier interactif des événements avec options de filtrage.
  *   Navigation facilitée par une barre latérale (sidebar) adaptative intégrant des icônes Lucide.
  *   Suivi des présences (affichage de QR codes générés par le backend).

## Architecture Frontend

*   **Framework:** Angular (Version 19).
*   **Langage:** TypeScript.
*   **Structure:** Single Page Application (SPA) organisée en composants réutilisables (Components).
*   **Services:** Les services Angular (`@Injectable`) sont utilisés pour la logique métier et la communication avec l'API backend via le module `HttpClient`.
*   **Intercepteur HTTP:** Un `HttpInterceptor` est mis en place pour gérer l'ajout automatique des tokens JWT aux requêtes sortantes et pour la gestion globale des erreurs API.
*   **Communication Backend:**
  *   API RESTful.
  *   Format d'échange: JSON (`application/json`).
  *   Authentification: Tokens JWT (Bearer Token dans l'en-tête `Authorization`).

## Technologies et Outils (Frontend)

*   **Framework Principal:** Angular (Version 19)
*   **Langage de Développement:** TypeScript
*   **Structure et Style:**
  *   HTML5 et CSS3 (SCSS)
  *   Utilisation de variables CSS pour une thématique flexible (adaptation aux couleurs du club)
  *   Design responsive
*   **UI Components & Styling:**
  *   Bibliothèque d'icônes: Lucide.
  *   Police principale: Poppins.
*   **Gestion de Versions:** Git
*   **Hébergement de Dépôt:** GitHub

## Prérequis

*   Node.js
*   npm
*   Angular CLI (globalement installé: `npm install -g @angular/cli`)

## Installation

1.  Clonez le dépôt du projet frontend :
    ```
    git clone https://github.com/Karmadibsa/ClubPlusFrontEnd
    ```
2.  Accédez au répertoire du projet :
    ```
    cd nom-du-repertoire-frontend
    ```
3.  Installez les dépendances :
    ```
    npm install
    ```


## Lancement du serveur de développement

Pour lancer l'application en mode développement :
    ```
    ng serve  
    ```
ou
    ```
    npm start
    ```

L'application sera accessible par défaut à l'adresse `http://localhost:4200/`. Le serveur se rechargera automatiquement si vous modifiez les fichiers sources.

## Build pour la production

Pour compiler l'application pour un environnement de production :
    ```
    ng build --configuration production
    ```

Les fichiers compilés seront générés dans le répertoire `dist/nom-du-projet-angular` (le nom exact peut varier selon la configuration de `angular.json`).


## Structure des styles (SCSS)

Le projet utilise SCSS pour la gestion des styles.
*   **Styles Globaux:** Les styles globaux, incluant l'import de la police Poppins, la configuration d'Angular Material, et les variables CSS principales (couleurs, espacements), sont définis dans `src/styles.scss` ou un fichier équivalent.
*   **Variables CSS:** Des variables CSS sont utilisées pour faciliter la personnalisation de la charte graphique, notamment les couleurs primaires (`--main-orange`, `--main-blue`) et secondaires.
*   **Composants Spécifiques:** Chaque composant Angular possède son propre fichier de styles encapsulé, mais peut utiliser les variables et mixins globaux.
*   **Layout Commun:** Un layout commun (`UserLayoutComponent`) est utilisé pour les pages internes, avec une structure de page standardisée (.page-header, .filters-section, .main-section) et des styles pour les éléments d'interface courants (cartes, boutons, formulaires, tableaux).
*   **Responsive Design:** Des media queries sont utilisées pour assurer l'adaptabilité sur différentes tailles d'écran.

## Auteur

*   **Axel MOMPER** dans le cadre du Projet Fil rouge de la formation de Concepteur Developpeur d'application à Metz Numeric School

## Lien du Back-end

   ```
    https://github.com/Karmadibsa/ClubPlusBackEnd
   ```
