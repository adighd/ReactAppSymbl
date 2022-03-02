import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <button className="name-picker-button" onClick={runApp}>
            OK!
        </button>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}


async function runApp() {
  /**
   * The JWT token you get after authenticating with our API.
   * Check the Authentication section of the documentation for more details.
   */
  const accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFVUTRNemhDUVVWQk1rTkJNemszUTBNMlFVVTRRekkyUmpWQ056VTJRelUxUTBVeE5EZzFNUSJ9.eyJodHRwczovL3BsYXRmb3JtLnN5bWJsLmFpL3VzZXJJZCI6IjUxODExMzk0NzI4NzU1MjAiLCJpc3MiOiJodHRwczovL2RpcmVjdC1wbGF0Zm9ybS5hdXRoMC5jb20vIiwic3ViIjoicFRXeXVpSVc1TUlhTW02ZGs3bjJMZmUyd0dCNjhFVEJAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcGxhdGZvcm0ucmFtbWVyLmFpIiwiaWF0IjoxNjQ2MTczMTQ4LCJleHAiOjE2NDYyNTk1NDgsImF6cCI6InBUV3l1aUlXNU1JYU1tNmRrN24yTGZlMndHQjY4RVRCIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.slqX2hJYKTcprnWok1eeLsp9WXtKSbtGKziDr_ihp8zwh-xHX4Rej-idFuGMXh7dcJ6EvMxRkCqlKuHDZWIi7prscJNzE_YU4ftxrbyCNC86FXBBIfI6DqW_biMvjky_Z_vN5FBw48Iy5fOjXUnA10l4OikeTlOVOtF-Eo0PmDWfdSP8tWCYZjNB7Vt4Ojh5_geFtya3vUptEMQcVm51BSHv9mGzXPV3N6erpTlJJ-h68226jP-zS9gbIB_clReGuo7FR7TzsGAI-k_rkbkXEweGPZHSeQ6v96XJYhGGvpfpo9krQYzxbCb0O7oyAv4Qg-rCIBO0S8Wrkaq8RbFDyg"
  const uniqueMeetingId = btoa("jaryen@uw.edu")
  const symblEndpoint = `wss://api.symbl.ai/v1/streaming/${uniqueMeetingId}?access_token=${accessToken}`;
  
  // Create a new websocket connection to the Symbl
  // streaming API
  const ws = new WebSocket(symblEndpoint);
  // let stream = new MediaStream();
  
  // Fired when a message is received from the WebSocket server
  ws.onmessage = (event) => {
    // You can find the conversationId in event.message.data.conversationId;
    const data = JSON.parse(event.data);
    if (data.type === 'message' && data.message.hasOwnProperty('data')) {
      console.log('conversationId', data.message.data.conversationId);
    }
    console.log('Data type:', data.type);
    if (data.type === 'message_response') {
      for (let message of data.messages) {
        console.log('Transcript (more accurate): ', message.payload.content);
      }
    }
    if (data.type === 'topic_response') {
      for (let topic of data.topics) {
        console.log('Topic detected: ', topic.phrases)
      }
    }
    if (data.type === 'insight_response') {
      for (let insight of data.insights) {
        console.log('Insight detected: ', insight.payload.content);
      }
    }
    if (data.type === 'message' && data.message.hasOwnProperty('punctuated')) {
      console.log('Live transcript (less accurate): ', data.message.punctuated.transcript)
    }
    if (data.type === 'message') {
      console.log('Data type is a message');
      console.log('Data transcript:', data.message.transcript);
    }
    console.log(`Response type: ${data.type}. Object: `, data);
  };
  
  // Fired when the WebSocket closes unexpectedly due to an error or lost connetion
  ws.onerror  = (err) => {
    console.error(err);
  };
  
  // Fired when the WebSocket connection has been closed
  ws.onclose = (event) => {
    console.info('Connection to websocket closed');
  };
  
  // Fired when the connection succeeds.
  ws.onopen = (event) => {
    console.log("Opened the websocket");
    ws.send(JSON.stringify({
      type: 'start_request',
      meetingTitle: 'Websockets How-to', // Conversation name
      insightTypes: ['question', 'action_item'], // Will enable insight generation
      config: {
        confidenceThreshold: 0.5,
        languageCode: 'en-US',
        speechRecognition: {
          encoding: 'LINEAR16',
          sampleRateHertz: 44100,
        }
      },
      speaker: {
        userId: 'jaryen@uw.edu',
        name: 'Jared Yen',
      }
    }));
  };

  ws.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
  });
  
  //async function makeStream() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    // handleSuccess(stream);
  //}
  //makeStream();

  /**
    * The callback function which fires after a user gives the browser permission to use
    * the computer's microphone. Starts a recording session which sends the audio stream to
    * the WebSocket endpoint for processing.
    */
  handleSuccess(stream);
  const handleSuccess = (stream) => {
    console.log("We are in handleSuccess");
    const AudioContext = window.AudioContext;
    const context = new AudioContext();
    if (stream == null) {
      console.log("Stream is NULL");
    } else {
      console.log("Stream is active? " + stream.active);
      console.log("MediaStream audio tracks", stream.getAudioTracks())
    }
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(1024, 1, 1);
    const gainNode = context.createGain();
    source.connect(gainNode);
    gainNode.connect(processor);
    processor.connect(context.destination);
    processor.onaudioprocess = (e) => {
      // console.log("Processed audio?");
      // convert to 16-bit payload
      const inputData = e.inputBuffer.getChannelData(0) || new Float32Array(this.bufferSize);
      const targetBuffer = new Int16Array(inputData.length);
      for (let index = inputData.length; index > 0; index--) {
          targetBuffer[index] = 32767 * Math.min(1, inputData[index]);
      }
      // Send audio stream to websocket.
      if (ws.readyState === WebSocket.OPEN) {
        // console.log("Testing targetBuffer: ", targetBuffer[30]);
        ws.send(targetBuffer.buffer);
      }
    };
 };
 
 

}

export default App;
