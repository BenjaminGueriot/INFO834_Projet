import db   
import redis
import pandas as pd

mongo = db.config_db(app, "myDatabase")
r = redis.Redis()

def connection_stats():
    all_connections = r.xrange("connections", "-", "+")
    print(all_connections)