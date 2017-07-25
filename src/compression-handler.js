const fs = require("fs");
const path = require("path");

module.exports = {
    parseOptionsToCompressionList: parseOptionsToCompressionList,
    findAllCompressionFiles: findAllCompressionFiles,
    findCompressionMatchingEncoding: findCompressionMatchingEncoding,
    addAllMatchingCompressionsToFile: addAllMatchingCompressionsToFile,
    addCompressionToFile: addCompressionToFile,
    registerCompression: registerCompression,
    Compression: Compression,
    findCompressionByName: findCompressionByName
}

/**
     * Reads the options into a list of available compressions.
     */
function parseOptionsToCompressionList(options) {
    compressions = [];

    //register all provided compressions
    if (options.customCompressions && options.customCompressions.length > 0) {
        for (var i = 0; i < options.customCompressions.length; i++) {
            var customCompression = options.customCompressions[i];
            registerCompression(customCompression.encodingName, customCompression.fileExtension, compressions);
        }
    }

    //enable brotli compression
    if (options.enableBrotli) {
        registerCompression("br", "br", compressions);
    }

    //gzip compression is enabled by default
    registerCompression("gzip", "gz", compressions);

    return compressions;
}

/**
 * Searches for the first matching compression available from the given compression list.
 * @param {[Compression]} compressions
 * @param {string} acceptedEncoding
 * @returns
 */
function findCompressionMatchingEncoding(compressions, acceptedEncoding) {
    if (acceptedEncoding) {
        for (var i = 0; i < compressions.length; i++) {
            if (acceptedEncoding.indexOf(compressions[i].encodingName) >= 0) {
                return compressions[i];
            }
        }
    }
    return null;
}

/**
 * Picks all files into the matching compression's file list. Search is done recursively!
 * @param {string} folderPath
 */
function findAllCompressionFiles(folderPath, compressions) {
    var files = {};

    folderPath = path.resolve(folderPath);
    if (isFolder(folderPath)) {
        findCompressedFilesRecursivly(folderPath, folderPath, compressions, files);
    } else {
        var parentFolder = path.dirname(folderPath);
        var fileName = path.basename(folderPath);
        var fileList = fs.readdirSync(parentFolder);
        for (var i = 0; i < fileList.length; i++) {
            if (fileList[i].indexOf(fileName) === 0) {
                var filePath = path.resolve(parentFolder, fileList[i]);
                addAllMatchingCompressionsToFile("/" + fileList[i], compressions, files);
            }
        }
    }

    return files;
}

function findCompressedFilesRecursivly(folderPath, rootPath, compressions, files) {
    var fsFiles = fs.readdirSync(folderPath);
    //iterate all files in the current folder
    for (var i = 0; i < fsFiles.length; i++) {
        var filePath = path.resolve(folderPath, fsFiles[i]);
        if (isFolder(filePath)) {
            //recursively search folders and append the matching files
            findCompressedFilesRecursivly(filePath, rootPath, compressions, files);
        } else {
            addAllMatchingCompressionsToFile(filePath.replace(rootPath, ''), compressions, files);
        }
    }
}

/**
 * Takes a filename and checks if there is any compression type matching the file extension.
 * Adds all matching compressions to the file.     
 * @param {string} fileName
 * @param {string} fillFilePath
 */
function addAllMatchingCompressionsToFile(fileName, compressions, files) {
    for (var i = 0; i < compressions.length; i++) {
        if (fileName.endsWith(compressions[i].fileExtension)) {
            addCompressionToFile(fileName, compressions[i], files);
            return;
        }
    }
}

/**
 * Adds the compression to the file's list of available compressions
 * @param {string} fileName
 * @param {Compression} compression
 */
function addCompressionToFile(fileName, compression, files) {
    var fileName = fileName.replace(compression.fileExtension, "");
    var existingFile = files[fileName];
    if (!existingFile) {
        files[fileName] = { compressions: [compression] };
    } else {
        existingFile.compressions.push(compression);
    }
}

/**
     * Registers a new compression to the module.
     * @param {string} encodingName
     * @param {string} fileExtension
     */
function registerCompression(encodingName, fileExtension, compressions) {
    if (!findCompressionByName(encodingName, compressions))
        compressions.push(new Compression(encodingName, fileExtension));
}

/**
 * Constructor
 * @param {string} encodingName
 * @param {string} fileExtension
 * @returns {encodingName:string, fileExtension:string,files:[Object]}
 */
function Compression(encodingName, fileExtension) {
    this.encodingName = encodingName;
    this.fileExtension = "." + fileExtension;
}

/**
 * Compression lookup by name.
 * @param {string} encodingName
 * @returns {Compression}
 */
function findCompressionByName(encodingName, compressions) {
    for (var i = 0; i < compressions.length; i++) {
        if (compressions[i].encodingName === encodingName)
            return compressions[i];
    }
    return null;
}

/**
 * Tests if path points to a folder
 * @param {string} filePath
 * @returns 
 */
function isFolder(filePath) {
    var stats = fs.statSync(filePath);
    return stats && stats.isDirectory();
}