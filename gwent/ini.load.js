var ini = require('node-ini');
ini.parse('./self_ini/test.ini', function(err,data){
  if(err) console.log(err)
  else {
    console.log(data)
  }
});