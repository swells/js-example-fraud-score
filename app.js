var express = require('express'),
    Primus  = require('primus.io'),
    app     = express(),
    router  = express.Router();    
    routes  = require('./server/routes/routes');
    FraudService = require('./server/service/fraud-service'),
    PORT    = 9080;

app.engine('html', require('ejs').renderFile);
app.use('/', router);
app.use(express.static(__dirname + '/client/app'));
app.get('/', routes.index);

// -- Start Primus server --
var server = require('http').createServer(app);
var primus = new Primus(server, { transformer: 'websockets', parser: 'JSON' });

primus.on('connection', function (spark) {
    var fraudService = new FraudService(primus);
   
    router.get('/fraud/score/:tasks', function(req, res) {    	
    	 var tasks = req.params.tasks === 0 ? 1 : req.params.tasks;
       console.log('REST:/fraud/score/' + tasks + ' called.');

       for(var i = 0; i < tasks; i++) {
          fraudService.submit(fraudService.buildTask());
       }
       
       res.json({ success: true });
    });

    router.post('/fraud/pool/init/:size', function (req, res) {
    	var size = req.params.size === 0 ? 1 : req.params.size;
    	console.log('REST:/pool/init/' + size + ' called.');

    	fraudService.buildPool(size);
      res.json({ success: true });
    });
});

primus.on('disconnection', function () {
      //if (fraudService) {
        //fraudService.destroy();
      //
});

// -- Start server --
server.listen(process.env.PORT || PORT, function(){
  console.log('\033[96mlistening on localhost:' + PORT +' \033[39m');
});
