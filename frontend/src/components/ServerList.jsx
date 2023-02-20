import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Session from 'react-session-api'


function ServerList(props){

    const [servers, setServers] = useState([])
    const [serverName, setServerName] = useState("")


    // Fonction pour récupérer les serveurs 

    async function fetchServers() {
      const data = await getServers()
      setServers(data)
    } 



    // Setup les listner de la socket
    useEffect(() =>
       {
        
        fetchServers()

        props.socket.on('server_joined', (data) => {
          fetchServers()
        })

       }
    , [])

    // Appel à l'api pour récupérer les serveurs
    const getServers = async () => {

        const responseServers = await fetch('/api/server?user=' + sessionStorage.getItem("user"), {
            method: 'GET',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            },
        })

      const res = await responseServers.json();

      if (responseServers.ok){
        return res.body
      }
      else{
        alert("Error fetching servers")
        return
      }

    }


    // Appel d'API pour créer un serveur
    const handleServerCreation = async (event) => {
        event.preventDefault()


        if( serverName === null || serverName === "" || serverName === undefined){
            return
        }

        const responseServerCreation = await fetch('/api/server', {
            method: 'POST',
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({'serverName': serverName, 'admin' : sessionStorage.getItem("user")})
        })

      const res = await responseServerCreation.json();

      if (responseServerCreation.ok){

        // Notifier le serveur socket de l'ajout d'un membre (ici l'admin est ajouté au serveur qu'il vient de créer)
        props.socket.emit("add_member", sessionStorage.getItem("user"), serverName )

        const data = await getServers()


        // Changer le state pour re render le component
        setServers(data)

      }
      else{
        ;
      }

    }

    // Afficher les serveurs
    const renderServerItems = () => {
      return servers.map( (server) => {

          if(server == props.activeServer){
            return <li className='active' onClick={() => props.handleServerClick(server)}>{server}</li>
          }
          else{
            return <li onClick={() => props.handleServerClick(server)}>{server}</li>
          }

       
      })
    }


    return (
        <div>
            <form className='d-flex flex-column align-items-center '>
            <label>
                <p>Server Name</p>
                <input className='w-100' type="text" value={serverName} onChange={e => setServerName(e.target.value)}/>
            </label>
            <button type="submit" onClick={handleServerCreation} className='btn btn-primary w-100'>+ Create Server</button>
            </form>
            <ul>
                {renderServerItems()}
            </ul>
        
        </div>
    )
}

export default ServerList