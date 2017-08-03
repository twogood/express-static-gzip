const expect = require("chai").expect;
const Middleware = require("../src/middleware");
const compressionHandler = require("../src/compression-handler");

const testPort = 1337;
const testContentFolder = "test/static";

describe("express-static-gzip", function () {
    var middleware;
    var callbackFn;

    it("should change request for files from the folder", function () {
        setupMiddleware(testContentFolder, {});

        var resp = test_request("/index.html", { 'accept-encoding': 'gzip' }, (req, res) => {
            expect(req.url).to.equal("/index.html.gz");
            expect(res.headers["content-encoding"]).to.equal("gzip");
            expect(res.headers["content-type"]).to.equal("text/html; charset=UTF-8");
        });
    });

    it("should select compression in correct order", function () {
        setupMiddleware(testContentFolder, { enableBrotli: true });

        var resp = test_request("/style.css", { 'accept-encoding': 'gzip, br' }, (req, res) => {
            expect(req.url).to.equal("/style.css.br");
            expect(res.headers["content-encoding"]).to.equal("br");
        });

        var resp = test_request("/style.css", { 'accept-encoding': 'gzip' }, (req, res) => {
            expect(req.url).to.equal("/style.css.gz");
            expect(res.headers["content-encoding"]).to.equal("gzip");
        });
    });

    function test_request(path, headers, cb) {
        callbackFn = cb;
        middleware(
            new MockedRequest(path, headers),
            new MockedResponse(),
            () => { }
        );
    }

    function setupMiddleware(folder, options) {
        let compressions = compressionHandler.parseOptionsToCompressionList(options);
        let files = compressionHandler.findAllCompressionFiles(folder, compressions);

        middleware = Middleware.create(
            (req, res, next) => {
                if (callbackFn) {
                    callbackFn(req, res, next);
                }
            },
            files,
            options
        );
    }

    function MockedRequest(path, headers) {
        this.method = "GET";
        this.header = (key) => headers[key.toLowerCase()];
        this.host = "localhost";
        this.port = testPort;
        this.path = path;
        this.url = path;
    }

    function MockedResponse() {
        this.headers = {};
        this.setHeader = (key, value) => { this.headers[key.toLowerCase()] = value };
    }

});