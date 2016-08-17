//
//  library.js
//
//  Created by Kerem Sevencan
//  Copyright (c) 2015. All rights reserved.
//

var Library = {
  "create": {
    "file": function(json,path) {
      jsonData = [NSJSONSerialization dataWithJSONObject:json options:NSJSONWritingPrettyPrinted error:nil]
      parsed = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding]
      sanitized = [parsed stringByReplacingOccurrencesOfString:@"\\/" withString:"/"];
      var t = [NSString stringWithFormat:@"%@", sanitized]
      f = [NSString stringWithFormat:@"%@", path]
      [t writeToFile:f atomically:true encoding:NSUTF8StringEncoding error:nil]
    },
    //
    // Create icon layer
    // Valid types for doc is Object
    // Valid types for selection is Object
    // Valid types for fontname is String
    // Valid types for name is String
    // Valid types for icon is String
    //
    "icon": function(plugin, doc, selection, fontname, name, icon) {
      var sketchVersion = tools.getSketchVersionNumber()
      var page          = doc.currentPage()
      var artboard      = page.currentArtboard() || page

      // 2. Fetch fonts.json file
      var json          = Library.fetch.json("config.json", plugin)
      var configs       = [json objectForKey:@"icon"]
      var zoom         = configs["Zoom"].value
      var fontsize      = configs["Size"].value
      var color         = configs["Color"].value
      var centered      = configs["Centered"].value
      var replace       = configs["Replace"].value
      color             = MSColor.colorWithSVGString(color);

      /*
      * config replace check
      * if replace is checked, change selection texts
      */
      if (replace == 1 && selection && selection.count() >= 1) {

        for (var j=0; j < selection.count(); j++) {
				  selected = selection[j]
          // set icon
          selected.setStringValue(icon)
          // set icon name
          selected.setName(name)

          // 8. set selected font
          if (sketchVersion > 370) {
            selected.setFont([NSFont fontWithName:@""+fontname size:fontsize])
          } else {
            [selected setFontPostscriptName:@""+fontname];
          }
        }

      } else {
        // create a text layer contains the icon
        selection = Library.create.textLayer(doc, artboard, {"text": icon, "name": name, "zoom": zoom, "fontSize": fontsize, "centered": centered, "sketchVersion": sketchVersion});

        // 8. set selected font
        if (sketchVersion > 370) {
          selection.setFont([NSFont fontWithName:@""+fontname size:fontsize])
        } else {
          [selection setFontPostscriptName:@""+fontname];
        }

        selection.setTextColor(color)
      }
    },
    //
    // Create a layer
    // Valid types for container is Object
    // Valid types for type is String
    // Valid types for parameters is Array
    //
    "layer": function (container, type, parameters) {
      if (parameters.sketchVersion > 370) {
        var layer
      	switch(type) {
      		case "rectangle":
      			var rectangleShape = MSRectangleShape.alloc().init()
            if (typeof(parameters.rect) !== 'undefined')
              rectangleShape.frame = MSRect.rectWithRect(parameters.rect)
            else
      			  rectangleShape.frame = MSRect.rectWithRect(NSMakeRect(0, 0, 50, 50))
      			layer = MSShapeGroup.shapeWithPath(rectangleShape)
      			container.addLayers([layer])
      			break
      		case "group":
      			layer = [[MSLayerGroup alloc] init]
      			[container addLayers:[layer]]
      			break
          case "text":
            layer = [[MSTextLayer alloc] init]
            [container addLayers:[layer]]
      		default:
      			break
      	}
      } else {
        var layer = container.addLayerOfType(type)
      }
      if (typeof(parameters.name) !== 'undefined') layer.name = parameters.name;
      if (typeof(parameters.color) !== 'undefined') {
        Library.util.setFillColor(layer, parameters.color);
      }
      return layer;
    },
    //
    // Create a text layer
    // Valid types for doc is Object
    // Valid types for container is Object
    // Valid types for parameters is Array
    //
    "textLayer": function (doc, container, parameters) {
      var textLayer = Library.create.layer(container, "text", parameters);

      // center function construct values
      zoomValue = doc.zoomValue();
      scrollOrigin = doc.scrollOrigin();

      if (parameters.centered == 1) {
        // view frame
        var view = doc.currentView();
        viewFrame = [view frame];
        viewHeight = viewFrame.size.height;
        viewWidth = viewFrame.size.width;

        // textlayer vertically center
        var midY = (viewHeight / 2 - scrollOrigin.y) / zoomValue;
        var targetY = Math.ceil(midY - textLayer.frame().height() / 2);
        textLayer.absoluteRect().setY(targetY);

        // textlayer horizontally center
        var midX = (viewWidth / 2 - scrollOrigin.x) / zoomValue;
        var targetX = Math.ceil(midX - textLayer.frame().width() / 2);
        textLayer.absoluteRect().setX(targetX);
      }

      // deselect all selected layers
      doc.currentPage().deselectAllLayers()

      // select the text layer
      [textLayer select:true byExpandingSelection:true];
      // set the default font-size
      textLayer.fontSize = 24;

      if (parameters.zoom == 1) {
        // zoom to the icon
        var view = doc.currentView();
        view.zoomToSelection();
      }

      if (typeof(parameters.text) !== 'undefined') {
        textLayer.stringValue = parameters.text;
        if (typeof(parameters.name) == 'undefined') {
          textLayer.name = parameters.text;
        }
      }
      if (typeof(parameters.fontSize) !== 'undefined') textLayer.fontSize = parameters.fontSize;
      textLayer.adjustFrameToFit();
      return textLayer;
    },
  },
  "fetch": {
    file: function(filePath) {
      var fileManager = [NSFileManager defaultManager];
      if([fileManager fileExistsAtPath:filePath]) {
        return [NSString stringWithContentsOfFile:filePath encoding:NSUTF8StringEncoding error:nil];
      }
      return nil;
    },
    selectPanel: function(title,type) {
      // display the open panel
      var openPanel = [NSOpenPanel openPanel]
      [openPanel setTitle:title]
      [openPanel setCanCreateDirectories:true]
      if (type == "folder") {
        [openPanel setCanChooseFiles:false]
        [openPanel setCanChooseDirectories:true]
      } else {
        [openPanel setCanChooseFiles:true]
        [openPanel setCanChooseDirectories:false]
      }
      [openPanel setAllowsMultipleSelection:false]
      [openPanel setShowsHiddenFiles:false]
      [openPanel setExtensionHidden:false]
      [[NSApplication sharedApplication] activateIgnoringOtherApps:true]
      var openPanelButtonPressed = [openPanel runModal]
      if (openPanelButtonPressed == NSFileHandlingPanelOKButton) {
        if (![openPanel URL]) {
          log("File not selected.")
        } else {
          allowedUrl = [openPanel URL]
        }
      }
      return allowedUrl
    },
    //
    // Get json with source
    // Valid types for source is String
    //
    "json": function(source,plugin) {
      var source      = plugin.urlForResourceNamed(source)
      var json        = [NSData dataWithContentsOfFile:source]

      return [NSJSONSerialization JSONObjectWithData:json options:0 error:nil]
    },
    //
    // Get font properties with fontname
    // Valid types for fontname is String
    // Valid types for plugin is Object
    //
    "font": function(fontname,plugin) {
      var json        = Library.fetch.json("fonts.json",plugin)
      var fonts       = [json objectForKey:@"fonts"]
      var escapedname = fontname.replace(/^\s*|\s*$/g,'')

      return fonts[escapedname]
    },
    //
    // Find mathed icon with char or name
    // Valid types for type is String
    // Valid types for text is String
    // Valid types for icons is Array
    //
    "icon": function(type,text,icons) {
      var result    = NSObject.alloc().init()
      var list      = [icons objectForKey:@"icons"]
      var matcher   = ""

      for (var i=0; i < list.count(); i++) {
        if (type=="unicode") {
          matcher = list[i].unicode
        } else {
          matcher = list[i]["id"]
        }

        if (matcher == @""+text) {
          result.alias = list[i]["id"]
          result.unicode = list[i]["unicode"]
        }
      }

      // no result error
      if (result.alias == "" || result.alias == undefined) {
        return false
      }

      return result
    },
  },
  "util": {
    // Sets the fill color for `layer` to `color` (MSColor)
    "setFillColor": function(layer, color) {
      var sketchVersion = tools.getSketchVersionNumber()

      if (sketchVersion > 370) {
        var fill = layer.style().addStylePartOfType(0);
      } else {
        var fill = layer.style().fills().addNewStylePart();
        fill.setFillType(0);
      }
      fill.color = color;

    }
  },
  "parse": {
    "outline": function(layer) {
        if(!layer.isKindOfClass(MSTextLayer)) return

        var sketchVersion = tools.getSketchVersionNumber()
        var parent = layer.parentGroup()
        var size = layer.fontSize()
        var x = layer.frame().x()
        var y = layer.frame().y()
        var name = layer.name()
        var groupbounds = NSMakeRect(x,y,size,size);
        var shape = MSShapeGroup.shapeWithBezierPath(layer.bezierPathWithTransforms())

        shape.style = layer.style()
        var style = shape.style()

        if(!style.fill()) {
            if (sketchVersion > 370) {
              var fill = style.addStylePartOfType(0)
            } else {
              var fill = style.fills().addNewStylePart()
              fill.setFillType(0)
            }
            fill.color = MSColor.colorWithNSColor(layer.style().textStyle().attributes().NSColor)
        }

        // shape horizontally center
        var shapewidth = shape.frame().width()
        var shapex = Math.ceil((size - shapewidth) / 2)

        // shape vertically center
        var shapeheight = shape.frame().height()
        var shapey = Math.ceil((size - shapeheight) / 2)

        shape.frame().x = shapex
        shape.frame().y = shapey
        shape.name = name
        parent.removeLayer(layer)

        var baseShape = MSRectangleShape.alloc().init();
        baseShape.frame = MSRect.rectWithRect(NSMakeRect(0,0,size,size))

        var baseLayer = MSShapeGroup.shapeWithPath(baseShape);
        baseLayer.name = "base"

        var layergroup = MSLayerGroup.alloc().initWithFrame(groupbounds);
        layergroup.name = name + ' - group'
        layergroup.addLayers([shape,baseLayer])
        parent.addLayers([layergroup])

        layergroup.setIsSelected(true)

        return shape;
    },
    //
    // Find new icons with q
    // Valid types for q is String
    // Valid types for icons is Array
    //
    "research": function(q,icons) {
      result          = NSObject.alloc().init()
      result.unicodes = []
      result.names    = []
      result.number   = []

      for (var i=0 ; i < [icons count]; i++) {
          icon = icons[i]["name"]

          if (icon.lowercaseString().indexOf(q) > -1) {
            result.names.push(icons[i]["id"])
            result.unicodes.push(Library.parse.escape('\\u' + icons[i]["unicode"]))
            result.number.push(i)
          }
      }

      return result
    },
    //
    // Parse unicode to get char
    // Valid types for unicode is String
    //
    "escape": function(unicode) {
      var r = /\\u([\d\w]{4})/gi;
      x = unicode.replace(r, function (match, grp) {
          return String.fromCharCode(parseInt(grp, 16)); }
      );
      return unescape(x);
    },
    //
    // Parse text layer to get unicode
    // Valid types for text is String
    //
    "unicode": function(text) {
      var code        = text.charCodeAt(0)
      var unicode     = code.toString(16)

      while (unicode.length < 4) {
        unicode       = '0' + unicode
      }

      return unicode
    },
  },
  "Widgets": {
    //
    // Build a window
    // Valid types for title is String
    //
    "window": function (title,subtitle) {
      // create a window
      var wrapper = NSWindow.alloc().init()
      [wrapper setFrame:NSMakeRect(0, 0, 600, 420) display:false]
      wrapper.setBackgroundColor(NSColor.whiteColor())
      wrapper.setTitle(title)

      // create a body
      body = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 600, 480))
      body.setWantsLayer(true)

      // create a main area
      main = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 600, 480))
      main.setWantsLayer(true)

      // subtitle in window
      if (subtitle!=nil) {
        subtitle = Library.Widgets.subtitle(subtitle,22,NSColor.blackColor(),NSMakeRect(25, 355, 300, 30))
        body.addSubview(subtitle)
      }

      // main area append to body
      body.addSubview(main)

      // construct header with internal function
      header = Library.Widgets.header(wrapper)

      // header append to body
      body.addSubview(header)

      // set body to wrapper
      wrapper.setContentView(body)
      wrapper.setAlphaValue(0.95)

      result          = NSObject.alloc().init()
      result.window   = wrapper
      result.main     = main
      return result
    },
    "header": function(wrapper) {
      // create a header
      header = NSView.alloc().initWithFrame(NSMakeRect(0, 350, 600, 48))
      header.setWantsLayer(true)

      // call an icon from OS for exit button
      var exit_icon = NSImage.imageNamed(NSImageNameStopProgressTemplate)

      // build exit button
      var userClickedCancel = false
      var exit = Library.Widgets.button(exit_icon,NSMakeRect(556, 5, 36, 36))
      [exit setKeyEquivalent:@"\033"]
      exit.setCOSJSTargetFunction(function(sender) {
        userClickedCancel = true
        wrapper.orderOut(nil)
        NSApp.stopModal()
      })

      // call an icon from OS for help button
      var help_icon = NSImage.imageNamed(NSImageNameBookmarksTemplate)

      // build help button
      var help = Library.Widgets.button(help_icon,NSMakeRect(520, 5, 36, 36))
      help.setCOSJSTargetFunction(function(sender) {
        var url = NSURL.URLWithString(@"https://github.com/keremciu/sketch-iconfont/blob/master/HELP.md")
        if (!NSWorkspace.sharedWorkspace().openURL(url)) {
            log(@"Failed to open url:" + url.description())
        }
      })

      // build help text
      var helptext = NSTextField.alloc().initWithFrame(NSMakeRect(480, 16, 48, 16))
      helptext.setEditable(false)
      helptext.setBordered(false)
      helptext.setDrawsBackground(false)
      helptext.setFont(NSFont.systemFontOfSize(12))
      helptext.setTextColor(NSColor.grayColor())
      helptext.setStringValue("HELP >")

      header.addSubview(help)
      header.addSubview(helptext)
      header.addSubview(exit)

      return header
    },
    //
    // Build a title field
    // Valid types for title is String
    // Valid types for fontsize is Number
    // Valid types for color is NSCOlor
    // Valid types for rect is NSMakeRect Object
    //
    "subtitle": function(title,fontsize,color,rect) {
      subtitle = NSTextField.alloc().initWithFrame(rect)
      subtitle.setEditable(false)
      subtitle.setBordered(false)
      subtitle.setDrawsBackground(false)
      subtitle.setFont(NSFont.systemFontOfSize(fontsize))
      subtitle.setTextColor(color)
      subtitle.setStringValue(title)

      return subtitle
    },
    //
    // Build a button
    // Valid types for image is String
    // Valid types for rect is NSMakeRect Object
    //
    "button": function(image,rect) {
      button = NSButton.alloc().initWithFrame(rect)
      buttonCell = button.cell()
      buttonCell.setImage(image)
      buttonCell.setImageScaling(NSScaleProportionally)

      button.setTitle(nil)
      button.setBordered(false)
      button.setBezelStyle(NSCircularBezelStyle)
      button.setAlphaValue(0.8)
      button.setAction("callAction:")

      return button
    },
    //
    // Construct a clipboard
    // Valid types for text is String
    //
    "clipboard": {
      init : function()
      {
        this.pasteBoard = NSPasteboard.generalPasteboard();
      },
      "set": function(text) {
        if( typeof text === 'undefined' ) return null;

        if( !this.pasteBoard )
          this.init();

        this.pasteBoard.declareTypes_owner( [ NSPasteboardTypeString ], null );
        this.pasteBoard.setString_forType( text, NSPasteboardTypeString );

        return true;
      }
    },
    //
    // Build a copy button
    // Valid types for text is String
    // Valid types for rect is NSMakeRect Object
    //
    "copy": function(text,rect) {
      var button = NSButton.alloc().initWithFrame(rect)
      button.setTitle("Copy It")
      button.setBezelStyle(NSRoundedBezelStyle)
      button.setAction("callAction:")

      button.setCOSJSTargetFunction(function() {
        Library.Widgets.clipboard.set(text)
      })

      return button
    },
    //
    // Show an alert
    // Valid types for title is String
    // Valid types for text is String
    //
    "alert": function (title, text) {
      // var app = [NSApplication sharedApplication];
      // [app withTitle:title displayDialog:text]
    },

  },

};

