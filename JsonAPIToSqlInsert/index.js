var https = require('https');
var fs = require('fs');
var oboe = require('oboe');
var mysql = require('mysql');

var table = "edsystems";

var dontSkipDownload = true;
var wstream;
var initial = false;

var connection = mysql.createConnection({
    host: 'localhost',
    user: process.argv[5],
    password: process.argv[6],
    database: 'elitedangerous'
});

dealWithArgs(function(arg) {
    downloadFile(arg, function(filename) {
        console.log("File download complete, beginning parse on " + filename);
        readFile(filename)
    });
});

function dealWithArgs(cb) {
    var arg = process.argv[2];
    if (!arg) {
        console.log("You didn't provide an argument\nType 'node index.js 1' for systems_populated.json (smaller file, faster parsing)\nType 'node index.js 2' for systems.json (much larger file)");
        exit("Argument not provided");
    }

    if (process.argv[3] == 'false') {
        dontSkipDownload = false;
    }

    if (process.argv[4] == 'true') {
        console.log("We're generating initial insert statements");
        //We're generating inserts and not doing updates
        initial = true;
        setupFS();
    } else {
        console.log("We're updating our DB");
    }

    cb(arg);
}

function setupFS() {
    wstream = fs.createWriteStream('output.sql');
    wstream.write(`INSERT INTO ${table} VALUES \n`);
}

function downloadFile(arg, cb) {
    var start = clock();
    var url;
    if (arg === '1') {
        url = "https://eddb.io/archive/v4/systems_populated.json";
    } else if (arg === '2') {
        url = "https://eddb.io/archive/v4/systems.json";
    } else {
        exit("Incorrect argument provided");
    }
    var filename = "temp.json";

    if (dontSkipDownload) {
        console.log("Downloading file...");
    
        
        var file = fs.createWriteStream(filename);

        var request = https.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                var time = clock(start) / 1000;
                console.log(`Download took ${time} seconds`)
                file.close(cb(filename));
            });
        }).on('error', function(err) {
            fs.unlink(filename); 
            exit(err.message);
        });
    } else {
        console.log("Skipping download per args");
        cb(filename);
    }
}

function toLower(s) {
	return s.toLowerCase();
}

function readFile(file) {
    var start = clock();
    var count = 0;
    console.log("Reading file...");
    oboe(fs.createReadStream(file))
    .node('name', toLower)
    .node('!.*', function(moduleJson, path) {
        if (initial) {
            //This is horrifically slow. Potentially buffer a couple thousand lines at a time before writing in chunks?
    	   writeToFile(moduleJson, count);
        } else {
            updateExistingDB(moduleJson, count);
        }
    	count++;
    	return oboe.drop;
    })
    .done(function() {
    	wstream.write(";");
    	wstream.end();
    	console.log(`Took ${clock(start) / 1000} seconds to process file`);
    	return oboe.drop;
    })
    .fail(function(err) {
    	console.log(err);
    });
}

function updateExistingDB(filepart, count) {
    if (count == 0) {
        connection.connect();
    }
    connection.query(`SELECT * FROM ${table} WHERE name = '${filepart.name}';`, function(err, rows, fields) {
        if (err) throw err;
        console.log(`SELECT * FROM ${table} WHERE name = '${filepart.name}';`);
        console.log(rows);
        console.log(fields);
    });
}

function writeToFile(filepart, count) {
	if (count == 0) {
		wstream.write(`('', "${filepart.name}", ${filepart.x}, ${filepart.y}, ${filepart.z})`);
	} else {
   		wstream.write(`, \n('', "${filepart.name}", ${filepart.x}, ${filepart.y}, ${filepart.z})`);      
   }   
}

function exit(error) {
    if (!error && error != 0) {
        process.exit();
    } else {
        throw error;
        process.exit();
    }
}
//Helper timer function
function clock(start) {
    if ( !start ) return process.hrtime();
    var end = process.hrtime(start);
    return Math.round((end[0]*1000) + (end[1]/1000000));
}