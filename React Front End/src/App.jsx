import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  /**
   * Create a varaible here that holds the contract address after you deploy!
   */
  const contractAddress = "0x0CCD9f24B2fB86Ad2bb1c58B977e394667F9cA60";
  const contractABI = abi.abi;

  const [allWaves, setAllWaves] = useState([]);
  const [waveMsg, setWaveMsg] = useState("");

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach( wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);
      } 
      else {
        console.log("Ethereum object doesn't exist");
      }
    }
    catch(error) {
        console.log(error);
    }
  }

  useEffect(() => {
    let wavePortalContract;
    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if(window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract){
        wavePortalContract.off("NewWave", onNewWave);
      }
    }
  })
  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if(allWaves.length === 0){
        getAllWaves();
      }
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    if(!waveMsg){
      alert("Please add a message to your wave");
    } 
    else {
      try {
        const { ethereum } = window;
  
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
          console.log(wavePortalContract);
          let count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());
  
          const waveTxn = await wavePortalContract.wave(waveMsg, { gasLimit: 300000 });
          console.log("Mining...", waveTxn.hash);
  
          await waveTxn.wait();
          console.log("Mined -- ", waveTxn.hash);
  
          count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());
          getAllWaves();
        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        alert("You can only wave from the same address every 15mins!");
      }
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])
  
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
          I'm Alec and I currently develop smart boat lifts and student information systems. Connect your Ethereum wallet and wave at me!
        </div>
        <br></br>
        <input 
          type="text" 
          placeholder="Add a message to your wave here!"
          value={waveMsg}
          onChange={(e) => setWaveMsg(e.target.value)}>
        </input>
        <br></br>
        

        {!currentAccount && (
          <button className="cta-button connect-wallet-button" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        
        {currentAccount && (
          <button className="cta-button wave-button" onClick={wave}>
          Wave at Me
        </button>
        )}

        <br></br>
        <br></br>
        {currentAccount && (
          <div className="header">
            Previous waves
          </div>
        )}
        <br></br>
        
        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{backgroundColor: "OldLace", marginTop: "16px", padding: "8px"}}>
              <div> Address: {wave.address} </div>
              <div> Time: {wave.timestamp.toString()} </div>
              <div> Message: {wave.message}</div>
            </div>
          )})
        }
      </div>
    </div>
  );
}

export default App
