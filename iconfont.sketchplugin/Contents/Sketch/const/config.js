@import "library.js";

var onRun = function(context) {

    // check updates
    tools.checkPluginUpdate(context)

    var plugin              = context.plugin
    var doc                 = context.document
    var fileManager         = NSFileManager.defaultManager()
    var scriptFullPath      = context.scriptPath
    var directoryPlugin     = [[scriptFullPath stringByDeletingLastPathComponent] stringByDeletingLastPathComponent]
    var resources           = [directoryPlugin stringByDeletingLastPathComponent] + "/Resources"

    // 1. Create Window
    var wrapper             = Library.Widgets.window("Config", "Select your configuration")

    // 2. Fetch fonts.json file
    var json                = Library.fetch.json("config.json",plugin)
    var configs             = [json objectForKey:@"icon"]
    var configsCount        = configs.count()
    var configsArray        = [NSMutableArray arrayWithCapacity:configsCount]

    // 3. create a combobox to select font which wants to remove
    for (config in configs) {
      var i = Object.keys(configs).indexOf(config) +1;
      var height = 20 + (i * 58);

      subtitle = Library.Widgets.subtitle(config,18,NSColor.blackColor(),NSMakeRect(25, height, 150, 30))
      wrapper.main.addSubview(subtitle)

      hint = Library.Widgets.subtitle(configs[config].hint,11,NSColor.blackColor(),NSMakeRect(25, height-14, 350, 18))
      wrapper.main.addSubview(hint)

      // 8.1. build a input for the config
      if (configs[config].type == "boolean") {
        var config_input = [[NSButton alloc] initWithFrame:NSMakeRect(360, height-10, 150, 30)]
        [config_input setButtonType:NSSwitchButton]
        if (configs[config].value == 1)
          [config_input setState:NSOnState]
        else
          [config_input setState:NSOffState]

        [config_input setTitle:@""];
      } else {
        var config_input = [[NSTextField alloc] initWithFrame:NSMakeRect(360, height, 150, 30)]
        config_input.setBezeled(true)
        config_input.setBezelStyle(NSRoundedBezelStyle)
        config_input.setFont(NSFont.systemFontOfSize(13))
        config_input.setStringValue(configs[config].value)
      }

      [configsArray addObject:config_input]
      wrapper.main.addSubview(config_input)
    }

    // 4. create a remove button
    var submit = [[NSButton alloc] initWithFrame:NSMakeRect(395, 10, 200, 50)]
    submit.setTitle("")
    submit.setAction("callAction:")
    submit.setWantsLayer(true)
    submit.setCOSJSTargetFunction(function(sender) {
        wrapper.window.orderOut(nil)
        NSApp.stopModalWithCode(NSOKButton)
    })

    // 4.1. create a layer for remove button
    var submit_text = CATextLayer.layer()
    submit_text.setBackgroundColor(NSColor.blackColor())
    submit_text.setForegroundColor(CGColorCreateGenericRGB(215/255, 159/255, 0/255, 1.0))
    submit_text.setFontSize(18)
    submit_text.contentsScale = NSScreen.mainScreen().backingScaleFactor()
    submit_text.string = "👍 Submit"

    submit.setLayer(submit_text)
    wrapper.main.addSubview(submit)

    var response            = NSApp.runModalForWindow(wrapper.window)

    // if is the response is ok, remove the font
    if (response == NSOKButton) {

      // write your configs to the config.json
      properties = Library.fetch.json("config.json",plugin)
      dict = [[NSMutableDictionary alloc] initWithDictionary:properties]
	 		list = [[NSMutableDictionary alloc] initWithDictionary:[dict objectForKey:@"icon"]]

      // find config values
      for (x=0; x < configsCount; x++) {
        var item = [configsArray objectAtIndex:x]
        var name = Object.keys(configs)[x]
        value = item.stringValue()
        getlistitem = list[@""+name]
        [getlistitem objectForKey:@"icon"]
        property = {
          "hint": [getlistitem objectForKey:@"hint"],
          "value": value,
          "type": [getlistitem objectForKey:@"type"]
	 	    }

        list[@""+name] = property
      }

	 		dict[@"icon"] = list

      // write new data to config file
      Library.create.file(dict,resources + "/config.json")

      doc.showMessage("Configuration has changed.")
    }
};
