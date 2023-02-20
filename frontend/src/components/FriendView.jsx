import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import  { useNavigate } from 'react-router-dom'

function FriendView({socket}){

    const [newMessage, setNewMessage] = useState()
    const [chat, setChat] = useState()
    // Variables pour les forms
    const [newFriend, setNewFriend] = useState()
    const [connectedUsers, setConnectedUsers] = useState()
    const [currentUser,setCurrentUser] = useState()
    const [loaded, setLoaded] = useState(false)
    const [activeFriend, setActiveFriend] = useState()

    
    const currentlogin = sessionStorage.getItem("user")
    
    const fetchUserData = async () => {
        
        if(currentlogin != undefined){
            const current = await getCurrent()
            setCurrentUser(current)
            return current
        }
    }

    

    useEffect( () => {

        if(connectedUsers != undefined){
            fetchUserData()  
        }
        
    }, [connectedUsers])

    useEffect(() => {

        (async () => {
            if (!loaded) {
                
                const c = await fetchUserData()

                const connect = await get_if_connect(c)
                //console.log(connect)
                setConnectedUsers(connect)

                setLoaded(true);
            }

        })()
    }, [loaded])

    useEffect( () => {
        (async () => {
                const c = await fetchUserData()
                const connect = await get_if_connect(c)
                //console.log(connect)
                setConnectedUsers(connect)
        })()

        socket.on('update_chat', (data) =>{

            
            const updatedServer = JSON.parse(data.server)
            setChat(updatedServer)

        })

        return () => {
            socket.off("update_chat")
            socket.off("new_message")
        }
    }, [])

    useEffect( () => {
        socket.off('new_message')

        socket.on('new_message', (data) => {
            alert("yahahaha")
            // if ( activeChannel && activeServer == data.server && activeChannel.name == data.channel ){

                // Notifier le server qu'un nouveau message a été reçu. 
                socket.emit("new_message_received", sessionStorage.getItem("user"), "Messages", chat.name)
            // }
        })

    }, [chat])



    const getCurrent = async () => {
        const responseServerData = await fetch('/api/user?user=' + currentlogin, {
            method: 'GET',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            },
        })

      const res = await responseServerData.json();

      if (responseServerData.ok){
        return res.body
      }
      else{
        alert("Error fetching server data")
        return
      }
    }


    const get_if_connect = async (userC) => {
        let res = {};
        if(userC){
            userC.map( async (friend) => {
                let responseUserData = await fetch('/api/get_user_redis?login=' + friend, {
                    method: 'GET',
                    headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                    },
                })
                let r = await responseUserData.json()
                res[friend] = r.body;
                console.log(res)
            });

            console.log(res)
            return(res)
        }
    }


    const renderFriendItems = () => {

        if(currentUser){
           
                return currentUser.map( (friend) => {

                    if(connectedUsers[friend] == 1 && friend == activeFriend){
                        return <li className='member connected active' onClick={handleChatClick}>{friend}</li>
                    }
                    else if (connectedUsers[friend] == 1 ){
                        return <li className='member connected' onClick={handleChatClick}>{friend}</li>
                    }
                    else if(friend == activeFriend){
                        return <li className='member active' onClick={handleChatClick}>{friend}</li>
                    }
                    else{
                        return <li className='member' onClick={handleChatClick}>{friend}</li>
                    }
                })
        }
    }

    const handleChatClick = async (e) => {
        e.preventDefault()

        const friendName = e.target.innerHTML

        const responseServerData = await fetch('/api/chat?user1=' + currentlogin + "&user2=" + friendName, {
            method: 'GET',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            },
        })

        const res = await responseServerData.json();

        if (responseServerData.ok){
            console.log(res.body)
            setChat(res.body)
            setActiveFriend(friendName)
        }
        else{
            alert("Error fetching server data")
            return
        }

    }

    const handleAddFriend = async (e) => {
        e.preventDefault()

        console.log(newFriend)
        console.log(currentlogin)

        if(newFriend === "" || newFriend === null || newFriend === undefined) return

        const responseServerData = await fetch('/api/friend', {
            method: 'POST',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
            body : JSON.stringify({"user" : currentlogin, "friend": newFriend})
        })

        const res = await responseServerData.json();


        if (responseServerData.ok){
            //socket.emit("add_friend", newFriend)
            fetchUserData()
            return
        }
        else{
            alert("Error fetching server data")
            return
        }



    }


    const renderMessageItems = () => {
        return chat && chat.channels[0].messages.map( (message) => {
            return (<li className='channel-message'>
                <div>
                    <span className='from'>{message.from_user.login}</span>
                    <span className='date'>{message.sent_at}</span>
                </div>
                <p>{message.content}</p>
            </li>)
        })
    }

    const handleSendNewMessage = async (e) => {
        e.preventDefault()

        if(newMessage === "" ||newMessage === null || newMessage === undefined) return

        const responseServerData = await fetch('/api/server', {
            method: 'PUT',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
            body : JSON.stringify({"new_channel" : "", "server_name" : chat.name, "new_member" : "", "channel_to_update" : "Messages", "new_message" : newMessage, "from" : sessionStorage.getItem("user")})
        })

        const res = await responseServerData.json();
      

        if (responseServerData.ok){
            setChat(res)
            socket.emit("message_sent",  chat.name, "Messages")
            return
        }
        else{
            alert("Error fetching server data")
            return
        }
    }

    const renderChannelView = () => {

        return (
            chat &&
        <form className='d-flex flex-column align-items-center p-3 justify-content-end'>
                    <label className='w-100'>
                        <input className='w-100' type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}/>
                    </label>
                    <button type="submit" className='btn btn-primary w-100' onClick={handleSendNewMessage}>Send Message</button>
        </form>
        )
    }

    return(
         currentUser && 
         <div className='server-view'>
            <div className='friend-view'>                
                <div className='member-list h-100'>
                <div className='friend_list_label'>Friend list</div> 
                <form className='d-flex flex-column align-items-center '>
                    <label>
                        <p>Username</p>
                        <input className='w-100' type="text" value={newFriend} onChange={(e) => setNewFriend(e.target.value)}/>
                    </label>
                    <button type="submit" className='btn btn-primary w-100' onClick={handleAddFriend}>+ Add Friend</button>
                    </form>
                    <ul>{renderFriendItems()}</ul>
                </div>
            </div>
            <div className='channel-view'>
                    <ul className='message-list'>{renderMessageItems()}</ul>
                    {renderChannelView()}
                </div>
        </div>
    )
}

export default FriendView
