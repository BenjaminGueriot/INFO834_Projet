# Projet FULLSTACK Discord
Projet réalisé seul. Le but était de rérpoduire un clonde de discord avec un front REACT et une API Flask avec python en BACKEND, avec une database mongoDB.

https://trello.com/b/VJNd6ont/proj-info-734

## ! Important !
regarder la vidéo en guise de présentation/soutenance pour plus d'explications

m'envoyer un mail si le lien ets plus dispo

https://we.tl/t-wbbSqECaZr

# Architecture

- `fronted`
    - `src/components` : Components react utilisés pour construire l'UI
    - `src/pages` : Components représentant une page entière
- `backend` 
    - `backend.py` : API flask
    - `db.py` : code d'interaction avec la BDD
    - `models.py` : Modèles pour la BDD et l'application
    - `tests.py` : Tests BDD

# Installation

J'ai pas réussi à configurer docker à cause de problèmes de proxy. Le `docker-compose.yaml` et des fichiers `Dockerfile` pour le front et back sont quand même disponibles sur la branche docker.

Pour installer :
- copier les fichiers
- installer l'image docker : `docker run -d --name mongo-bdd -p 27017:27017 mongo`
- se placer dans `Backend` puis `pip -r requirements.txt` pour installer les dépendances
- toujours dans `Backend`, éxécuter `backend.py` avec python.
- Dans un autre terminal, se placer dans `frontend`
- `npm install` puis `npm start`, l'application se lance sur `localhost:3000`
