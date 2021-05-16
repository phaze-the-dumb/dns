const http = require('http');
const fetch = require('node-fetch');
const express = require('express');
const fs = require('fs');
const CryptoJS = require('crypto-js');
const ip = require("ip");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')

const server = require('./data/server.json');
const users = require('./data/users.json');
const domains = require('./data/domains.json');

if(!server.adminPass){
    server.adminPass = CryptoJS.SHA3('Admin').toString();

    fs.writeFile("./data/server.json", JSON.stringify(server), (err) => {
        if(err)return console.log(err);
    });
}

http.createServer(onRequest).listen(80);

function clearLogs(){
    fs.writeFile("./data/logs.txt", '', (err) => {
        if(err)return console.log(err);
    });

    fs.readdir(__dirname + '/data/logs', (err, files) => {
        if (err)
          console.log(err);
        else {
            files.forEach(file => {
                fs.writeFile("./data/logs/"+file, '', (err) => {
                    if(err)return console.log(err);
                });            
            })
        }
    })
}

function clearUserLogs(id){
    fs.writeFile("./data/logs/"+id+".txt", '', (err) => {
        if(err)return console.log(err);
    });
}

function getLogs(user, callback){
    fs.readFile('./data/logs/'+user+'.txt', 'utf8', function(err, data){
        if(err)return;

        callback(data)
    });
}

async function onRequest(req, res){
    let ip2 = ''

    if(req.headers['cf-connecting-ip']){
        ip2 = req.headers['cf-connecting-ip']
    } else{
        ip2 = ip.address()
    }

    let url = req.url

    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();

    fs.readFile('./data/logs.txt', 'utf8', function(err, data){
        if(err)return;

        let log = '['+date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds+'] INFO ' + ip2 + ' visited '  + req.headers.host + url + '\n'

        fs.writeFile("./data/logs.txt", data + log, (err) => {
            if(err)return console.log(err);
        });
    });    

    proxy(req, res)
}

async function proxy(client_req, client_res) {
    var options

    let ip2 = ''

    if(client_req.headers['cf-connecting-ip']){
        ip2 = client_req.headers['cf-connecting-ip']
    } else{
        ip2 = ip.address()
    }

    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();

    let domain = domains.find(x => x.domain === client_req.headers.host)
    if(!domain){
        options = {
            hostname: 'localhost',
            port: 2086,
            path: '/404',
            method: client_req.method,
            headers: client_req.headers
        };
    } else{
        fs.readFile('./data/logs/'+domain.user+'.txt', 'utf8', function(err, data){
            if(err)return;
    
            let log = '['+date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds+'] INFO ' + ip2 + ' visited '  + client_req.headers.host + client_req.url + '\n'
    
            fs.writeFile('./data/logs/'+domain.user+'.txt', data + log, (err) => {
                if(err)return console.log(err);
            });
        });

        options = {
            hostname: domain.ip,
            port: domain.port,
            path: client_req.url,
            method: client_req.method,
            headers: client_req.headers
        };
    }

    var proxy = http.request(options, function (res) {
        client_res.writeHead(res.statusCode, res.headers)
        res.pipe(client_res, {
            end: true
        });
    });

    proxy.on('error', function(err1){
        fs.readFile('./data/logs.txt', 'utf8', function(err, data){
            if(err)return;
    
            let log = '['+date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds+'] ERROR ' + err1 + '\n'
    
            fs.writeFile("./data/logs.txt", data + log, (err) => {
                if(err)return console.log(err);
            });
        }); 

        fs.readFile('./data/logs/'+domain.user+'.txt', 'utf8', function(err, data){
            if(err)return;
    
            let log = '['+date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds+'] ERROR ' + err1 + '\n'
    
            fs.writeFile('./data/logs/'+domain.user+'.txt', data + log, (err) => {
                if(err)return console.log(err);
            });
        });

        options = {
            hostname: 'localhost',
            port: 2086,
            path: '/500',
            method: client_req.method,
            headers: client_req.headers
        };

        var proxy2 = http.request(options, function (res) {
            client_res.writeHead(res.statusCode, res.headers)
            res.pipe(client_res, {
                end: true
            });
        });

        client_req.pipe(proxy2, {
            end: true
        })
    })

    client_req.pipe(proxy, {
        end: true
    })
}

const panel = express();

panel.use(express.static("public"));
panel.use(bodyParser.urlencoded({ extended: true }));
panel.use(cookieParser());
panel.use(bodyParser.json());
panel.use(bodyParser.raw());

panel.get('/', async function(req, res){
    let ip2 = ''

    if(req.headers['cf-connecting-ip']){
        ip2 = req.headers['cf-connecting-ip']
    } else{
        ip2 = ip.address()
    }

    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();

    fs.readFile('./data/logs.txt', 'utf8', function(err, data){
        if(err)return;

        let log = '['+date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds+'] WARN '+ip2+' went to login page\n'

        fs.writeFile("./data/logs.txt", data + log, (err) => {
            if(err)return console.log(err);
        });
    }); 

    res.render(__dirname + '/views/panel/login.ejs', {
        error: false,
    });
})

panel.get('/panel', async function(req, res){
    res.redirect('/panel/home')
})

