from flask_pymongo import PyMongo
from models import User, UserRepository, ServerRepository, Server, Member, Channel, Message

def config_db(app, db_name):
    app.config["MONGO_URI"] = f"mongodb://localhost:27018,localhost:27019,localhost:27020/{db_name}?replicaSet=rs0&readPreference=primaryPreferred&w=majority"
    mongo = PyMongo(app)
    return mongo

def create_user(mongo, username, password):

    user = User(**{
        'login' : username,
        'password' : password,
        'nickname' : username
    })

    userRepository = UserRepository(mongo.db)
    print(list(mongo.db["users"].find({})))
    print(userRepository.find_one_by({'login' : username}))
    if userRepository.find_one_by({'login' : username}) == None:
        userRepository.save(user)
        return user
    else:
        return False

def find_user(mongo, username, password):

    userRepository = UserRepository(mongo.db)

    user = userRepository.find_one_by({'login' : username, 'password' : password})
    if user == None:
        return False
    else: 
        return user

def create_server(mongo, server_name, admin):

    serverRepository = ServerRepository(mongo.db)
    userRepository = UserRepository(mongo.db)

    user = userRepository.find_one_by({'login' : admin})

    if not user:
        return False

    member = Member(**{
            'user' : user, 
            'role' : "admin"
        })

    channel = Channel(**{
            'name' : "General",
            "messages" : []
        })

    server = Server(**{
        'name' : server_name,
        'members' : [member],
        'channels' : [channel]
    })

    if not serverRepository.find_one_by({'name' : server_name}):
        serverRepository.save(server)
        return server
    else:
        return False

def get_servers_of_user(mongo, user_login):
    serverRepository = ServerRepository(mongo.db)
    userRepository = UserRepository(mongo.db)
    user = userRepository.find_one_by({'login' : user_login})
    return serverRepository.find_by({ 'members.user.id' : {'$eq' : user.id} })

def get_server(mongo, server_name):
    serverRepository = ServerRepository(mongo.db)
    server = serverRepository.find_one_by({'name' : server_name})
    return server

def get_all_servers(mongo):
    serverRepository = ServerRepository(mongo.db)
    servers = serverRepository.find_by({})
    return servers

def update_server(mongo, server_name, channel, member, channel_to_update, new_message, from_user):
    serverRepository = ServerRepository(mongo.db)
    server = serverRepository.find_one_by({'name' : server_name})

    if channel != "":
        server.channels.append(Channel(**{
            'name' : channel,
            'messages' : []
        }))
    
    if member != "":
        userRepository = UserRepository(mongo.db)
        user = userRepository.find_one_by({'login' : member})

        if user :
            server.members.append(
                Member(**{
                    'user' : user,
                    'role' : 'user'
                })
            )

    if channel_to_update != "":
        userRepository = UserRepository(mongo.db)
        user = userRepository.find_one_by({'login' : from_user})

        if new_message:
            message = Message(
                **{
                    'from_user' : user,
                    'content' : new_message
                }
            )

            for channel in server.channels:
                if channel.name == channel_to_update:
                    channel.messages.append(message)


    serverRepository.save(server)

    return server