(function (w) {
  var KEY = "on_archive_until";
  var DAYS = w.ARCHIVE_DAYS || 3;

  w.archiveEnsureWindow = function () {
    try {
      var until = localStorage.getItem(KEY);
      if (!until) {
        until = String(Date.now() + DAYS * 24 * 60 * 60 * 1000);
        localStorage.setItem(KEY, until);
      }
      return parseInt(until, 10);
    } catch (e) {
      return Date.now() + DAYS * 24 * 60 * 60 * 1000;
    }
  };

  w.archiveIsOpen = function () {
    return Date.now() < w.archiveEnsureWindow();
  };

  w.archiveRemainText = function () {
    var ms = w.archiveEnsureWindow() - Date.now();
    if (ms <= 0) return "公開は終了しました";
    var h = Math.floor(ms / 3600000);
    var d = Math.floor(h / 24);
    var hh = h % 24;
    var m = Math.floor((ms % 3600000) / 60000);
    if (d > 0) return "残り " + d + "日" + hh + "時間";
    return "残り " + hh + "時間" + m + "分";
  };

  w.archiveWatchHref = function (typeId) {
    var id = typeId || "";
    return "watch.html?id=" + encodeURIComponent(id);
  };
})(window);
