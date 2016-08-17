@import "const/library.js";

var handleFonts = function(context) {
  var handler  = context.command.name()
  var font     = Library.fetch.font(handler,context.plugin)

  // onRun function with context, json file path, title and font name.
  onRun(context,"/bundle/" + font.path,handler);
  var json        = Library.fetch.json("fonts.json",plugin)
}

var onRun = function(context) {

  var plugin        = context.plugin
  var doc           = context.document
  var selection     = context.selection
  var filtered      = false
  var json          = Library.fetch.json("fonts.json",plugin)
  var fonts         = [json objectForKey:@"fonts"]

  // 1. create a wrapper windows
  var wrapper       = Library.Widgets.window("Add an icon from all", "Select an icon")

  // 2. create list properties
  var allIcons = [NSMutableArray array];
  var fontcount = 0
  var previousfontcount = 0

  for (var font in fonts) {
    var i = Object.keys(fonts).indexOf(font);
    var fontsCount = fonts.count()
    var path = "/bundle/" + fonts[font].path;

    json            = Library.fetch.json(path,plugin)
    icons           = [json objectForKey:@"icons"]
    ic              = icons.count()
    // font0 = fontname
    eval("font" + i + " = font");

    // font0count = fontcount + previousfontcount
    if (i == 0) {
      eval("font" + i + "count = 0");
      previousfontcount = ic
    } else if ((i+1) == fontsCount) {
      eval("font" + i + "count = previousfontcount");
      previousfontcount = previousfontcount + ic
      eval("font" + (i+1) + "count = previousfontcount");
    } else {
      eval("font" + i + "count = previousfontcount");
      previousfontcount = previousfontcount + ic
    }

    allIcons = [allIcons arrayByAddingObjectsFromArray:icons]
    fontcount++
  }

  unfilter          = allIcons
  count             = allIcons.count()
  width             = 545
  col_size          = Math.ceil(width / 50)
  row_size          = Math.ceil(count / col_size)
  height            = Math.ceil(row_size * 50)
  list              = [[NSScrollView alloc] initWithFrame:NSMakeRect(25,25,554,320)]

  // 3. create a button prototype for matrix
  prototype         = NSButtonCell.alloc().init()
  prototype.setButtonType(NSToggleButton)
  prototype.setTitle("-")
  prototype.setBezeled(true)
  prototype.setBezelStyle(NSThickSquareBezelStyle)

  // 4. create a matrix
  matrix            = [[NSMatrix alloc] initWithFrame:NSMakeRect(0, 45, width, height)
    mode:NSRadioModeMatrix prototype:prototype numberOfRows:row_size numberOfColumns:col_size];
  matrix.setCellSize(NSMakeSize(47, 47))
  matrix.setIntercellSpacing(NSMakeSize(2, 2))
  cellArray         = matrix.cells()

  // 5. loop all icons
  for (var c=0; c < count; c++) {
    var fCountName;
    for (var fc=0; fc < fontcount; fc++) {
      fc_count = eval("font" + fc + "count")
      if (c == fc_count) {
        fCountName = eval("font" + fc)
      }
    }
    // escape icon
    icon = Library.parse.escape('\\u' + allIcons[c].unicode)
    // get cell
    cell = cellArray.objectAtIndex(c)
    // set tooltip
    [matrix setToolTip:@""+allIcons[c].name + " - " + fCountName forCell:cell];
    // set title
    cell.setTitle(icon)
    // set font
    cell.setFont([NSFont fontWithName:@""+fCountName size:20.0])
    // set loop index into tag variable
    cell.setTag(c)
    // // cell needs to able to click itself
    cell.setTarget(self)
    cell.setAction("callAction:")
    // // click function
    cell.setCOSJSTargetFunction(function(sender) {
      wrapper.window.orderOut(nil)
      NSApp.stopModalWithCode(NSOKButton)
    })
  }

  // 6. create a searchbox to filter icons
  var searchbox   = [[NSTextField alloc] initWithFrame:NSMakeRect(200,357,150,24)]
  searchbox.setBackgroundColor(NSColor.clearColor())
  searchbox.setPlaceholderString(@"Search an icon...")
  searchbox.setTarget(self)
  searchbox.setAction("callAction:")
  searchbox.setCOSJSTargetFunction(function(sender) {
    if (filtered == true)
      allIcons = unfilter
    // get filter
    var q               = searchbox.stringValue()
    // search icons with filter
    allIcons            = Library.parse.research(q,allIcons)
    // find icons with the "key"
    newCount            = allIcons.unicodes.length
    newRows             = Math.ceil(newCount / col_size)
    newHeight           = Math.ceil(newRows * 50)
    if (newCount > col_size) {
      newCol = col_size
    } else {
      newCol = newCount
    }

    // 7. new frame and data
    newFrame = NSMakeRect(0, 45, width, newHeight);
    [matrix setFrame:newFrame];
    [matrix renewRows:newRows columns:newCol];

    for (var i=0; i < newCount; i++)
    {
      var fCountName;
      for (var fc=0; fc < fontcount; fc++) {
        filteredIconNumber = allIcons.number[i]
        fc_count = eval("font" + fc + "count")
        next = eval("font" + (fc+1) + "count")

        if (filteredIconNumber >= fc_count && filteredIconNumber <= next) {
          fCountName = eval("font" + fc)
        }
      }

      newCell = cellArray.objectAtIndex(i)
      [matrix setToolTip:@""+ allIcons.names[i] + " - " + fCountName forCell:newCell];
      newCell.setTitle(allIcons.unicodes[i])
      // set font
      newCell.setFont([NSFont fontWithName:@""+fCountName size:20.0])
      newCell.setTag(i)
    }

    filtered = true
  }];

  wrapper.main.addSubview(searchbox)

  list.setDocumentView(matrix)
  list.setHasVerticalScroller(true)
  wrapper.main.addSubview(list)

  // 5. build window
  var response = NSApp.runModalForWindow(wrapper.window)

  selected                = matrix.selectedCell().tag()
  icon                    = matrix.selectedCell().title()
  fontname                = matrix.selectedCell().font().fontName()

  if (filtered) {
    name                  = allIcons.names[selected] + ' - ' + fontname
  } else {
    name                  = allIcons[selected].name + ' - ' + fontname
  }

  // if is the response is ok, add icon
  if (response == NSOKButton) {
    Library.create.icon(plugin,doc,selection,fontname,name,icon)
  }

};
