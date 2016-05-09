@import "library.js";

var onRun = function(context) {

    var plugin        	= context.plugin
    var doc           	= context.document
    var fileManager	  	= NSFileManager.defaultManager()
    var scriptFullPath 	= context.scriptPath
    var directoryPlugin = [[scriptFullPath stringByDeletingLastPathComponent] stringByDeletingLastPathComponent]
    var resources       = [directoryPlugin stringByDeletingLastPathComponent] + "/Resources"

    // 1. Select SVG Font
    folder = Library.fetch.selectPanel("Select a folder to export/backup, it needs to be empty.","folder")

    // create a bundle folder if is it not exist
    var bundle_folder = folder.path() + "/bundle"

    if (![fileManager fileExistsAtPath:bundle_folder]) {
        [fileManager createDirectoryAtPath:bundle_folder withIntermediateDirectories:true attributes:nil error:nil]
    }

    // 2. Create Window
    // var wrapper     	= Library.Widgets.window("Export Fonts","Backup your fonts")

    // 3. Export all font json files to bundle folder.
    bundle = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:resources+"/bundle/" error:nil];

    for (k = 0; k < [bundle count]; k++) {

        font_json = [bundle objectAtIndex:k]

        if (![[NSFileManager defaultManager] copyItemAtPath:resources+"/bundle/"+font_json toPath:folder.path()+"/bundle/"+font_json error:nil]) {
            log("Bundle fonts can not export.")
        }
    }

    // 4. Export fonts.json
    if (![[NSFileManager defaultManager] copyItemAtPath:resources+"/fonts.json" toPath:folder.path()+"/fonts.json" error:nil]) {
        log("Fonts.json file can not export.")
    }

    // Show an error when user write a wrong icon name.
    doc.showMessage("You've a backup there: "+ folder)

  //   // var response        = NSApp.runModalForWindow(wrapper.window)

  //   //
  //   // 5. TTF Fonts needs to move from Library.
  //   //
  //   // array = [NSArray arrayWithObjects:@"playtime.ttf", nil];
  //   // status = [[NSWorkspace sharedWorkspace] performFileOperation:NSWorkspaceCopyOperation source:@"/Library/Fonts/" destination:folder.path() files:array tag:nil];

 	// // if is the response is ok, export fonts
  //   if (response == NSOKButton) {

  //   }
};
