import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Session from 'react-session-api'
import  { Navigate, useNavigate } from 'react-router-dom'
import '../styles/app.css'
import ServerList from '../components/ServerList';
import ServerView from '../components/ServerView';
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


    const handleServerClick = (server) => {
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




    return(
        <div>
          <ProtectedComponent/>
          <div className='app'>
            <div className='sidebar'>
              <div>
                <div className='username'>{sessionStorage.getItem("user")}</div>
                  
                <ServerList activeServer = {activeServer} handleServerClick={handleServerClick} socket={socket}/>
              </div>

              <div className='btn btn-danger' onClick={handleDisconnect}>Disconnect</div>
            </div>
            <div className='main'>
              <ServerView activeServer = {activeServer} socket = {socket}/>
            </div>
          </div>
        </div>
    )
}

export default App