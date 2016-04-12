var express = require('express'),
    Jimp = require("jimp");

var app = express();

app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});

app.get('/photo', function(req, res) {
    var takePhoto = new run_cmd(
        'gphoto2', ['--set-config', 'shutterspeed=46', '--capture-image-and-download', '--force-overwrite'],
        function(me, buffer) {
            me.stdout += buffer.toString();
        },
        function() {
            var result = takePhoto.stdout.replace('undefined', '');
            resizePhoto(parsePathOfPhoto(result)[2], function(err, image) {
                if (err) {
                    console.error(err);
                    res.send('error');
                } else {
            	    var imgSrc = 'data:' + Jimp.MIME_JPEG + ';base64,' + new Buffer(image, 'binary').toString('base64');
                    res.send('<html><head></head><body><img style="width: 40%;" src="' + imgSrc + '" ></body></html>');
                }
            });
        });
});

app.get('/test', function(req, res) {
    var testCommand = new run_cmd(
        'cat', ['mock'],
        function(me, buffer) {
            me.stdout += buffer.toString();
        },
        function() {
            var result = testCommand.stdout.replace('undefined', '');
            resizePhoto(parsePathOfPhoto(result)[2], function(err, image) {
                if (err) {
                    console.error(err);
                    res.send('error');
                } else {
            	    var imgSrc = 'data:' + Jimp.MIME_JPEG + ';base64,' + new Buffer(image, 'binary').toString('base64');
                    res.send('<html><head></head><body><img style="width: 40%;" src="' + imgSrc + '" ></body></html>');
                }
            });
        });

});

function resizePhoto(path, cb) {
    Jimp
        .read(path)
        .then(function(image) {
            image
                .scale(0.5)
                .quality(85)
                .getBuffer(Jimp.MIME_JPEG, function(err, buffer) {
                    if (err) throw err;
                    cb(null, buffer);
                });
        }).catch(function(err) {
            cb(err, null);
        });
}

function parsePathOfPhoto(resultOfGphoto2) {
    var regex = /(Saving file as )(.*.jpg)(\n)/;
    return regex.exec(resultOfGphoto2);
}

function run_cmd(cmd, args, cb, end) {
    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this;
    child.stdout.on('data', function(buffer) {
        cb(me, buffer)
    });
    child.stdout.on('end', end);
}