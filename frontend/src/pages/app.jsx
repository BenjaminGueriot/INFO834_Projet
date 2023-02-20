import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Session from 'react-session-api'
import  { Navigate, useNavigate } from 'react-router-dom'
import '../styles/app.css'
import ServerList from '../components/ServerList';
import ServerView from '../components/ServerView';
import FriendView from '../components/FriendView';
import io from 'socket.io-client';
// import { SocketContext, socket } from '../context/socket';
const { createProxyMiddleware } = require('http-proxy-middleware');


// Initialisation socket 

const socket = io("http://127.0.0.1:5000", {autoConnect: false})
createProxyMiddleware({
      target: 'http://localhost:6000',
      changeOrigin: true,
    })

socket.connect()

function App() {

    const navigate = useNavigate()
    


    // Serveur à afficher
    const [activeServer, setActiveServer] = useState(null)


    const [serverCondition, setServerCondition] = useState()

    const handleServerClick = (server) => {
      setServerCondition(1)
      setActiveServer(server)
    }

    //Protection de l'application

    const ProtectedComponent = () => {

        if (sessionStorage.getItem("user") === "" || sessionStorage.getItem("user") === null || sessionStorage.getItem("user") === undefined )
          return <Navigate replace to='/' />

        return
      }

    
    useEffect( () => {
      if(sessionStorage.getItem("user") === "" || sessionStorage.getItem("user") === null || sessionStorage.getItem("user") === undefined ) return

      socket.emit('register_user', socket.id, sessionStorage.getItem("user"))


    }, [])


    
  const handleDisconnect = (e) => {
        
      e.preventDefault()
      
      sessionStorage.removeItem("user")
      socket.disconnect()
      navigate("/")
      socket.connect()
  }

  const showFriend = (e) => {
      setServerCondition(0)
        //return <FriendView activeServer = {activeServer} socket = {socket}/>
   
  }




    return(
        <div>
          <ProtectedComponent/>
          <div className='app'>
            <div className='sidebar'>
              <div>
                <div className='username'>{sessionStorage.getItem("user")}</div>
                <div id='btn-friends-top'>{"       "}</div>
                <div className='btn btn-primary w-100' onClick={showFriend}>Friends</div>
                <div id='btn-friends-bottom'>{"       "}</div>
                <ServerList activeServer = {activeServer} handleServerClick={handleServerClick} socket={socket}/>
              </div>

              <div className='btn btn-danger' onClick={handleDisconnect}>Disconnect</div>
            </div>
            <div className='main'>

               { serverCondition == 1 && ( <ServerView activeServer = {activeServer} socket = {socket}/>)}
               { serverCondition == 0 && ( <FriendView socket = {socket}/>)}
              
            </div>
          </div>
        </div>
    )
}

export default App