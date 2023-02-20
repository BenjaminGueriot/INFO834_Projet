from flask_pymongo import PyMongo
from models import User, UserRepository, ServerRepository, Server, Member, Channel, Message

def config_db(app, db_name):
    app.config["MONGO_URI"] = f"mongodb://localhost:27017/{db_name}"
    mongo = PyMongo(app)
    return mongo

def create_user(mongo, username, password):

    user = User(**{
        'login' : username,
        'password' : password,
        'nickname' : username,
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
    
def find_user_by_login(mongo, username):

    userRepository = UserRepository(mongo.db)

    user = userRepository.find_one_by({'login' : username})
    if user == None:
        return False
    else: 
        return user
    
def find_chat(mongo, name1, name2):
    serverRepository = ServerRepository(mongo.db)

    chat = serverRepository.find_one_by({"$or" : [ {'name' : f"{name1}_{name2}"}, {'name' : f"{name2}_{name1}"}]})

    if chat :
        return chat
    else :
        return False

def create_chat(mongo, chat_name, name1, name2):

    serverRepository = ServerRepository(mongo.db)
    userRepository = UserRepository(mongo.db)


    chat_exists = serverRepository.find_one_by({"$or" : [ {'name' : f"{name1}_{name2}"}, {'name' : f"{name2}_{name1}"}]})

    if chat_exists:
        print("AAAAAAAAAAAAAA")
        return False

    user1 = userRepository.find_one_by({'login' : name1})
    user2 = userRepository.find_one_by({'login' : name2})

    if (not user1) or (not user2) :
        return False
    
    user1.friends.append(name2)
    user2.friends.append(name1)

    userRepository.save(user1)
    userRepository.save(user2)


    member1 = Member(**{
            'user' : user1, 
            'role' : "user"
        }, )
    
    member2 = Member(**{        
        'user' : user2,
        'role' : "user"
    })

    channel = Channel(**{
            'name' : "Messages",
            "messages" : []
        })

    server = Server(**{
        'name' : chat_name,
        'type' : False,
        'members' : [member1, member2],
        'channels' : [channel]
    })

    serverRepository.save(server)

    return server

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
        'type' : True,
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
    return serverRepository.find_by({ 'members.user.id' : {'$eq' : user.id} , 'type' : True})

def get_all_servers_of_user(mongo, user_login):
    serverRepository = ServerRepository(mongo.db)
    userRepository = UserRepository(mongo.db)
    user = userRepository.find_one_by({'login' : user_login})
    return serverRepository.find_by({ 'members.user.id' : {'$eq' : user.id}})

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