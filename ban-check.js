const FRIEND_CHAT_SUPABASE_URL =
  "https://yxonmqdyekwenyzekjwj.supabase.co";

const FRIEND_CHAT_SUPABASE_KEY =
  "sb_publishable_IuQ6r_4vbGC9PP7cWJ9YRQ_Ai7tAfTJ";

const friendChatSupabase =
  window.supabase.createClient(
    FRIEND_CHAT_SUPABASE_URL,
    FRIEND_CHAT_SUPABASE_KEY
  );


async function checkFriendChatBan() {
  try {

    const {
      data: sessionData,
      error: sessionError
    } = await friendChatSupabase.auth.getSession();

    if (sessionError) {
      console.error(
        "セッション確認エラー:",
        sessionError
      );
      return false;
    }

    const session = sessionData.session;

    if (!session) {
      return false;
    }

    const username =
      session.user?.user_metadata?.username || "";

    if (!username) {
      return false;
    }

    const {
      data: banned,
      error
    } = await friendChatSupabase.rpc(
      "check_user_banned",
      {
        target_username: username
      }
    );

    if (error) {
      console.error(
        "BAN確認エラー:",
        error
      );

      return false;
    }

    if (banned === true) {

      /*
       * BANされた場合
       *
       * ・ログアウトしない
       * ・ログイン画面へ移動しない
       * ・alert()を使わない
       * ・OKボタンを表示しない
       * ・画面全体をBAN表示にする
       */

      document.body.innerHTML = `
        <div
          id="friendChatBanScreen"
          style="
            position:fixed;
            inset:0;
            width:100%;
            height:100%;
            background:#ffffff;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:24px;
            box-sizing:border-box;
            text-align:center;
            font-family:-apple-system,BlinkMacSystemFont,
              'Segoe UI',sans-serif;
            z-index:999999999;
          "
        >

          <div
            style="
              width:100%;
              max-width:420px;
              padding:32px 24px;
              box-sizing:border-box;
              border-radius:24px;
              background:#f8f8fb;
              box-shadow:0 8px 30px rgba(0,0,0,0.10);
            "
          >

            <div
              style="
                font-size:64px;
                line-height:1;
                margin-bottom:20px;
              "
            >
              🚫
            </div>

            <h1
              style="
                margin:0 0 16px;
                font-size:24px;
                color:#222;
              "
            >
              このアカウントはBANされています
            </h1>

            <p
              style="
                margin:0;
                color:#666;
                font-size:15px;
                line-height:1.8;
              "
            >
              現在、このアカウントでは<br>
              Friend Chatを利用できません。
            </p>

          </div>

        </div>
      `;

      return true;
    }

    return false;

  } catch (error) {

    console.error(
      "BAN確認エラー:",
      error
    );

    return false;
  }
}
