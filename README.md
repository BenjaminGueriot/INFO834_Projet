# Projet Chat
Projet réalisé en groupe. Le but était de faire un chat 

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

- copier les fichiers
- se placer dans `Backend` puis `pip -r requirements.txt` pour installer les dépendances
- toujours dans `Backend`, éxécuter `backend.py` avec python.
- Dans un autre terminal, se placer dans `frontend`
- `npm install` puis `npm start`, l'application se lance sur `localhost:3000`
