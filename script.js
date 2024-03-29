//MAIN: BEFORE IMPORTING NEW P&L
//makes a copy of the "Ongoing Course ID List" sheet, updates the previous ID list within the original ID list sheet, creates IMPORT HERE
//uses helpers copyOngoingCoursesSheet and updatePreviousIds
function preUpload() {
  var ui = SpreadsheetApp.getUi()
  var response = ui.alert(
    "This will move current data from the spreadsheet. Continue?",
    ui.ButtonSet.YES_NO
  )
  if (response == ui.Button.YES) {
    copyOngoingCoursesSheet()
    updatePreviousIds()
    createImportHere()
  } else {
    ui.alert(
      '"It is so hard to leave until you leave. And then it is the easiest thing in the world." - John Green'
    )
  }
}

//MAIN: AFTER IMPORTING NEW P&L
//updates recently closed courses in "Closed Courses P&L", updates ongoing course IDs to match in "Ongoing Courses P&L", and
//deletes the copy of the aforementioned ongoing sheet
//uses helpers updateClosedCourses, updateOngoingIds, and deleteCopyOngoingCoursesSheet
function postUpload() {
  var ui = SpreadsheetApp.getUi()
  var response = ui.alert(
    "This will move current data from the spreadsheet. Continue?",
    ui.ButtonSet.YES_NO
  )
  if (response == ui.Button.YES) {
    updateClosedCourses()
    updateOngoingIds()
    deleteCopyOngoingCoursesSheet()
    deleteDuplicateCourses()
  } else {
    ui.alert('"Hasta la vista, baby!" - The Terminator')
  }
}

//USED IN: preUpload
//replaces previous course ID list with updated course ID list in "Ongoing Course ID List" to prep for new imported P&L
//uses helper ReplaceIdList
function updatePreviousIds() {
  replaceIdList("Ongoing Course ID List", "Ongoing Course ID List", 3, 2, 3, 1)
}

//USED IN: postUpload
//updates ongoing course ID list to accurat1ely depict ongoing course profit and loss data
//uses helper ReplaceIdList
function updateOngoingIds() {
  replaceIdList("Ongoing Course ID List", "Ongoing Courses P&L", 3, 2, 2, 1) //TODO: make sure this is the right one and in the right order
}

//HELPER: Used in UpdatePreviousIds and UpdateOngoingIds
//Copies and pastes one set of data to another spot
//uses helper getSheet
function replaceIdList(
  startSheetName,
  endSheetName,
  startRow,
  startColumn,
  endRow,
  endColumn
) {
  var startSheet = getSheet(startSheetName)
  var endSheet = getSheet(endSheetName)

  //delete data in first column
  var finalColumn = endSheet.getRange(endRow, endColumn, 1000) //lengthy and not too useful to get exact number of rows
  finalColumn.clear()

  //copy data from second column (headered as Updated)
  var idsColumn = startSheet.getRange(startRow, startColumn, 1000)
  var ids = idsColumn.getValues()

  //put data in empty row (headered as Previous)
  finalColumn.setValues(ids)
}

//USED IN: preUpload
//makes a copy of "Ongoing Courses P&L" sheet
//uses helper getSheet
function copyOngoingCoursesSheet() {
  //copy data
  var ss = SpreadsheetApp.getActive()
  var sheet = getSheet("Ongoing Courses P&L")
  var range = sheet.getDataRange()
  var data = range.getValues()
  ss.insertSheet("ongoing copy")
    .getRange(1, 1, data.length, data[0].length)
    .setValues(data)
}

//USED IN: preUpload
//replaces A1 with "IMPORT HERE!"
function createImportHere() {
  var sheet = getSheet("Profit and Loss")
  sheet.getRange(1, 1).setValue("IMPORT HERE!")
}

