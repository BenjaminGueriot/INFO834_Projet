# %%
import db   
from flask import Flask
import redis
import pandas as pd
import matplotlib

def create_app():
    app = Flask(__name__)
    return app

# Serveur flask
app = create_app()

# Config la ddb
mongo = db.config_db(app, "myDatabase")
r = r = redis.StrictRedis('localhost', 6379, charset="utf-8", decode_responses=True)

# %%

def connection_stats():
    all_connections = r.xrange("connections", "-", "+")
    df = pd.DataFrame(all_connections, columns = ["stream_id", "user"])
    df["user"] = df["user"].apply( lambda x : x["username"])
    df2 = pd.DataFrame(df.groupby("user")["stream_id"].count()).reset_index()
    df2.columns = ["user", "connections"]
    df2 = df2.sort_values("connections", ascending = False)
    df2.plot(kind = "bar", x="user", title="User connections ranking")


connection_stats()

# %%

def user_msg_stats():
    servers = mongo.db.servers
    pipeline = [
                {"$unwind" : "$channels"},
                {"$unwind" : "$channels.messages"},
                {"$project" : {"messages" : "$channels.messages", "_id" : 0}},
                {"$group" : {"_id" : "$messages.from_user", "total" : {"$sum" : 1}  }},
                {"$project" : {"_id" : 0, "user" : "$_id.login", "messages" : "$total"} }
                ]
    results =  servers.aggregate(pipeline)
    df = pd.DataFrame( list(results))
    users = mongo.db.users.aggregate([{"$project" : {"user" : "$login", "_id" : 0}}])
    df_users = pd.DataFrame(list(users))

    df_users["messages"] = df_users["user"].apply(lambda user : list(df.loc[df["user"] == user]["messages"])[0] if user in df["user"].values else 0)
    df_users = df_users.sort_values("messages", ascending = False)
    df_users.plot(kind = "bar", x = "user", title="User messages ranking")


user_msg_stats()


# %%
def server_msg_stats():
    servers = mongo.db.servers
    pipeline = [
                {"$unwind" : "$channels"},
                {"$unwind" : "$channels.messages"},
                {"$project" : {"messages" : "$channels.messages", "_id" : 0, "name" : 1}},
                {"$group" : {"_id" : "$name", "total" : {"$sum" : 1}  }},
                {"$project" : {"_id" : 0, "server" : "$_id", "messages" : "$total"} }
                ]
    results =  servers.aggregate(pipeline)
    df = pd.DataFrame( list(results))
    all_servers = servers.aggregate([{"$project" : {"server" : "$name", "_id" : 0}}])
    df_servers = pd.DataFrame( list(all_servers))
    df_servers["messages"] = df_servers["server"].apply(lambda server : list(df.loc[df["server"] == server]["messages"])[0] if server in df["server"].values else 0)
    df_servers = df_servers.sort_values("messages", ascending = False)

    df_servers.plot(kind = "bar", x = "server", title="Server messages ranking")
   


server_msg_stats()

# %%
