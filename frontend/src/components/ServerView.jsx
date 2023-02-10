import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

function ServerView({activeServer, socket}){

    // Serveur cliqué
    const [server, setServer] = useState()
    // Channel cliqué
    const [activeChannel, setActiveChannel] = useState(null)

    // Variables pour les forms
    const [newChannel, setNewChannel] = useState()
    const [newMember, setNewMember] = useState()
    const [newMessage, setNewMessage] = useState()
    

    // Fonction pour réucpérer les données du serveur cliqué
    const fetchServerData = async () => {
        if (activeServer === null ) return
        const serverData = await getServerData()
        setServer(serverData)
        setNewChannel("")
    }

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

    useEffect( () => {
        socket.off('user_joined_server')
        socket.off('new_channel')

        socket.on('user_joined_server', (data) => {



            if ( activeServer == data.server.name ){

                setServer(data.server)

            }
        })

        // Pour refresh la view quand un channel est ajouté à mon server ouvert
        socket.on('new_channel', (data) => {

            if( activeServer == data.server.name)
            {
                setServer(data.server)
                setActiveChannel(activeChannel)
            }
        })


    }, [activeServer])


    // Setup les autres listeners de la socket
    useEffect( () => {
        // Pour refresh la view quand on user est ajouté à mon server ouvert

        // Pour refresh le chat
        socket.on('update_chat', (data) =>{

            const updatedServer = JSON.parse(data.server)
            setServer(updatedServer)
            setActiveChannel(updatedServer.channels.find(channel => channel.name == data.channel))
        })
    

        return () => {
            socket.off('user_joined_server')
            socket.off('new_message')
            socket.off('update_chat')
            socket.off('new_channel')
        }

    }, [])

    // Refresh la vue au changement de serveur
    useEffect( () => {
        fetchServerData()
        setActiveChannel(null)

    }, [activeServer])

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

    const renderChannelItems = () => {
        return server.channels.map( (channel) => {
            if(activeChannel && channel.name === activeChannel.name){
                return <li className='channel-list active-channel' onClick={() => {setActiveChannel(channel)}}>{channel.name}</li>
            }
            
            return <li className='channel-list' onClick={() => {setActiveChannel(channel)}}>{channel.name}</li>
        })
    }

    const renderMemberItems = () => {
        console.log(server.members)

        return server.members.map( (member) => {
            if(member.role === "admin"){
                return <li className='member-list admin' >{member.user.login}</li>
            }
            
            let connected = get_if_connect(member.user.login).then(res => {
                if (res == 1){
                   return 1
                }
                else{
                    return 0
                }
            });

            console.log(connected)
            if(connected == 1){
                return <li className='member-list connected'>{member.user.login}</li>
            }
            else{
                return <li className='member-list'>{member.user.login}</li>
            }
        })
    }

    const get_if_connect = async (login) => {

        const responseUserData = await fetch('/api/get_user_redis?login=' + login, {
            method: 'GET',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            },
        })

        const res = await responseUserData.json();
        return(res.body[0])
    }

    const handleAddChannel = async (e) => {
        e.preventDefault()

        if(newChannel === "" || newChannel === null || newChannel === undefined) return

        const responseServerData = await fetch('/api/server', {
            method: 'PUT',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
            body : JSON.stringify({"new_channel" : newChannel, "server_name" : activeServer, "new_member" : "", "channel_to_update" : "", "new_message" : "", "from" : ""})
        })

      const res = await responseServerData.json();


      if (responseServerData.ok){
        socket.emit("channel_added", activeServer)
        setServer(res)
        return
      }
      else{
        alert("Error fetching server data")
        return
      }
    }

    const handleAddMember = async (e) => {
        e.preventDefault()

        if(newMember === "" || newMember === null || newMember === undefined) return

        const responseServerData = await fetch('/api/server', {
            method: 'PUT',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
            body : JSON.stringify({"new_channel" : "", "server_name" : activeServer, "new_member" : newMember, "channel_to_update" : "", "new_message" : "", "from" : ""})
        })

      const res = await responseServerData.json();


      if (responseServerData.ok){
        socket.emit("add_member", newMember, activeServer )
        setServer(res)
        return
      }
      else{
        alert("Error fetching server data")
        return
      }
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
            body : JSON.stringify({"new_channel" : "", "server_name" : activeServer, "new_member" : "", "channel_to_update" : activeChannel.name, "new_message" : newMessage, "from" : sessionStorage.getItem("user")})
        })

      const res = await responseServerData.json();

      if (responseServerData.ok){
        // setServer(res)
        // setActiveChannel(res.channels.find(channel => channel.name == activeChannel.name))
        socket.emit("message_sent",  activeServer, activeChannel.name)
        return
      }
      else{
        alert("Error fetching server data")
        return
      }

    }

    const renderMessageItems = () => {
        return activeChannel && activeChannel.messages.map( (message) => {
            return (<li className='channel-message'>
                <div>
                    <span className='from'>{message.from_user.login}</span>
                    <span className='date'>{message.sent_at}</span>
                </div>
                <p>{message.content}</p>
            </li>)
        })
    }


    const renderChannelView = () => {

        return (
            activeChannel &&
        <form className='d-flex flex-column align-items-center p-3 justify-content-end'>
                    <label className='w-100'>
                        <input className='w-100' type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}/>
                    </label>
                    <button type="submit" className='btn btn-primary w-100' onClick={handleSendNewMessage}>Send Message</button>
        </form>
        )
    }

    return(
        server && <div className='server-view'>
            <div className='channel-list'>
                <div className='servername'>{server.name}</div>
                <form className='d-flex flex-column align-items-center '>
                <label>
                    <p>Channel name</p>
                    <input className='w-100' type="text" value={newChannel} onChange={(e) => setNewChannel(e.target.value)}/>
                </label>
                <button type="submit" className='btn btn-primary w-100' onClick={handleAddChannel}>+ Add channel</button>
                </form>
                <ul>{renderChannelItems()}</ul>
            </div>
            <div className='channel-view'>
                <ul className='message-list'>{renderMessageItems()}</ul>
                {renderChannelView()}
            </div>
                
            <div className='member-list'>
            <form className='d-flex flex-column align-items-center '>
                <label>
                    <p>User name</p>
                    <input className='w-100' type="text" value={newMember} onChange={(e) => setNewMember(e.target.value)}/>
                </label>
                <button type="submit" className='btn btn-primary w-100' onClick={handleAddMember}>+ Add Member</button>
                </form>
                <ul>{renderMemberItems()}</ul>
            </div>
        </div>
    )
}


export default ServerView
