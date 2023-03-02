# Projet Clone Discord
Projet réalisé en groupe. Le but était de réaliser une application de chat qui imitait le fonctionnement de Discord. C'est à dire qu'un utilisateur peut rejoindre
plusieurs serveurs qui eux contiennent plusieurs channels centrées sur un sujet qui font office de chat. Il est également possible d'ajouter des utilisateurs come amis pour communiquer avec eux de manière privée.

# Architecture

## Arborescence

```python
📦 INFO834_Projet
├─ 📁 Frontend
│  └─ 📁 src
│     ├─ 📁 components  # Components react
│     │  ├─ 📝 FriendView.jsx   # Vue amis : liste d'amis + conversations
│     │  ├─ 📝 ServerList.jsx   # Liste des serveurs
│     │  └─ 📝 ServerView.jsx   # Vue du serveur : channels + chat
│     ├─ 📁 pages   # Pages de l'application
│     │  ├─ 📝 login/login.jsx  # Login page
│     │  └─ 📝 app.jsx  # Application après login
│     └─ 📁 Styles
├─ 📁 Backend
│  ├─ 📝 backend.py  # API python
│  ├─ 📝 db.py  # Fonctions de manipulation de la BDD
│  ├─ 📝 models.py  # Models ORM pour mongoDB
│  └─ 📝 tests.py   # Tests de la BDD
└─ 📁 Stats
   └─ 📝 stats.py  # Fonctions de stats utilisateurs
```

## Technologies

![architecture](imgs_readme/architecture.png)

Pour le frontend, nous utilisons la librairie JS React afin de construire notre UI. React communique avec notre Backend Pythonpar le biais d'appels d'API pour obtenir les informations de la base de donnée, mais également par des websockets qui permettent une mise a jour en temps réel de l'UI, pour gérer les nouveaux messages par exemple.

Notre backend python implémente la librairie `pydantic_mongo` pour définir des modèles correspondant à nos données et utiliser des repositories pour communiquer avec notre base de données MongoDB. Finalement, nous utilisons une seconde base de données Redis pour stocker à chaud les connexions des utilisateurs et savoir si un utilisateur est présomptement connecté ou non.

## MongoDB

Les données sont structurées de la manière suivante :
- une collection `server` pour les serveurs.
- une collection `user` pour les utilisateurs.

Un serveur est un document de la forme :
```javascript
{
    "id" : ... , // Id mongo du serveur
    "type" : ... , // Pour différencier serveur et conversation privée
    "name" : ... , // Nom du serveur
    "members" : [...], // Liste des membres du serveur
    "channels" : [...] // Liste des channels du serveur
}
```
Un membre est un objet de la forme : 
```javascript
{
    "user" : ... , // Id mongo de l'utilisateur correspondant
    "role" : ...  // Admin ou utilisateur

}
```
Un channel est un objet de la forme :
```javascript
{
    "name" : ... , // Nom du channel
    "messages" : [...]  // Liste des messages du channel
}
```
Un message est un objet de la forme :
```javascript
{
    "from_user" : ... , // Id mongo de l'utilisateur
    "sent_at" : [...],  // Date du message
    "content" : ... // Contenu du message
}
```
Finalement, un utilisateur est un document de la forme :
```javascript
{
    "id" : ... , // Id mongo de l'utilisateur
    "login" : [...],  // Login de l'utilisateur
    "password" : ... , // Mot de passe
    "nickname" : ... , // Nom de l'utilisateur
    "friends" : [...] // Liste d'IDs des utilisateurs amis
}
```

Avec `pydantic_mongo` on peut alors définir des modèles pour chaque objet/document pour garantir une cohérence des données :
```python
class Server(BaseModel):
    id: ObjectIdField = None
    type : bool
    name : str
    members : list[Member]
    channels : list[Channel] 
```

Les conversations privées sont gérées de la manière suivante :
- Une conversation privée est un serveur de nom username1_username2 sans administrateur et avec un unique channel.

## Redis

Pour savoir si un utilisateur est connecté ou non, à chaque connexion utilisateur l'on affect 1 à la clé du nom de l'utilisateur dans Redis.

Pour garder une trace du nombre de connexions, on rajoute une entrée contenant le nom de l'utilisateur à un stream Redis lors de chaque connexion. La clé de l'entrée sera automatiquement  la date de l'entrée.
```python
r.set(username, 1) # Utilisateur connecté
r.xadd("connections", {'username' : username}) # Logging de la connexion au stream connections
```

Lors de la déconnexion, on supprimme la clé de l'utilisateur pour indiquer qu'il n'est plus connecté :
```python
r.delete(socketio.server.get_session(sid).get('username')) # Suppression de l'entrée correspondant à l'utilisateur
```

# Fonctionnalités développées

- Connexions utilisateur
- Gestion de serveurs
- Affichage des utilisateurs connectés en temps réel indiqué par le rond à coté du pseudo d'un utilisateur
- Gestion de salons au sein d'un serveur
- Liste d’amis
- Conversations privées
- Verifications (vérification des champs de login, ne peux pas ajouter deux fois le même utilisateur à un serveur ou en ami, unicité des conversations privées entre deux utilisateurs)
- Stats serveurs et utilisateurs
- Replica set de la base de donnée MongoDB

# Stats

Le fichier `stats.py` permet d'obtenir des stats sur l'application à partir de Redis,  MongoDB et pandas.
D'abord un diagramme des utilisateurs qui se connectent le plus en manipulant les données du stream de connexions Redis. 

![Stats](imgs_readme/stats_connexions.png)

Ensuite les utilisateurs qui envoient le plus de message à partir de MongoDB et d'une pipeline d'agrégats :

![Stats](imgs_readme/stats_msg.png)

Finalement les serveurs avec le plus de messages, toujours avec MongoDB :

![Stats](imgs_readme/stats_servers.png)

# Compétences acquises

- Déploiement de bases de données NoSQL dans une application
- Réplication d’une base de donnée pour sa résilience 
- Utilisation de base de données secondaire pour stockage chaud (logs, gestion des connexions en temps réel)  
- Gestion des sockets entre FrontEnd et BackEnd
- Pipeline d’agrégats pour mongoDB


# Installation

Prérequis :
- MongoDB qui tourne sur le port `27017`
- Redis qui tourne sur le port `6379`

Installation :
- copier les fichiers
- se placer dans `Backend` puis `pip install -r requirements.txt` pour installer les dépendances.
- toujours dans `Backend`, éxécuter `backend.py` avec python.
- Dans un autre terminal, se placer dans `frontend`.
- `npm install` puis `npm start`, l'application se lance sur `localhost:3000`.

**Attention** : ne pas refresh la page lorsque l'application tourne sinon il y aura des bugs de sockets
