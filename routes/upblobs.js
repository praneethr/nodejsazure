
/*
 * GET home page.
 */

var azure = require('azure-storage');
var helpers = require('express-helpers')

exports.upblobs = function (request, response) {

var blobService = azure.createBlobService()
      .withFilter(new azure.ExponentialRetryPolicyFilter());
var container = 'ssmvvhd';
var myblob = req.query
    
    var multiparty = require('multiparty');
    var form = new multiparty.Form();

    form.on('part', function (part) {
        if (part.filename) {

            var size = part.byteCount - part.byteOffset;
            var name = part.filename;

            blobService.createBlockBlobFromStream(container, name, part, size, function (error) {
                if (error) {
                    res.send(' Blob create: error ');
                }
            });
        } else {
            form.handlePart(part);
        }
    });
    form.parse(req);
    res.send('OK');
}
