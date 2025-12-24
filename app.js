const SUPABASE_URL = "https://yxeowgpwumbirppmssmd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JYqJrlOtlH12J1xhgAaObw_MU4R8P0-";

const supabase = supabaseJs.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const chat = document.getElementById("chat");
const usernameInput = document.getElementById("username");
const msgInput = document.getElementById("msg");

let username = "";

function join(){
  username = usernameInput.value.trim();
  if(!username) return alert("Digite um nome");
  listenChat();
  alert("Entrou no chat");
}

function sendMsg(){
  const text = msgInput.value.trim();
  if(!text) return;

  supabase.from("messages").insert({
    username,
    text
  });

  msgInput.value = "";
}

function listenChat(){
  supabase.channel("chat")
    .on(
      "postgres_changes",
      { event:"INSERT", schema:"public", table:"messages" },
      payload => {
        const m = payload.new;
        chat.innerHTML += `<div><b>${m.username}:</b> ${m.text}</div>`;
      }
    )
    .subscribe();
}