//USED IN: postUpload
//updates "Closed Courses P&L" sheet to add recently closed courses
//uses helpers getSheet, getColumnHeight, and binarySearch
function updateClosedCourses() {
  //get recently closed course ID array
  var courseIdSheet = getSheet("Ongoing Course ID List")
  var allIds = courseIdSheet.getDataRange()
  var numRecentlyClosedIds = getColumnHeight(courseIdSheet, 3, 3)
  var recentlyClosedIds = courseIdSheet.getRange(3, 3, numRecentlyClosedIds) //TODO: make sure there are any closed courses to update
  var recentlyClosedIdData = recentlyClosedIds.getValues()

  //get data to be added from copied table
  var ongoingCopySheet = getSheet("ongoing copy")
  var ongoingCopyRange = ongoingCopySheet.getDataRange()
  var ongoingCopyData = ongoingCopyRange.getValues()

  //get destination sheet: Closed Courses P&L
  var closedCoursesSheet = getSheet("Closed Courses P&L")
  var numClosedCoursesIds = getColumnHeight(closedCoursesSheet, 2, 1)
  var closedCoursesIds = closedCoursesSheet.getRange(2, 1, numClosedCoursesIds) //FIXME: inefficient double loops out here
  var closedCoursesIdData = closedCoursesIds.getValues()

  //check if ongoing copy ids exists in updated ids (use appendRow())
  //if not, then add that row to closed courses
  for (var i = 1; i < ongoingCopyData.length; i++) {
    //    Logger.log(ongoingCopyData[i][0] + " " + binarySearch(ongoingCopyData[i][0], recentlyClosedIdData));

    //positive index returned if true
    if (binarySearch(ongoingCopyData[i][0], recentlyClosedIdData) > -1) {
      //get 2D array (1 row) of course p&l data
      var addCourse = ongoingCopySheet.getRange(i + 1, 1, 1, 4).getValues()

      //if course ID already exists, replace row of data. Else, append row to end of sheet
      var addCourseRowIndex = binarySearch(
        ongoingCopyData[i][0],
        closedCoursesIdData
      )
      if (addCourseRowIndex > -1) {
        closedCoursesSheet
          .getRange(addCourseRowIndex + 2, 1, 1, 4)
          .setValues(addCourse)
      } else {
        //need to convert from 2D to 1D array before appending to end
        var addCourseArray = new Array(4)
        for (var j = 0; j < addCourseArray.length; j++) {
          addCourseArray[j] = addCourse[0][j]
        }
        closedCoursesSheet.appendRow(addCourseArray)
      }
    }
  }
}

//USED IN: postUpload
//deletes the copy of "Ongoing Courses P&L" sheet
function deleteCopyOngoingCoursesSheet() {
  var ss = SpreadsheetApp.getActive()
  var ongoingCopySheet = ss.getSheetByName("ongoing copy")
  ss.deleteSheet(ongoingCopySheet)
}

//USED IN: postUpload
//finds common course IDs between the "Ongoing Courses P&L" and "Closed Courses P&L" sheets
//and deletes it from the closed courses sheet
//uses helpers getSheet, getColumnHeight, binarySearch
function deleteDuplicateCourses() {
  var ongoingCoursesSheet = getSheet("Ongoing Courses P&L")
  var numOngoingCoursesIds = getColumnHeight(ongoingCoursesSheet, 2, 1)
  var ongoingCoursesIds = ongoingCoursesSheet.getRange(
    2,
    1,
    numOngoingCoursesIds
  )
  var ongoingCoursesIdData = ongoingCoursesIds.getValues()

  var closedCoursesSheet = getSheet("Closed Courses P&L")
  var numClosedCoursesIds = getColumnHeight(closedCoursesSheet, 2, 1)
  var closedCoursesIds = closedCoursesSheet.getRange(2, 1, numClosedCoursesIds)
  var closedCoursesIdData = closedCoursesIds.getValues()

  for (var i = 0; i < ongoingCoursesIdData.length; i++) {
    var rowIndex = binarySearch(ongoingCoursesIdData[i][0], closedCoursesIdData)
    if (rowIndex > -1) {
      closedCoursesSheet.deleteRow(rowIndex + 2) //+1 for title, +1 for array index (0... 1... 2...) to data (1... 2... 3...)
    }
  }
}

//USED IN: updateClosedCourses
//source: https://www.geeksforgeeks.org/binary-search/
//binary search takes in a target to search for given an array
//returns index if target is found, -1 if not found
function binarySearch(target, array) {
  if (target != null) {
    var start = 0
    var end = array.length - 1

    while (start <= end) {
      var mid = Math.floor((start + end) / 2)
      if (array[mid][0] === target) {
        return mid
      } else if (array[mid][0] < target) {
        start = mid + 1
      } else {
        end = mid - 1
      }
    }
  }

  return -1
}

//USED IN: updateClosedCourses
//finds the column height starting at a given row in a specified sheet
function getColumnHeight(sheet, row, col) {
  var values = sheet.getRange(row, col, 200).getValues() //no workaround
  //  for(var i = 0; i < 5; i++){
  //    Logger.log(values[i])
  //  }
  row = 0
  while (values[row] > 0 && values[row] != null) {
    //TODO: see if >0 is even needed
    row = row + 1
    //    Logger.log(row);
  }
  return row
}

//USED IN: many things
//gets a specified sheet from the current spreadsheet
function getSheet(sheetName) {
  var ss = SpreadsheetApp.getActive()
  var sheet = ss.getSheetByName(sheetName)
  return sheet
}

//potential issues that may come up...
//    1: sheet names are accidentally change
//        Likely sheets are named "Profit and Loss", "Separated Course ID", "ongoing copy" (temporary tab)*,
//        "Ongoing Course ID List"*,"Ongoing Courses P&L"*, "Closed Courses P&L"*, "Chartio Feeder". Those
//        with a * are likelybe the main issues.
//
//    2: Not updating course ID/deleting duplicates in "Closed Courses P&L"
//        Check that the "Closed Courses P&L" is sorted b/c binary search requires the ordered array}
