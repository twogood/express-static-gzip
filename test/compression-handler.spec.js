var expect = require("chai").expect;
var expressStaticGzip = require("../index");
var compressionHandler = require("../src/compression-handler");

var contentFolder = "test/static";

describe("express-static-gzip", function () {

    it("should register gzip compression", function () {
        let compressions = [];
        compressionHandler.registerCompression("gzip", "gz", compressions);

        expect(compressions.length).to.equal(1);
        expect(compressions[0].encodingName).to.equal("gzip");
        expect(compressions[0].fileExtension).to.equal(".gz");
    });

    it("should find gziped file in folder", function () {
        let compressions = [];
        let files = {};
        compressionHandler.registerCompression("gzip", "gz", compressions);

        compressionHandler.findAllCompressionFiles(contentFolder, compressions, files);
        expect(files["/index.html"]).to.exist;
        expect(files["/js/main.js"]).to.exist;
    });

    it("should detect a single file", function () {
        let compressions = [];
        let files = {};
        compressionHandler.registerCompression("gzip", "gz", compressions);

        compressionHandler.findAllCompressionFiles(contentFolder + "/index.html", compressions, files);
        expect(files["/index.html"]).to.exist;
    });
});