# Étape 1: Phase de construction (build)
# Utiliser une image Node.js pour construire l'application Angular
FROM node:18-alpine as builder
# Définir le répertoire de travail dans le conteneur
WORKDIR /app
# Copier package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./
# Installer les dépendances
RUN npm install
# Copier tous les autres fichiers du projet Angular
COPY . .
# Construire l'application Angular pour la production
# 'votre-nom-app-angular' est le nom de votre projet dans angular.json
RUN npm run build --prod

# Étape 2: Phase de service (serve)
# Utiliser une image Nginx légère pour servir les fichiers statiques
FROM nginx:alpine

# Supprimer la configuration Nginx par défaut si elle existe
RUN rm -f /etc/nginx/conf.d/default.conf

# Copier votre fichier de configuration Nginx personnalisé
# Assurez-vous que "nginx.conf" est le nom exact de votre fichier de configuration créé à l'étape 1.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers construits de l'étape 'builder' vers le répertoire par défaut de Nginx
COPY --from=builder /app/dist/front-end-club-plus/browser/ /usr/share/nginx/html
# (Optionnel) Si vous avez une configuration Nginx personnalisée (par exemple pour le proxy vers le backend), copiez-la ici:
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# Exposer le port 80 (port par défaut de Nginx)
EXPOSE 80
# Commande pour démarrer Nginx et le maintenir en premier plan
CMD ["nginx", "-g", "daemon off;"]


#windows-system32-drivers-etc-host-editer
