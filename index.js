var serveStatic = require("serve-static");

var Middleware = require("./src/middleware");
var CompressionHandler = require("./src/compression-handler");

module.exports = expressStaticGzip;

/**
 * Generates a middleware function to serve static files. It is build on top of the express.static middleware.
 * It extends the express.static middleware with the capability to serve (previously) gziped files. For this
 * it asumes, the gziped files are next to the original files.
 * @param {string} rootFolder: folder to staticly serve files from
 * @param {{enableBrotli:boolean, customCompressions:[{encodingName:string,fileExtension:string}], indexFromEmptyFile:boolean}} options: options to change module behaviour  
 * @returns express middleware function
 */
function expressStaticGzip(rootFolder, options) {
    options = options || {};
    if (typeof (options.indexFromEmptyFile) === "undefined") options.indexFromEmptyFile = true;

    //create a serve-static middleware to handle serving files
    var static = serveStatic(rootFolder, options);

    //read compressions from options
    var compressions = CompressionHandler.parseOptionsToCompressionList(options);

    //create file - compression map
    var files = compressions.length > 0 ? CompressionHandler.findAllCompressionFiles(rootFolder, compressions) : {};

    return Middleware.create(static, files, options);    
}