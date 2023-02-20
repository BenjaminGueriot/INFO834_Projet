import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import  { useNavigate } from 'react-router-dom'

function FriendView({activeServer, socket}){

    const [server, setServer] = useState()

    // Channel cliqué
    const [activeChannel, setActiveChannel] = useState(null)

    // Variables pour les forms
    const [newChannel, setNewChannel] = useState()
    const [newFriend, setNewFriend] = useState()
    const [newMessage, setNewMessage] = useState()
    const [connectedUsers, setConnectedUsers] = useState()
    const [currentUser,setCurrentUser] = useState()

    const [loaded, setLoaded] = useState(false)
    const [loaded2, setLoaded2] = useState(false)
    const [loaded3, setLoaded3] = useState(false)
    
    const currentlogin = sessionStorage.getItem("user")
    
    const fetchUserData = async () => {
        
        if(currentlogin != undefined){
            const current = await getCurrent()
            setCurrentUser(current)
            return current
        }
    }

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

    // Setup le listener pour un nouveau message (J'ai galéré car j'utilise le state activeChannel dedans
    // donc obligé de le re-register le listener a chaque changement)
    useEffect( () => {
        
        socket.off('new_message')

        socket.on('new_message', (data) => {
           
            // if ( activeChannel && activeServer == data.server && activeChannel.name == data.channel ){

                // Notifier le server qu'un nouveau message a été reçu. 
                socket.emit("new_message_received", sessionStorage.getItem("user"), activeChannel.name, server.name)
            // }
        })

    }, [activeChannel])

    // Setup les autres listeners de la socket
    useEffect( () => {
        // Pour refresh la view quand on user est ajouté à mon server ouvert


        // const connected = await get_if_connect(serverData)

        // Pour refresh le chat
        socket.on('update_chat', (data) =>{

            const updatedServer = JSON.parse(data.server)
            setServer(updatedServer)
            // const connected = get_if_connect(JSON.parse(updatedServer))
            // setConnectedUsers(connected)
            setActiveChannel(updatedServer.channels.find(channel => channel.name == data.channel))
        })

        return () => {
            socket.off('new_message')
            socket.off('update_chat')
        }

    }, [])

    /*useEffect( () => {
        (async () => {
            if (!loaded2) {

                const refresh = async () => {
                    const current = await getCurrent()
                    console.log(current)
                    setCurrentUser(current)
                }

                if(currentUser != undefined){
                    refresh()
                }
                setLoaded2(true);
            }
        })()
    }, [loaded2])

    useEffect( () => {
        (async () => {
            if (!loaded3) {

                // Ca marche grace  à ça

                const refresh = async () => {
                    const connect = await get_if_connect()
                    console.log(connect)
                    setConnectedUsers(connect)
                }

                if(connectedUsers != undefined){
                    console.log("oui")
                    setLoaded3(true);
                    refresh()
                }
               
            }
        })()
    }, [loaded3])*/


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

    // Appel api pour les données
    const getServerData = async () => {

        const responseServerData = await fetch('/api/server?server_name=' + activeServer, {
            method: 'GET',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            },
        })

      const res = await responseServerData.json();
      

      if (responseServerData.ok){
        return JSON.parse(res.body)
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

    const test = () => {

        return console.log("fsdfsdfsd")

    }

    const renderFriendItems = () => {

        //console.log(connectedUsers)

        if(currentUser){
           
                return currentUser.map( (friend) => {
                    //console.log(friend)

                   

                    //console.log(Object.keys(connectedUsers))
                    //console.log(connectedUsers[connectedUsers])
                    //console.log(member.user.login + " : " + connectedUsers[member.user.login] )

                    if(connectedUsers[friend] == 1){
                        return <li className='member connected' onClick={test}><span>{friend}</span></li>
                    }
                    else{
                        return <li className='member' onClick={test}> {friend} </li>
                    }
                })
        }
    }

    const handleAddFriend = async (e) => {
        e.preventDefault()

        console.log(newFriend)

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
            socket.emit("add_friend", newFriend)
            setServer(res)
            return
        }
        else{
            alert("Error fetching server data")
            return
        }



    }

    return(
         currentUser && <div className='friend-view'>                          
             <div className='member-list'>
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
    )
}

export default FriendView
