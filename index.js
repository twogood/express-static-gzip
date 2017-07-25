var mime = require("mime");
var serveStatic = require("serve-static");

var compressionHandler = require("./src/compression-handler");

module.exports = expressStaticGzip;

var defaultStatic;

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

    var compressions = [],
        files = {};

    //create a express.static middleware to handle serving files 
    defaultStatic = serveStatic(rootFolder, options);

    //read compressions from options
    setupCompressions();

    //if at least one compression has been added, lookup files
    if (compressions.length > 0) {
        compressionHandler.findAllCompressionFiles(rootFolder, compressions, files);
    }

    return function middleware(req, res, next) {
        changeUrlFromEmptyToIndexHtml(req);

        //get browser's' supported encodings
        var acceptEncoding = req.header("accept-encoding");

        //test if any compression is available 
        var matchedFile = files[req.path];
        if (matchedFile) {
            //as long as there is any compression available for this file, add the Vary Header (used for caching proxies)
            res.setHeader("Vary", "Accept-Encoding");

            //use the first matching compression to serve a compresed file
            var compression = compressionHandler.findCompressionMatchingEncoding(matchedFile.compressions, acceptEncoding);
            if (compression) {
                convertToCompressedRequest(req, res, compression);
            }
        }

        //allways call the default static file provider
        callServeStatic(req, res, next);
    };

    /**
     * Reads the options into a list of available compressions.
     */
    function setupCompressions() {
        //register all provided compressions
        if (options.customCompressions && options.customCompressions.length > 0) {
            for (var i = 0; i < options.customCompressions.length; i++) {
                var customCompression = options.customCompressions[i];
                compressionHandler.registerCompression(customCompression.encodingName, customCompression.fileExtension, compressions);
            }
        }

        //enable brotli compression
        if (options.enableBrotli) {
            compressionHandler.registerCompression("br", "br", compressions);
        }

        //gzip compression is enabled by default
        compressionHandler.registerCompression("gzip", "gz", compressions);
    }

    /**
     * Changes the url and adds required headers to serve a compressed file.
     * @param {Object} req
     * @param {Object} res
     */
    function convertToCompressedRequest(req, res, compression) {
        var type = mime.lookup(req.path);
        var charset = mime.charsets.lookup(type);
        var search = req.url.split('?').splice(1).join('?');

        if (search !== "") {
            search = "?" + search;
        }

        req.url = req.path + compression.fileExtension + search;
        res.setHeader("Content-Encoding", compression.encodingName);
        res.setHeader("Content-Type", type + (charset ? "; charset=" + charset : ""));
    }

    /**
     * In case it's enabled in the options and the requested url does not request a specific file, "index.html" will be appended.
     * @param {Object} req
     */
    function changeUrlFromEmptyToIndexHtml(req) {
        if (options.indexFromEmptyFile && req.url.endsWith("/")) {
            req.url += "index.html";
        }
    }
}

function callServeStatic(req, res, next) {
    if (defaultStatic) {
        defaultStatic(req, res, next);
    }
}

expressStaticGzip.__setServeStatic__testonly = function __setServeStatic__(callback) {
    defaultStatic = callback;
};