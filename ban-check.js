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
      console.error(sessionError);
      return false;
    }

    const session = sessionData.session;

    if (!session) {
      return false;
    }

    const username =
      session.user.user_metadata?.username || "";

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

      await friendChatSupabase.auth.signOut();

      alert(
        "🚫 このアカウントはBANされました。"
      );

      window.location.href =
        "index.html";

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
