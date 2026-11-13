
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
// メンテナンスモード
// =========================

let friendChatMaintenanceChecked = false;
let friendChatMaintenanceBlocked = false;
let friendChatMaintenanceCheckPromise = null;

function showFriendChatMaintenanceScreen(message) {
  if (document.getElementById("friend-chat-maintenance-overlay")) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "friend-chat-maintenance-overlay";
  overlay.setAttribute("role", "alertdialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-live", "assertive");
  overlay.setAttribute("aria-label", "メンテナンス中");

  const style = document.createElement("style");
  style.textContent = `
    #friend-chat-maintenance-overlay {
      position: fixed !important;
      inset: 0 !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
      width: 100vw !important;
      height: 100vh !important;
      height: 100dvh !important;
      padding: 24px !important;
      overflow: auto !important;
      background: #101827 !important;
      color: #ffffff !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      text-align: center !important;
      pointer-events: auto !important;
      user-select: text !important;
    }

    #friend-chat-maintenance-overlay .maintenance-content {
      width: min(100%, 480px) !important;
      padding: 32px 24px !important;
      border: 1px solid rgba(255,255,255,.16) !important;
      border-radius: 18px !important;
      background: #1c293b !important;
      box-sizing: border-box !important;
    }

    #friend-chat-maintenance-overlay .maintenance-icon {
      margin-bottom: 16px !important;
      font-size: 48px !important;
      line-height: 1 !important;
    }

    #friend-chat-maintenance-overlay h1 {
      margin: 0 0 14px !important;
      color: #ffffff !important;
      font-size: 24px !important;
      font-weight: 700 !important;
    }

    #friend-chat-maintenance-overlay p {
      margin: 0 !important;
      color: #d5deea !important;
      font-size: 15px !important;
      line-height: 1.8 !important;
      white-space: pre-wrap !important;
      overflow-wrap: anywhere !important;
    }
  `;

  const content = document.createElement("div");
  content.className = "maintenance-content";

  const icon = document.createElement("div");
  icon.className = "maintenance-icon";
  icon.textContent = "🔧";

  const heading = document.createElement("h1");
  heading.textContent = "メンテナンス中です";

  const description = document.createElement("p");
  description.textContent =
    message || "現在メンテナンス中です。しばらくお待ちください。";

  content.append(icon, heading, description);
  overlay.appendChild(content);

  const mount = document.body || document.documentElement;
  mount.appendChild(style);
  mount.appendChild(overlay);

  if (document.body) {
    Array.from(document.body.children).forEach((element) => {
      if (element !== overlay && element !== style) {
        element.inert = true;
        element.setAttribute("aria-hidden", "true");
      }
    });

    document.body.style.setProperty("overflow", "hidden", "important");
    document.body.style.setProperty("pointer-events", "none", "important");
  }

  document.documentElement.style.setProperty(
    "overflow",
    "hidden",
    "important"
  );

  overlay.focus({ preventScroll: true });
}


async function checkFriendChatMaintenance() {
  if (friendChatMaintenanceChecked) {
    return friendChatMaintenanceBlocked;
  }

  if (friendChatMaintenanceCheckPromise) {
    return await friendChatMaintenanceCheckPromise;
  }

  friendChatMaintenanceCheckPromise = (async () => {
    try {
      const { data, error } =
        await friendChatSupabase.rpc("get_site_maintenance");

      if (error) {
        console.error("メンテナンス確認エラー:", error);
        friendChatMaintenanceChecked = true;
        return false;
      }

      if (data?.maintenance_enabled === true) {
        friendChatMaintenanceBlocked = true;

        showFriendChatMaintenanceScreen(
          data.maintenance_message
        );
      }

      friendChatMaintenanceChecked = true;
      return friendChatMaintenanceBlocked;

    } catch (error) {
      console.error("メンテナンス確認エラー:", error);
      friendChatMaintenanceChecked = true;
      return false;
    }
  })();

  return await friendChatMaintenanceCheckPromise;
}


// =========================
// BANチェック
// =========================

let friendChatBanChecked = false;
let friendChatBanResult = false;
let friendChatBanCheckPromise = null;

async function checkFriendChatBan() {

  if (friendChatBanChecked) {
    return friendChatBanResult;
  }

  if (friendChatBanCheckPromise) {
    return await friendChatBanCheckPromise;
  }

  friendChatBanCheckPromise = (async () => {

    try {

      // 先にメンテナンス状態を確認
      const maintenanceBlocked =
        await checkFriendChatMaintenance();

      if (maintenanceBlocked) {
        friendChatBanResult = false;
        friendChatBanChecked = true;
        return false;
      }

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
