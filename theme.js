/* Friend Chat 共通テーマ読み込み
 * 設定ページの localStorage キー friendChatTheme を読み込みます。
 * 既存ページの見た目を勝手に上書きせず、共通CSS変数だけを設定します。
 */
(function () {
  "use strict";

  const themes = {
    pink:   { main: "#ff82b2", light: "#fff0f7", text: "#e34f85" },
    purple: { main: "#8f7cff", light: "#f0edff", text: "#5e50c9" },
    blue:   { main: "#5c9eff", light: "#eef5ff", text: "#397bd8" },
    green:  { main: "#48c78e", light: "#eef9f3", text: "#279b68" },
    orange: { main: "#ff9b52", light: "#fff4e8", text: "#df7628" },
    cyan:   { main: "#36c9d8", light: "#eafcff", text: "#1599a8" }
  };

  function applyFriendChatTheme() {
    let selected = "purple";

    try {
      const stored = localStorage.getItem("friendChatTheme");
      if (stored && Object.prototype.hasOwnProperty.call(themes, stored)) {
        selected = stored;
      }
    } catch (error) {
      console.warn("Friend Chatテーマを読み込めませんでした:", error);
    }

    const theme = themes[selected];
    const root = document.documentElement;

    root.style.setProperty("--theme", theme.main);
    root.style.setProperty("--theme-light", theme.light);
    root.style.setProperty("--theme-text", theme.text);
    root.dataset.friendChatTheme = selected;

    window.FriendChatTheme = {
      name: selected,
      colors: { ...theme },
      apply: applyFriendChatTheme
    };
  }

  applyFriendChatTheme();

  // 同じタブ内で設定画面などからテーマが変更された場合にも追従
  window.addEventListener("storage", function (event) {
    if (event.key === "friendChatTheme") applyFriendChatTheme();
  });

  window.addEventListener("friendchat:themechange", applyFriendChatTheme);
})();
