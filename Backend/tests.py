import pytest
import db
from backend import create_app
from models import User, UserRepository, Message, Channel, Server, Member, ServerRepository



def test_user():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })

    mongo = db.config_db(app, "test_db")
    mongo.db.users.drop()
    mongo.db.servers.drop()

    user = User(
        **{'login' : 'bob',
        'password' : 'password',
        'nickname' : "xX_bob_Xx"
        })

    userRepository = UserRepository(mongo.db)
    userRepository.save(user)
    assert mongo.db.list_collection_names() == ["users"]
    

def test_message():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })

    mongo = db.config_db(app, "test_db")
    mongo.db.users.drop()

    user = User(
        **{'login' : 'bob',
        'password' : 'password',
        'nickname' : "xX_bob_Xx"
        })

    userRepository = UserRepository(mongo.db)
    userRepository.save(user)

    from_user = userRepository.find_one_by({'login' : 'bob'})

    assert from_user is not None
    assert from_user.id == user.id

    message = Message(
        **{'from_user' : from_user.id,
        'content' : 'test'
        })

    assert message == Message(
        **{'from_user' : user.id,
        'content' : 'test'
        })
    
def test_server():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })

    mongo = db.config_db(app, "test_db")
    mongo.db.users.drop()
    mongo.db.servers.drop()

    user = User(
        **{'login' : 'bob',
        'password' : 'password',
        'nickname' : "xX_bob_Xx"
        })

    userRepository = UserRepository(mongo.db)
    userRepository.save(user)

    member = Member(**{'user' : user.id, 'role' : 'admin'})
    server = Server(**{'name' : "bob's server",
        'members' : [member]
        })

    serverRepository = ServerRepository(mongo.db)
    serverRepository.save(server)

def test_add_friend():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })

    mongo = db.config_db(app, "test_db")
    mongo.db.users.drop()

    bob = User(
        **{'login' : 'bob',
        'password' : 'password',
        'nickname' : "xX_bob_Xx",
        'friends': []
        })
    
    user2 = User(
        **{'login' : 'louis',
        'password' : 'password',
        'nickname' : "xX_bob_Xx",
        'friends': []
        })

    userRepository = UserRepository(mongo.db)
    userRepository.save(bob)
    userRepository.save(user2)

    from_user = userRepository.find_one_by({'login' : 'bob'})

    assert from_user is not None
    assert from_user.id == bob.id

    chat = db.create_chat(mongo, 'bob_louis', 'bob', 'louis')
    
    bob = userRepository.find_one_by({'login' : 'bob'})
    user2 = userRepository.find_one_by({'login' : 'louis'})


    assert bob.friends == ['louis']
    assert user2.friends == ['bob']

test_add_friend()