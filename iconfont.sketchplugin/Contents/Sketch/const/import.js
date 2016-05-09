@import "library.js";

var onRun = function(context) {

    var plugin        	= context.plugin
    var doc           	= context.document
    var fileManager	  	= NSFileManager.defaultManager()
    var scriptFullPath 	= context.scriptPath
    var directoryPlugin = [[scriptFullPath stringByDeletingLastPathComponent] stringByDeletingLastPathComponent]
    var resources       = [directoryPlugin stringByDeletingLastPathComponent] + "/Resources"

    // 1. Select SVG Font
    font = Library.fetch.selectPanel("Select SVG file of icon-font","file")
    svg = Library.fetch.file(font.path()).toString()
    fontname = svg.match(/id=".+?"/)[0].split('"')[1]

    if (fontname == "fontawesomeregular")
        fontname = "FontAwesome"
    if (fontname == "batch_iconsregular")
        fontname = "Batch"
    if (fontname == "weather_iconsregular")
        fontname = "Weather Icons"

    // 2. Create Window
    var wrapper     	= Library.Widgets.window("Import Font",fontname)

    // 3. Create a text field to write icon container
    var container     = [[NSTextField alloc] initWithFrame:NSMakeRect(200,275,200,24)]
	container.setBackgroundColor(NSColor.clearColor())
	container.setPlaceholderString(@"Write icon-container here")
	container.setTarget(self)
	container.setCOSJSTargetFunction(function(sender){
		wrapper.window.orderOut(nil)
		NSApp.stopModalWithCode(NSOKButton)
	})
	wrapper.main.addSubview(container)

    // 3.1. Create a shortcut
    var shortcut     = [[NSTextField alloc] initWithFrame:NSMakeRect(200,145,200,24)]
  shortcut.setBackgroundColor(NSColor.clearColor())
  shortcut.setPlaceholderString(@"Write command shortcut here")
  shortcut.setTarget(self)
  shortcut.setCOSJSTargetFunction(function(sender){
    wrapper.window.orderOut(nil)
    NSApp.stopModalWithCode(NSOKButton)
  })
  wrapper.main.addSubview(shortcut)

	hint = Library.Widgets.subtitle("You need to write like this: <i class='fa fa-*****'></i>",14,NSColor.grayColor(),NSMakeRect(130, 220, 500, 30))
	wrapper.main.addSubview(hint)

	hint2 = Library.Widgets.subtitle("It will be like this: <i class='fa fa-iconname'></i>",14,NSColor.grayColor(),NSMakeRect(145, 190, 500, 30))
	wrapper.main.addSubview(hint2)

  hint3 = Library.Widgets.subtitle("You need to write like this: cmd ctrl f",14,NSColor.grayColor(),NSMakeRect(170, 100, 500, 30))
  wrapper.main.addSubview(hint3)

	// 3.2. Create a button to start import
	var submit = [[NSButton alloc] initWithFrame:NSMakeRect(230, 30, 200, 50)]
  	submit.setTitle("")
  	submit.setAction("callAction:")
  	submit.setWantsLayer(true)
  	submit.setCOSJSTargetFunction(function(sender) {
    	wrapper.window.orderOut(nil)
    	NSApp.stopModalWithCode(NSOKButton)
  	})

	var submit_text = CATextLayer.layer()
	submit_text.setBackgroundColor(NSColor.blackColor())
	submit_text.setForegroundColor(CGColorCreateGenericRGB(215/255, 159/255, 0/255, 1.0))
	submit_text.setFontSize(18)
	submit_text.contentsScale = NSScreen.mainScreen().backingScaleFactor()
	submit_text.string = "+ Import this font"

	submit.setLayer(submit_text)
	wrapper.main.addSubview(submit)

    // 3.3 Parse Glyphs of Font
    glyphs = svg.match(/<glyph[^>]*?>/g)

    var list = {"icons": []}

    for (i = 0; i < glyphs.length; i++) {
        glyph = glyphs[i]
        if (glyph.match(/glyph-name=".+?"/)) {
            name = glyph.match(/glyph-name=".+?"/)[0].split('"')[1]
        } else {
            name = "icon"+i
        }

        if (glyph.match(/unicode=".+?"/)) {
          unicode = glyph.match(/unicode=".+?"/)[0].split('"')[1]
          sliced = unicode.slice(3,7)

          icon = {"name":name,"id":name,"unicode":sliced,"created":1}

          if (glyph.match(/d=".+?"/)) {
            list.icons.push(icon)
          }
        }
    }

    json = JSON.stringify(list)

    // 4. Build a directory for custom icon-fonts
	  var bundle_folder = resources + "/bundle"

  	if (![fileManager fileExistsAtPath:bundle_folder]) {
  		[fileManager createDirectoryAtPath:bundle_folder withIntermediateDirectories:true attributes:nil error:nil]
  	}

  	// 5. Build a json file for new font into bundle_folder folder
  	if (![fileManager fileExistsAtPath:bundle_folder +"/"+ fontname + ".json"]) {
  		[fileManager createFileAtPath:bundle_folder +"/"+ fontname + ".json" contents:"" attributes:nil]
  	}

    // 8. Find path of manifest.json
    var manifestPath = directoryPlugin + "/manifest.json"

    // 9. Fetch data of manifest.json
    var data = [NSData dataWithContentsOfFile:manifestPath]
    manifest = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:nil]

    // 10. Add a command to manifest.json
    count = manifest.commands.length()

    if (manifest.menu.items.length() < 3) {
        var structure = [NSData dataWithContentsOfFile:directoryPlugin + "/structure.json"]
        form = [NSJSONSerialization JSONObjectWithData:structure options:NSJSONReadingMutableContainers error:nil]

        [manifest setValue:[form objectForKey:@"menu"] forKeyPath:@"menu"];
        [manifest setValue:[form objectForKey:@"commands"] forKeyPath:@"commands"];
        count = 7;
    }


 	var response = NSApp.runModalForWindow(wrapper.window)

 	// if is the response is ok, import font
    if (response == NSOKButton) {

      // Create shortcut for new font
      writed_shortcut = shortcut.stringValue()

      if (!(writed_shortcut && writed_shortcut.length() > 0)) {
        writed_shortcut = nil
      }

      // add command to manifest
      menu = [manifest objectForKey:@"menu"]
      items = [menu objectForKey:@"items"]
      first = [items objectAtIndex:0]
      firstlist = [first objectForKey:@"items"]

      // put nextid
      nextid = count +1

      // search nextid is true?
      for (i = 0; i < firstlist.length(); i++) {
        item = firstlist[i]
        if (item == nextid + "_add_grid") {
          nextid = count+30
        }
      }

      command = {
        "script": "add_grid.cocoascript",
            "handler": "handleFont",
            "name": fontname,
            "identifier": nextid + "_add_grid",
            "shortcut": writed_shortcut
      }

      [[manifest objectForKey:@"commands"] addObject:command]
      [[first objectForKey:@"items"] addObject:@""+nextid + "_add_grid"]

        // 10/2. Write font data to json file
        var t = [NSString stringWithFormat:@"%@", json]
        f = [NSString stringWithFormat:@"%@", bundle_folder +"/"+ fontname + ".json"]
        [t writeToFile:f atomically:true encoding:NSUTF8StringEncoding error:nil]

        // 11. Write new data to manifest.file
        Library.create.file(manifest,manifestPath)

        // 12. Fetch font.json file
        properties = Library.fetch.json("fonts.json",plugin)

        // 13. Create properties for new font
        writed_cont = container.stringValue()

        // if user didnt write a container create example
        if (!(writed_cont && writed_cont.length() > 0)) {
            writed_cont = "<i class='"+fontname+"-*****'></i>"
        }

        property = {
            "path": fontname + ".json",
            "container": writed_cont
	 	   }

	 	// 14. Add new font properties to font.json
	 	if ([properties isKindOfClass:[NSDictionary class]]) {
	 		dict = [[NSMutableDictionary alloc] initWithDictionary:properties]
	 		list = [[NSMutableDictionary alloc] initWithDictionary:[dict objectForKey:@"fonts"]]
	 		list[@""+fontname] = property
	 		dict[@"fonts"] = list
	 	}

        // 15. Write new data to fonts.json
 		Library.create.file(dict,resources + "/fonts.json")
  }
};
