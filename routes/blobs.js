
/*
 * GET home page.
 */

var azure = require('azure-storage');

var helpers = require('express-helpers')


exports.blobs = function (request, response) {

var blobService = azure.createBlobService()
      .withFilter(new azure.ExponentialRetryPolicyFilter());


    var container = 'ssmvvhd';
    
blobService.listBlobsSegmented(container, null, function(error, result) {
	
	if(!error){
      // result.entries contains the entries
      //       // If not all blobs were returned, result.continuationToken has the continuation token.
      //         
            response.render('blobs', {
            error: error,
            container: container,
            blobs: result.entries
        });


        }

  });


}
