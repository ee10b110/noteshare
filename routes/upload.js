/**
 * Created by vignesh on 11/2/15.
 */
 var express = require('express');
 var router = express.Router();
 var mysql=require('mysql');
 var db = require('../public/db_structure');
 var notification = require('./util/notification');
 var util = require('./util/util');
 var _ = require('underscore');

 var isAuth = function(req, res, next) {
    console.log('Authenticating');
    if (req.isAuthenticated())
        next();
    else {
        req.flash('login', 'LOGIN');
        res.redirect('/login')
    }
};
router.get('/',isAuth,function(req, res){
    res.render('upload');
});
router.get('/get', isAuth, function(req, res) {
    if(req.query.id) {
        var id = req.query.id;
    }
    else id=req.user.id;
    var querystring = "SELECT * FROM noteshare.uploads WHERE userid=" + mysql.escape(id) + " ORDER BY uploads.dateUploaded";
    db.querydb(querystring,function(result){ 
        console.log(querystring);
        res.end(JSON.stringify(result));
    });
});
router.post('/',isAuth,function(req,res){
    console.log(req.files);
    console.log(req.headers.x);
    console.log(req.body);
    var files = req.files.uploadedFile;
    if(!files){
        res.end('error no files sent');
    } else {
        var querystring="INSERT INTO noteshare.uploads(userid,name,filename,views,rating,dateUploaded,department,semester,year) VALUES(";
            if(req.user && req.user.id){
                querystring+=mysql.escape(req.user.id)+',';
            } else {
                res.end('{result:false,error:"not auth"}');
                return ;
        }
        if(req.body.uploadfilename){
            querystring+=(req.body.name)?req.body.name:mysql.escape(req.body.uploadfilename)+',';
        } else {
            querystring+=mysql.escape(files.originalname)+',';
        }
        querystring+=mysql.escape(files.name)+',';
        querystring+='0,';//default no of views
        querystring+='3,';//default rating
        querystring+=mysql.escape(util.dateToMysqlFormat(new Date()))+",";
        querystring+=mysql.escape(req.body.department?req.body.department:'none')+",";
        querystring+=mysql.escape(req.body.semester?req.body.semester:'1')+",";
        querystring+=mysql.escape(req.body.year?req.body.year:'1');
        querystring+=");";

db.querydb(querystring,function(result){
    console.log(querystring);
    //TODO : extend it for an array
    util.savePDFToSWF("uploads/" + files.name, "public/views/" + "test1.swf");
    notification.notifyAllFollowers(req.user.id,"Unread",req.user.username + " has uploaded a file : " + files.originalname, "Upload");
    res.end(JSON.stringify(result));
})
}
});


module.exports=router;