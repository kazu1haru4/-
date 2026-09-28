const FRIEND_CHAT_SUPABASE_URL="https://yxonmqdyekwenyzekjwj.supabase.co";
const FRIEND_CHAT_SUPABASE_KEY="sb_publishable_IuQ6r_4vbGC9PP7cWJ9YRQ_Ai7tAfTJ";
const friendChatSupabase=window.supabase.createClient(FRIEND_CHAT_SUPABASE_URL,FRIEND_CHAT_SUPABASE_KEY);

function friendChatGetDeviceId(){
  let id=localStorage.getItem("friendChatDeviceId");
  if(!id){
    id=(crypto.randomUUID?crypto.randomUUID():"fc-"+Date.now()+"-"+Math.random().toString(36).slice(2));
    localStorage.setItem("friendChatDeviceId",id);
  }
  return id;
}

function friendChatDeviceLabel(){
  const ua = navigator.userAgent;

  // iPadOSのSafariはMacとして判定されることがある
  if(
    /iPad|Macintosh/i.test(ua) &&
    (navigator.maxTouchPoints > 1 || /iPad/i.test(ua))
  ){
    return "iPad";
  }

  if(/iPhone|iPod/i.test(ua)) return "iPhone";
  if(/Android/i.test(ua)) return "Android端末";
  if(/Windows/i.test(ua)) return "Windows";
  if(/Mac/i.test(ua)) return "Mac";

  return "この端末";
}

async function friendChatRegisterDevice(session){
  try{
    if(!session?.user?.id)return;

    const deviceId=friendChatGetDeviceId();
    const deviceLabel=friendChatDeviceLabel();

    const {error}=await friendChatSupabase.rpc("register_device_session",{
      p_device_id:deviceId,
      p_device_label:deviceLabel
    });

    if(error){
      console.error("端末登録エラー:",error);
    }
  }catch(error){
    console.error("端末登録エラー:",error);
    // 端末登録に失敗しても既存のBAN確認・サイト機能は止めない。
  }
}

async function checkFriendChatBan(){
  try{
    const {data:sessionData,error:sessionError}=await friendChatSupabase.auth.getSession();
    if(sessionError){
      console.error("セッション確認エラー:",sessionError);
      return false;
    }

    const session=sessionData.session;
    if(!session)return false;

    // ログイン済み端末を登録・最終アクセス更新
    await friendChatRegisterDevice(session);

    const username=session.user?.user_metadata?.username||"";
    if(!username)return false;

    const {data:banned,error}=await friendChatSupabase.rpc(
      "check_user_banned",
      {target_username:username}
    );

    if(error){
      console.error("BAN確認エラー:",error);
      return false;
    }

    if(banned===true){
      document.body.innerHTML=`
        <div id="friendChatBanScreen" style="position:fixed;inset:0;width:100%;height:100%;background:#fff;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;z-index:999999999">
          <div style="width:100%;max-width:420px;padding:32px 24px;box-sizing:border-box;border-radius:24px;background:#f8f8fb;box-shadow:0 8px 30px rgba(0,0,0,.10)">
            <div style="font-size:64px;line-height:1;margin-bottom:20px">🚫</div>
            <h1 style="margin:0 0 16px;font-size:24px;color:#222">このアカウントはBANされています</h1>
            <p style="margin:0;color:#666;font-size:15px;line-height:1.8">現在、このアカウントでは<br>Friend Chatを利用できません。</p>
          </div>
        </div>`;
      return true;
    }

    return false;
  }catch(error){
    console.error("BAN確認エラー:",error);
    return false;
  }
}