var tools = {
  getSketchVersionNumber : function() {
    const version = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"]
    var versionNumber = version.stringByReplacingOccurrencesOfString_withString(".", "") + ""
    while(versionNumber.length != 3) {
        versionNumber += "0"
    }
    return parseInt(versionNumber)
  },
	versionComponents : function() {
		var info = [[NSBundle mainBundle] infoDictionary];
		var items = [[(info["CFBundleShortVersionString"]) componentsSeparatedByString:"."] mutableCopy];

		while([items count] < 3)
			[items addObject:"0"];

		return items;
	},
	majorVersion : function() {
		var items = tools.versionComponents();

		return items[0];
	},
	minorVersion : function() {
		var items = tools.versionComponents();

		return items[1];
	},
	getJSONFromURL: function(url) {
		var request = [NSURLRequest requestWithURL:[NSURL URLWithString:url]],
			response = [NSURLConnection sendSynchronousRequest:request returningResponse:nil error:nil],
			responseObj = [NSJSONSerialization JSONObjectWithData:response options:nil error:nil]
		return responseObj
	},
	checkPluginUpdate: function(context) {
    var doc        = context.document
    var scriptFullPath 	= context.scriptPath
    var directoryPlugin = [[scriptFullPath stringByDeletingLastPathComponent] stringByDeletingLastPathComponent]

    // 9. Fetch data of manifest.json
    var manifestPath = directoryPlugin + "/manifest.json"
    var data = [NSData dataWithContentsOfFile:manifestPath]
    manifest = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:nil]

		try {
			var response = this.getJSONFromURL('https://raw.githubusercontent.com/keremciu/sketch-iconfont/master/iconfont.sketchplugin/Contents/Sketch/manifest.json')

      var pluginVersion = manifest.version.toString()
			if(response && response.version) {
				var rgx = new RegExp("\\d","g");
				var removeVersion = parseFloat(response.version.match(rgx).join(""))
				var installedVersion = parseFloat(pluginVersion.match(rgx).join(""))
				if (removeVersion > installedVersion) [doc showMessage:"New plugin update " + response.version + " is available! Visit github.com/keremciu/sketch-iconfont"]
			}
		} catch(e){
			log(e);
		}
	}
};
