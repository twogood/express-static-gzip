const expect = require("chai").expect;
const Middleware = require("../src/middleware");
const compressionHandler = require("../src/compression-handler");

const testPort = 1337;
const testContentFolder = "test/static";

describe("express-static-gzip", function () {
    var middleware;
    var callbackFn;

    it("should serve from a folder", function () {
        setupMiddleware(testContentFolder, {});

        var resp = test_request("/index.html", { 'accept-encoding': 'gzip' }, (req, res) => {
            expect(req.url).to.equal("/index.html.gz");
            expect(res.headers["content-encoding"]).to.equal("gzip");
            expect(res.headers["content-type"]).to.equal("text/html; charset=UTF-8");
        });
    });

    it("should change request for a single file setup", function () {
        setupMiddleware(testContentFolder + "/js/main.js", {});

        var resp = test_request("/main.js", { 'accept-encoding': 'gzip' }, (req, res) => {
            expect(req.url).to.equal("/main.js.gz");
            expect(res.headers["content-encoding"]).to.equal("gzip");
            expect(res.headers["vary"]).to.equal("Accept-Encoding");
            expect(res.headers["content-type"]).to.equal("application/javascript; charset=UTF-8");
        });
    });

    it("should not change requests for other files than the one specified", function () {
        setupMiddleware(testContentFolder + "/index.html", {});

        var resp = test_request("/js/main.js", { 'accept-encoding': 'gzip' }, (req, res) => {
            expect(req.url).to.equal("/js/main.js");
            expect(res.headers["content-encoding"]).to.be.undefined;
            expect(res.headers["vary"]).to.be.undefined;
            expect(res.headers["content-type"]).to.be.undefined;
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