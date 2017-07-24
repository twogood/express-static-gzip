var fs = require("fs");

module.exports = {
    findAllCompressionFiles: findAllCompressionFiles,
    findAvailableCompressionForFile: findAvailableCompressionForFile,
    addAllMatchingCompressionsToFile: addAllMatchingCompressionsToFile,
    addCompressionToFile: addCompressionToFile,
    registerCompression: registerCompression,
    Compression: Compression,
    findCompressionByName: findCompressionByName
}

/**
 * Searches for the first matching compression available from the given compressions.
 * @param {[Compression]} compressionList
 * @param {string} acceptedEncoding
 * @returns
 */
function findAvailableCompressionForFile(compressionList, acceptedEncoding) {
    if (acceptedEncoding) {
        for (var i = 0; i < compressionList.length; i++) {
            if (acceptedEncoding.indexOf(compressionList[i].encodingName) >= 0) {
                return compressionList[i];
            }
        }
    }
    return null;
}

/**
 * Picks all files into the matching compression's file list. Search is done recursively!
 * @param {string} folderPath
 */
function findAllCompressionFiles(folderPath, compressions, files, rootPath) {
    rootPath = rootPath || folderPath;
    var fsFiles = fs.readdirSync(folderPath);
    //iterate all files in the current folder
    for (var i = 0; i < fsFiles.length; i++) {
        var filePath = folderPath + "/" + fsFiles[i];
        var stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            //recursively search folders and append the matching files
            findAllCompressionFiles(filePath, compressions, files, rootPath);
        } else {
            addAllMatchingCompressionsToFile(fsFiles[i], filePath, compressions, rootPath, files);
        }
    }
}

/**
 * Takes a filename and checks if there is any compression type matching the file extension.
 * Adds all matching compressions to the file.     
 * @param {string} fileName
 * @param {string} fillFilePath
 */
function addAllMatchingCompressionsToFile(fileName, fullFilePath, compressions, rootFolder, files) {
    for (var i = 0; i < compressions.length; i++) {
        if (fileName.endsWith(compressions[i].fileExtension)) {
            addCompressionToFile(fullFilePath, compressions[i], rootFolder, files);
            return;
        }
    }
}

/**
 * Adds the compression to the file's list of available compressions
 * @param {string} filePath
 * @param {Compression} compression
 */
function addCompressionToFile(filePath, compression, rootFolder, files) {
    var srcFilePath = filePath.replace(compression.fileExtension, "").replace(rootFolder, "");
    var existingFile = files[srcFilePath];
    if (!existingFile) {
        files[srcFilePath] = { compressions: [compression] };
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