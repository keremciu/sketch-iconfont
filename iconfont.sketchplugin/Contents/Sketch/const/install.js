@import "library.js";

var onRun = function(context) {

    var plugin        	= context.plugin
    var doc           	= context.document
    var fileManager	  	= NSFileManager.defaultManager()
    var scriptFullPath 	= context.scriptPath
    var directoryPlugin = [[scriptFullPath stringByDeletingLastPathComponent] stringByDeletingLastPathComponent]
    var resources       = [directoryPlugin stringByDeletingLastPathComponent] + "/Resources"

    // 1. Select SVG Font
    folder = Library.fetch.selectPanel("Select a folder/directory to install","folder")

    // 2. Create Window

    // 3. Import all font json files to bundle folder.
    folder_bundle = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:folder.path() + "/bundle/" error:nil];

    var resource_bundle = resources + "/bundle"

    if (![fileManager fileExistsAtPath:resource_bundle]) {
        [fileManager createDirectoryAtPath:resource_bundle withIntermediateDirectories:true attributes:nil error:nil]
    }

    for (k = 0; k < [folder_bundle count]; k++) {
        font_json = [folder_bundle objectAtIndex:k]
        if (![[NSFileManager defaultManager] copyItemAtPath:folder.path() +"/bundle/"+font_json toPath:resource_bundle + "/"+ font_json error:nil]) {
            log("Bundle fonts can not import.")
        }
    }

    // 4. Read the selected folter/ fonts.json
    var json = [NSData dataWithContentsOfFile:folder.path() + "/fonts.json"]
    folder_data = [NSJSONSerialization JSONObjectWithData:json options:0 error:nil]

    // 5. Fetch resources/ fonts.json file
    properties = Library.fetch.json("fonts.json",plugin)

    // 6. Add new font properties to font.json
    if ([properties isKindOfClass:[NSDictionary class]]) {
        dict = [[NSMutableDictionary alloc] initWithDictionary:properties]
        list = [[NSMutableDictionary alloc] initWithDictionary:[dict objectForKey:@"fonts"]]
        for (item in folder_data.fonts) {
            list[@""+item] = folder_data.fonts[item]
        }
        dict[@"fonts"] = list
    }

    // 7. Put new data to resources/ fonts.json
    Library.create.file(dict,resources + "/fonts.json")

     // 8. Find path of manifest.json
    var manifestPath = directoryPlugin + "/manifest.json"

    // 9. Fetch data of manifest.json
    var data = [NSData dataWithContentsOfFile:manifestPath]
    manifest = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:nil]

    // 10. Check this is the first install?
    count = manifest.commands.count()

    if (manifest.menu.items.count() < 4) {
        var structure = [NSData dataWithContentsOfFile:directoryPlugin + "/structure.json"]
        form = [NSJSONSerialization JSONObjectWithData:structure options:NSJSONReadingMutableContainers error:nil]

        [manifest setValue:[form objectForKey:@"menu"] forKeyPath:@"menu"];
        [manifest setValue:[form objectForKey:@"commands"] forKeyPath:@"commands"];
        count = 8;
    }

    menu = [manifest objectForKey:@"menu"]
    items = [menu objectForKey:@"items"]
    first = [items objectAtIndex:0]
    nextid = count +1

    // 11. Add a command to manifest.json
    for (item in folder_data.fonts) {
        command = {
            "script": "add_grid.js",
            "handler": "handleFont",
            "name": item,
            "identifier": nextid + "_add_grid"
        }
        [[manifest objectForKey:@"commands"] addObject:command]
        [[first objectForKey:@"items"] addObject:@""+nextid + "_add_grid"]
        nextid++;
    }

    // 11. Write new data to manifest.file
    Library.create.file(manifest,manifestPath)

    doc.showMessage("You've installed it, now go for it: Plugins > Icon Font > Grid Insert")
};
