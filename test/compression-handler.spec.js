const expect = require("chai").expect;
const compressionHandler = require("../src/compression-handler");

const testContentFolder = "test/static";

describe("compression-handler", function () {

    it("should register gzip compression", function () {
        let compressions = [];
        compressionHandler.registerCompression("gzip", "gz", compressions);

        expect(compressions.length).to.equal(1);
        expect(compressions[0].encodingName).to.equal("gzip");
        expect(compressions[0].fileExtension).to.equal(".gz");
    });

    it("should find file in main folder", function () {
        let compressions = [];
        compressionHandler.registerCompression("gzip", "gz", compressions);

        let files = compressionHandler.findAllCompressionFiles(testContentFolder, compressions);
        expect(files["/index.html"]).to.exist;
    });

    it("should find file in subfolder", function () {
        let compressions = [];
        compressionHandler.registerCompression("gzip", "gz", compressions);

        let files = compressionHandler.findAllCompressionFiles(testContentFolder, compressions);
        expect(files["/js/main.js"]).to.exist;
    });

    it("should detect a single file", function () {
        let compressions = [];
        compressionHandler.registerCompression("gzip", "gz", compressions);

        let files = compressionHandler.findAllCompressionFiles(testContentFolder + "/index.html", compressions);
        expect(files["/index.html"]).to.exist;
    });
});