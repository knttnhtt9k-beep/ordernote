function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var now = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
    sheet.appendRow([
      now,
      data.plan || "",
      data.lineName || "",
      data.fullName || "",
      data.age || "",
      data.worryType || "",
      data.worryOther || "",
      data.pastEffort || "",
      data.worryNow || "",
      data.ideal || "",
      data.reason || "",
      data.motivation || ""
    ]);
    applyPlanDropdown_(sheet);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("ok");
}

function applyPlanDropdown_(sheet) {
  var last = sheet.getMaxRows();
  var range = sheet.getRange(2, 2, last - 1, 1);
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["内面セッションのみ", "動画講座＋セッション"], true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
}
