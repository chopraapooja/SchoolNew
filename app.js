var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var school_routes = require('./own_modules/school_routes');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
//commit

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/grades',school_routes.get_grades);
app.get('/students',school_routes.get_students);
app.get('/subjects',school_routes.get_subjects);
app.get('/students/:id',school_routes.get_student);
app.get('/grades/:id',school_routes.get_grade_summary);
app.get('/subject/:id',school_routes.get_subject_summary);


app.get('/editStudentSummary/:id',school_routes.edit_student_summary);
app.post('/students/:id',school_routes.update_student_summary);
app.get('/editSubjectSummary/:id',school_routes.edit_subject_summary);
app.post('/subject/:id',school_routes.update_subject_summary);


app.post('/addStudent/:id',school_routes.add_new_student);
app.post('/addSubject/:id',school_routes.add_new_subject);
app.post('/updateScore/:id',school_routes.update_score);
app.post('/updateGradeName/:id',school_routes.update_grade_name);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
