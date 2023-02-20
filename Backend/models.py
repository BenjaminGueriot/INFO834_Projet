import uuid
from pydantic import BaseModel, Field, validator
from pydantic_mongo import AbstractRepository, ObjectIdField
from bson import ObjectId
import datetime

class User(BaseModel):
    id: ObjectIdField = None
    login: str
    password: str
    nickname: str
    friends : list[str] = []

    class Config:
        # The ObjectIdField creates an bson ObjectId value, so its necessary to setup the json encoding
        json_encoders = {ObjectId: str}


class UserRepository(AbstractRepository[User]):
    class Meta:
        collection_name = 'users'

class Message(BaseModel):
    from_user: User
    sent_at: str = "{:%X %x}".format(datetime.datetime.now())
    content:str

    class Config:
        json_encoders = {ObjectId: str}

class Member(BaseModel):
    user : User
    role : str

    @validator('role')
    def role_must_be_admin_or_user(cls, v):
        if v != 'admin' and v != 'user':
            raise ValueError('must be "admin" or "user')
        return v

class Channel(BaseModel):
    name : str
    messages : list[Message] = None

class Server(BaseModel):
    id: ObjectIdField = None
    type : bool
    name : str
    members : list[Member]
    channels : list[Channel] 

    class Config:
        # The ObjectIdField creates an bson ObjectId value, so its necessary to setup the json encoding
        json_encoders = {ObjectId: str}

class ServerRepository(AbstractRepository[Server]):
    class Meta:
        collection_name = 'servers'