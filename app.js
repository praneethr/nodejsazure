
/**
 * Module dependencies.
 */

//included modules
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var storage = require('./routes/storage');
var blobs = require('./routes/blobs');
var http = require('http');
var path = require('path');
var azure = require('azure-storage');
var azureTable = require('azure-table-node');
var helpers = require('express-helpers')
var formidable = require('formidable');


var app = express();

 //set azure blob credentials
azureTable.setDefaultClient({
    accountUrl: 'http://[accountName].table.core.windows.net/',
    accountName: '[accountName]',
    accountKey: '[accountKey]'
});

helpers(app);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));



// check for development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}



//routing
app.get('/', routes.index);
app.get('/storage', storage.storage);
//list blobs
app.get('/blobs', blobs.blobs);
app.get('/users', user.list);


app.post('/blobs', function (req, res) {
    var multiparty = require('multiparty');
    var accessKey = 'OiCDT56crtSUWADNcyzuLT1nt23N3idAPwGQl640GUHtzqVe9a40EtRbdP5IvmkP5mM/q1W+9zdCcjP8f9S64g==';
    var storageAccount = 'ssmvsa0';

    var container = 'ssmvvhd';
    var blobService = azure.createBlobService(storageAccount, accessKey);
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

blobService.listBlobsSegmented(container, null, function(error, result) {
        if(!error){
            res.render('blobs', {
            error: error,
            container: container,
            blobs: result.entries
        });
        }
  });


//    res.send('OK');
});



app.get('/downblob', function (req, res) {

var blobService = azure.createBlobService()
      .withFilter(new azure.ExponentialRetryPolicyFilter());
    
var blobname = req.query.blobname
var fs = require('fs');
var container = 'ssmvvhd';
   res.header('Content-Disposition', 'attachment; filename=' + blobname);

blobService.getBlobToStream(container, blobname, res, function(error){
  if(!error){
                 res.end();
       }
       });
});


app.get('/delblob', function (req,res) {

var container = 'ssmvvhd';
var blobService = azure.createBlobService()
      .withFilter(new azure.ExponentialRetryPolicyFilter());

  blobService.deleteBlob(container, req.query.blobname, function(error, response){
  if(!error){
                      res.end();

//    	blobService.listBlobsSegmented(container, null, function(error, result) {
//        if(!error){
//            res.render('blobs', {
//            error: error,
//            container: container,
//            blobs: result.entries
//        });
//        }
//  });
//	
       }
       });


});

app.post('/busboyblobs', function (req, res) {

var Busboy = require('busboy');
var blobService = azure.createBlobService()
      .withFilter(new azure.ExponentialRetryPolicyFilter());
var container = 'ssmvvhd';

var busboy = new Busboy({ headers: req.headers });
		busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
			file.on('data', function (data) {
        console.log('File [' + fieldname + '] got ' + data.length + ' bytes');

            blobService.createBlockBlobFromStream(container, filename, data, data.length, { contentType: 'application/octet-stream' },function (error, result, response) {
                if (error) {
                    response.send(' Blob create: error ');
                       console.log(error);
                } else {
		            console.log('Stream uploaded successfully');
			}
                });
    	});
		file.on('end', function () {
				console.log('Finished with ' + fieldname);
			});
			});
		busboy.on('finish', function () {
			res.statusCode = 200;
			res.end();
	});
	req.pipe(busboy);
});


//create a server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
