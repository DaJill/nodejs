var fs = require('fs');
var sFilePath = './self_ini/test2.ini';

fs.writeFile(sFilePath, "Hey there2!", function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});

fs.appendFile(sFilePath, 'data to append\n', function (err) {
	if (err) throw err;
	var fs = require('fs');
});