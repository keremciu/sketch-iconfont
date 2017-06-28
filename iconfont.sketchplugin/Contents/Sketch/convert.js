@import "const/library.js";

var onRun = function(context) {

  var plugin        = context.plugin
  var doc           = context.document
  var page          = doc.currentPage()
  var json          = Library.fetch.json("fonts.json",plugin)
  var fonts         = [json objectForKey:@"fonts"]
  var predicate     = "";

  for (var font in fonts) {
    var i = Object.keys(fonts).indexOf(font);

    if (i == 0) {
      predicate += "name ENDSWITH '" + font +"'"
    } else {
      predicate += " OR name ENDSWITH '" + font +"'"
    }
  }

  var scope = [page children];
	var	layerPredicate = NSPredicate.predicateWithFormat(predicate);
	var layers = [scope filteredArrayUsingPredicate:layerPredicate];

	// [[doc currentPage] deselectAllLayers];
	var loop = [layers objectEnumerator], layer;

	while (layer = [loop nextObject]) {
    var vectorizedTextLayer = Library.parse.outline(layer);
	}

};
