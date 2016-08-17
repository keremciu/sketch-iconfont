@import "const/library.js";

var onRun = function(context) {

  var plugin        = context.plugin
  var doc           = context.document

  // 8. Show name of the icon/html/itself
  var wrapper     = Library.Widgets.window("What's font bundle?", "First Install")

  hint = Library.Widgets.subtitle("A Font Bundle is a folder containing one or more icon fonts that are to be used with the IconFont Sketch plugin. The IconFont plugin has commands to install both individual icon fonts, as well as font bundles. In order to use icon fonts with the IconFont plugin, fonts can be manually installed one by one, or several fonts can be installed at once if they were packaged in a font bundle.",14,NSColor.blackColor(),NSMakeRect(50, 120, 500, 200))
	wrapper.main.addSubview(hint)

  hint2 = Library.Widgets.subtitle("If you don't have any Font Bundle, download the popular font bundle on GitHub.",16,NSColor.blackColor(),NSMakeRect(50, 20, 500, 150))
	wrapper.main.addSubview(hint2)

  var button = NSButton.alloc().initWithFrame(NSMakeRect(50, 50, 500, 50))
  button.setTitle("https://github.com/keremciu/font-bundles")
  button.setBezelStyle(NSRoundedBezelStyle)
  button.setAction("callAction:")

  button.setCOSJSTargetFunction(function() {
    url = [NSURL URLWithString:@"https://github.com/keremciu/font-bundles"]
    [[NSWorkspace sharedWorkspace] openURL:url]
  })

	wrapper.main.addSubview(button)

  NSApp.runModalForWindow(wrapper.window)
};
