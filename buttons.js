function onOpen() {
  var ui = SpreadsheetApp.getUi()
  ui.createMenu("🚀 Updates") //note no semicolon to continue method calls
    .addItem("💸 Prepare for Upload...", "preUpload")
    .addItem("🤝 Update Courses...", "postUpload")
    .addToUi()
}
