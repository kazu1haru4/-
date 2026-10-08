const FRIEND_CHAT_SUPABASE_URL =
  "https://yxonmqdyekwenyzekjwj.supabase.co";

const FRIEND_CHAT_SUPABASE_KEY =
  "sb_publishable_IuQ6r_4vbGC9PP7cWJ9YRQ_Ai7tAfTJ";

const friendChatSupabase =
  window.supabase.createClient(
    FRIEND_CHAT_SUPABASE_URL,
    FRIEND_CHAT_SUPABASE_KEY
  );


// =========================
// BANチェック
// =========================
// 1ページにつき最初の1回だけ確認します。
// 同じページ内で何度呼び出されても、
// 2回目以降はSupabaseへ問い合わせません。

let friendChatBanChecked = false;
let friendChatBanResult = false;
let friendChatBanCheckPromise = null;

async function checkFriendChatBan() {

  // すでに確認済みなら同じ結果を返す
  if (friendChatBanChecked) {
    return friendChatBanResult;
  }

  // 同時に複数回呼ばれた場合も
  // BANチェックを1回だけ実行する
  if (friendChatBanCheckPromise) {
    return await friendChatBanCheckPromise;
  }

  friendChatBanCheckPromise = (async () => {

    try {

      const {
        data: sessionData,
        error: sessionError
      } = await friendChatSupabase.auth.getSession();

      if (sessionError) {
        console.error(sessionError);
        friendChatBanResult = false;
        friendChatBanChecked = true;
        return false;
      }

      const session = sessionData.session;

      if (!session) {
        friendChatBanResult = false;
        friendChatBanChecked = true;
        return false;
      }

      const username =
        session.user.user_metadata?.username || "";

      if (!username) {
        friendChatBanResult = false;
        friendChatBanChecked = true;
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

        friendChatBanResult = false;
        friendChatBanChecked = true;
        return false;
      }

      if (banned === true) {

        alert(
          "🚫 このアカウントはBANされています。"
        );

        // BANされてもログアウトしません。
        // 現在のログインセッションを維持します。

        friendChatBanResult = true;
        friendChatBanChecked = true;
        return true;
      }

      friendChatBanResult = false;
      friendChatBanChecked = true;
      return false;

    } catch (error) {

      console.error(
        "BAN確認エラー:",
        error
      );

      friendChatBanResult = false;
      friendChatBanChecked = true;
      return false;
    }

  })();

  return await friendChatBanCheckPromise;
}
