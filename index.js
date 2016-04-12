var express = require('express'),
    Jimp = require('jimp'),
    aws = require('aws-sdk');

var app = express();

var s3Options = {
    accessKeyId: 'xxx',
    secretAccessKey: 'yyy',
    // region: 'US Standard',
    endpoint: 's3.amazonaws.com'
};
var awsS3Client = new aws.S3(s3Options);


app.listen(3000, function() {
    console.log('Example app listening on port 3000!');
});

app.get('/photo', function(req, res) {
    var takePhoto = new run_cmd(
        'gphoto2', ['--set-config', 'shutterspeed=46', '--capture-image-and-download', '--force-overwrite'],
        commandOutputAppender,
        function() {
            cbRunCommandResizeAndManupulateTheImage(res, takePhoto);
        });
});

app.get('/test', function(req, res) {
    var testCommand = new run_cmd(
        'cat', ['mock'],
        commandOutputAppender,
        function() {
            cbRunCommandResizeAndManupulateTheImage(res, testCommand);
        });
});

function commandOutputAppender(commander, buffer) {
    commander.stdout += buffer.toString();
}

function cbRunCommandResizeAndManupulateTheImage(res, commander) {
    var result = commander.stdout.replace('undefined', '');
    resizePhoto(
        parsePathOfPhoto(result)[2],
        function(err, image) {
            cbResizePhotoAddToHtml(res, err, image);
        });
}

function addToHtml(image) {
    var imgSrc = 'data:' + Jimp.MIME_JPEG + ';base64,' + new Buffer(image, 'binary').toString('base64');
    res.send('<html><head></head><body><img style="width: 40%;" src="' + imgSrc + '" ></body></html>');
}

function sendToS3(image) {

    var params = {
        Bucket: 'maker-faire-long-exposure',
        Key: '123',
        ACL: 'public-read',
        Body: image,
        ContentType: Jimp.MIME_JPEG,
    };
    awsS3Client.putObject(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
    });




    var imgSrc = 'data:' + Jimp.MIME_JPEG + ';base64,' + new Buffer(image, 'binary').toString('base64');
    res.send('<html><head></head><body><img style="width: 40%;" src="' + imgSrc + '" ></body></html>');
}

function cbResizePhotoAddToHtml(res, err, image) {
    if (err) {
        console.error(err);
        res.send('error');
    } else {
        sendToS3(image);
        addToHtml(image);
    }
}

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
