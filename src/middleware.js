var mime = require("mime");
var CompressionHandler = require("./compression-handler");

module.exports = {
    create: createMiddleware
};

/**
 * 
 * @param {() => void} serveStatic serve-static middleware function 
 * @returns 
 */
function createMiddleware(serveStatic, files, options) {
    return function execute(req, res, next) {
        changeUrlFromEmptyToIndexHtml(req, options);

        //get browser's' supported encodings
        var acceptEncoding = req.header("accept-encoding");

        //test if any compression is available 
        var matchedFile = files[req.path];
        if (matchedFile) {
            //as long as there is any compression available for this file, add the Vary Header (used for caching proxies)
            res.setHeader("Vary", "Accept-Encoding");

            //use the first matching compression to serve a compresed file
            var compression = CompressionHandler.findCompressionMatchingEncoding(matchedFile.compressions, acceptEncoding);
            if (compression) {
                convertToCompressedRequest(req, res, compression);
            }
        }

        //allways call the default static file provider
        serveStatic(req, res, next);
    };
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
function changeUrlFromEmptyToIndexHtml(req, options) {
    if (options.indexFromEmptyFile && req.url.endsWith("/")) {
        req.url += "index.html";
    }
}