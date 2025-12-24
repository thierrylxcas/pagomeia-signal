/* ==================================================
   🔧 CONFIGURAÇÃO (MUDE SOMENTE ISSO)
================================================== */

// 🔹 SUPABASE
const SUPABASE_URL = "https://yxeowgpwumbirppmssmd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JYqJrlOtlH12J1xhgAaObw_MU4R8P0-";

// 🔹 WEBSOCKET (RENDER)
const WSS_URL = "https://pagomeia-signal.onrender.com/";

/* ================================================== */

const supabase = supabaseJs.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ELEMENTOS
const video = document.getElementById("video");
const chat = document.getElementById("chat");
const usernameInput = document.getElementById("username");
const msgInput = document.getElementById("msg");

// ESTADO
let username = "";
let socket = null;
let pc = null;

/* =========================
   ENTRAR NA SALA
========================= */
function join(){
  username = usernameInput.value.trim();

  if(!username){
    alert("Digite um nome");
    return;
  }

  socket = new WebSocket(WSS_URL);

  socket.onopen = () => {
    console.log("Conectado ao servidor");
  };

  socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);

    // Recebe offer do HOST
    if(data.offer){
      pc = createPeer();
      await pc.setRemoteDescription(data.offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.send(JSON.stringify({ answer }));
    }

    // Recebe ICE candidates
    if(data.candidate && pc){
      try{
        await pc.addIceCandidate(data.candidate);
      }catch(e){
        console.warn("Erro ICE:", e);
      }
    }
  };

  socket.onerror = e => {
    console.error("Erro WebSocket", e);
  };

  listenChat();
}

/* =========================
   CHAT
========================= */
function sendMsg(){
  const text = msgInput.value.trim();
  if(!text) return;

  supabase.from("messages").insert({
    username: username,
    text: text
  });

  msgInput.value = "";
}

function listenChat(){
  supabase.channel("chat-room")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      payload => {
        const m = payload.new;
        chat.innerHTML += `
          <div class="msg">
            <b>${m.username}:</b> ${m.text}
          </div>
        `;
        chat.scrollTop = chat.scrollHeight;
      }
    )
    .subscribe();
}

/* =========================
   WEBRTC
========================= */
function createPeer(){
  const peer = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  });

  peer.ontrack = e => {
    video.srcObject = e.streams[0];
  };

  peer.onicecandidate = e => {
    if(e.candidate && socket){
      socket.send(JSON.stringify({ candidate: e.candidate }));
    }
  };

  peer.onconnectionstatechange = () => {
    console.log("WebRTC:", peer.connectionState);
  };

  return peer;
}

/* =========================
   HOST - COMPARTILHAR TELA
========================= */
async function startShare(){
  if(!socket){
    alert("Entre na sala primeiro");
    return;
  }

  pc = createPeer();

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 30 },
    audio: true
  });

  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
  });

  video.srcObject = stream;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.send(JSON.stringify({ offer }));
}