panel.get('/panel/home', async function(req, res){
    let user = users.find(x => x.username === req.cookies._name)
    if(!user){
        res.render(__dirname + '/views/panel/login.ejs', {
            error: true,
        });
        return;
    }

    if(user.password === req.cookies._pass){
        getLogs(user.id, function(logs){
            let sites = domains.filter(x => x.user === user.id);

            res.render(__dirname + '/views/panel/panel.ejs', {
                logs,
                sites
            })
        })
    } else{
        res.render(__dirname + '/views/panel/login.ejs', {
            error: true,
        });
    }
})

panel.post('/dns/delete', async function(req, res){
    let user = users.find(x => x.username === req.cookies._name)
    if(!user){
        res.render(__dirname + '/views/panel/login.ejs', {
            error: true,
        });
        return;
    }

    if(user.password === req.cookies._pass){
        domains = domains.filter(x => x.domain != req.body.domain)

        fs.writeFile("./data/domains.json", JSON.stringify(domains), (err) => {
            if(err)return console.log(err);
        });

        res.send('ok')
    } else{
        res.render(__dirname + '/views/panel/login.ejs', {
            error: true,
        });
    }
})

panel.post('/addSite', async function(req, res){
    let user = users.find(x => x.username === req.cookies._name)
    if(!user){
        res.render(__dirname + '/views/panel/login.ejs', {
            error: true,
        });
        return;
    }

    if(user.password === req.cookies._pass){
        domains.push({
            domain: req.body.domain,
            ip: req.body.ip,
            port: req.body.port,
            user: user.id
        })

        fs.writeFile("./data/domains.json", JSON.stringify(domains), (err) => {
            if(err)return console.log(err);
        });

        res.redirect('/panel/home')
    } else{
        res.render(__dirname + '/views/panel/login.ejs', {
            error: true,
        });
    }
})

panel.post('/login', async function(req, res){
    let pass = CryptoJS.SHA3(req.body.password).toString();

    let user = users.find(x => x.username === req.body.username)
    if(!user){
        let user = users.find(x => x.email === req.body.username)
        if(!user){
            res.render(__dirname + '/views/panel/login.ejs', {
                error: true,
            });
            return;
        }

        if(user.password === pass){
            res.cookie('_pass', pass);
            res.cookie('_name', user.username);

            res.redirect('/panel')
            return;
        } else{
            res.render(__dirname + '/views/panel/login.ejs', {
                error: true,
            });
            return;
        }
    }

    if(user.password === pass){
        res.cookie('_pass', pass);
        res.cookie('_name', req.body.name);

        res.redirect('/panel')
    } else{
        res.render(__dirname + '/views/panel/login.ejs', {
            error: true,
        });
        return;
    }
})

panel.listen(2087)


const setup = express();

setup.use(bodyParser.urlencoded({ extended: true }));
setup.use(cookieParser());
setup.use(bodyParser.json());
setup.use(bodyParser.raw());

setup.get('/', async function(req, res){
    res.render(__dirname + '/views/setup/login.ejs');
})

setup.get('/panel', async function(req, res){
    if(server.adminName === req.cookies._name && server.adminPass === req.cookies._pass){
        fs.readFile('./data/logs.txt', 'utf8', function(err, data){
            if(err)return;
            
            res.render(__dirname + '/views/setup/panel.ejs', {
                logs: data
            });
        });
    } else{
        res.redirect('/?error=Incorrect');
    }
})

setup.post('/changeNamePass', async function(req, res){
    let pass = CryptoJS.SHA3(req.body.pass).toString();

    if(server.adminName === req.cookies._name && server.adminPass === req.cookies._pass){
        res.cookie('_pass', pass);
        res.cookie('_name', req.body.name);

        server.adminName = req.body.name
        server.adminPass = pass

        fs.writeFile("./data/server.json", JSON.stringify(server), (err) => {
            if(err)return console.log(err);
        });

        res.redirect('/panel')
    } else{
        res.redirect('/?error=Incorrect');
    }
})

setup.post('/newAccount', async function(req, res){
    let pass = CryptoJS.SHA3(req.body.pass).toString();

    if(server.adminName === req.cookies._name && server.adminPass === req.cookies._pass){
        let id = createID();

        fs.writeFile("./data/logs/"+id+'.txt', '', (err) => {
            if(err)return console.log(err);
        });

        users.push({
            username: req.body.name,
            password: pass,
            email: req.body.email,
            id: id
        })

        fs.writeFile("./data/users.json", JSON.stringify(users), (err) => {
            if(err)return console.log(err);
        });

        res.redirect('/panel')
    } else{
        res.redirect('/?error=Incorrect');
    }
})

setup.post('/login', async function(req, res){
    let pass = CryptoJS.SHA3(req.body.pass).toString();

    if(server.adminName === req.body.name && server.adminPass === pass){
        res.cookie('_pass', pass);
        res.cookie('_name', req.body.name);

        res.redirect('/panel')
    } else{
        res.redirect('/?error=Incorrect');
    }
})

setup.listen(2090)


//error pages

const errors = express();

errors.get('/404', function(req, res){
    fs.readFile('./templates/404.html', 'utf8', function(err, data){
        res.status(404).send(data)
    })
})

errors.get('/500', function(req, res){
    fs.readFile('./templates/500.html', 'utf8', function(err, data){
        res.status(500).send(data)
    })
})

errors.get('/ban', function(req, res){
    res.status(401).send('You have been banned from this site')
})

errors.listen(2086)

function createID() {
    var characters = [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0"
    ];
    var template = "############";
    var create = "";
  
    template.split("").forEach(char => {
      create =
        create + characters[Math.floor(Math.random() * characters.length + 0)];
    });
  
    return create;
}